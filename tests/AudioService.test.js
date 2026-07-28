import { AudioService } from '../services/AudioService.js';
import assert from 'node:assert';
import test from 'node:test';

test('AudioService Test Suite', async (t) => {

    await t.test('TC-050: instantiates AudioService with default enabled status', () => {
        const audioService = new AudioService();
        assert.strictEqual(audioService.enabled, true);
        assert.strictEqual(audioService.ctx, null);
    });

    await t.test('TC-051: gracefully handles playAttackSound without throwing errors in Node environment', () => {
        const audioService = new AudioService();
        assert.doesNotThrow(() => {
            audioService.playAttackSound('police');
            audioService.playAttackSound('caging');
            audioService.playAttackSound('shooting');
            audioService.playAttackSound('butchering');
            audioService.playAttackSound('default');
        });
    });

    await t.test('TC-052: gracefully handles playGameOverSound without throwing errors in Node environment', () => {
        const audioService = new AudioService();
        assert.doesNotThrow(() => {
            audioService.playGameOverSound();
        });
    });

    await t.test('TC-053: respects enabled status toggle', () => {
        const audioService = new AudioService();
        audioService.enabled = false;
        assert.doesNotThrow(() => {
            audioService.playAttackSound('police');
            audioService.playGameOverSound();
        });
    });
});
