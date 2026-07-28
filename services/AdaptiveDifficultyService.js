export const ThreatTier = {
    RELAXED: { name: 'RELAXED', label: '🛡️ RELAXED', speedMult: 0.8, bountyMult: 0.9, color: '#38bdf8' },
    STANDARD: { name: 'STANDARD', label: '🎯 STANDARD', speedMult: 1.0, bountyMult: 1.0, color: '#00ff88' },
    TACTICAL: { name: 'TACTICAL', label: '⚡ TACTICAL', speedMult: 1.2, bountyMult: 1.15, color: '#ffb800' },
    EXPERT: { name: 'EXPERT', label: '🔥 EXPERT', speedMult: 1.4, bountyMult: 1.30, color: '#ff0055' }
};

export class AdaptiveDifficultyService {
    constructor() {
        this.currentTier = ThreatTier.STANDARD;
        this.captureTicksHistory = [];
        this.consecutiveCaptures = 0;
        this.lastSpawnTick = 0;
        this.currentTick = 0;
        this.onTierChange = null;
    }

    /**
     * Called on each game loop update tick
     */
    tick() {
        this.currentTick++;
    }

    /**
     * Register when a new target is spawned onto the grid
     */
    recordSpawn() {
        this.lastSpawnTick = this.currentTick;
    }

    /**
     * Register target capture and update dynamic difficulty tier
     * @returns {Object} Updated ThreatTier object
     */
    recordCapture() {
        const reactionTicks = this.currentTick - this.lastSpawnTick;
        this.captureTicksHistory.push(reactionTicks);
        if (this.captureTicksHistory.length > 10) {
            this.captureTicksHistory.shift(); // Maintain rolling window of 10 recent captures
        }

        this.consecutiveCaptures++;
        this.evaluateTier();
        return this.currentTier;
    }

    /**
     * Register collision / player failure
     */
    recordFailure() {
        this.consecutiveCaptures = 0;
        this.evaluateTier();
        return this.currentTier;
    }

    /**
     * Evaluate performance metrics and determine the threat tier
     */
    evaluateTier() {
        const prevTier = this.currentTier;

        // Calculate average reaction time in ticks
        const avgReaction = this.captureTicksHistory.length > 0
            ? this.captureTicksHistory.reduce((a, b) => a + b, 0) / this.captureTicksHistory.length
            : 40;

        if (this.consecutiveCaptures >= 6 || (this.consecutiveCaptures >= 4 && avgReaction < 18)) {
            this.currentTier = ThreatTier.EXPERT;
        } else if (this.consecutiveCaptures >= 3 || avgReaction < 28) {
            this.currentTier = ThreatTier.TACTICAL;
        } else if (this.consecutiveCaptures === 0 && avgReaction > 50) {
            this.currentTier = ThreatTier.RELAXED;
        } else {
            this.currentTier = ThreatTier.STANDARD;
        }

        if (prevTier !== this.currentTier && typeof this.onTierChange === 'function') {
            this.onTierChange(this.currentTier);
        }
    }

    /**
     * Reset telemetry state for new game session
     */
    reset() {
        this.currentTier = ThreatTier.STANDARD;
        this.captureTicksHistory = [];
        this.consecutiveCaptures = 0;
        this.lastSpawnTick = 0;
        this.currentTick = 0;
    }
}
