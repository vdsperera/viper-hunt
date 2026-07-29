export class TargetManager {
    constructor(gridState, registryService) {
        this.gridState = gridState;
        this.registryService = registryService;
        this.currentLevelPool = null;
    }

    /**
     * Sets the dedicated target pool for the active level.
     * @param {Array<CriminalRecord>} records
     */
    setLevelPool(records) {
        this.currentLevelPool = Array.isArray(records) ? [...records] : null;
    }

    spawnTarget() {
        let pool = this.currentLevelPool;
        if (!pool || pool.length === 0) {
            pool = this.registryService ? this.registryService.getUnspawnedRecords() : [];
        }
        if (!pool || pool.length === 0) return null; // Session complete, no targets left

        // Select random target and safely remove from pool
        const targetIndex = Math.floor(Math.random() * pool.length);
        const record = pool.splice(targetIndex, 1)[0];

        let spawned = false;
        let attempts = 0;
        let coord = { x: 0, y: 0 };
        
        const minX = this.gridState.width > 2 ? 1 : 0;
        const maxX = this.gridState.width > 2 ? this.gridState.width - 2 : this.gridState.width - 1;
        const minY = this.gridState.height > 2 ? 1 : 0;
        const maxY = this.gridState.height > 2 ? this.gridState.height - 2 : this.gridState.height - 1;

        // Find empty cell with retry limits to prevent infinite locks on dense grids
        while (!spawned && attempts < 1000) {
            coord.x = minX + Math.floor(Math.random() * (maxX - minX + 1));
            coord.y = minY + Math.floor(Math.random() * (maxY - minY + 1));
            
            if (!this.gridState.isCellOccupied(coord.x, coord.y)) {
                spawned = true;
            }
            attempts++;
        }

        if (spawned) {
            this.gridState.activeTargets.set(`${coord.x},${coord.y}`, record);
            return record;
        }
        
        // Push target back to pool if grid is fully saturated
        pool.push(record);
        return null; 
    }

    handleCapture(coordKey) {
        if (this.gridState.activeTargets.has(coordKey)) {
            const captured = this.gridState.activeTargets.get(coordKey);
            this.gridState.activeTargets.delete(coordKey);
            return captured;
        }
        return null;
    }
}
