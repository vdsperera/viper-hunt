export class LevelManager {
    constructor(gridState, targetManager, gameLoop, targetsPerLevel = 5, maxSimultaneousTargets = 3) {
        this.gridState = gridState;
        this.targetManager = targetManager;
        this.gameLoop = gameLoop;
        
        this.targetsPerLevel = targetsPerLevel;
        this.maxSimultaneousTargets = maxSimultaneousTargets;
        this.capturedThisLevel = 0;
    }

    /**
     * Call this whenever the GameLoop detects a valid capture.
     */
    handleCapture() {
        this.capturedThisLevel++;
        if (this.capturedThisLevel >= this.targetsPerLevel) {
            this.advanceLevel();
        } else {
            // Spawn next target to keep the active count at maxSimultaneousTargets
            // (Only if there are still enough targets left in the level)
            const remainingToCapture = this.targetsPerLevel - this.capturedThisLevel;
            if (this.gridState.activeTargets.size < Math.min(this.maxSimultaneousTargets, remainingToCapture)) {
                this.targetManager.spawnTarget();
            }
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
        this.levelStartTime = performance.now();
        this.capturedThisLevel = 0;
        
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

        // Spawn targets for the next level
        let spawnedAny = false;
        for (let i = 0; i < Math.min(this.maxSimultaneousTargets, this.targetsPerLevel); i++) {
            const newTarget = this.targetManager.spawnTarget();
            if (newTarget) spawnedAny = true;
        }
        
        if (!spawnedAny) {
            // Session complete, no registry data left
            if (this.gameLoop) this.gameLoop.stop();
        }
    }
}
