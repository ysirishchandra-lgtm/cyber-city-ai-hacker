/**
 * SCAR — THE LAST CHOICE
 * ShaderPipeline.js — Cyberpunk Post-Processing & Visual FX
 * Author: Ashwidha (Visual / UI / Cinematic Lead)
 */

export class ShaderPipeline {
  constructor() {
    this.trauma = 0; // Screen shake trauma (0 to 1)
    this.chromaticAberration = 0; // RGB split intensity
    this.glitchIntensity = 0; // Glitch distortion
    this.flashAlpha = 0; // Screen flash overlay
    this.flashColor = '#ffffff';
    this.scanlineAlpha = 0.15;
    this.vignetteIntensity = 0.75;
    this.letterboxProgress = 0; // 0 = full screen, 1 = cinematic bars

    this._time = 0;
  }

  update(dt) {
    this._time += dt;

    // Decay trauma (squared decay for natural camera feel)
    if (this.trauma > 0) {
      this.trauma = Math.max(0, this.trauma - dt * 1.5);
    }

    // Decay chromatic aberration
    if (this.chromaticAberration > 0) {
      this.chromaticAberration = Math.max(0, this.chromaticAberration - dt * 2.0);
    }

    // Decay glitch
    if (this.glitchIntensity > 0) {
      this.glitchIntensity = Math.max(0, this.glitchIntensity - dt * 2.5);
    }

    // Decay flash
    if (this.flashAlpha > 0) {
      this.flashAlpha = Math.max(0, this.flashAlpha - dt * 3.0);
    }
  }

  // ─── Trigger Effects ───────────────────────────────────────────────────────

  addShake(amount = 0.5) {
    this.trauma = Math.min(1.0, this.trauma + amount);
  }

  triggerGlitch(intensity = 0.6) {
    this.glitchIntensity = Math.min(1.0, this.glitchIntensity + intensity);
    this.chromaticAberration = Math.min(1.0, this.chromaticAberration + intensity * 0.8);
  }

  triggerFlash(color = '#ffffff', alpha = 0.8) {
    this.flashColor = color;
    this.flashAlpha = alpha;
    this.chromaticAberration = Math.max(this.chromaticAberration, 0.4);
  }

  setLetterbox(progress) {
    this.letterboxProgress = Math.max(0, Math.min(1, progress));
  }

  getShakeOffset() {
    if (this.trauma <= 0) return { x: 0, y: 0, rot: 0 };
    const shake = this.trauma * this.trauma;
    const maxOffset = 18;
    const maxRot = 0.03;
    const offsetX = (Math.random() * 2 - 1) * maxOffset * shake;
    const offsetY = (Math.random() * 2 - 1) * maxOffset * shake;
    const rot = (Math.random() * 2 - 1) * maxRot * shake;
    return { x: offsetX, y: offsetY, rot };
  }

  // ─── Post-Processing Render Passes ─────────────────────────────────────────

  applyPrePass(ctx, w, h) {
    ctx.save();
    const { x, y, rot } = this.getShakeOffset();
    if (x !== 0 || y !== 0 || rot !== 0) {
      ctx.translate(w / 2, h / 2);
      ctx.rotate(rot);
      ctx.translate(-w / 2 + x, -h / 2 + y);
    }
  }

  applyPostPass(ctx, w, h) {
    ctx.restore();

    // 1. Chromatic Aberration & Glitch Blocks
    if (this.glitchIntensity > 0.05) {
      this._renderGlitchArtifacts(ctx, w, h);
    }

    // 2. Flash Overlay
    if (this.flashAlpha > 0.01) {
      ctx.save();
      ctx.globalAlpha = this.flashAlpha;
      ctx.fillStyle = this.flashColor;
      ctx.fillRect(0, 0, w, h);
      ctx.restore();
    }

    // 3. Cinematic Vignette
    this._renderVignette(ctx, w, h);

    // 4. CRT Scanlines
    this._renderScanlines(ctx, w, h);

    // 5. Letterboxing Bars (Cinematic aspect ratio)
    if (this.letterboxProgress > 0.001) {
      this._renderLetterbox(ctx, w, h);
    }
  }

  _renderVignette(ctx, w, h) {
    ctx.save();
    const grad = ctx.createRadialGradient(
      w / 2, h / 2, Math.min(w, h) * 0.35,
      w / 2, h / 2, Math.max(w, h) * 0.75
    );
    grad.addColorStop(0, 'rgba(0, 0, 0, 0)');
    grad.addColorStop(0.7, `rgba(4, 4, 10, ${this.vignetteIntensity * 0.4})`);
    grad.addColorStop(1, `rgba(2, 2, 6, ${this.vignetteIntensity * 0.85})`);

    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);
    ctx.restore();
  }

  _renderScanlines(ctx, w, h) {
    ctx.save();
    ctx.globalAlpha = this.scanlineAlpha;
    ctx.fillStyle = '#000000';
    for (let y = 0; y < h; y += 4) {
      ctx.fillRect(0, y, w, 1.5);
    }
    ctx.restore();
  }

  _renderGlitchArtifacts(ctx, w, h) {
    ctx.save();
    const count = Math.floor(this.glitchIntensity * 8);
    for (let i = 0; i < count; i++) {
      const sliceY = Math.random() * h;
      const sliceH = 8 + Math.random() * 25;
      const shiftX = (Math.random() * 2 - 1) * 35 * this.glitchIntensity;

      ctx.fillStyle = Math.random() > 0.5 ? 'rgba(0, 243, 255, 0.15)' : 'rgba(255, 0, 85, 0.15)';
      ctx.fillRect(0, sliceY, w, sliceH);

      // Horizontal glitch bar
      ctx.fillStyle = Math.random() > 0.5 ? '#00f3ff' : '#ff0055';
      ctx.globalAlpha = 0.25 * this.glitchIntensity;
      ctx.fillRect(Math.random() * w, sliceY, Math.random() * 150 + 50, sliceH * 0.5);
    }
    ctx.restore();
  }

  _renderLetterbox(ctx, w, h) {
    const barHeight = (h * 0.12) * this.letterboxProgress;
    ctx.save();
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, w, barHeight);
    ctx.fillRect(0, h - barHeight, w, barHeight);

    // Subtle laser edge line
    ctx.strokeStyle = 'rgba(204, 0, 0, 0.6)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, barHeight);
    ctx.lineTo(w, barHeight);
    ctx.moveTo(0, h - barHeight);
    ctx.lineTo(w, h - barHeight);
    ctx.stroke();

    ctx.restore();
  }
}

export const shaderPipeline = new ShaderPipeline();
