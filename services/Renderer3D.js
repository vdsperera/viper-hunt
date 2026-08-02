/**
 * Renderer3D
 * High-performance Three.js 3D WebGL renderer for Viper Hunt.
 * Provides a 3D cyberpunk environment with dynamic lights, glowing 3D meshes, 
 * target gems, hazard figures, and weather particle systems.
 */
let THREE = typeof globalThis !== 'undefined' ? globalThis.THREE : null;

export class Renderer3D {
    /**
     * @param {string} canvasId - HTML Canvas element ID for WebGL rendering
     * @param {number} spacing - 3D spacing between grid units
     */
    constructor(canvasId = 'three-canvas', spacing = 2) {
        this.canvas = typeof document !== 'undefined' ? document.getElementById(canvasId) : null;
        if (!this.canvas) {
            console.warn(`[Renderer3D] Canvas element '${canvasId}' not found. 3D mode disabled.`);
            this.isReady = false;
            return;
        }

        this.spacing = spacing;
        this.isReady = false;

        // Visual FX Systems
        this.particles = [];
        this.floatingTexts = [];
        this.weatherState = 'CLEAR';
        this.pulseAngle = 0;

        // Mesh caches for high-performance reuse
        this.snakeMeshes = [];
        this.targetMeshMap = new Map();
        this.hazardMeshMap = new Map();

        this._initThree();
    }

    /**
     * Initializes Three.js Scene, Camera, WebGLRenderer, and Lighting
     */
    _initThree() {
        if (typeof globalThis !== 'undefined' && globalThis.THREE) {
            THREE = globalThis.THREE;
        }

        if (!THREE || !this.canvas) {
            this.isReady = false;
            return;
        }

        try {
            const width = this.canvas.width || 1280;
            const height = this.canvas.height || 720;

            // 1. Scene & Camera
            this.scene = new THREE.Scene();
            this.scene.background = new THREE.Color(0x060911);
            this.scene.fog = new THREE.FogExp2(0x060911, 0.015);

            this.camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
            // Position camera looking down at a dramatic 3D angle
            this.camera.position.set(0, 32, 28);
            this.camera.lookAt(0, 0, -2);

            // 2. WebGL Renderer
            this.renderer = new THREE.WebGLRenderer({
                canvas: this.canvas,
                antialias: true,
                alpha: false,
                powerPreference: "high-performance"
            });
            this.renderer.setSize(width, height, false);
            this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
            this.renderer.shadowMap.enabled = true;
            this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

            // 3. Lighting System
            const ambientLight = new THREE.AmbientLight(0x1a2636, 1.2);
            this.scene.add(ambientLight);

            this.dirLight = new THREE.DirectionalLight(0x00f0ff, 1.8);
            this.dirLight.position.set(20, 40, 20);
            this.dirLight.castShadow = true;
            this.scene.add(this.dirLight);

            // Snake Head Spotlight / Pointlight
            this.headLight = new THREE.PointLight(0x00ffff, 3, 20);
            this.headLight.position.set(0, 3, 0);
            this.scene.add(this.headLight);

            // 4. Cyber Grid Floor
            this._createGridFloor(40, 22);

            // 5. 3D Weather System (Rain / Particles)
            this._initWeatherParticles();

            this.isReady = true;
        } catch (err) {
            console.warn("[Renderer3D] WebGL Initialization failed/fallback:", err);
            this.isReady = false;
        }
    }

