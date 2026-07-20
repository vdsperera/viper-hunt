import { Direction } from '../models/HunterEntity.js';

export class InputHandler {
    constructor() {
        this.inputQueue = [];
        this.currentMovingDirection = Direction.RIGHT; // Default baseline
        this._bindEvents();
    }

    _bindEvents() {
        if (typeof window !== 'undefined') {
            window.addEventListener('keydown', (e) => {
                const dir = this._mapToDirection(e.key);
                if (dir) {
                    this._enqueueDirection(dir);
                }
            });
        }
    }

    /**
     * Public method to allow external controllers (virtual D-Pad, touch swipes) to enqueue direction
     * @param {string} dir - One of Direction.UP, Direction.DOWN, Direction.LEFT, Direction.RIGHT
     */
    injectDirection(dir) {
        if (Object.values(Direction).includes(dir)) {
            this._enqueueDirection(dir);
        }
    }

    /**
     * Binds touch swipe listeners on a DOM element (canvas or container)
     * @param {HTMLElement} element
     */
    bindTouchSwipe(element) {
        if (!element || typeof element.addEventListener !== 'function') return;

        let startX = 0;
        let startY = 0;
        const minSwipeDistance = 20;

        element.addEventListener('touchstart', (e) => {
            if (e.touches && e.touches.length > 0) {
                startX = e.touches[0].clientX;
                startY = e.touches[0].clientY;
            }
        }, { passive: true });

        element.addEventListener('touchend', (e) => {
            if (!e.changedTouches || e.changedTouches.length === 0) return;

            const endX = e.changedTouches[0].clientX;
            const endY = e.changedTouches[0].clientY;
            const deltaX = endX - startX;
            const deltaY = endY - startY;

            if (Math.abs(deltaX) < minSwipeDistance && Math.abs(deltaY) < minSwipeDistance) {
                return; // Tap, not a swipe
            }

            if (Math.abs(deltaX) > Math.abs(deltaY)) {
                // Horizontal Swipe
                if (deltaX > 0) {
                    this.injectDirection(Direction.RIGHT);
                } else {
                    this.injectDirection(Direction.LEFT);
                }
            } else {
                // Vertical Swipe
                if (deltaY > 0) {
                    this.injectDirection(Direction.DOWN);
                } else {
                    this.injectDirection(Direction.UP);
                }
            }
        }, { passive: true });
    }

    /**
     * Binds virtual D-Pad buttons for touch/pointer input
     * @param {Object} buttonMap - { upEl, downEl, leftEl, rightEl } or DOM container
     */
    bindDpadControls(dpadContainer) {
        if (!dpadContainer) return;

        const upBtn = dpadContainer.querySelector ? dpadContainer.querySelector('#dpad-up') : dpadContainer.upBtn;
        const downBtn = dpadContainer.querySelector ? dpadContainer.querySelector('#dpad-down') : dpadContainer.downBtn;
        const leftBtn = dpadContainer.querySelector ? dpadContainer.querySelector('#dpad-left') : dpadContainer.leftBtn;
        const rightBtn = dpadContainer.querySelector ? dpadContainer.querySelector('#dpad-right') : dpadContainer.rightBtn;

        const bindBtn = (btn, dir) => {
            if (!btn) return;
            const handler = (e) => {
                if (e.cancelable) e.preventDefault();
                this.injectDirection(dir);
            };
            btn.addEventListener('pointerdown', handler);
            btn.addEventListener('touchstart', handler, { passive: false });
        };

        bindBtn(upBtn, Direction.UP);
        bindBtn(downBtn, Direction.DOWN);
        bindBtn(leftBtn, Direction.LEFT);
        bindBtn(rightBtn, Direction.RIGHT);
    }

    _mapToDirection(key) {
        if (!key) return null;
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
