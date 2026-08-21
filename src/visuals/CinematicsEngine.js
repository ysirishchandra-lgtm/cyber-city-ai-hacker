/**
 * SCAR — THE LAST CHOICE
 * CinematicsEngine.js — Animated Anime Storyboard & Google Veo Video Playback
 * Author: Ashwidha (Visual / UI / Cinematic Lead)
 */

import { shaderPipeline } from './ShaderPipeline.js';
import { audioEngine } from './AudioEngine.js';
import { voiceEngine } from './VoiceEngine.js';

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
    this.imageCache = {};
    this.rainDrops = [];
    this.video = null;

    this._time = 0;
    this._initRain();
  }

  _initRain() {
    this.rainDrops = [];
    for (let i = 0; i < 90; i++) {
      this.rainDrops.push({
        x: Math.random() * 1600,
        y: Math.random() * 900,
        len: 12 + Math.random() * 16,
        speed: 700 + Math.random() * 300,
        alpha: 0.15 + Math.random() * 0.35,
        drift: -120
      });
    }
  }

  _ensureVideo() {
    if (this.video || typeof document === 'undefined') return;
    try {
      this.video = document.createElement('video');
      this.video.src = 'src/assets/cinematics/prologue_cinematic.mp4';
      this.video.muted = true;
      this.video.loop = true;
      this.video.playsInline = true;
      this.video.autoplay = true;
      this.video.style.display = 'none';
      document.body.appendChild(this.video);
      this.video.play().catch(() => {});
    } catch (e) {}
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

    this._ensureVideo();
    if (this.video) {
      this.video.currentTime = 0;
      this.video.play().catch(() => {});
    }

    if (this.panels.length > 0 && this.panels[0].text) {
      voiceEngine.speak(this.panels[0].text, 'NARRATOR');
    }

    if (phase === 'ATTACK') {
      shaderPipeline.triggerGlitch(0.8);
      shaderPipeline.addShake(0.7);
      audioEngine.playImpact(true);
    } else if (phase === 'SCAR') {
      shaderPipeline.triggerFlash('#ff0033', 0.9);
      shaderPipeline.addShake(0.9);
      audioEngine.playPowerAwakening();
    }
  }

  skip() {
    if (!this.active) return;
    audioEngine.playUIClick();
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
      audioEngine.playDialogueBlip();
      if (panel && panel.text) {
        voiceEngine.speak(panel.text, 'NARRATOR');
      }

      if (panel.style === 'flash') {
        shaderPipeline.triggerFlash('#ffffff', 0.9);
        audioEngine.playImpact(true);
      } else if (panel.style === 'impact') {
        shaderPipeline.addShake(0.8);
        shaderPipeline.triggerGlitch(0.7);
        audioEngine.playImpact(true);
      }
    }
  }

  completeSequence() {
    this.active = false;
    this.panels = [];
    shaderPipeline.setLetterbox(0.0);
    voiceEngine.stop();

    if (this.video) {
      try {
        this.video.pause();
      } catch (e) {}
    }

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

    // Update cinematic rain
    for (const drop of this.rainDrops) {
      drop.x += drop.drift * dt;
      drop.y += drop.speed * dt;
      if (drop.y > 900) {
        drop.y = -30;
        drop.x = Math.random() * 1600;
      }
    }

    const currentPanel = this.panels[this.currentIndex];
    const duration = currentPanel?.duration || 3500;

    if (this.timer >= duration) {
      this.nextPanel();
    }
  }

  render(ctx, w, h) {
    if (!this.active || !this.panels[this.currentIndex]) return;
    const panel = this.panels[this.currentIndex];
    const duration = panel.duration || 3500;
    const panelProgress = Math.min(1.0, this.timer / duration);

    // 1. Background Pure Black
    ctx.save();
    ctx.fillStyle = '#020206';
    ctx.fillRect(0, 0, w, h);

    let hasMedia = false;

    // 2. Play Google Veo Video if available
    if (this.video && this.video.readyState >= 2 && typeof ctx.drawImage === 'function') {
      try {
        hasMedia = true;
        const vw = this.video.videoWidth || 1280;
        const vh = this.video.videoHeight || 720;
        const scale = Math.max(w / vw, h / vh);
        const nw = vw * scale;
        const nh = vh * scale;
        const ox = (w - nw) / 2;
        const oy = (h - nh) / 2;

        ctx.save();
        ctx.globalAlpha = 0.9;
        ctx.drawImage(this.video, ox, oy, nw, nh);
        ctx.restore();

        // Dark cinematic vignette over video
        const artGrad = ctx.createLinearGradient(0, 0, 0, h);
        artGrad.addColorStop(0, 'rgba(2, 2, 8, 0.65)');
        artGrad.addColorStop(0.5, 'rgba(2, 2, 8, 0.35)');
        artGrad.addColorStop(1, 'rgba(2, 2, 8, 0.85)');
        ctx.fillStyle = artGrad;
        ctx.fillRect(0, 0, w, h);
      } catch (e) {
        hasMedia = false;
      }
    }

    // 3. Fallback to Animated Ken-Burns Artwork if Video not playing
    if (!hasMedia && panel.image && typeof Image !== 'undefined') {
      if (!this.imageCache) this.imageCache = {};
      let img = this.imageCache[panel.image];
      if (!img) {
        img = new Image();
        img.src = panel.image;
        this.imageCache[panel.image] = img;
      }

      if (img.complete && img.naturalWidth > 0 && typeof ctx.drawImage === 'function') {
        hasMedia = true;

        const kbScale = 1.0 + panelProgress * 0.08;
        const kbPanX = Math.sin(panelProgress * Math.PI) * 15;
        const kbPanY = Math.cos(panelProgress * Math.PI) * 8;

        const baseScale = Math.max(w / img.naturalWidth, h / img.naturalHeight);
        const totalScale = baseScale * kbScale;
        const nw = img.naturalWidth * totalScale;
        const nh = img.naturalHeight * totalScale;
        const ox = (w - nw) / 2 + kbPanX;
        const oy = (h - nh) / 2 + kbPanY;

        ctx.save();
        const fadeIn = Math.min(1.0, this.timer / 400);
        ctx.globalAlpha = 0.88 * fadeIn;
        try {
          ctx.drawImage(img, ox, oy, nw, nh);
        } catch (e) {}
        ctx.restore();

        const artGrad = ctx.createLinearGradient(0, 0, 0, h);
        artGrad.addColorStop(0, 'rgba(2, 2, 8, 0.72)');
        artGrad.addColorStop(0.5, 'rgba(2, 2, 8, 0.45)');
        artGrad.addColorStop(1, 'rgba(2, 2, 8, 0.88)');
        ctx.fillStyle = artGrad;
        ctx.fillRect(0, 0, w, h);
      }
    }

    // 4. Atmospheric animated fog (if no media)
    if (!hasMedia) {
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

    // 5. Foreground Cinematic Rain Streaks
    ctx.save();
    ctx.lineWidth = 1.2;
    for (const drop of this.rainDrops) {
      ctx.strokeStyle = `rgba(180, 230, 255, ${drop.alpha * 0.6})`;
      ctx.beginPath();
      ctx.moveTo(drop.x, drop.y);
      ctx.lineTo(drop.x - 4, drop.y + drop.len);
      ctx.stroke();
    }
    ctx.restore();

    // 6. Render Panel Typography Content
    if (panel.style === 'title') {
      this._renderTitleCard(ctx, w, h, panel);
    } else if (panel.style === 'quote' || panel.style === 'highlight') {
      this._renderQuoteCard(ctx, w, h, panel);
    } else {
      this._renderStandardCard(ctx, w, h, panel);
    }

    // 7. Skip Prompt & Progress Bar
    ctx.save();
    ctx.fillStyle = 'rgba(0, 243, 255, 0.35)';
    ctx.fillRect(w / 2 - 120, h - 30, 240 * panelProgress, 2);

    ctx.fillStyle = 'rgba(120, 140, 180, 0.75)';
    ctx.font = '12px monospace';
    ctx.textAlign = 'right';
    ctx.fillText('[SPACE / CLICK] SKIP', w - 40, h - 35);
    ctx.restore();

    ctx.restore();
  }

  _renderTitleCard(ctx, w, h, panel) {
    ctx.save();
    const slashWidth = Math.min(600, w * 0.75);
    ctx.strokeStyle = '#cc0000';
    ctx.shadowColor = '#ff0033';
    ctx.shadowBlur = 24;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(w / 2 - slashWidth / 2, h / 2 + 10);
    ctx.lineTo(w / 2 + slashWidth / 2, h / 2 + 10);
    ctx.stroke();

    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = '#ffffff';
    ctx.shadowBlur = 18;
    ctx.font = `900 ${Math.min(84, w * 0.12)}px monospace`;
    ctx.textAlign = 'center';
    ctx.fillText(panel.text, w / 2, h / 2 - 10);

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
    ctx.fillStyle = '#e6f0ff';
    ctx.shadowColor = 'rgba(0, 243, 255, 0.4)';
    ctx.shadowBlur = 12;
    ctx.font = `bold ${Math.min(34, w * 0.048)}px monospace`;
    ctx.textAlign = 'center';
    this._wrapText(ctx, panel.text, w / 2, h / 2 - 25, w * 0.8, 48);

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