    /**
     * Creates a glowing cyberpunk 3D grid floor with neon lines
     */
    _createGridFloor(gridW = 40, gridH = 22) {
        const floorWidth = gridW * this.spacing;
        const floorDepth = gridH * this.spacing;

        // Ground Plane Mesh
        const planeGeo = new THREE.PlaneGeometry(floorWidth, floorDepth);
        const planeMat = new THREE.MeshStandardMaterial({
            color: 0x070b14,
            roughness: 0.4,
            metalness: 0.8
        });
        const floorMesh = new THREE.Mesh(planeGeo, planeMat);
        floorMesh.rotation.x = -Math.PI / 2;
        floorMesh.position.set(0, -0.05, 0);
        floorMesh.receiveShadow = true;
        this.scene.add(floorMesh);

        // Cyber Grid Lines Helper
        const gridHelper = new THREE.GridHelper(Math.max(floorWidth, floorDepth), Math.max(gridW, gridH), 0x00ffff, 0x004466);
        gridHelper.position.set(0, 0.01, 0);
        if (gridHelper.material) {
            gridHelper.material.transparent = true;
            gridHelper.material.opacity = 0.4;
        }
        this.scene.add(gridHelper);

        // Outer Boundary Walls (Neon Glass)
        const wallMat = new THREE.MeshBasicMaterial({
            color: 0x00f0ff,
            wireframe: true,
            transparent: true,
            opacity: 0.25
        });
        const wallGeoH = new THREE.BoxGeometry(floorWidth, 2, 0.2);
        const wallGeoV = new THREE.BoxGeometry(0.2, 2, floorDepth);

        const topWall = new THREE.Mesh(wallGeoH, wallMat);
        topWall.position.set(0, 1, -floorDepth / 2);
        this.scene.add(topWall);

        const bottomWall = new THREE.Mesh(wallGeoH, wallMat);
        bottomWall.position.set(0, 1, floorDepth / 2);
        this.scene.add(bottomWall);

        const leftWall = new THREE.Mesh(wallGeoV, wallMat);
        leftWall.position.set(-floorWidth / 2, 1, 0);
        this.scene.add(leftWall);

        const rightWall = new THREE.Mesh(wallGeoV, wallMat);
        rightWall.position.set(floorWidth / 2, 1, 0);
        this.scene.add(rightWall);
    }

    /**
     * Converts 2D Grid coordinates (x, y) to 3D World space coordinates (x, y, z)
     */
    gridToWorld(gridX, gridY, gridW = 40, gridH = 22, heightOffset = 0.5) {
        const worldX = (gridX - gridW / 2 + 0.5) * this.spacing;
        const worldZ = (gridY - gridH / 2 + 0.5) * this.spacing;
        return new THREE.Vector3(worldX, heightOffset, worldZ);
    }

    setWeatherState(weatherState) {
        this.weatherState = weatherState || 'CLEAR';
    }

    /**
     * Main Render Loop called on every game tick
     * @param {Object} gridState
     */
    renderFrame(gridState) {
        if (!this.isReady || !gridState) return;

        try {
            this.pulseAngle = (this.pulseAngle + 0.05) % (Math.PI * 2);
            const gridW = gridState.width || 40;
            const gridH = gridState.height || 22;

            // 1. Render Hunter Snake in 3D
            if (gridState.hunter) {
                this._renderHunter3D(gridState.hunter, gridW, gridH);
            }

            // 2. Render Active Targets in 3D
            if (gridState.activeTargets) {
                this._renderTargets3D(gridState.activeTargets, gridW, gridH);
            }

            // 3. Render Hazards & Bosses in 3D
            if (gridState.playMode === 'mode1' || gridState.playMode === 'mode3') {
                this._renderHazards3D(gridState, gridW, gridH);
            }

            // 4. Update Particle & Weather Systems
            this._updateWeather3D();
            this._updateParticles3D();

            // 5. Render Scene
            if (this.renderer && this.scene && this.camera) {
                this.renderer.render(this.scene, this.camera);
            }
        } catch (err) {
            console.warn("[Renderer3D] Frame render warning (recovered safely):", err);
        }
    }

