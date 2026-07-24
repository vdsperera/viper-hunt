export class ScoreManager {
    constructor() {
        this.sessionScore = 0;
        this.currentLevelCapturedSum = 0;
        this.currentLevelTargetsCount = 0;
        this.levelHistory = [];
    }

    /**
     * @param {number} value
     */
    addCaptureValue(value) {
        if (!Number.isInteger(value) || value < 0) {
            throw new TypeError("Capture value must be a positive integer.");
        }
        this.currentLevelCapturedSum += value;
        this.currentLevelTargetsCount++;
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
        
        this.levelHistory.push({
            level: this.levelHistory.length + 1,
            targetsCaptured: this.currentLevelTargetsCount,
            capturedSum,
            valueScore: Math.round(valueScore),
            elapsedSeconds: Math.round(elapsedSeconds * 10) / 10,
            timeBonus: Math.round(timeBonus),
            levelScore
        });

        this.sessionScore += levelScore;
        this.currentLevelCapturedSum = 0; // Reset state for the next level
        this.currentLevelTargetsCount = 0;
        
        return levelScore;
    }

    getSessionScore() {
        return this.sessionScore + Math.round(this.currentLevelCapturedSum * 0.6);
    }

    /**
     * Returns full detailed breakdown of score calculation across all completed levels and partial level.
     * @param {number} valueWeight
     * @param {number} timeWeight
     * @returns {Object} Structured score breakdown
     */
    getScoreBreakdown(valueWeight = 0.6, timeWeight = 0.4) {
        const partialCapturedSum = this.currentLevelCapturedSum;
        const partialTargetsCaptured = this.currentLevelTargetsCount;
        const partialValueScore = Math.round(partialCapturedSum * valueWeight);

        let totalTargetValueSum = 0;
        let totalTargetScore = 0;
        let totalTimeBonus = 0;

        this.levelHistory.forEach(lvl => {
            totalTargetValueSum += lvl.capturedSum;
            totalTargetScore += lvl.valueScore;
            totalTimeBonus += lvl.timeBonus;
        });

        totalTargetValueSum += partialCapturedSum;
        totalTargetScore += partialValueScore;

        return {
            levelHistory: [...this.levelHistory],
            partialLevel: (partialCapturedSum > 0 || partialTargetsCaptured > 0) ? {
                level: this.levelHistory.length + 1,
                targetsCaptured: partialTargetsCaptured,
                capturedSum: partialCapturedSum,
                valueScore: partialValueScore,
                elapsedSeconds: 0,
                timeBonus: 0,
                levelScore: partialValueScore
            } : null,
            summary: {
                totalTargetValueSum,
                totalTargetScore,
                totalTimeBonus,
                finalScore: this.getSessionScore(),
                valueWeight,
                timeWeight
            }
        };
    }
}
