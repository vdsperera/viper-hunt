export class LevelManager {
    constructor(
        gridState, 
        targetManager, 
        gameLoop, 
        targetsPerLevel = 5, 
        maxSimultaneousTargets = 3, 
        maxLevels = 3,
        levelTargetSpecs = null
    ) {
        this.gridState = gridState;
        this.targetManager = targetManager;
        this.gameLoop = gameLoop;
        
        this.targetsPerLevel = targetsPerLevel;
        this.maxSimultaneousTargets = maxSimultaneousTargets;
        this.maxLevels = maxLevels;
        this.levelTargetSpecs = levelTargetSpecs;
        this.capturedThisLevel = 0;
        this.currentLevelIndex = 0;
    }

    /**
     * Call this whenever the GameLoop detects a valid capture.
     */
    handleCapture() {
        this.capturedThisLevel++;
        const targetGoal = this.activeTargetsPerLevel || this.targetsPerLevel;
        if (this.capturedThisLevel >= targetGoal) {
            this.advanceLevel();
        }
    }

    /**
     * Seamless level transition logic.
     */
    advanceLevel() {
        if (this.gameLoop && this.gameLoop.scoreManager) {
            // Only apply level completion score if we actually played a level (not on initial bootstrap)
            if (this.levelStartTime) {
                const elapsed = (performance.now() - this.levelStartTime) / 1000;
                this.gameLoop.scoreManager.completeLevel(undefined, elapsed);
            }
        }

        this.currentLevelIndex++;

        if (this.currentLevelIndex > this.maxLevels) {
            if (this.gameLoop) {
                this.gameLoop.victory = true;
                this.gameLoop.stop();
            }
            return;
        }

        this.levelStartTime = performance.now();
        this.capturedThisLevel = 0;
        let activeCount = this.targetsPerLevel;
        
        // Allocate deterministic level target pool for maximum scoring fairness
        if (this.targetManager && this.targetManager.registryService && typeof this.targetManager.registryService.getRecordsForLevel === 'function') {
            const recordsForLevel = this.targetManager.registryService.getRecordsForLevel(
                this.currentLevelIndex, 
                this.targetsPerLevel,
                this.levelTargetSpecs
            );
            if (recordsForLevel && recordsForLevel.length > 0) {
                this.targetManager.setLevelPool(recordsForLevel);
                activeCount = recordsForLevel.length;
            }
        }
        this.activeTargetsPerLevel = activeCount;

        if (this.gridState.hunter) {
            // Seamlessly snap Hunter head back to mathematical center of the grid
            const newHead = { 
                x: Math.floor(this.gridState.width / 2), 
                y: Math.floor(this.gridState.height / 2) 
            };
            this.gridState.hunter.HeadCoordinate = newHead;
            
            // Retain length but straighten body behind the head to prevent instant self-collision
            const currentLength = this.gridState.hunter.BodySegments.length;
            const dir = this.gridState.hunter.Direction || 'RIGHT';
            const newBody = [];
            
            for (let i = 1; i <= currentLength; i++) {
                if (dir === 'UP') newBody.push({ x: newHead.x, y: newHead.y + i });
                else if (dir === 'DOWN') newBody.push({ x: newHead.x, y: newHead.y - i });
                else if (dir === 'LEFT') newBody.push({ x: newHead.x + i, y: newHead.y });
                else newBody.push({ x: newHead.x - i, y: newHead.y }); // RIGHT
            }
            
            this.gridState.hunter.BodySegments = newBody;
        }

        // Clear any uncaptured targets from previous level
        this.gridState.activeTargets.clear();

        // Spawn all configured targets for this level up front
        let spawnedAny = false;
        const countToSpawn = this.activeTargetsPerLevel || this.targetsPerLevel;
        for (let i = 0; i < countToSpawn; i++) {
            const newTarget = this.targetManager.spawnTarget();
            if (newTarget) spawnedAny = true;
        }

        // Spawn Criminal Big Boss threat figure in Criminal mode (mode1)
        if (this.gridState.playMode === 'mode1') {
            this.gridState.spawnBoss();
        }
        
        if (!spawnedAny) {
            // Session complete, no registry data left
            if (this.gameLoop) {
                this.gameLoop.victory = true;
                this.gameLoop.stop();
            }
        }
    }
}
