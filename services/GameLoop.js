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
        this.adaptiveDifficultyService = deps.adaptiveDifficultyService;
        this.llmService = deps.llmService;
        this.playMode = deps.playMode || 'mode1';
        this.attackManager = deps.attackManager;
    }

    start() {
        if (this.running) return;
        this.running = true;
        this.lastTime = performance.now();
        if (this.audioService && typeof this.audioService.startBGM === 'function') {
            this.audioService.startBGM();
        }
        this.animationId = requestAnimationFrame((t) => this.tick(t));
    }

    stop() {
        this.running = false;
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
        if (this.audioService && typeof this.audioService.stopBGM === 'function') {
            this.audioService.stopBGM();
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

        if (this.adaptiveDifficultyService && typeof this.adaptiveDifficultyService.tick === 'function') {
            this.adaptiveDifficultyService.tick();
        }

        // Update real-time HUD threat status badge based on active grid risk & hazard count
        if (typeof document !== 'undefined') {
            const hudThreat = document.getElementById('hud-threat-level');
            if (hudThreat && this.gridState && typeof this.gridState.getThreatStatus === 'function') {
                const threat = this.gridState.getThreatStatus();
                hudThreat.innerText = threat.label;
                hudThreat.style.color = threat.color;
            }
        }

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
            if (this.adaptiveDifficultyService && typeof this.adaptiveDifficultyService.recordFailure === 'function') {
                this.adaptiveDifficultyService.recordFailure();
            }
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
                    color: attackResult.color,
                    alignmentScore: attackResult.alignmentScore || 0,
                    policeDelta: attackResult.policeDelta || 0,
                    crimeBossDelta: attackResult.crimeBossDelta || 0,
                    riskDescription: attackResult.riskDescription || ''
                };

                if (this.gridState && typeof this.gridState.applyAttackConsequences === 'function') {
                    const riskOutcomes = this.gridState.applyAttackConsequences(attackResult.policeDelta, attackResult.crimeBossDelta);
                    if (this.renderer && Array.isArray(riskOutcomes)) {
                        const cs = this.renderer.cellSize || 32;
                        const px = head.x * cs + cs / 2;
                        const py = head.y * cs;
                        riskOutcomes.forEach((oc, i) => {
                            const color = oc.type.includes('boss') ? '#ff0055' : oc.type.includes('remove') ? '#00f0ff' : '#0088ff';
                            setTimeout(() => {
                                if (this.renderer && typeof this.renderer.addFloatingText === 'function') {
                                    this.renderer.addFloatingText(px, py - (i + 1) * 22, oc.text, color);
                                }
                            }, (i + 1) * 150);
                        });
                    }
                }
            }

            if (this.adaptiveDifficultyService && typeof this.adaptiveDifficultyService.recordCapture === 'function') {
                const tier = this.adaptiveDifficultyService.recordCapture();
                if (tier && tier.bountyMult && tier.bountyMult !== 1.0) {
                    addedScore = Math.round(addedScore * tier.bountyMult);
                    popupText += ` [${tier.name}]`;
                }
            }

            if (this.audioService && typeof this.audioService.playAttackSound === 'function') {
                this.audioService.playAttackSound(attackIdToPlay);
            }

            let confession = '';
            if (this.llmService && typeof this.llmService._synthesizeProceduralConfession === 'function') {
                confession = this.llmService._synthesizeProceduralConfession(capturedTarget.Name, capturedTarget.Incident, attackInfo.name);
            }

            if (this.scoreManager) {
                if (typeof this.scoreManager.recordCriminalCapture === 'function') {
                    this.scoreManager.recordCriminalCapture(capturedTarget, attackInfo, addedScore, confession);
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
