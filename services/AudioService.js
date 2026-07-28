export class AudioService {
    constructor() {
        this.ctx = null;
        this.enabled = true;
        this.bgmPlaying = false;
        this.bgmTimer = null;
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
     * Start playing the procedural Dark Synthwave Criminal Hunting BGM loop
     */
    startBGM() {
        if (!this.enabled) return;
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
        this.bgmPlaying = false;
        if (this.bgmTimer) {
            clearTimeout(this.bgmTimer);
            this.bgmTimer = null;
        }
    }

    _scheduleBGMStep(stepIndex = 0) {
        if (!this.bgmPlaying || !this.ctx) return;

        const now = this.ctx.currentTime;
        const bpm = 124;
        const sixteenthNote = 60 / bpm / 4; // ~0.121s

        // 16-step bass pattern (A minor pentatonic driving bassline)
        const bassFreqs = [
            55, 55, 110, 55,  65.4, 55, 73.4, 55,
            55, 55, 110, 55,  82.4, 73.4, 65.4, 55
        ];

        // 16-step arpeggio melody line
        const arpFreqs = [
            220, 329.63, 440, 659.25, 220, 329.63, 440, 523.25,
            261.63, 329.63, 523.25, 659.25, 293.66, 349.23, 440, 523.25
        ];

        const bassFreq = bassFreqs[stepIndex % 16];
        const arpFreq = arpFreqs[stepIndex % 16];

        // Bass Oscillator
        const bassOsc = this.ctx.createOscillator();
        const bassGain = this.ctx.createGain();
        bassOsc.type = 'sawtooth';
        bassOsc.frequency.setValueAtTime(bassFreq, now);
        bassGain.gain.setValueAtTime(0.06, now);
        bassGain.gain.exponentialRampToValueAtTime(0.001, now + sixteenthNote * 0.9);
        bassOsc.connect(bassGain);
        bassGain.connect(this.ctx.destination);
        bassOsc.start(now);
        bassOsc.stop(now + sixteenthNote * 0.9);

        // Arp Lead Oscillator
        const arpOsc = this.ctx.createOscillator();
        const arpGain = this.ctx.createGain();
        arpOsc.type = 'triangle';
        arpOsc.frequency.setValueAtTime(arpFreq, now);
        arpGain.gain.setValueAtTime(0.025, now);
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
        if (!this.ctx) return;
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
        gain.gain.setValueAtTime(0.02, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

        noise.connect(filter);
        filter.connect(gain);
        gain.connect(this.ctx.destination);

        noise.start(now);
    }

    /**
     * Synthesize and play custom retro sound effects based on attack type
     * @param {string} attackIdOrName ID or name of the attack ('police', 'caging', 'shooting', 'butchering')
     */
    playAttackSound(attackIdOrName) {
        if (!this.enabled) return;
        try {
            this._initContext();
            if (!this.ctx) return;

            const name = String(attackIdOrName || '').toLowerCase();

            if (name.includes('police') || name === '1') {
                this._playPoliceSiren();
            } else if (name.includes('cage') || name.includes('caging') || name === '2') {
                this._playCageLock();
            } else if (name.includes('shot') || name.includes('shooting') || name === '3') {
                this._playBlasterShot();
            } else if (name.includes('butcher') || name.includes('butchering') || name === '4') {
                this._playHeavySlash();
            } else {
                this._playDefaultChirp();
            }
        } catch (e) {
            console.warn('[AudioService] SFX playback error:', e);
        }
    }

    /**
     * Play game over collision sound
     */
    playGameOverSound() {
        if (!this.enabled) return;
        try {
            this._initContext();
            if (!this.ctx) return;

            const now = this.ctx.currentTime;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();

            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(220, now);
            osc.frequency.exponentialRampToValueAtTime(40, now + 0.4);

            gain.gain.setValueAtTime(0.3, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.4);

            osc.connect(gain);
            gain.connect(this.ctx.destination);

            osc.start(now);
            osc.stop(now + 0.4);
        } catch (e) {
            console.warn('[AudioService] Game over SFX error:', e);
        }
    }

    // 1. Police Custody: Two-tone rapid siren beep (600Hz -> 900Hz)
    _playPoliceSiren() {
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(600, now);
        osc.frequency.setValueAtTime(900, now + 0.08);
        osc.frequency.setValueAtTime(600, now + 0.16);

        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now);
        osc.stop(now + 0.25);
    }

    // 2. Brutally Caged: Low metallic square wave lock (180Hz -> 70Hz)
    _playCageLock() {
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'square';
        osc.frequency.setValueAtTime(180, now);
        osc.frequency.exponentialRampToValueAtTime(70, now + 0.2);

        gain.gain.setValueAtTime(0.25, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.22);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now);
        osc.stop(now + 0.22);
    }

    // 3. Shot Down: Fast laser pitch sweep (800Hz -> 90Hz) with noise burst
    _playBlasterShot() {
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(800, now);
        osc.frequency.exponentialRampToValueAtTime(90, now + 0.18);

        gain.gain.setValueAtTime(0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.18);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now);
        osc.stop(now + 0.18);
    }

    // 4. Ruthlessly Butchered: Heavy dual pitch chop (1200Hz -> 150Hz sub-bass)
    _playHeavySlash() {
        const now = this.ctx.currentTime;
        
        // Low bass thump
        const osc1 = this.ctx.createOscillator();
        const gain1 = this.ctx.createGain();
        osc1.type = 'triangle';
        osc1.frequency.setValueAtTime(250, now);
        osc1.frequency.exponentialRampToValueAtTime(40, now + 0.28);
        gain1.gain.setValueAtTime(0.35, now);
        gain1.gain.exponentialRampToValueAtTime(0.01, now + 0.28);

        // High slash sweep
        const osc2 = this.ctx.createOscillator();
        const gain2 = this.ctx.createGain();
        osc2.type = 'sawtooth';
        osc2.frequency.setValueAtTime(1200, now);
        osc2.frequency.exponentialRampToValueAtTime(200, now + 0.2);
        gain2.gain.setValueAtTime(0.2, now);
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

    // Default target capture arpeggio chirp (C5 -> E5)
    _playDefaultChirp() {
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(523.25, now); // C5
        osc.frequency.setValueAtTime(659.25, now + 0.08); // E5

        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.16);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now);
        osc.stop(now + 0.16);
    }
}
