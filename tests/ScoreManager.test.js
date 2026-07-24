import { ScoreManager } from '../services/ScoreManager.js';
import assert from 'node:assert';
import test from 'node:test';

test('ScoreManager Test Suite', async (t) => {
    
    /*
    ID: TC-024
    Type: Unit
    Linked story: US-011
    Linked task: TASK-010
    Scenario type: Happy path
    Name: calculates level score correctly well within time limit
    Precondition: Level target value sum is accumulated
    Input: capturedSum = 200, elapsed = 60, maxTime = 300, valueWeight = 0.6, timeWeight = 0.4
    Expected output: 216
    Side effects: increments session score
    Mocks / fixtures: none
    Acceptance link: US-011 Scenario 1
    */
    await t.test('TC-024: calculates level score correctly well within time limit', () => {
        const scoreManager = new ScoreManager();
        scoreManager.addCaptureValue(100);
        scoreManager.addCaptureValue(100);

        const levelScore = scoreManager.completeLevel(undefined, 60, 300, 0.6, 0.4);
        assert.strictEqual(levelScore, 216);
        assert.strictEqual(scoreManager.getSessionScore(), 216);
    });

    /*
    ID: TC-025
    Type: Unit
    Linked story: US-011
    Linked task: TASK-010
    Scenario type: Edge case
    Name: calculates score correctly when completed exactly at Max_Level_Time
    Precondition: None
    Input: elapsed = 300, maxTime = 300
    Expected output: 120 (with 0 time bonus)
    Side effects: none
    Mocks / fixtures: none
    Acceptance link: US-011 Scenario 2
    */
    await t.test('TC-025: calculates score correctly when completed exactly at Max_Level_Time', () => {
        const scoreManager = new ScoreManager();
        const levelScore = scoreManager.completeLevel(200, 300, 300, 0.6, 0.4);
        assert.strictEqual(levelScore, 120);
    });

    /*
    ID: TC-026
    Type: Unit
    Linked story: US-011
    Linked task: TASK-010
    Scenario type: Edge case
    Name: calculates score safely in near-zero time without division by zero
    Precondition: None
    Input: elapsed = 0.001, maxTime = 300
    Expected output: 240 (rounded)
    Side effects: none
    Mocks / fixtures: none
    Acceptance link: US-011 Scenario 3
    */
    await t.test('TC-026: calculates score safely in near-zero time without division by zero', () => {
        const scoreManager = new ScoreManager();
        const levelScore = scoreManager.completeLevel(200, 0.001, 300, 0.6, 0.4);
        // valueScore = 120. timeBonus = (300 - 0.001) * 0.4 = 119.9996 -> rounds to 240
        assert.strictEqual(levelScore, 240);
    });

    /*
    ID: TC-027
    Type: Unit
    Linked story: US-011
    Linked task: TASK-010
    Scenario type: Sad path
    Name: floors time bonus at 0 when level time exceeds Max_Level_Time
    Precondition: None
    Input: elapsed = 400, maxTime = 300
    Expected output: 120 (no negative penalty)
    Side effects: none
    Mocks / fixtures: none
    Acceptance link: US-011 Scenario 4
    */
    await t.test('TC-027: floors time bonus at 0 when level time exceeds Max_Level_Time', () => {
        const scoreManager = new ScoreManager();
        const levelScore = scoreManager.completeLevel(200, 400, 300, 0.6, 0.4);
        assert.strictEqual(levelScore, 120);
    });

    /*
    ID: TC-028
    Type: Unit
    Linked story: US-011
    Linked task: TASK-010
    Scenario type: Sad path
    Name: awards time bonus even if all captured targets have value 0
    Precondition: None
    Input: capturedSum = 0, elapsed = 10, maxTime = 300
    Expected output: 116
    Side effects: none
    Mocks / fixtures: none
    Acceptance link: US-011 Scenario 5
    */
    await t.test('TC-028: awards time bonus even if all captured targets have value 0', () => {
        const scoreManager = new ScoreManager();
        const levelScore = scoreManager.completeLevel(0, 10, 300, 0.6, 0.4);
        // valueScore = 0. timeBonus = 290 * 0.4 = 116
        assert.strictEqual(levelScore, 116);
    });

    /*
    ID: TC-029
    Type: Unit
    Linked story: US-012
    Linked task: TASK-010
    Scenario type: State transition
    Name: accumulates final score across multiple completed levels
    Precondition: Multiple levels completed in succession
    Input: Level 1 score = 216, Level 2 score = 180
    Expected output: sessionScore = 396
    Side effects: sessionScore maintains running total
    Mocks / fixtures: none
    Acceptance link: US-012 Scenario 1
    */
    await t.test('TC-029: accumulates final score across multiple completed levels', () => {
        const scoreManager = new ScoreManager();
        scoreManager.completeLevel(200, 60, 300, 0.6, 0.4); // yields 216
        scoreManager.completeLevel(300, 300, 300, 0.6, 0.4); // yields 180 (300 * 0.6)
        
        assert.strictEqual(scoreManager.getSessionScore(), 396);
    });

    await t.test('TC-030: generates complete score breakdown including completed levels and partial level', () => {
        const scoreManager = new ScoreManager();
        scoreManager.addCaptureValue(100);
        scoreManager.addCaptureValue(100);
        scoreManager.completeLevel(undefined, 60, 300, 0.6, 0.4); // Level 1: valueScore 120, timeBonus 96 -> 216

        scoreManager.addCaptureValue(50); // Partial level 2 capture

        const breakdown = scoreManager.getScoreBreakdown();
        assert.strictEqual(breakdown.levelHistory.length, 1);
        assert.strictEqual(breakdown.levelHistory[0].level, 1);
        assert.strictEqual(breakdown.levelHistory[0].targetsCaptured, 2);
        assert.strictEqual(breakdown.levelHistory[0].capturedSum, 200);
        assert.strictEqual(breakdown.levelHistory[0].valueScore, 120);
        assert.strictEqual(breakdown.levelHistory[0].timeBonus, 96);
        assert.strictEqual(breakdown.levelHistory[0].levelScore, 216);

        assert.notStrictEqual(breakdown.partialLevel, null);
        assert.strictEqual(breakdown.partialLevel.level, 2);
        assert.strictEqual(breakdown.partialLevel.targetsCaptured, 1);
        assert.strictEqual(breakdown.partialLevel.capturedSum, 50);
        assert.strictEqual(breakdown.partialLevel.valueScore, 30);

        assert.strictEqual(breakdown.summary.finalScore, 246); // 216 + 30
        assert.strictEqual(breakdown.summary.totalTargetValueSum, 250);
        assert.strictEqual(breakdown.summary.totalTargetScore, 150);
        assert.strictEqual(breakdown.summary.totalTimeBonus, 96);
    });

});