    /**
     * Renders 3D glowing meshes for Hunter (head + body segments)
     */
    _renderHunter3D(hunter, gridW, gridH) {
        if (!hunter || !hunter.HeadCoordinate) return;
        const head = hunter.HeadCoordinate;
        const body = hunter.BodySegments || [];
        const totalSegments = 1 + body.length;

        // Resize mesh pool if segment count changed
        while (this.snakeMeshes.length < totalSegments) {
            const isHeadMesh = this.snakeMeshes.length === 0;
            const geo = isHeadMesh ? new THREE.SphereGeometry(0.85, 16, 16) : new THREE.BoxGeometry(1.2, 1.2, 1.2);
            const mat = new THREE.MeshStandardMaterial({
                color: isHeadMesh ? 0x00ffff : 0x00ff88,
                emissive: isHeadMesh ? 0x008888 : 0x004422,
                roughness: 0.2,
                metalness: 0.7
            });
            const mesh = new THREE.Mesh(geo, mat);
            mesh.castShadow = true;
            this.scene.add(mesh);
            this.snakeMeshes.push(mesh);
        }

        // Hide excess meshes
        for (let i = totalSegments; i < this.snakeMeshes.length; i++) {
            this.snakeMeshes[i].visible = false;
        }

        // Position Head
        const headMesh = this.snakeMeshes[0];
        const headPos = this.gridToWorld(head.x, head.y, gridW, gridH, 0.7);
        headMesh.position.copy(headPos);
        headMesh.visible = true;

        // Position Head Spotlight
        if (this.headLight) {
            this.headLight.position.copy(headPos).add(new THREE.Vector3(0, 2, 0));
        }

        // Position Body Segments
        body.forEach((seg, idx) => {
            if (!seg) return;
            const mesh = this.snakeMeshes[idx + 1];
            if (mesh) {
                const pos = this.gridToWorld(seg.x, seg.y, gridW, gridH, 0.6);
                mesh.position.copy(pos);
                mesh.visible = true;
            }
        });

        // Smooth camera tracking on Hunter Head
        if (this.camera) {
            this.camera.position.x = THREE.MathUtils.lerp(this.camera.position.x, headPos.x * 0.4, 0.05);
            this.camera.lookAt(headPos.x * 0.2, 0, headPos.z * 0.2);
        }
    }

    /**
     * Renders glowing 3D gemstone shapes for active targets
     */
    _renderTargets3D(activeTargets, gridW, gridH) {
        if (!activeTargets) return;
        const currentKeys = new Set(activeTargets.keys());

        // Remove stale targets
        for (const [key, meshGroup] of this.targetMeshMap.entries()) {
            if (!currentKeys.has(key)) {
                this.scene.remove(meshGroup);
                this.targetMeshMap.delete(key);
            }
        }

        // Create or update active targets
        for (const [coordKey, record] of activeTargets.entries()) {
            if (!coordKey || !record) continue;
            const [x, y] = coordKey.split(',').map(Number);
            const pos = this.gridToWorld(x, y, gridW, gridH, 1.0);

            let meshGroup = this.targetMeshMap.get(coordKey);
            if (!meshGroup) {
                meshGroup = new THREE.Group();

                // 3D Gemstone Geometry
                const geo = record.Category === 'High' 
                    ? new THREE.OctahedronGeometry(0.8) 
                    : (record.Category === 'Elite' ? new THREE.DodecahedronGeometry(0.8) : new THREE.BoxGeometry(0.9, 0.9, 0.9));

                const colorHex = this._parseColorToHex(record.Color || record.Badge_Color || '#00f0ff');
                const mat = new THREE.MeshStandardMaterial({
                    color: colorHex,
                    emissive: colorHex,
                    emissiveIntensity: 0.6,
                    roughness: 0.1,
                    metalness: 0.9
                });

                const gemMesh = new THREE.Mesh(geo, mat);
                gemMesh.castShadow = true;
                meshGroup.add(gemMesh);

                // Small Target Point Light
                const targetLight = new THREE.PointLight(colorHex, 1.5, 6);
                targetLight.position.set(0, 0, 0);
                meshGroup.add(targetLight);

                this.scene.add(meshGroup);
                this.targetMeshMap.set(coordKey, meshGroup);
            }

            meshGroup.position.copy(pos);
            // Floating bounce & hover rotation
            meshGroup.position.y = 1.0 + Math.sin(this.pulseAngle * 2 + x) * 0.2;
            meshGroup.rotation.y += 0.03;
            meshGroup.rotation.x += 0.01;
        }
    }

