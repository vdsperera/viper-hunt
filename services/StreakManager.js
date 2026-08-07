import { eventBus, EVENTS } from './EventBus.js';

export class StreakManager {
    constructor(timeoutMs = 5000) {
        this.timeoutMs = timeoutMs;
        this.streakCount = 0;
        this.lastCaptureTime = 0;
        this.active = false;
        
        this.scoreMultiplier = 1.0;
        this.speedMultiplier = 1.0;
    }

    handleCapture() {
        const now = performance.now();
        if (this.streakCount === 0 || (now - this.lastCaptureTime <= this.timeoutMs)) {
            this.streakCount++;
            this.active = true;
        } else {
            this.streakCount = 1;
            this.active = true;
        }
        this.lastCaptureTime = now;
        this._recalculateMultipliers();
        this._emitUpdate();
    }

    tick() {
        if (!this.active) return;
        
        const now = performance.now();
        if (now - this.lastCaptureTime > this.timeoutMs) {
            this.reset();
        }
    }

    reset() {
        if (!this.active) return; // Prevent spamming reset events
        this.streakCount = 0;
        this.active = false;
        this.scoreMultiplier = 1.0;
        this.speedMultiplier = 1.0;
        this._emitUpdate();
    }

    _recalculateMultipliers() {
        // Score Multiplier (Cap at 3.0x)
        if (this.streakCount <= 1) this.scoreMultiplier = 1.0;
        else if (this.streakCount === 2) this.scoreMultiplier = 1.5;
        else if (this.streakCount === 3) this.scoreMultiplier = 2.0;
        else if (this.streakCount === 4) this.scoreMultiplier = 2.5;
        else this.scoreMultiplier = 3.0;

        // Speed Multiplier (Cap at 1.5x)
        if (this.streakCount <= 2) this.speedMultiplier = 1.0;
        else if (this.streakCount <= 4) this.speedMultiplier = 1.25;
        else this.speedMultiplier = 1.5;
    }

    _emitUpdate() {
        eventBus.emit(EVENTS.STREAK_UPDATED, {
            active: this.active,
            count: this.streakCount,
            scoreMultiplier: this.scoreMultiplier,
            speedMultiplier: this.speedMultiplier
        });
    }

    getRemainingPercent() {
        if (!this.active) return 0;
        const now = performance.now();
        const elapsed = now - this.lastCaptureTime;
        if (elapsed >= this.timeoutMs) return 0;
        return Math.max(0, 100 - (elapsed / this.timeoutMs * 100));
    }
}
