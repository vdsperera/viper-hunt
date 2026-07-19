import { Direction } from '../models/HunterEntity.js';

export class InputHandler {
    constructor() {
        this.inputQueue = [];
        this.currentMovingDirection = Direction.RIGHT; // Default baseline
        this._bindEvents();
    }

    _bindEvents() {
        window.addEventListener('keydown', (e) => {
            const dir = this._mapToDirection(e.key);
            if (dir) {
                this._enqueueDirection(dir);
            }
        });
    }

    _mapToDirection(key) {
        switch (key.toLowerCase()) {
            case 'w':
            case 'arrowup':
                return Direction.UP;
            case 's':
            case 'arrowdown':
                return Direction.DOWN;
            case 'a':
            case 'arrowleft':
                return Direction.LEFT;
            case 'd':
            case 'arrowright':
                return Direction.RIGHT;
            default:
                return null;
        }
    }

    _isReversal(dir1, dir2) {
        return (
            (dir1 === Direction.UP && dir2 === Direction.DOWN) ||
            (dir1 === Direction.DOWN && dir2 === Direction.UP) ||
            (dir1 === Direction.LEFT && dir2 === Direction.RIGHT) ||
            (dir1 === Direction.RIGHT && dir2 === Direction.LEFT)
        );
    }

    _enqueueDirection(newDir) {
        const lastIntended = this.inputQueue.length > 0 
            ? this.inputQueue[this.inputQueue.length - 1] 
            : this.currentMovingDirection;
        
        // Only enqueue if it's a new direction and not a reversal
        if (newDir !== lastIntended && !this._isReversal(newDir, lastIntended)) {
            // Cap queue size to prevent unbounded memory growth from key mashing
            if (this.inputQueue.length < 3) {
                this.inputQueue.push(newDir);
            }
        }
    }

    /**
     * @param {string} currentFacing - The physical direction the Hunter is facing this tick
     * @returns {string} The resolved direction for the next tick
     */
    getCurrentDirection(currentFacing) {
        // Sync our baseline physical state with the engine
        if (currentFacing) {
            this.currentMovingDirection = currentFacing;
        }
        
        if (this.inputQueue.length === 0) {
            return this.currentMovingDirection;
        }

        const nextDir = this.inputQueue.shift();
        
        // Final sanity check against 180 reversals in case physical state changed
        if (this._isReversal(nextDir, this.currentMovingDirection)) {
            return this.currentMovingDirection;
        }
        
        this.currentMovingDirection = nextDir;
        return nextDir;
    }

    clearInputQueue() {
        this.inputQueue = [];
    }
}