    /**
     * Renders 3D threat models for hazards/bosses
     */
    _renderHazards3D(gridState, gridW, gridH) {
        const rawHazards = (Array.isArray(gridState.hazards) && gridState.hazards.length > 0)
            ? gridState.hazards
            : (gridState.bossPosition ? [gridState.bossPosition] : []);

        const currentKeys = new Set();
        rawHazards.forEach((h, idx) => {
            if (!h) return;
            const hx = typeof h.x === 'number' ? h.x : (h.position ? h.position.x : 0);
            const hy = typeof h.y === 'number' ? h.y : (h.position ? h.position.y : 0);
            const type = h.type || 'crime_boss';
            const key = `${hx},${hy}_${idx}`;
            currentKeys.add(key);

            let mesh = this.hazardMeshMap.get(key);
            if (!mesh) {
                const isPolice = type === 'police_patrol';
                const isDeath = type === 'death_reaper';
                const colorHex = isPolice ? 0x0088ff : (isDeath ? 0xaa00ff : 0xff0055);
                const geo = isDeath ? new THREE.TetrahedronGeometry(0.9) : new THREE.ConeGeometry(0.8, 1.6, 4);
                const mat = new THREE.MeshStandardMaterial({
                    color: colorHex,
                    emissive: colorHex,
                    emissiveIntensity: 0.6,
                    roughness: 0.3,
                    metalness: 0.8
                });
                mesh = new THREE.Mesh(geo, mat);
                this.scene.add(mesh);
                this.hazardMeshMap.set(key, mesh);
            }

            const pos = this.gridToWorld(hx, hy, gridW, gridH, 0.9);
            mesh.position.copy(pos);
            mesh.rotation.y += 0.05;
        });

        // Cleanup unused hazard meshes
        for (const [key, mesh] of this.hazardMeshMap.entries()) {
            if (!currentKeys.has(key)) {
                this.scene.remove(mesh);
                this.hazardMeshMap.delete(key);
            }
        }
    }

    /**
     * Initializes 3D Weather Particle Rain System
     */
    _initWeatherParticles() {
        const particleCount = 400;
        const geo = new THREE.BufferGeometry();
        const positions = new Float32Array(particleCount * 3);

        for (let i = 0; i < particleCount; i++) {
            positions[i * 3] = (Math.random() - 0.5) * 80;
            positions[i * 3 + 1] = Math.random() * 40;
            positions[i * 3 + 2] = (Math.random() - 0.5) * 60;
        }

        geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        const mat = new THREE.PointsMaterial({
            color: 0x00ffff,
            size: 0.25,
            transparent: true,
            opacity: 0.6
        });

        this.weatherRainSystem = new THREE.Points(geo, mat);
        this.scene.add(this.weatherRainSystem);
    }

    /**
     * Updates 3D Weather particles on tick
     */
    _updateWeather3D() {
        if (!this.weatherRainSystem) return;

        const isRainy = this.weatherState === 'RAIN' || this.weatherState === 'THUNDER';
        this.weatherRainSystem.visible = isRainy;

        if (!isRainy) return;

        const positions = this.weatherRainSystem.geometry.attributes.position.array;
        for (let i = 0; i < positions.length / 3; i++) {
            positions[i * 3 + 1] -= 0.8; // Rain speed down
            if (positions[i * 3 + 1] < 0) {
                positions[i * 3 + 1] = 35;
            }
        }
        this.weatherRainSystem.geometry.attributes.position.needsUpdate = true;
    }

    emitSparks(px, py, color = '#00ff88', count = 15) {}

    addFloatingText(px, py, text, color = '#00ff88') {}

    _updateParticles3D() {}

    _parseColorToHex(colorStr) {
        if (typeof colorStr === 'string' && colorStr.startsWith('#')) {
            return parseInt(colorStr.replace('#', '0x'), 16);
        }
        return 0x00f0ff;
    }
}
