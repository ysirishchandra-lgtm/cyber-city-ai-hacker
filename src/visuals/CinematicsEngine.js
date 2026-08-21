/**
 * SCAR — THE LAST CHOICE
 * CinematicsEngine.js — Animated Anime Storyboard & Google Veo Video Playback
 * Author: Ashwidha & Sirish (Visual / Systems Integration)
 *
 * Plays prologue / cutscene videos with non-looping playback, listens for completion
 * event (onended / loopPointReached), fades out the video canvas, and triggers
 * the "ROUND 1 — FIND THE FOUR" sequence & CyberHUD boot-up.
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

    // Round 1 Announcement Splash Sequence State
    this.isAnnouncingRound1 = false;
    this.round1Timer = 0;
    this.round1Duration = 2.2;
    this.speedSparks = [];

    this._time = 0;
    this._initRain();
    this._initSparks();
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

  _initSparks() {
    this.speedSparks = [];
    for (let i = 0; i < 70; i++) {
      this.speedSparks.push({
        x: (Math.random() - 0.5) * 1200,
        y: (Math.random() - 0.5) * 600,
        vx: (Math.random() > 0.5 ? 1 : -1) * (400 + Math.random() * 600),
        vy: (Math.random() - 0.5) * 200,
        len: 15 + Math.random() * 40,
        color: Math.random() > 0.4 ? '#ff9900' : '#00f3ff',
        alpha: 0.4 + Math.random() * 0.6
      });
    }
  }

  _ensureVideo() {
    if (this.video || typeof document === 'undefined') return;
    try {
      this.video = document.createElement('video');
      this.video.src = 'src/assets/cinematics/prologue_cinematic.mp4';
      this.video.muted = true;
      this.video.loop = false; // Strictly non-looping playback
      this.video.playsInline = true;
      this.video.autoplay = true;
      this.video.style.display = 'none';
      
      // Hook into video completion event
      this.video.onended = () => {
        this.completeSequence();
      };

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
      this.video.loop = false;
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
        this.video.currentTime = 0;
      } catch (e) {}
    }

    // Trigger "ROUND 1 — FIND THE FOUR" Announcement Splash
    this.triggerRound1Sequence();
  }

  triggerRound1Sequence() {
    this.isAnnouncingRound1 = true;
    this.round1Timer = this.round1Duration;
    shaderPipeline.triggerFlash('#00f3ff', 0.7);
    shaderPipeline.addShake(0.6);
    audioEngine.playPowerAwakening();

    import('../core/EventBus.js').then(({ eventBus, EVENTS }) => {
      eventBus.emit(EVENTS.CINEMATIC_COMPLETE);
    });

    if (this.onComplete) {
      this.onComplete();
    }
  }

  update(dt) {
    this._time += dt;

    if (this.isAnnouncingRound1) {
      this.round1Timer -= dt;
      if (this.round1Timer <= 0) {
        this.isAnnouncingRound1 = false;
      }
    }

    if (!this.active) return;
    this.timer += dt * 1000;
    this.textProgress = Math.min(1.0, this.textProgress + dt * 2.5);

    // Update cinematic rain
    for (const drop of this.rainDrops) {
      drop.y += drop.speed * dt;
      drop.x += drop.drift * dt;
      if (drop.y > 950) {
        drop.y = -20;
        drop.x = Math.random() * 1600;
      }
    }
  }

  render(ctx, w, h) {
    if (!this.active && !this.isAnnouncingRound1) return;

    if (this.isAnnouncingRound1) {
      this._renderRound1Announcement(ctx, w, h);
      return;
    }

    // 1. Render Video Frame or Animated Rainy Cyberpunk Backdrop
    let renderedVideo = false;
    if (this.video && this.video.readyState >= 2 && !this.video.paused) {
      try {
        ctx.drawImage(this.video, 0, 0, w, h);
        renderedVideo = true;
      } catch (e) {}
    }

    if (!renderedVideo) {
      this._renderCinematicBackdrop(ctx, w, h);
    }

    // 2. Render Anime Storyboard Card
    if (this.panels.length > 0 && this.currentIndex < this.panels.length) {
      const panel = this.panels[this.currentIndex];
      this._renderPanelCard(ctx, w, h, panel);
    }

    // 3. Skip Prompt Overlay
    ctx.save();
    ctx.font = 'bold 12px monospace';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.textAlign = 'right';
    ctx.fillText('[SPACE / CLICK] SKIP SCENE', w - 40, h - 35);
    ctx.restore();
  }

  _renderRound1Announcement(ctx, w, h) {
    ctx.save();
    const progress = 1.0 - (this.round1Timer / this.round1Duration);
    const alpha = Math.sin(Math.min(1, progress * 1.5) * Math.PI * 0.5) * (this.round1Timer < 0.35 ? this.round1Timer / 0.35 : 1.0);
    const scale = progress < 0.2 ? 1.5 - progress * 2.5 : (progress > 0.8 ? 1.0 + (progress - 0.8) * 1.5 : 1.0);

    ctx.globalAlpha = alpha;

    // Dark semi-transparent radial speed vignette
    const vigGrad = ctx.createRadialGradient(w / 2, h / 2, 80, w / 2, h / 2, w * 0.65);
    vigGrad.addColorStop(0, 'rgba(0, 0, 0, 0.4)');
    vigGrad.addColorStop(1, 'rgba(0, 0, 0, 0.85)');
    ctx.fillStyle = vigGrad;
    ctx.fillRect(0, 0, w, h);

    // Explosive Speed Line Sparks
    for (const spark of this.speedSparks) {
      const sx = w / 2 + spark.x + spark.vx * progress * 0.8;
      const sy = h / 2 + spark.y + spark.vy * progress * 0.8;
      ctx.strokeStyle = spark.color;
      ctx.shadowColor = spark.color;
      ctx.shadowBlur = 10;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(sx, sy);
      ctx.lineTo(sx + (spark.vx > 0 ? spark.len : -spark.len), sy);
      ctx.stroke();
    }

    // Center Banner Horizon Bar
    ctx.save();
    ctx.translate(w / 2, h / 2);
    ctx.scale(scale, scale);

    const bannerW = Math.min(880, w * 0.85);
    const bannerH = 150;

    // Outer Jagged Banner Frame
    ctx.fillStyle = 'rgba(6, 10, 20, 0.94)';
    ctx.strokeStyle = '#ff8800';
    ctx.lineWidth = 3;
    ctx.shadowColor = '#ff8800';
    ctx.shadowBlur = 22;

    ctx.beginPath();
    ctx.moveTo(-bannerW / 2 - 25, 0);
    ctx.lineTo(-bannerW / 2, -bannerH / 2);
    ctx.lineTo(bannerW / 2, -bannerH / 2);
    ctx.lineTo(bannerW / 2 + 25, 0);
    ctx.lineTo(bannerW / 2, bannerH / 2);
    ctx.lineTo(-bannerW / 2, bannerH / 2);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Top & Bottom Accent Ribbons
    ctx.strokeStyle = '#00f3ff';
    ctx.shadowColor = '#00f3ff';
    ctx.shadowBlur = 16;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(-bannerW / 2 + 30, -bannerH / 2);
    ctx.lineTo(bannerW / 2 - 30, -bannerH / 2);
    ctx.moveTo(-bannerW / 2 + 30, bannerH / 2);
    ctx.lineTo(bannerW / 2 - 30, bannerH / 2);
    ctx.stroke();

    // Text: "ROUND 1" (Cyan & Orange)
    ctx.font = `italic 900 ${Math.min(96, w * 0.09)}px 'Orbitron', monospace`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Cyan "ROUND"
    ctx.fillStyle = '#00f3ff';
    ctx.shadowColor = '#00f3ff';
    ctx.shadowBlur = 26;
    ctx.fillText('ROUND 1', 0, -18);

    // Subtitle: "FIND THE FOUR"
    ctx.font = `900 ${Math.min(32, w * 0.035)}px 'Orbitron', monospace`;
    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = '#ff8800';
    ctx.shadowBlur = 14;
    ctx.fillText('FIND THE FOUR', 0, 42);

    ctx.restore();
    ctx.restore();
  }

  _renderCinematicBackdrop(ctx, w, h) {
    const bgGrad = ctx.createLinearGradient(0, 0, 0, h);
    bgGrad.addColorStop(0, '#04040a');
    bgGrad.addColorStop(0.5, '#0a0d1a');
    bgGrad.addColorStop(1, '#020205');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, w, h);

    // Rainy atmosphere
    ctx.strokeStyle = 'rgba(0, 243, 255, 0.3)';
    ctx.lineWidth = 1.5;
    for (const drop of this.rainDrops) {
      ctx.beginPath();
      ctx.moveTo(drop.x, drop.y);
      ctx.lineTo(drop.x - 3, drop.y + drop.len);
      ctx.stroke();
    }
  }

  _renderPanelCard(ctx, w, h, panel) {
    if (!panel) return;
    if (panel.style === 'title') {
      this._renderTitleCard(ctx, w, h, panel);
    } else if (panel.style === 'quote') {
      this._renderQuoteCard(ctx, w, h, panel);
    } else {
      this._renderStandardCard(ctx, w, h, panel);
    }
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
