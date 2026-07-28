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
        this.audioService = deps.audioService;
        this.playMode = deps.playMode || 'mode1';
        this.attackManager = deps.attackManager;
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
            } catch (e) {
                console.error("Uncaught exception in GameLoop update tick:", e);
                this.stop();
            }
        }

        if (this.running) {
            this.animationId = requestAnimationFrame((t) => this.tick(t));
        }
    }

    update() {
        if (!this.gridState || !this.gridState.hunter) return;

        // 1. Process Input
        const currentDir = this.gridState.hunter.Direction;
        const nextDir = this.inputHandler ? this.inputHandler.getCurrentDirection(currentDir) : currentDir;
        if (nextDir) {
            this.gridState.hunter.Direction = nextDir;
        }

        // 2. Move Hunter & Hazards
        this.gridState.moveHunter();

        if (typeof this.gridState.moveHazards === 'function') {
            this.gridState.moveHazards();
        } else if (typeof this.gridState.moveBoss === 'function') {
            this.gridState.moveBoss();
        }

        // 3. Collision Check
        const head = this.gridState.hunter.HeadCoordinate;
        const body = this.gridState.hunter.BodySegments;
        const bounds = { width: this.gridState.width, height: this.gridState.height };

        const hazardsOrBoss = (Array.isArray(this.gridState.hazards) && this.gridState.hazards.length > 0)
            ? this.gridState.hazards
            : this.gridState.bossPosition;

        const isCollided = this.collisionDetector.checkCollision(head, bounds, body, hazardsOrBoss);
        if (isCollided) {
            const lastRes = this.collisionDetector.lastResult || {};
            this.lastCollisionReason = lastRes.reason || 'Tactical Operation Failed';
            this.lastHazardName = lastRes.hazardName || null;
            if (this.audioService && typeof this.audioService.playGameOverSound === 'function') {
                this.audioService.playGameOverSound();
            }
            this.stop();
            return;
        }

        // 4. Target Capture Check
        const headKey = `${head.x},${head.y}`;
        if (this.gridState.activeTargets.has(headKey)) {
            const capturedTarget = this.targetManager.handleCapture(headKey);
            this.gridState.growHunter(capturedTarget.Computed_Value);

            let addedScore = capturedTarget.Computed_Value;
            let popupText = `+${addedScore}`;
            let popupColor = '#00ff88';
            let attackInfo = { name: 'Standard Capture', icon: '👮', color: '#00f0ff' };
            let attackIdToPlay = 'default';

            if (this.playMode === 'mode1' && this.attackManager) {
                const attackResult = this.attackManager.consumeActiveAttack(capturedTarget.Computed_Value);
                addedScore = attackResult.finalValue;
                popupText = `+${addedScore} (${attackResult.attackName.toUpperCase()})`;
                popupColor = attackResult.color || '#00ff88';
                attackIdToPlay = attackResult.attackId || attackResult.attackName;
                attackInfo = {
                    name: attackResult.attackName,
                    pastAction: attackResult.pastAction || attackResult.attackName,
                    icon: attackResult.icon,
                    color: attackResult.color
                };
            }

            if (this.audioService && typeof this.audioService.playAttackSound === 'function') {
                this.audioService.playAttackSound(attackIdToPlay);
            }

            if (this.scoreManager) {
                if (typeof this.scoreManager.recordCriminalCapture === 'function') {
                    this.scoreManager.recordCriminalCapture(capturedTarget, attackInfo, addedScore);
                }
                this.scoreManager.addCaptureValue(addedScore);
            }

            if (this.renderer) {
                const cs = this.renderer.cellSize || 32;
                const px = head.x * cs + cs / 2;
                const py = head.y * cs;
                if (typeof this.renderer.emitSparks === 'function') {
                    this.renderer.emitSparks(px, py + cs / 2, popupColor, 18);
                }
                if (typeof this.renderer.addFloatingText === 'function') {
                    this.renderer.addFloatingText(px, py, popupText, popupColor);
                }
            }

            if (this.levelManager) {
                this.levelManager.handleCapture();
            }
        }

        if (this.renderer && typeof this.renderer.renderFrame === 'function') {
            this.renderer.renderFrame(this.gridState);
        }
    }
}
