/**
 * RenderManager
 * Composite render manager coordinating 2D HTML5 Canvas renderer 
 * and 3D Three.js WebGL renderer for live 2D/3D mode toggling.
 */
import { Renderer } from './Renderer.js';
import { Renderer3D } from './Renderer3D.js';

export class RenderManager {
    /**
     * @param {string} canvas2dId - ID of 2D HTML5 Canvas element
     * @param {string} canvas3dId - ID of 3D WebGL Canvas element
     * @param {number} cellSize - Pixel size for 2D grid cells
     */
    constructor(canvas2dId = 'game-canvas', canvas3dId = 'three-canvas', cellSize = 32) {
        this.canvas2dId = canvas2dId;
        this.canvas3dId = canvas3dId;
        this.cellSize = cellSize;
        this.mode = '2d';

        // 1. Initialize 2D Renderer (always available)
        this.renderer2D = new Renderer(canvas2dId, cellSize);

        // 2. Safely Attempt to Initialize 3D Renderer (WebGL)
        this.renderer3D = null;
        try {
            this.renderer3D = new Renderer3D(canvas3dId, 2);
        } catch (err) {
            console.warn("[RenderManager] 3D Renderer initial setup skipped or offline fallback active:", err);
        }

        this.onModeChange = null;
    }

    /**
     * Toggles or sets rendering mode ('2d' or '3d')
     * @param {string} newMode 
     */
    setMode(newMode) {
        if (newMode !== '2d' && newMode !== '3d') return;

        // If 3D requested but 3D renderer unavailable, fallback to 2D
        if (newMode === '3d' && (!this.renderer3D || !this.renderer3D.isReady)) {
            console.warn("[RenderManager] 3D renderer unavailable. Falling back to 2D mode.");
            newMode = '2d';
        }

        this.mode = newMode;

        const canvas2d = document.getElementById(this.canvas2dId);
        const canvas3d = document.getElementById(this.canvas3dId);

        if (canvas2d && canvas3d) {
            if (this.mode === '3d') {
                canvas2d.classList.add('hidden');
                canvas3d.classList.remove('hidden');
            } else {
                canvas3d.classList.add('hidden');
                canvas2d.classList.remove('hidden');
            }
        }

        if (typeof this.onModeChange === 'function') {
            this.onModeChange(this.mode);
        }
    }

    /**
     * Gets currently active mode
     */
    getMode() {
        return this.mode;
    }

    /**
     * Core Render Call — Delegated to active renderer
     * @param {Object} gridState 
     */
    renderFrame(gridState) {
        if (this.mode === '3d' && this.renderer3D && this.renderer3D.isReady) {
            this.renderer3D.renderFrame(gridState);
        } else {
            this.renderer2D.renderFrame(gridState);
        }
    }

    /**
     * Propagates weather state updates to both renderers
     */
    setWeatherState(state) {
        if (this.renderer2D) this.renderer2D.setWeatherState(state);
        if (this.renderer3D) this.renderer3D.setWeatherState(state);
    }

    /**
     * Emits particle spark bursts
     */
    emitSparks(px, py, color, count) {
        if (this.renderer2D && typeof this.renderer2D.emitSparks === 'function') {
            this.renderer2D.emitSparks(px, py, color, count);
        }
        if (this.renderer3D && typeof this.renderer3D.emitSparks === 'function') {
            this.renderer3D.emitSparks(px, py, color, count);
        }
    }

    /**
     * Adds floating score popups
     */
    addFloatingText(px, py, text, color) {
        if (this.renderer2D && typeof this.renderer2D.addFloatingText === 'function') {
            this.renderer2D.addFloatingText(px, py, text, color);
        }
    }
}
