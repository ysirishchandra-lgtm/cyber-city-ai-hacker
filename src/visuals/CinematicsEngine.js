/**
 * SCAR — THE LAST CHOICE
 * CinematicsEngine.js — Cinematic Openings, Attack Sequences, and Story Transitions
 * Author: Ashwidha (Visual / UI / Cinematic Lead)
 */

import { shaderPipeline } from './ShaderPipeline.js';

export class CinematicsEngine {
  constructor() {
    this.active = false;
    this.panels = [];
    this.currentIndex = 0;
    this.currentPhase = null;
    this.onComplete = null;

    this.timer = 0;
    this.panelDuration = 3500;
    this.fadeAlpha = 1.0;
    this.textProgress = 0;

    this._time = 0;
  }

  startSequence(panels, phase, onComplete) {
    this.active = true;
    this.panels = panels || [];
    this.currentIndex = 0;
    this.currentPhase = phase;
    this.onComplete = onComplete;
    this.timer = 0;
    this.textProgress = 0;

    shaderPipeline.setLetterbox(1.0); // Full cinematic widescreen bars

    if (phase === 'ATTACK') {
      shaderPipeline.triggerGlitch(0.8);
      shaderPipeline.addShake(0.7);
    } else if (phase === 'SCAR') {
      shaderPipeline.triggerFlash('#ff0033', 0.9);
      shaderPipeline.addShake(0.9);
    }
  }

  skip() {
    if (!this.active) return;
    this.nextPanel();
  }

  nextPanel() {
    this.currentIndex++;
    this.timer = 0;
    this.textProgress = 0;

    if (this.currentIndex >= this.panels.length) {
      this.completeSequence();
    } else {
      const panel = this.panels[this.currentIndex];
      if (panel.style === 'flash') {
        shaderPipeline.triggerFlash('#ffffff', 0.9);
      } else if (panel.style === 'impact') {
        shaderPipeline.addShake(0.8);
        shaderPipeline.triggerGlitch(0.7);
      }
    }
  }

  completeSequence() {
    this.active = false;
    this.panels = [];
    shaderPipeline.setLetterbox(0.0); // Return to gameplay view

    if (this.onComplete) {
      this.onComplete();
    }

    import('../core/EventBus.js').then(({ eventBus, EVENTS }) => {
      eventBus.emit(EVENTS.CINEMATIC_COMPLETE);
    });
  }

  update(dt) {
    if (!this.active) return;
    this._time += dt;
    this.timer += dt * 1000;
    this.textProgress = Math.min(1.0, this.textProgress + dt * 2.5);

    const currentPanel = this.panels[this.currentIndex];
    const duration = currentPanel?.duration || 3500;

    if (this.timer >= duration) {
      this.nextPanel();
    }
  }

  render(ctx, w, h) {
    if (!this.active || !this.panels[this.currentIndex]) return;
    const panel = this.panels[this.currentIndex];

    // 1. Background Pure Black
    ctx.save();
    ctx.fillStyle = '#020206';
    ctx.fillRect(0, 0, w, h);

    // 2. Render Anime Cutscene Background (if available)
    let hasImage = false;
    if (panel.image && typeof Image !== 'undefined') {
      if (!this.imageCache) this.imageCache = {};
      let img = this.imageCache[panel.image];
      if (!img) {
        img = new Image();
        img.src = panel.image;
        this.imageCache[panel.image] = img;
      }

      if (img.complete && img.naturalWidth > 0 && typeof ctx.drawImage === 'function') {
        hasImage = true;
        // Cover aspect ratio
        const scale = Math.max(w / img.naturalWidth, h / img.naturalHeight);
        const nw = img.naturalWidth * scale;
        const nh = img.naturalHeight * scale;
        const ox = (w - nw) / 2;
        const oy = (h - nh) / 2;

        ctx.save();
        ctx.globalAlpha = 0.85;
        try {
          ctx.drawImage(img, ox, oy, nw, nh);
        } catch (e) {}
        ctx.restore();

        // Dark cinematic vignette overlay over artwork
        const artGrad = ctx.createLinearGradient(0, 0, 0, h);
        artGrad.addColorStop(0, 'rgba(2, 2, 8, 0.7)');
        artGrad.addColorStop(0.5, 'rgba(2, 2, 8, 0.4)');
        artGrad.addColorStop(1, 'rgba(2, 2, 8, 0.85)');
        ctx.fillStyle = artGrad;
        ctx.fillRect(0, 0, w, h);
      }
    }

    // 3. Atmospheric animated fog gradient (if no image or layered)
    if (!hasImage) {
      const fogGrad = ctx.createRadialGradient(
        w / 2, h / 2, h * 0.1,
        w / 2, h / 2, h * 0.7
      );
      const pulse = Math.sin(this._time * 2) * 0.05 + 0.15;
      fogGrad.addColorStop(0, `rgba(18, 18, 36, ${pulse})`);
      fogGrad.addColorStop(1, 'rgba(0, 0, 0, 0.95)');
      ctx.fillStyle = fogGrad;
      ctx.fillRect(0, 0, w, h);
    }

    // 4. Render Panel Content
    if (panel.style === 'title') {
      this._renderTitleCard(ctx, w, h, panel);
    } else if (panel.style === 'quote' || panel.style === 'highlight') {
      this._renderQuoteCard(ctx, w, h, panel);
    } else {
      this._renderStandardCard(ctx, w, h, panel);
    }

    // Skip Prompt
    ctx.fillStyle = 'rgba(100, 100, 140, 0.7)';
    ctx.font = '13px monospace';
    ctx.textAlign = 'right';
    ctx.fillText('[SPACE] SKIP', w - 40, h - 40);

    ctx.restore();
  }

