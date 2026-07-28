import { AdaptiveDifficultyService, ThreatTier } from '../services/AdaptiveDifficultyService.js';
import assert from 'node:assert';
import test from 'node:test';

test('AdaptiveDifficultyService Test Suite', async (t) => {

    await t.test('TC-060: initializes with STANDARD threat tier', () => {
        const adaptive = new AdaptiveDifficultyService();
        assert.strictEqual(adaptive.currentTier.name, 'STANDARD');
        assert.strictEqual(adaptive.consecutiveCaptures, 0);
    });

    await t.test('TC-061: scales threat tier up to TACTICAL on 3 consecutive captures', () => {
        const adaptive = new AdaptiveDifficultyService();
        for (let i = 0; i < 3; i++) {
            adaptive.recordSpawn();
            for (let t = 0; t < 20; t++) adaptive.tick();
            adaptive.recordCapture();
        }
        assert.strictEqual(adaptive.currentTier.name, 'TACTICAL');
        assert.strictEqual(adaptive.currentTier.bountyMult, 1.15);
    });

    await t.test('TC-062: scales threat tier up to EXPERT on 6 consecutive fast captures', () => {
        const adaptive = new AdaptiveDifficultyService();
        for (let i = 0; i < 6; i++) {
            adaptive.recordSpawn();
            for (let t = 0; t < 15; t++) adaptive.tick();
            adaptive.recordCapture();
        }
        assert.strictEqual(adaptive.currentTier.name, 'EXPERT');
        assert.strictEqual(adaptive.currentTier.speedMult, 1.4);
    });

    await t.test('TC-063: drops threat tier to RELAXED on failure with slow reaction history', () => {
        const adaptive = new AdaptiveDifficultyService();
        adaptive.recordSpawn();
        for (let t = 0; t < 60; t++) adaptive.tick();
        adaptive.recordCapture(); // Slow reaction
        adaptive.recordFailure();

        assert.strictEqual(adaptive.currentTier.name, 'RELAXED');
        assert.strictEqual(adaptive.currentTier.speedMult, 0.8);
    });

    await t.test('TC-064: triggers onTierChange callback on tier change', () => {
        const adaptive = new AdaptiveDifficultyService();
        let changedTier = null;
        adaptive.onTierChange = (tier) => { changedTier = tier; };

        for (let i = 0; i < 3; i++) {
            adaptive.recordSpawn();
            adaptive.recordCapture();
        }

        assert.notStrictEqual(changedTier, null);
        assert.strictEqual(changedTier.name, 'TACTICAL');
    });

    await t.test('TC-065: resets state correctly on session reset', () => {
        const adaptive = new AdaptiveDifficultyService();
        adaptive.recordSpawn();
        adaptive.recordCapture();
        adaptive.reset();

        assert.strictEqual(adaptive.currentTier.name, 'STANDARD');
        assert.strictEqual(adaptive.consecutiveCaptures, 0);
        assert.strictEqual(adaptive.currentTick, 0);
    });
});
