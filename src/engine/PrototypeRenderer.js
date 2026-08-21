/**
 * SCAR — THE LAST CHOICE
 * PrototypeRenderer.js — Working visual prototype
 * Author: Sirish (Lead/Integration)
 *
 * Provides a WORKING visual game so the team has a running base.
 * Ashwidha will REPLACE this with cyberpunk visuals on her branch.
 * This file is intentionally minimal — it exists to prove the architecture works.
 *
 * Implements the interface expected by GameManager.registerRenderer()
 */

import { ENDING_CONTENT } from '../story/StoryContent.js';
import { ENDING, POWER_PATH } from '../core/GameState.js';

export class PrototypeRenderer {
  constructor(canvasId) {
    this._canvasId = canvasId;
    this._canvas = null;
    this._ctx = null;

    // Cinematic state
    this._cinematicPanels = [];
    this._cinematicIndex = 0;
    this._cinematicTimer = null;
    this._cinematicPhase = null;
    this._onCinematicDone = null;

    // Overlay state
    this._currentChoice = null;
    this._currentDialogue = null;
    this._dialogueLine = 0;
    this._finalChoiceOptions = null;
    this._showEndingScreen = null;
  }

  async init() {
    this._canvas = document.getElementById(this._canvasId);
    if (!this._canvas) throw new Error(`Canvas #${this._canvasId} not found`);
    this._ctx = this._canvas.getContext('2d');
    this._resize();
    window.addEventListener('resize', () => this._resize());
    document.addEventListener('keydown', (e) => this._handleKey(e));

    // Draw boot screen
    this._drawBootScreen();
  }

  _resize() {
    this._canvas.width = window.innerWidth;
    this._canvas.height = window.innerHeight;
  }

  // ─── Cinematic Panels ───────────────────────────────────────────────────────

  showCinematic(panels, phase, onDone) {
    this._cinematicPanels = panels;
    this._cinematicIndex = 0;
    this._cinematicPhase = phase;
    this._onCinematicDone = onDone;
    this._showPanel(0);
  }

  _showPanel(index) {
    if (index >= this._cinematicPanels.length) {
      // All panels done — emit complete
      import('../core/EventBus.js').then(({ eventBus, EVENTS }) => {
        eventBus.emit(EVENTS.CINEMATIC_COMPLETE);
      });
      return;
    }

    const panel = this._cinematicPanels[index];
    this._drawCinematicPanel(panel);

    // Click/keypress skips to next panel
    this._cinematicIndex = index;

    // Auto-advance
    if (this._cinematicTimer) clearTimeout(this._cinematicTimer);
    this._cinematicTimer = setTimeout(() => {
      this._showPanel(index + 1);
    }, panel.duration);
  }

  _drawCinematicPanel(panel) {
    const ctx = this._ctx;
    const w = this._canvas.width;
    const h = this._canvas.height;

    // Black background
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, w, h);

    // Subtle vignette
    const grad = ctx.createRadialGradient(w / 2, h / 2, h * 0.2, w / 2, h / 2, h * 0.8);
    grad.addColorStop(0, 'rgba(0,0,0,0)');
    grad.addColorStop(1, 'rgba(0,0,0,0.6)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    if (panel.style === 'title') {
      // Big title treatment
      ctx.fillStyle = '#ffffff';
      ctx.font = `bold ${Math.min(72, w * 0.12)}px monospace`;
      ctx.textAlign = 'center';
      ctx.fillText(panel.text, w / 2, h / 2 - 20);

      if (panel.subtext) {
        ctx.fillStyle = '#888888';
        ctx.font = `${Math.min(24, w * 0.04)}px monospace`;
        ctx.fillText(panel.subtext, w / 2, h / 2 + 30);
      }

      // Scar line decoration
      ctx.strokeStyle = '#cc0000';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(w / 2 - 80, h / 2 + 55);
      ctx.lineTo(w / 2 + 80, h / 2 + 55);
      ctx.stroke();
    } else if (panel.style === 'quote') {
      ctx.fillStyle = '#cccccc';
      ctx.font = `italic ${Math.min(28, w * 0.045)}px Georgia`;
      ctx.textAlign = 'center';
      this._wrapText(ctx, panel.text, w / 2, h / 2 - 20, w * 0.7, 40);

      if (panel.subtext) {
        ctx.fillStyle = '#888888';
        ctx.font = `italic ${Math.min(22, w * 0.035)}px Georgia`;
        this._wrapText(ctx, panel.subtext, w / 2, h / 2 + 50, w * 0.6, 36);
      }
    } else {
      // Standard panel
      ctx.fillStyle = '#dddddd';
      ctx.font = `${Math.min(32, w * 0.05)}px monospace`;
      ctx.textAlign = 'center';
      this._wrapText(ctx, panel.text, w / 2, h / 2 - 20, w * 0.75, 48);

      if (panel.subtext) {
        ctx.fillStyle = '#888888';
        ctx.font = `${Math.min(20, w * 0.03)}px monospace`;
        this._wrapText(ctx, panel.subtext, w / 2, h / 2 + 50, w * 0.6, 32);
      }
    }

