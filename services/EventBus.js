export const EVENTS = {
    TARGET_CAPTURED: 'TARGET_CAPTURED',
    GAME_OVER: 'GAME_OVER',
    THREAT_LEVEL_CHANGED: 'THREAT_LEVEL_CHANGED',
    GAME_STARTED: 'GAME_STARTED',
    GAME_STOPPED: 'GAME_STOPPED',
    TICK: 'TICK',
    RENDER_TICK: 'RENDER_TICK',
    RISK_OUTCOMES_APPLIED: 'RISK_OUTCOMES_APPLIED'
};

class EventBus {
    constructor() {
        this.listeners = new Map();
    }

    on(event, callback) {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, []);
        }
        this.listeners.get(event).push(callback);
    }

    off(event, callback) {
        if (!this.listeners.has(event)) return;
        const callbacks = this.listeners.get(event);
        const index = callbacks.indexOf(callback);
        if (index !== -1) {
            callbacks.splice(index, 1);
        }
    }

    emit(event, payload = null) {
        if (!this.listeners.has(event)) return;
        const callbacks = this.listeners.get(event);
        for (const callback of callbacks) {
            try {
                callback(payload);
            } catch (error) {
                console.error(`Error in EventBus for event ${event}:`, error);
            }
        }
    }
}

// Export a singleton instance
export const eventBus = new EventBus();