  _renderTitleCard(ctx, w, h, panel) {
    // Grand Cinematic Title Card
    ctx.save();
    // Glowing Crimson Scar Slash Behind Title
    const slashWidth = Math.min(600, w * 0.75);
    ctx.strokeStyle = '#cc0000';
    ctx.shadowColor = '#ff0033';
    ctx.shadowBlur = 24;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(w / 2 - slashWidth / 2, h / 2 + 10);
    ctx.lineTo(w / 2 + slashWidth / 2, h / 2 + 10);
    ctx.stroke();

    // Main SCAR Logo
    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = '#ffffff';
    ctx.shadowBlur = 18;
    ctx.font = `900 ${Math.min(84, w * 0.12)}px monospace`;
    ctx.textAlign = 'center';
    ctx.fillText(panel.text, w / 2, h / 2 - 10);

    // Subtitle
    if (panel.subtext) {
      ctx.fillStyle = '#ff0033';
      ctx.shadowColor = '#ff0033';
      ctx.shadowBlur = 12;
      ctx.font = `bold ${Math.min(22, w * 0.035)}px monospace`;
      ctx.fillText(panel.subtext, w / 2, h / 2 + 55);
    }
    ctx.restore();
  }

  _renderQuoteCard(ctx, w, h, panel) {
    ctx.save();
    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = 'rgba(0, 243, 255, 0.6)';
    ctx.shadowBlur = 14;
    ctx.font = `italic ${Math.min(32, w * 0.045)}px Georgia, serif`;
    ctx.textAlign = 'center';
    this._wrapText(ctx, panel.text, w / 2, h / 2 - 30, w * 0.75, 46);

    if (panel.subtext) {
      ctx.fillStyle = '#ff0055';
      ctx.shadowColor = '#ff0055';
      ctx.shadowBlur = 10;
      ctx.font = `bold ${Math.min(20, w * 0.03)}px monospace`;
      this._wrapText(ctx, panel.subtext, w / 2, h / 2 + 50, w * 0.65, 34);
    }
    ctx.restore();
  }

  _renderStandardCard(ctx, w, h, panel) {
    ctx.save();
    // High-impact cinematic text
    ctx.fillStyle = '#e6f0ff';
    ctx.shadowColor = 'rgba(0, 243, 255, 0.4)';
    ctx.shadowBlur = 12;
    ctx.font = `bold ${Math.min(36, w * 0.05)}px monospace`;
    ctx.textAlign = 'center';
    this._wrapText(ctx, panel.text, w / 2, h / 2 - 25, w * 0.8, 50);

    if (panel.subtext) {
      ctx.fillStyle = '#99aacc';
      ctx.shadowBlur = 0;
      ctx.font = `${Math.min(20, w * 0.028)}px monospace`;
      this._wrapText(ctx, panel.subtext, w / 2, h / 2 + 55, w * 0.7, 34);
    }
    ctx.restore();
  }

  _wrapText(ctx, text, x, y, maxWidth, lineHeight) {
    if (!text) return;
    const words = text.split(' ');
    let line = '';
    let currentY = y;

    for (const word of words) {
      const testLine = line + word + ' ';
      const metrics = ctx.measureText(testLine);
      if (metrics.width > maxWidth && line !== '') {
        ctx.fillText(line.trim(), x, currentY);
        line = word + ' ';
        currentY += lineHeight;
      } else {
        line = testLine;
      }
    }
    ctx.fillText(line.trim(), x, currentY);
  }
}

export const cinematicsEngine = new CinematicsEngine();
