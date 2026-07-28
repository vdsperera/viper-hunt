import { AudioService } from '../services/AudioService.js';
import assert from 'node:assert';
import test from 'node:test';

test('AudioService Test Suite', async (t) => {

    await t.test('TC-050: instantiates AudioService with default enabled status and default track', () => {
        const audioService = new AudioService();
        assert.strictEqual(audioService.sfxEnabled, true);
        assert.strictEqual(audioService.bgmEnabled, true);
        assert.strictEqual(audioService.voiceEnabled, true);
        assert.strictEqual(audioService.currentBgmTrack, 'neon_chase');
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

    await t.test('TC-053: supports sfx, bgm, and voice toggle controls', () => {
        const audioService = new AudioService();
        audioService.setSfxEnabled(false);
        assert.strictEqual(audioService.sfxEnabled, false);
        audioService.setBgmEnabled(false);
        assert.strictEqual(audioService.bgmEnabled, false);
        audioService.setVoiceEnabled(false);
        assert.strictEqual(audioService.voiceEnabled, false);

        assert.doesNotThrow(() => {
            audioService.playAttackSound('police');
            audioService.playGameOverSound();
            audioService.startBGM();
            audioService.stopBGM();
            audioService.playVoiceComm('Testing radio dispatch');
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

    await t.test('TC-056: handles voice comms and radio crackle without throwing errors in Node environment', () => {
        const audioService = new AudioService();
        assert.doesNotThrow(() => {
            audioService.playVoiceComm('Dispatch, target neutralized!');
            audioService._playRadioCrackle();
        });
    });

    await t.test('TC-057: supports BGM track selection and switching across valid tracks', () => {
        const audioService = new AudioService();
        audioService.setBgmTrack('cyber_standoff');
        assert.strictEqual(audioService.currentBgmTrack, 'cyber_standoff');

        audioService.setBgmTrack('shadow_grid');
        assert.strictEqual(audioService.currentBgmTrack, 'shadow_grid');

        // Invalid track ID should be ignored
        audioService.setBgmTrack('invalid_track_id');
        assert.strictEqual(audioService.currentBgmTrack, 'shadow_grid');
    });

    await t.test('TC-058: supports voiceStyle selection across valid tactical crime voice personas', () => {
        const audioService = new AudioService();
        assert.strictEqual(audioService.voiceStyle, 'tactical_swat');

        audioService.setVoiceStyle('gritty_syndicate');
        assert.strictEqual(audioService.voiceStyle, 'gritty_syndicate');

        audioService.setVoiceStyle('cyber_command');
        assert.strictEqual(audioService.voiceStyle, 'cyber_command');

        // Invalid voice style should be ignored
        audioService.setVoiceStyle('invalid_voice_style');
        assert.strictEqual(audioService.voiceStyle, 'cyber_command');
    });

    await t.test('TC-059: handles voice comm dispatch with tactical voice personas without throwing errors', () => {
        const audioService = new AudioService();
        assert.doesNotThrow(() => {
            audioService.setVoiceStyle('tactical_swat');
            audioService.playVoiceComm('SWAT team in position!');

            audioService.setVoiceStyle('gritty_syndicate');
            audioService.playVoiceComm('Syndicate intercept confirmed!');

            audioService.setVoiceStyle('cyber_command');
            audioService.playVoiceComm('Cyber command breach authorized!');
        });
    });
});

