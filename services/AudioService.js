export class AudioService {
    constructor(config = {}) {
        this.ctx = null;
        this.sfxEnabled = config.sfxEnabled ?? true;
        this.bgmEnabled = config.bgmEnabled ?? true;
        this.voiceEnabled = config.voiceEnabled ?? true;
        this.showCaptureLog = config.showCaptureLog ?? false;
        this.currentBgmTrack = config.currentBgmTrack || 'neon_chase';
        this.sfxVolume = config.sfxVolume ?? 0.8;
        this.bgmVolume = config.bgmVolume ?? 0.4;

        this.bgmPlaying = false;
        this.bgmTimer = null;
        this.shouldBgmPlay = false;

        this.loadConfig();
    }

    get enabled() {
        return this.sfxEnabled || this.bgmEnabled || this.voiceEnabled;
    }

    loadConfig() {
        try {
            if (typeof localStorage !== 'undefined') {
                const saved = localStorage.getItem('viper_hunt_audio_config');
                if (saved) {
                    const parsed = JSON.parse(saved);
                    if (typeof parsed.sfxEnabled === 'boolean') this.sfxEnabled = parsed.sfxEnabled;
                    if (typeof parsed.bgmEnabled === 'boolean') this.bgmEnabled = parsed.bgmEnabled;
                    if (typeof parsed.voiceEnabled === 'boolean') this.voiceEnabled = parsed.voiceEnabled;
                    if (typeof parsed.showCaptureLog === 'boolean') this.showCaptureLog = parsed.showCaptureLog;
                    if (typeof parsed.currentBgmTrack === 'string') this.currentBgmTrack = parsed.currentBgmTrack;
                    if (typeof parsed.sfxVolume === 'number') this.sfxVolume = parsed.sfxVolume;
                    if (typeof parsed.bgmVolume === 'number') this.bgmVolume = parsed.bgmVolume;
                }
            }
        } catch (e) {
            console.warn('[AudioService] Failed to load config:', e);
        }
    }

    saveConfig() {
        try {
            if (typeof localStorage !== 'undefined') {
                localStorage.setItem('viper_hunt_audio_config', JSON.stringify({
                    sfxEnabled: this.sfxEnabled,
                    bgmEnabled: this.bgmEnabled,
                    voiceEnabled: this.voiceEnabled,
                    showCaptureLog: this.showCaptureLog,
                    currentBgmTrack: this.currentBgmTrack,
                    sfxVolume: this.sfxVolume,
                    bgmVolume: this.bgmVolume
                }));
            }
        } catch (e) {
            console.warn('[AudioService] Failed to save config:', e);
        }
    }

    setSfxEnabled(enabled) {
        this.sfxEnabled = Boolean(enabled);
        this.saveConfig();
    }

    setShowCaptureLog(enabled) {
        this.showCaptureLog = Boolean(enabled);
        this.saveConfig();
    }

    setBgmEnabled(enabled) {
        this.bgmEnabled = Boolean(enabled);
        if (!this.bgmEnabled) {
            this.stopBGM();
        } else if (this.shouldBgmPlay) {
            this.startBGM();
        }
        this.saveConfig();
    }

    setVoiceEnabled(enabled) {
        this.voiceEnabled = Boolean(enabled);
        this.saveConfig();
    }

    setBgmTrack(trackId) {
        const validTracks = ['neon_chase', 'cyber_standoff', 'shadow_grid'];
        if (validTracks.includes(trackId)) {
            this.currentBgmTrack = trackId;
            this.saveConfig();
            if (this.bgmPlaying) {
                this.stopBGM();
                this.startBGM();
            }
        }
    }

    setSfxVolume(vol) {
        this.sfxVolume = Math.max(0, Math.min(1, Number(vol)));
        this.saveConfig();
    }

    setBgmVolume(vol) {
        this.bgmVolume = Math.max(0, Math.min(1, Number(vol)));
        this.saveConfig();
    }

    /**
     * Lazy initialize Web Audio context on user interaction
     */
    _initContext() {
        if (!this.ctx && typeof window !== 'undefined') {
            const AudioCtx = window.AudioContext || window.webkitAudioContext;
            if (AudioCtx) {
                this.ctx = new AudioCtx();
            }
        }
        if (this.ctx && this.ctx.state === 'suspended') {
            this.ctx.resume().catch(() => {});
        }
    }

    /**
     * Play live tactical radio voice-over comms using browser Web Speech API
     * @param {string} phrase Text phrase to speak over tactical radio
     */
    playVoiceComm(phrase) {
        if (!this.voiceEnabled) return;
        try {
            if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
                window.speechSynthesis.cancel();

                const utterance = new SpeechSynthesisUtterance(phrase);
                utterance.rate = 1.15;
                utterance.pitch = 0.85;
                utterance.volume = this.sfxVolume;

                const voices = window.speechSynthesis.getVoices();
                const englishVoice = voices.find(v => v.lang && v.lang.startsWith('en') && (v.name.includes('Male') || v.name.includes('Google') || v.name.includes('Natural')));
                if (englishVoice) {
                    utterance.voice = englishVoice;
                }

                this._playRadioCrackle();
                window.speechSynthesis.speak(utterance);
            }
        } catch (e) {
            console.warn('[AudioService] Tactical Voice Comm error:', e);
        }
    }

    /**
     * Procedural tactical radio static crackle effect
     */
    _playRadioCrackle() {
        if (!this.sfxEnabled) return;
        try {
            this._initContext();
            if (!this.ctx) return;

            const now = this.ctx.currentTime;
            const duration = 0.12;
            const bufferSize = Math.floor(this.ctx.sampleRate * duration);
            if (bufferSize <= 0) return;

            const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
            const output = buffer.getChannelData(0);
            for (let i = 0; i < bufferSize; i++) {
                output[i] = (Math.random() * 2 - 1) * (i % 4 === 0 ? 0.8 : 0.2);
            }

            const noise = this.ctx.createBufferSource();
            noise.buffer = buffer;

            const filter = this.ctx.createBiquadFilter();
            filter.type = 'bandpass';
            filter.frequency.value = 2400;
            filter.Q.value = 3.5;

            const gain = this.ctx.createGain();
            gain.gain.setValueAtTime(0.12 * this.sfxVolume, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

            noise.connect(filter);
            filter.connect(gain);
            gain.connect(this.ctx.destination);

            noise.start(now);
        } catch (e) {
            console.warn('[AudioService] Radio crackle error:', e);
        }
    }

    /**
     * Start playing selected procedural Dark Synthwave BGM track
     */
    startBGM() {
        this.shouldBgmPlay = true;
        if (!this.bgmEnabled) return;
        try {
            this._initContext();
            if (!this.ctx) return;
            if (this.bgmPlaying) return;

            this.bgmPlaying = true;
            this._scheduleBGMStep(0);
        } catch (e) {
            console.warn('[AudioService] BGM start error:', e);
        }
    }

    /**
     * Stop background music loop
     */
    stopBGM() {
        this.shouldBgmPlay = false;
        this.bgmPlaying = false;
        if (this.bgmTimer) {
            clearTimeout(this.bgmTimer);
            this.bgmTimer = null;
        }
    }

    _scheduleBGMStep(stepIndex = 0) {
        if (!this.bgmPlaying || !this.bgmEnabled || !this.ctx) return;

        const now = this.ctx.currentTime;
        let bpm = 124;
        let bassFreqs = [];
        let arpFreqs = [];
        let bassWave = 'sawtooth';
        let arpWave = 'triangle';

        if (this.currentBgmTrack === 'cyber_standoff') {
            // Track 2: Cyber Standoff (130 BPM Industrial Electro)
            bpm = 130;
            bassWave = 'square';
            arpWave = 'sawtooth';
            bassFreqs = [65.4, 65.4, 130.8, 65.4,  98, 65.4, 87.3, 65.4,  65.4, 65.4, 130.8, 65.4,  110, 98, 87.3, 65.4];
            arpFreqs = [329.63, 659.25, 587.33, 783.99, 329.63, 659.25, 587.33, 880,  392, 659.25, 587.33, 783.99, 349.23, 523.25, 440, 659.25];
        } else if (this.currentBgmTrack === 'shadow_grid') {
            // Track 3: Shadow Grid (118 BPM Tactical Recon Ambience)
            bpm = 118;
            bassWave = 'triangle';
            arpWave = 'sine';
            bassFreqs = [43.65, 43.65, 87.3, 43.65,  55, 43.65, 48.99, 43.65,  43.65, 43.65, 87.3, 43.65,  65.4, 55, 48.99, 43.65];
            arpFreqs = [174.61, 220, 261.63, 349.23, 174.61, 220, 261.63, 392,  196, 246.94, 293.66, 392,  164.81, 220, 261.63, 329.63];
        } else {
            // Track 1 (Default): Neon Chase (124 BPM Dark Synthwave)
            bpm = 124;
            bassWave = 'sawtooth';
            arpWave = 'triangle';
            bassFreqs = [55, 55, 110, 55,  65.4, 55, 73.4, 55,  55, 55, 110, 55,  82.4, 73.4, 65.4, 55];
            arpFreqs = [220, 329.63, 440, 659.25, 220, 329.63, 440, 523.25,  261.63, 329.63, 523.25, 659.25, 293.66, 349.23, 440, 523.25];
        }

        const sixteenthNote = 60 / bpm / 4;
        const bassFreq = bassFreqs[stepIndex % 16];
        const arpFreq = arpFreqs[stepIndex % 16];

        // Bass Oscillator
        const bassOsc = this.ctx.createOscillator();
        const bassGain = this.ctx.createGain();
        bassOsc.type = bassWave;
        bassOsc.frequency.setValueAtTime(bassFreq, now);
        bassGain.gain.setValueAtTime(0.06 * this.bgmVolume, now);
        bassGain.gain.exponentialRampToValueAtTime(0.001, now + sixteenthNote * 0.9);
        bassOsc.connect(bassGain);
        bassGain.connect(this.ctx.destination);
        bassOsc.start(now);
        bassOsc.stop(now + sixteenthNote * 0.9);

        // Arp Lead Oscillator
        const arpOsc = this.ctx.createOscillator();
        const arpGain = this.ctx.createGain();
        arpOsc.type = arpWave;
        arpOsc.frequency.setValueAtTime(arpFreq, now);
        arpGain.gain.setValueAtTime(0.025 * this.bgmVolume, now);
        arpGain.gain.exponentialRampToValueAtTime(0.001, now + sixteenthNote * 0.8);
        arpOsc.connect(arpGain);
        arpGain.connect(this.ctx.destination);
        arpOsc.start(now);
        arpOsc.stop(now + sixteenthNote * 0.8);

        // Rhythmic Hi-Hat Noise Click every 2 steps
        if (stepIndex % 2 === 0) {
            this._playHiHat(now, sixteenthNote * 0.4);
        }

        const nextStep = (stepIndex + 1) % 16;
        this.bgmTimer = setTimeout(() => {
            this._scheduleBGMStep(nextStep);
        }, sixteenthNote * 1000);
    }

    _playHiHat(now, duration) {
        if (!this.ctx || !this.bgmEnabled) return;
        const bufferSize = Math.floor(this.ctx.sampleRate * duration);
        if (bufferSize <= 0) return;
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const output = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            output[i] = Math.random() * 2 - 1;
        }

        const noise = this.ctx.createBufferSource();
        noise.buffer = buffer;

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'highpass';
        filter.frequency.value = 7000;

        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.02 * this.bgmVolume, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

        noise.connect(filter);
        filter.connect(gain);
        gain.connect(this.ctx.destination);

        noise.start(now);
    }

    /**
     * Synthesize sound effect & trigger tactical voice-over dispatch
     * @param {string} attackIdOrName ID or name of the attack ('police', 'caging', 'shooting', 'butchering')
     */
    playAttackSound(attackIdOrName) {
        try {
            this._initContext();

            const name = String(attackIdOrName || '').toLowerCase();

            if (name.includes('police') || name === '1') {
                if (this.sfxEnabled) this._playPoliceSiren();
                this.playVoiceComm("Dispatch, target apprehended! Surrendered to Police Custody.");
            } else if (name.includes('cage') || name.includes('caging') || name === '2') {
                if (this.sfxEnabled) this._playCageLock();
                this.playVoiceComm("Heavy containment unit deployed! Target locked down.");
            } else if (name.includes('shot') || name.includes('shooting') || name === '3') {
                if (this.sfxEnabled) this._playBlasterShot();
                this.playVoiceComm("Tactical engage! Target shot down in action.");
            } else if (name.includes('butcher') || name.includes('butchering') || name === '4') {
                if (this.sfxEnabled) this._playHeavySlash();
                this.playVoiceComm("Breach completed! Target eliminated.");
            } else {
                if (this.sfxEnabled) this._playDefaultChirp();
                this.playVoiceComm("Target intercepted!");
            }
        } catch (e) {
            console.warn('[AudioService] SFX playback error:', e);
        }
    }

    /**
     * Play game over collision sound and voice comm
     */
    playGameOverSound() {
        try {
            this.playVoiceComm("Agent down! Operation failed!");
            if (!this.sfxEnabled) return;
            this._initContext();
            if (!this.ctx) return;

            const now = this.ctx.currentTime;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();

            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(220, now);
            osc.frequency.exponentialRampToValueAtTime(40, now + 0.4);

            gain.gain.setValueAtTime(0.3 * this.sfxVolume, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.4);

            osc.connect(gain);
            gain.connect(this.ctx.destination);

            osc.start(now);
            osc.stop(now + 0.4);
        } catch (e) {
            console.warn('[AudioService] Game over SFX error:', e);
        }
    }

    _playPoliceSiren() {
        if (!this.ctx) return;
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(600, now);
        osc.frequency.setValueAtTime(900, now + 0.08);
        osc.frequency.setValueAtTime(600, now + 0.16);

        gain.gain.setValueAtTime(0.2 * this.sfxVolume, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now);
        osc.stop(now + 0.25);
    }

    _playCageLock() {
        if (!this.ctx) return;
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'square';
        osc.frequency.setValueAtTime(180, now);
        osc.frequency.exponentialRampToValueAtTime(70, now + 0.2);

        gain.gain.setValueAtTime(0.25 * this.sfxVolume, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.22);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now);
        osc.stop(now + 0.22);
    }

    _playBlasterShot() {
        if (!this.ctx) return;
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(800, now);
        osc.frequency.exponentialRampToValueAtTime(90, now + 0.18);

        gain.gain.setValueAtTime(0.3 * this.sfxVolume, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.18);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now);
        osc.stop(now + 0.18);
    }

    _playHeavySlash() {
        if (!this.ctx) return;
        const now = this.ctx.currentTime;
        
        const osc1 = this.ctx.createOscillator();
        const gain1 = this.ctx.createGain();
        osc1.type = 'triangle';
        osc1.frequency.setValueAtTime(250, now);
        osc1.frequency.exponentialRampToValueAtTime(40, now + 0.28);
        gain1.gain.setValueAtTime(0.35 * this.sfxVolume, now);
        gain1.gain.exponentialRampToValueAtTime(0.01, now + 0.28);

        const osc2 = this.ctx.createOscillator();
        const gain2 = this.ctx.createGain();
        osc2.type = 'sawtooth';
        osc2.frequency.setValueAtTime(1200, now);
        osc2.frequency.exponentialRampToValueAtTime(200, now + 0.2);
        gain2.gain.setValueAtTime(0.2 * this.sfxVolume, now);
        gain2.gain.exponentialRampToValueAtTime(0.01, now + 0.2);

        osc1.connect(gain1);
        gain1.connect(this.ctx.destination);
        osc2.connect(gain2);
        gain2.connect(this.ctx.destination);

        osc1.start(now);
        osc2.start(now);
        osc1.stop(now + 0.28);
        osc2.stop(now + 0.2);
    }

    _playDefaultChirp() {
        if (!this.ctx) return;
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(523.25, now);
        osc.frequency.setValueAtTime(659.25, now + 0.08);

        gain.gain.setValueAtTime(0.2 * this.sfxVolume, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.16);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now);
        osc.stop(now + 0.16);
    }
}
