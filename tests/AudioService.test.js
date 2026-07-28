import { AudioService } from '../services/AudioService.js';
import assert from 'node:assert';
import test from 'node:test';

test('AudioService Test Suite', async (t) => {

    await t.test('TC-050: instantiates AudioService with default enabled status', () => {
        const audioService = new AudioService();
        assert.strictEqual(audioService.sfxEnabled, true);
        assert.strictEqual(audioService.bgmEnabled, true);
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

    await t.test('TC-053: supports sfx and bgm toggle controls', () => {
        const audioService = new AudioService();
        audioService.setSfxEnabled(false);
        assert.strictEqual(audioService.sfxEnabled, false);
        audioService.setBgmEnabled(false);
        assert.strictEqual(audioService.bgmEnabled, false);

        assert.doesNotThrow(() => {
            audioService.playAttackSound('police');
            audioService.playGameOverSound();
            audioService.startBGM();
            audioService.stopBGM();
        });
    });

    await t.test('TC-054: supports volume configuration controls', () => {
        const audioService = new AudioService();
        audioService.setSfxVolume(0.5);
        assert.strictEqual(audioService.sfxVolume, 0.5);

        audioService.setBgmVolume(0.2);
        assert.strictEqual(audioService.bgmVolume, 0.2);
    });

    await t.test('TC-055: clamps volume bounds between 0.0 and 1.0', () => {
        const audioService = new AudioService();
        audioService.setSfxVolume(1.5);
        assert.strictEqual(audioService.sfxVolume, 1.0);

        audioService.setBgmVolume(-0.5);
        assert.strictEqual(audioService.bgmVolume, 0.0);
    });
});
