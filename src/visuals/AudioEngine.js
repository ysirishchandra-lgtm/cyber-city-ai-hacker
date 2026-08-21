/**
 * SCAR — THE LAST CHOICE
 * AudioEngine.js — Procedural Cyberpunk Audio Synthesizer (Web Audio API)
 * Author: Ashwidha (Visual / UI / Audio Lead)
 *
 * Generates dynamic, real-time procedural sound effects and atmospheric synth music:
 * - Cyberpunk Synthwave BGM Loop with Bass Arpeggio & Hi-Hats
 * - Katana Slash Whoosh & Hit-Crunch Impact
 * - Laser Drone Blasts & Mini-boss Walker Steps
 * - Scar Pulse Heartbeat & Power Awakening Bass Drop
 * - UI Cyber Blips & Ending Chimes
 */

export class AudioEngine {
  constructor() {
    this.ctx = null;
    this.masterGain = null;
    this.bgmGain = null;
    this.isMuted = false;
    this.bgmTimer = null;
    this.bgmStep = 0;
    this._initialized = false;
  }

  init() {
    if (this._initialized || typeof window === 'undefined') return;

    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) {
        this.ctx = new AudioContext();
        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.setValueAtTime(0.75, this.ctx.currentTime);
        this.masterGain.connect(this.ctx.destination);

        this.bgmGain = this.ctx.createGain();
        this.bgmGain.gain.setValueAtTime(0.28, this.ctx.currentTime);
        this.bgmGain.connect(this.masterGain);

        this._initialized = true;

        const resumeAudio = () => {
          if (this.ctx && this.ctx.state === 'suspended') {
            this.ctx.resume();
          }
          ['click', 'keydown', 'touchstart'].forEach(e => window.removeEventListener(e, resumeAudio));
        };
        ['click', 'keydown', 'touchstart'].forEach(e => window.addEventListener(e, resumeAudio, { once: true }));
      }
    } catch (e) {
      console.warn('[AudioEngine] Web Audio not available', e);
    }
  }

  ensureContext() {
    if (!this._initialized) this.init();
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  // ─── Procedural Cyberpunk Synthwave BGM ───────────────────────────────────

  startBGM() {
    if (this.bgmTimer || !this._initialized) return;
    this.ensureContext();

    const bassNotes = [73.42, 73.42, 87.31, 73.42, 98.0, 73.42, 110.0, 98.0]; // D2, F2, G2, A2
    const intervalMs = 240; // 125 BPM 16th groove

    this.bgmTimer = setInterval(() => {
      if (this.isMuted || !this.ctx || this.ctx.state === 'suspended') return;
      const t = this.ctx.currentTime;
      const freq = bassNotes[this.bgmStep % bassNotes.length];

      // 1. Synth Bass Note
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, t);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(320 + Math.sin(this.bgmStep * 0.4) * 120, t);
      filter.Q.setValueAtTime(4, t);

      gain.gain.setValueAtTime(0.2, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.22);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.bgmGain);

      osc.start(t);
      osc.stop(t + 0.23);

      // 2. Cyber Beat Pulse (on downbeats)
      if (this.bgmStep % 4 === 0) {
        const kickOsc = this.ctx.createOscillator();
        const kickGain = this.ctx.createGain();
        kickOsc.type = 'sine';
        kickOsc.frequency.setValueAtTime(140, t);
        kickOsc.frequency.exponentialRampToValueAtTime(35, t + 0.12);
        kickGain.gain.setValueAtTime(0.35, t);
        kickGain.gain.exponentialRampToValueAtTime(0.01, t + 0.12);
        kickOsc.connect(kickGain);
        kickGain.connect(this.bgmGain);
        kickOsc.start(t);
        kickOsc.stop(t + 0.13);
      }

      this.bgmStep++;
    }, intervalMs);
  }

  stopBGM() {
    if (this.bgmTimer) {
      clearInterval(this.bgmTimer);
      this.bgmTimer = null;
    }
  }

  // ─── Combat & Weapon FX ───────────────────────────────────────────────────

  playSlash() {
    if (!this._initialized || this.isMuted) return;
    this.ensureContext();
    const t = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(700, t);
    osc.frequency.exponentialRampToValueAtTime(120, t + 0.14);

    gain.gain.setValueAtTime(0.38, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.14);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(t);
    osc.stop(t + 0.15);
  }

  playImpact(isHeavy = false) {
    if (!this._initialized || this.isMuted) return;
    this.ensureContext();
    const t = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = isHeavy ? 'triangle' : 'sine';
    osc.frequency.setValueAtTime(isHeavy ? 180 : 260, t);
    osc.frequency.exponentialRampToValueAtTime(35, t + (isHeavy ? 0.26 : 0.12));

    gain.gain.setValueAtTime(isHeavy ? 0.65 : 0.4, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + (isHeavy ? 0.26 : 0.12));

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(t);
    osc.stop(t + (isHeavy ? 0.27 : 0.13));
  }

  playHurt() {
    if (!this._initialized || this.isMuted) return;
    this.ensureContext();
    const t = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(340, t);
    osc.frequency.exponentialRampToValueAtTime(75, t + 0.18);

    gain.gain.setValueAtTime(0.48, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.18);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(t);
    osc.stop(t + 0.19);
  }

  playDodge() {
    if (!this._initialized || this.isMuted) return;
    this.ensureContext();
    const t = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(220, t);
    osc.frequency.exponentialRampToValueAtTime(540, t + 0.1);

    gain.gain.setValueAtTime(0.28, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.1);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(t);
    osc.stop(t + 0.11);
  }

  // ─── Superpower & Scar FX ─────────────────────────────────────────────────

  playPowerAwakening() {
    if (!this._initialized || this.isMuted) return;
    this.ensureContext();
    const t = this.ctx.currentTime;

    [55, 110, 165, 220].forEach((freq, i) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, t);
      osc.frequency.exponentialRampToValueAtTime(freq * 2.5, t + 1.2);

      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(0.28 / (i + 1), t + 0.6);
      gain.gain.exponentialRampToValueAtTime(0.01, t + 1.5);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(t);
      osc.stop(t + 1.55);
    });
  }

  playPowerActivation(powerPath) {
    if (!this._initialized || this.isMuted) return;
    this.ensureContext();
    const t = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = powerPath === 'AGGRESSIVE' ? 'sawtooth' : 'sine';
    osc.frequency.setValueAtTime(powerPath === 'AGGRESSIVE' ? 140 : 440, t);
    osc.frequency.exponentialRampToValueAtTime(powerPath === 'AGGRESSIVE' ? 35 : 880, t + 0.4);

    gain.gain.setValueAtTime(0.55, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.45);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(t);
    osc.stop(t + 0.46);
  }

  // ─── UI & Ambient Sounds ──────────────────────────────────────────────────

  playUIHover() {
    if (!this._initialized || this.isMuted) return;
    this.ensureContext();
    const t = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(850, t);
    gain.gain.setValueAtTime(0.09, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.04);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(t);
    osc.stop(t + 0.05);
  }

  playUIClick() {
    if (!this._initialized || this.isMuted) return;
    this.ensureContext();
    const t = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'square';
    osc.frequency.setValueAtTime(1300, t);
    osc.frequency.exponentialRampToValueAtTime(450, t + 0.08);

    gain.gain.setValueAtTime(0.24, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.08);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(t);
    osc.stop(t + 0.09);
  }

  playDialogueBlip() {
    if (!this._initialized || this.isMuted) return;
    this.ensureContext();
    const t = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(540 + Math.random() * 80, t);

    gain.gain.setValueAtTime(0.07, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.03);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(t);
    osc.stop(t + 0.035);
  }
}

export const audioEngine = new AudioEngine();
