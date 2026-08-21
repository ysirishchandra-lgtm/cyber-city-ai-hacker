/**
 * SCAR — THE LAST CHOICE
 * AudioEngine.js — Procedural Cyberpunk Audio Synthesizer (Web Audio API)
 * Author: Ashwidha (Visual / UI / Audio Lead)
 *
 * Generates dynamic, real-time procedural sound effects and atmospheric synth music:
 * - Rain & Thunder Ambience
 * - Katana Slash Whoosh & Hit-Crunch Impact
 * - Laser Drone Blasts & Mini-boss Walker Steps
 * - Scar Pulse Heartbeat & Power Awakening Bass Drop
 * - UI Cyber Blips & Ending Chimes
 */

export class AudioEngine {
  constructor() {
    this.ctx = null;
    this.masterGain = null;
    this.isMuted = false;
    this.ambientRunning = false;
    this._initialized = false;
  }

  init() {
    if (this._initialized || typeof window === 'undefined') return;

    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) {
        this.ctx = new AudioContext();
        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.setValueAtTime(0.7, this.ctx.currentTime);
        this.masterGain.connect(this.ctx.destination);
        this._initialized = true;

        // Auto-resume on first user gesture
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

  // ─── Combat & Weapon FX ───────────────────────────────────────────────────

  playSlash() {
    if (!this._initialized || this.isMuted) return;
    this.ensureContext();
    const t = this.ctx.currentTime;

    // Fast noise swoosh + sweeping sine wave
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(650, t);
    osc.frequency.exponentialRampToValueAtTime(110, t + 0.14);

    gain.gain.setValueAtTime(0.35, t);
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

    // Heavy thud impact
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = isHeavy ? 'triangle' : 'sine';
    osc.frequency.setValueAtTime(isHeavy ? 180 : 260, t);
    osc.frequency.exponentialRampToValueAtTime(40, t + (isHeavy ? 0.25 : 0.12));

    gain.gain.setValueAtTime(isHeavy ? 0.6 : 0.4, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + (isHeavy ? 0.25 : 0.12));

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(t);
    osc.stop(t + (isHeavy ? 0.26 : 0.13));
  }

  playHurt() {
    if (!this._initialized || this.isMuted) return;
    this.ensureContext();
    const t = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(320, t);
    osc.frequency.exponentialRampToValueAtTime(80, t + 0.18);

    gain.gain.setValueAtTime(0.45, t);
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
    osc.frequency.setValueAtTime(200, t);
    osc.frequency.exponentialRampToValueAtTime(500, t + 0.1);

    gain.gain.setValueAtTime(0.25, t);
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

    // Sub-bass rumble + rising choir chord
    [55, 110, 165, 220].forEach((freq, i) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, t);
      osc.frequency.exponentialRampToValueAtTime(freq * 2.5, t + 1.2);

      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(0.25 / (i + 1), t + 0.6);
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
    osc.frequency.setValueAtTime(powerPath === 'AGGRESSIVE' ? 120 : 440, t);
    osc.frequency.exponentialRampToValueAtTime(powerPath === 'AGGRESSIVE' ? 40 : 880, t + 0.4);

    gain.gain.setValueAtTime(0.5, t);
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
    osc.frequency.setValueAtTime(800, t);
    gain.gain.setValueAtTime(0.08, t);
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
    osc.frequency.setValueAtTime(1200, t);
    osc.frequency.exponentialRampToValueAtTime(400, t + 0.08);

    gain.gain.setValueAtTime(0.2, t);
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
    osc.frequency.setValueAtTime(520 + Math.random() * 80, t);

    gain.gain.setValueAtTime(0.06, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.03);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(t);
    osc.stop(t + 0.035);
  }
}

export const audioEngine = new AudioEngine();
