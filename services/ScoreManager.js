export class ScoreManager {
    constructor() {
        this.sessionScore = 0;
        this.currentLevelCapturedSum = 0;
    }

    /**
     * @param {number} value
     */
    addCaptureValue(value) {
        if (!Number.isInteger(value) || value < 0) {
            throw new TypeError("Capture value must be a positive integer.");
        }
        this.currentLevelCapturedSum += value;
    }

    /**
     * @param {number} capturedSum - The sum of target values captured this level
     * @param {number} elapsedSeconds - The time taken to complete the level
     * @param {number} maxTime - The maximum time bonus available (e.g., 300s)
     * @param {number} valueWeight - Weight modifier for the capture value
     * @param {number} timeWeight - Weight modifier for the time bonus
     * @returns {number} The calculated level score
     */
    completeLevel(
        capturedSum = this.currentLevelCapturedSum, 
        elapsedSeconds = 0, 
        maxTime = 300, 
        valueWeight = 0.6, 
        timeWeight = 0.4
    ) {
        const valueScore = capturedSum * valueWeight;
        // Floor the time bonus at 0 to prevent negative penalties
        const timeBonus = Math.max(0, maxTime - elapsedSeconds) * timeWeight;
        
        const levelScore = Math.round(valueScore + timeBonus);
        
        this.sessionScore += levelScore;
        this.currentLevelCapturedSum = 0; // Reset state for the next level
        
        return levelScore;
    }

    getSessionScore() {
        return this.sessionScore + Math.round(this.currentLevelCapturedSum * 0.6);
    }
}
