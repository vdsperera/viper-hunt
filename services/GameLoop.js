export class GameLoop {
    constructor(fps, deps) {
        this.fps = fps;
        this.interval = 1000 / fps;
        this.lastTime = 0;
        this.running = false;
        this.animationId = null;

        // Injected dependencies
        this.inputHandler = deps.inputHandler;
        this.gridState = deps.gridState;
        this.collisionDetector = deps.collisionDetector;
        this.targetManager = deps.targetManager;
        this.renderer = deps.renderer;
        this.scoreManager = deps.scoreManager;
        this.playMode = deps.playMode || 'mode1';
    }

    start() {
        if (this.running) return;
        this.running = true;
        this.lastTime = performance.now();
        this.animationId = requestAnimationFrame((t) => this.tick(t));
    }

    stop() {
        this.running = false;
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
    }

    tick(timestamp) {
        if (!this.running) return;

        const deltaTime = timestamp - this.lastTime;

        // Cap execution to intended tick interval (fps)
        if (deltaTime >= this.interval) {
            this.lastTime = timestamp - (deltaTime % this.interval);
            
            try {
                this.update();
                this.renderer.renderFrame(this.gridState);
            } catch (error) {
                console.error("GameLoop hard failure:", error);
                this.stop(); // Safe fallback to avoid silent cyclic exceptions
            }
        }

        if (this.running) {
            this.animationId = requestAnimationFrame((t) => this.tick(t));
        }
    }

    update() {
        if (!this.gridState.hunter) return;

        // 1. Process Input
        const currentDir = this.gridState.hunter.Direction;
        const nextDir = this.inputHandler.getCurrentDirection(currentDir);
        this.gridState.hunter.Direction = nextDir;

        // 2. Move Hunter
        this.gridState.moveHunter();

        // 3. Collision Check
        const head = this.gridState.hunter.HeadCoordinate;
        const body = this.gridState.hunter.BodySegments;
        const bounds = { width: this.gridState.width, height: this.gridState.height };

        if (this.collisionDetector.checkCollision(head, bounds, body)) {
            // Trigger GameOver (TASK-017 overlays will integrate here)
            this.stop();
            return;
        }

        // 4. Target Capture Check
        const headKey = `${head.x},${head.y}`;
        if (this.gridState.activeTargets.has(headKey)) {
            const capturedTarget = this.targetManager.handleCapture(headKey);
            this.gridState.growHunter(capturedTarget.Computed_Value);
            
            if (this.scoreManager) {
                this.scoreManager.addCaptureValue(capturedTarget.Computed_Value);
            }

            if (this.levelManager) {
                this.levelManager.handleCapture();
            }
        }
    }
}
