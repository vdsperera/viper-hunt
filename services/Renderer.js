export class Renderer {
    /**
     * @param {string} canvasId
     * @param {number} cellSize - Pixel size of each grid cell
     */
    constructor(canvasId, cellSize = 32) {
        this.canvas = document.getElementById(canvasId);
        if (!this.canvas) throw new Error(`Renderer validation failed: Canvas element '${canvasId}' not found.`);
        
        this.ctx = this.canvas.getContext('2d');
        if (!this.ctx) throw new Error("Renderer failed to acquire 2D context.");

        this.cellSize = cellSize;
        this.imageCache = new Map(); // Cache to prevent continuous reloading of avatars
    }

    /**
     * @param {Object} gridState
     */
    renderFrame(gridState) {
        if (!gridState || typeof gridState !== 'object') {
            throw new Error("Renderer.renderFrame requires a valid state object.");
        }
        if (!gridState.activeTargets || !gridState.hunter) {
            throw new TypeError("Renderer.renderFrame: malformed state object. 'activeTargets' and 'hunter' properties are required.");
        }
        
        // 1. Clear Frame / Draw Background
        this.ctx.fillStyle = '#1a1a1a';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // 2. Draw Targets (TASK-016)
        if (gridState.activeTargets) {
            for (const [coordKey, record] of gridState.activeTargets.entries()) {
                const [x, y] = coordKey.split(',').map(Number);
                this._drawTarget(x, y, record);
            }
        }

        // 3. Draw Hunter (TASK-015)
        if (gridState.hunter) {
            // Draw body segments
            this.ctx.fillStyle = '#00ff00';
            for (const segment of gridState.hunter.BodySegments) {
                this.ctx.fillRect(
                    segment.x * this.cellSize, 
                    segment.y * this.cellSize, 
                    this.cellSize - 1, // -1 for visual grid separation
                    this.cellSize - 1
                );
            }
            
            // Draw head (distinct color)
            this.ctx.fillStyle = '#00aa00';
            this.ctx.fillRect(
                gridState.hunter.HeadCoordinate.x * this.cellSize, 
                gridState.hunter.HeadCoordinate.y * this.cellSize, 
                this.cellSize - 1, 
                this.cellSize - 1
            );
        }
    }

    _drawTarget(x, y, record) {
        const px = x * this.cellSize;
        const py = y * this.cellSize;

        // Fetch or initialise Image object
        let img = this.imageCache.get(record.ID);
        if (!img) {
            img = new Image();
            img.src = record.Avatar_Asset_Path;
            img.onload = () => { img.loaded = true; };
            // Handle broken URLs gracefully per ADR-003
            img.onerror = () => { img.failed = true; };
            this.imageCache.set(record.ID, img);
        }

        if (img.complete && img.loaded && !img.failed) {
            // Secure rendering: drawImage avoids script execution completely
            this.ctx.drawImage(img, px, py, this.cellSize, this.cellSize);
        } else if (img.failed) {
            // Fallback placeholder if missing or blocked by CORS
            this.ctx.fillStyle = '#ff3333';
            this.ctx.fillRect(px, py, this.cellSize - 1, this.cellSize - 1);
        }
        // If loading (not complete and not failed), we leave the background to prevent flashing

        // Draw Value Label Overlay
        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = '12px Courier New';
        this.ctx.fillText(`$${record.Computed_Value}`, px + 2, py + 12);
    }
}