    // Skip hint
    ctx.fillStyle = 'rgba(100,100,100,0.6)';
    ctx.font = '14px monospace';
    ctx.textAlign = 'right';
    ctx.fillText('[SPACE] skip', w - 20, h - 20);
  }

  // ─── Choice Overlay ─────────────────────────────────────────────────────────

  showChoice(choice) {
    if (!choice) return;
    this._currentChoice = choice;
    this._drawChoiceOverlay();
  }

  _drawChoiceOverlay() {
    const choice = this._currentChoice;
    if (!choice) return;

    const ctx = this._ctx;
    const w = this._canvas.width;
    const h = this._canvas.height;

    // Dim background
    ctx.fillStyle = 'rgba(0,0,0,0.85)';
    ctx.fillRect(0, 0, w, h);

    // Red top border
    ctx.fillStyle = '#cc0000';
    ctx.fillRect(0, 0, w, 4);

    // Prompt
    ctx.fillStyle = '#ffffff';
    ctx.font = `bold ${Math.min(26, w * 0.04)}px monospace`;
    ctx.textAlign = 'center';
    this._wrapText(ctx, choice.prompt, w / 2, 80, w * 0.8, 38);

    if (choice.context) {
      ctx.fillStyle = '#888888';
      ctx.font = `${Math.min(16, w * 0.025)}px monospace`;
      this._wrapText(ctx, choice.context, w / 2, 140, w * 0.7, 28);
    }

    // Options
    const startY = 200;
    const optH = 80;
    choice.options.forEach((opt, i) => {
      const y = startY + i * (optH + 12);
      const boxW = Math.min(600, w * 0.8);
      const boxX = (w - boxW) / 2;

      // Option box
      ctx.fillStyle = '#1a1a1a';
      ctx.strokeStyle = '#333333';
      ctx.lineWidth = 1;
      this._roundRect(ctx, boxX, y, boxW, optH, 6, true, true);

      // Key hint
      ctx.fillStyle = '#cc0000';
      ctx.font = `bold 18px monospace`;
      ctx.textAlign = 'left';
      ctx.fillText(`[${i + 1}]`, boxX + 16, y + 30);

      // Option text
      ctx.fillStyle = '#cccccc';
      ctx.font = `${Math.min(16, w * 0.025)}px monospace`;
      this._wrapText(ctx, opt.text, boxX + 50, y + 26, boxW - 70, 24);

      if (opt.subtext) {
        ctx.fillStyle = '#666666';
        ctx.font = `12px monospace`;
        ctx.fillText(opt.subtext, boxX + 50, y + 55);
      }
    });

    ctx.fillStyle = '#444444';
    ctx.font = '13px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('Press [1] [2] [3] to choose', w / 2, startY + choice.options.length * (optH + 12) + 20);
  }

  // ─── Dialogue ───────────────────────────────────────────────────────────────

  showDialogue(dialogue) {
    this._currentDialogue = dialogue;
    this._dialogueLine = 0;
    this._drawDialogue();
  }

  _drawDialogue() {
    const dlg = this._currentDialogue;
    if (!dlg || this._dialogueLine >= dlg.lines.length) {
      this._currentDialogue = null;
      import('../core/EventBus.js').then(({ eventBus, EVENTS }) => {
        eventBus.emit(EVENTS.DIALOGUE_COMPLETE);
      });
      return;
    }

    const line = dlg.lines[this._dialogueLine];
    const ctx = this._ctx;
    const w = this._canvas.width;
    const h = this._canvas.height;

    // Dialogue box at bottom
    ctx.fillStyle = 'rgba(0,0,0,0.8)';
    ctx.fillRect(0, h - 160, w, 160);

    ctx.strokeStyle = '#333333';
    ctx.lineWidth = 1;
    ctx.strokeRect(0, h - 160, w, 160);

    // Speaker
    ctx.fillStyle = line.speaker === 'ATLAS' ? '#ff6666' :
      line.speaker === 'INNER VOICE' ? '#9966ff' : '#88ccff';
    ctx.font = 'bold 14px monospace';
    ctx.textAlign = 'left';
    ctx.fillText(line.speaker, 24, h - 130);

    // Line text
    ctx.fillStyle = '#dddddd';
    ctx.font = '18px monospace';
    this._wrapText(ctx, line.text, 24, h - 100, w - 48, 28);

    ctx.fillStyle = '#555555';
    ctx.font = '13px monospace';
    ctx.fillText('[SPACE] continue', w - 170, h - 16);
  }

  // ─── Final Choice ───────────────────────────────────────────────────────────

  showFinalChoice(eligibleEndings) {
    this._finalChoiceOptions = eligibleEndings;
    this._drawFinalChoice(eligibleEndings);
  }

  _drawFinalChoice(endings) {
    const ctx = this._ctx;
    const w = this._canvas.width;
    const h = this._canvas.height;

    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, w, h);

    ctx.fillStyle = '#cc0000';
    ctx.fillRect(0, 0, w, 4);

    ctx.fillStyle = '#ffffff';
    ctx.font = `bold ${Math.min(36, w * 0.055)}px monospace`;
    ctx.textAlign = 'center';
    ctx.fillText('THE LAST CHOICE', w / 2, 70);

    ctx.fillStyle = '#888888';
    ctx.font = '16px monospace';
    ctx.fillText('Who do you become?', w / 2, 105);

    const allEndings = [ENDING.VILLAIN, ENDING.HERO, ENDING.SAVIOR, ENDING.HUMAN];
    const y0 = 150;
    const optH = 90;

    allEndings.forEach((ending, i) => {
      const content = ENDING_CONTENT[ending];
      const isEligible = endings.includes(ending);
      const y = y0 + i * (optH + 10);
      const boxW = Math.min(600, w * 0.8);
      const boxX = (w - boxW) / 2;

      ctx.fillStyle = isEligible ? '#1a1a24' : '#0d0d0d';
      ctx.strokeStyle = isEligible ? '#444466' : '#222222';
      ctx.lineWidth = 1;
      this._roundRect(ctx, boxX, y, boxW, optH, 6, true, true);

      // Key
      ctx.fillStyle = isEligible ? '#cc0000' : '#333333';
      ctx.font = 'bold 16px monospace';
      ctx.textAlign = 'left';
      ctx.fillText(`[${i + 1}]`, boxX + 16, y + 32);

      // Title
      ctx.fillStyle = isEligible ? '#ffffff' : '#444444';
      ctx.font = `bold ${Math.min(18, w * 0.028)}px monospace`;
      ctx.fillText(content.title.toUpperCase(), boxX + 50, y + 28);

      // Headline
      ctx.fillStyle = isEligible ? '#aaaaaa' : '#333333';
      ctx.font = '13px monospace';
      ctx.fillText(content.headline, boxX + 50, y + 52);

      if (!isEligible) {
        ctx.fillStyle = '#333333';
        ctx.font = '11px monospace';
        ctx.fillText('[your choices did not lead here]', boxX + 50, y + 70);
      }
    });

    ctx.fillStyle = '#555555';
    ctx.font = '13px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('You may choose any path — eligible endings score higher', w / 2, y0 + allEndings.length * (optH + 10) + 16);
  }

  // ─── Ending Screen ──────────────────────────────────────────────────────────

  showEnding(ending, score, breakdown) {
    this._showEndingScreen = { ending, score, breakdown };
    this._drawEndingScreen(ending, score, breakdown);
  }

  _drawEndingScreen(ending, score, breakdown) {
    const content = ENDING_CONTENT[ending];
    if (!content) return;

    const ctx = this._ctx;
    const w = this._canvas.width;
    const h = this._canvas.height;

    const bgColor = {
      [ENDING.VILLAIN]: '#0d0000',
      [ENDING.HERO]: '#000d00',
      [ENDING.SAVIOR]: '#00080d',
      [ENDING.HUMAN]: '#0a0a00',
    }[ending] || '#000000';

    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, w, h);

    // Title
    ctx.fillStyle = '#ffffff';
    ctx.font = `bold ${Math.min(48, w * 0.075)}px monospace`;
    ctx.textAlign = 'center';
    ctx.fillText(content.title.toUpperCase(), w / 2, 90);

    // Headline
    ctx.fillStyle = '#aaaaaa';
    ctx.font = `italic ${Math.min(22, w * 0.034)}px Georgia`;
    ctx.fillText(content.headline, w / 2, 130);

    // Divider
    ctx.strokeStyle = '#333333';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(w / 2 - 200, 150);
    ctx.lineTo(w / 2 + 200, 150);
    ctx.stroke();

    // Story text
    ctx.fillStyle = '#cccccc';
    ctx.font = `${Math.min(17, w * 0.026)}px Georgia`;
    const lines = content.text.split('\n');
    lines.forEach((line, i) => {
      ctx.fillText(line.trim(), w / 2, 185 + i * 28);
    });

    // Score
    const scoreY = h - 140;
    ctx.fillStyle = '#ffffff';
    ctx.font = `bold ${Math.min(32, w * 0.05)}px monospace`;
    ctx.fillText(`SCORE: ${score.toLocaleString()}`, w / 2, scoreY);

    if (breakdown) {
      ctx.fillStyle = '#666666';
      ctx.font = '13px monospace';
      const parts = [
        `Completion: ${breakdown.base}`,
        `Time: +${breakdown.timeBonus}`,
        `Health: +${breakdown.healthBonus}`,
        `Combat: +${breakdown.combatBonus}`,
        `Choices: +${breakdown.choicesBonus}`,
        `Multiplier: ×${breakdown.endingMultiplier}`,
      ];
      parts.forEach((p, i) => {
        ctx.fillText(p, w / 2, scoreY + 28 + i * 18);
      });
    }

    ctx.fillStyle = '#444444';
    ctx.font = '14px monospace';
    ctx.fillText('[R] Play Again  |  [L] Leaderboard', w / 2, h - 20);
  }

  // ─── Game World Render (placeholder for Kaustub's scenes) ──────────────────

  render(state, dt) {
    if (!this._currentChoice && !this._currentDialogue && !this._finalChoiceOptions && !this._showEndingScreen) {
      this._renderGameplay(state);
      this._renderHUD(state);
    }
  }

  _renderGameplay(state) {
    const gs = window.__SCAR_GAMEPLAY_STATE__;
    if (!gs || !this._ctx) return;
    const ctx = this._ctx;
    const cam = gs.camera || { x: 0, y: 0 };

    // Clear background grid
    ctx.fillStyle = '#0a0a14';
    ctx.fillRect(0, 0, this._canvas.width, this._canvas.height);

    // Draw grid lines
    const gridSize = 60;
    const startX = -(cam.x % gridSize);
    const startY = -(cam.y % gridSize);
    ctx.strokeStyle = 'rgba(0, 243, 255, 0.05)';
    ctx.lineWidth = 1;

    for (let x = startX; x < this._canvas.width; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, this._canvas.height);
      ctx.stroke();
    }
    for (let y = startY; y < this._canvas.height; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(this._canvas.width, y);
      ctx.stroke();
    }

    // Draw Particles
    if (gs.particles) {
      gs.particles.forEach(pt => {
        const sx = pt.x - cam.x;
        const sy = pt.y - cam.y;
        ctx.save();
        ctx.beginPath();
        ctx.arc(sx, sy, pt.radius, 0, Math.PI * 2);
        ctx.strokeStyle = pt.color;
        ctx.lineWidth = 3;
        ctx.shadowColor = pt.color;
        ctx.shadowBlur = 10;
        ctx.stroke();
        ctx.restore();
      });
    }

    // Draw Projectiles
    if (gs.projectiles) {
      gs.projectiles.forEach(p => {
        ctx.beginPath();
        ctx.arc(p.x - cam.x, p.y - cam.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 8;
        ctx.fill();
      });
    }

    // Draw Enemies
    if (gs.enemies) {
      gs.enemies.forEach(e => {
        const sx = e.x - cam.x;
        const sy = e.y - cam.y;
        ctx.save();
        ctx.translate(sx, sy);
        if (e.inStasis) {
          ctx.beginPath();
          ctx.arc(0, 0, 20, 0, Math.PI * 2);
          ctx.strokeStyle = '#00ff66';
          ctx.lineWidth = 3;
          ctx.stroke();
        }
        ctx.beginPath();
        ctx.arc(0, 0, 16, 0, Math.PI * 2);
        ctx.fillStyle = '#111';
        ctx.fill();
        ctx.strokeStyle = e.color || '#ff0055';
        ctx.lineWidth = 2.5;
        ctx.shadowColor = e.color || '#ff0055';
        ctx.shadowBlur = 8;
        ctx.stroke();
        ctx.restore();
      });
    }

    // Draw Hero AI
    if (gs.hero && gs.hero.isAlive) {
      const sx = gs.hero.x - cam.x;
      const sy = gs.hero.y - cam.y;
      ctx.save();
      ctx.translate(sx, sy);
      ctx.beginPath();
      ctx.arc(0, 0, 24, 0, Math.PI * 2);
      ctx.fillStyle = '#ffffff';
      ctx.fill();
      ctx.strokeStyle = '#00ffff';
      ctx.lineWidth = 4;
      ctx.shadowColor = '#00ffff';
      ctx.shadowBlur = 15;
      ctx.stroke();
      ctx.restore();
    }

    // Draw Player
    if (gs.player) {
      const sx = gs.player.x - cam.x;
      const sy = gs.player.y - cam.y;
      ctx.save();
      ctx.translate(sx, sy);
      ctx.rotate(gs.player.facingAngle);
      ctx.beginPath();
      ctx.arc(0, 0, 16, 0, Math.PI * 2);
      ctx.fillStyle = '#0a0a14';
      ctx.fill();
      ctx.strokeStyle = '#00f3ff';
      ctx.lineWidth = 3;
      ctx.shadowColor = '#00f3ff';
      ctx.shadowBlur = 12;
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, -6);
      ctx.lineTo(12, 0);
      ctx.lineTo(0, 6);
      ctx.fillStyle = '#ff0055';
      ctx.fill();
      ctx.restore();
    }
  }

  _renderHUD(state) {
    if (!state || state.gameStatus !== 'playing') return;
    const ctx = this._ctx;
    const w = this._canvas.width;

    // Health bar
    const hpPct = state.health / state.maxHealth;
    const barW = 180;
    const barH = 12;
    const barX = 16;
    const barY = 16;

    ctx.fillStyle = '#111111';
    ctx.fillRect(barX, barY, barW, barH);
    ctx.fillStyle = hpPct > 0.5 ? '#22cc44' : hpPct > 0.25 ? '#ffaa00' : '#cc2222';
    ctx.fillRect(barX, barY, barW * hpPct, barH);
    ctx.strokeStyle = '#333333';
    ctx.strokeRect(barX, barY, barW, barH);

    ctx.fillStyle = '#888888';
    ctx.font = '11px monospace';
    ctx.textAlign = 'left';
    ctx.fillText(`HP ${state.health}/${state.maxHealth}`, barX, barY + 26);

    // Power path badge
    if (state.powerUnlocked) {
      const pathColors = {
        [POWER_PATH.AGGRESSIVE]: '#cc2222',
        [POWER_PATH.PROTECTIVE]: '#2222cc',
        [POWER_PATH.STRATEGIC]: '#22cc88',
      };
      ctx.fillStyle = pathColors[state.powerPath] || '#888888';
      ctx.font = 'bold 12px monospace';
      ctx.fillText(`★ ${state.powerPath} Lv.${state.powerLevel}`, barX, barY + 44);
    }

    // Phase label (top right)
    ctx.fillStyle = '#444444';
    ctx.font = '12px monospace';
    ctx.textAlign = 'right';
    ctx.fillText(state.phase.replace(/_/g, ' '), w - 16, 28);
  }

  // ─── Boot Screen ────────────────────────────────────────────────────────────

  _drawBootScreen() {
    const ctx = this._ctx;
    const w = this._canvas.width;
    const h = this._canvas.height;

    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, w, h);

    ctx.fillStyle = '#cc0000';
    ctx.fillRect(0, 0, w, 3);

    ctx.fillStyle = '#ffffff';
    ctx.font = `bold ${Math.min(52, w * 0.08)}px monospace`;
    ctx.textAlign = 'center';
    ctx.fillText('SCAR', w / 2, h / 2 - 20);

    ctx.fillStyle = '#666666';
    ctx.font = `${Math.min(18, w * 0.028)}px monospace`;
    ctx.fillText('THE LAST CHOICE', w / 2, h / 2 + 16);

    ctx.fillStyle = '#333333';
    ctx.font = '14px monospace';
    ctx.fillText('Initializing...', w / 2, h / 2 + 60);
  }

  // ─── Key Handler ────────────────────────────────────────────────────────────

  _handleKey(e) {
    // Skip cinematic panel
    if (e.code === 'Space') {
      if (this._cinematicPanels.length > 0) {
        if (this._cinematicTimer) clearTimeout(this._cinematicTimer);
        this._showPanel(this._cinematicIndex + 1);
        return;
      }
      if (this._currentDialogue) {
        this._dialogueLine++;
        this._drawDialogue();
        return;
      }
    }

    // Choice selection
    if (this._currentChoice) {
      const idx = parseInt(e.key) - 1;
      if (idx >= 0 && idx < this._currentChoice.options.length) {
        const opt = this._currentChoice.options[idx];
        this._currentChoice = null;
        import('../core/ChoiceSystem.js').then(({ choiceSystem }) => {
          choiceSystem.selectOption(opt.id);
        });
      }
      return;
    }

    // Final choice
    if (this._finalChoiceOptions) {
      const allEndings = [ENDING.VILLAIN, ENDING.HERO, ENDING.SAVIOR, ENDING.HUMAN];
      const idx = parseInt(e.key) - 1;
      if (idx >= 0 && idx < allEndings.length) {
        const ending = allEndings[idx];
        this._finalChoiceOptions = null;
        import('../core/ChoiceSystem.js').then(({ choiceSystem }) => {
          choiceSystem.makeFinalChoice(ending);
        });
      }
      return;
    }

    // Ending screen
    if (this._showEndingScreen) {
      if (e.code === 'KeyR') {
        location.reload();
      }
      if (e.code === 'KeyL') {
        import('../core/EventBus.js').then(({ eventBus, EVENTS }) => {
          eventBus.emit('SHOW_LEADERBOARD');
        });
      }
    }
  }

  // ─── Helpers ────────────────────────────────────────────────────────────────

  _wrapText(ctx, text, x, y, maxWidth, lineHeight) {
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

  _roundRect(ctx, x, y, w, h, r, fill, stroke) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.arcTo(x + w, y, x + w, y + r, r);
    ctx.lineTo(x + w, y + h - r);
    ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
    ctx.lineTo(x + r, y + h);
    ctx.arcTo(x, y + h, x, y + h - r, r);
    ctx.lineTo(x, y + r);
    ctx.arcTo(x, y, x + r, y, r);
    ctx.closePath();
    if (fill) ctx.fill();
    if (stroke) ctx.stroke();
  }
}
