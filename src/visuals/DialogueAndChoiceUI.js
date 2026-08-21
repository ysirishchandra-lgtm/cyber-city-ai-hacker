/**
 * SCAR — THE LAST CHOICE
 * DialogueAndChoiceUI.js — Cyberpunk Dialogue, Interactive Choice Cards & Ending Overlays
 * Author: Ashwidha (Visual / UI / Cinematic Lead)
 */

import { ENDING, POWER_PATH } from '../core/GameState.js';
import { ENDING_CONTENT } from '../story/StoryContent.js';
import { shaderPipeline } from './ShaderPipeline.js';
import { voiceEngine } from './VoiceEngine.js';

export class DialogueAndChoiceUI {
  constructor() {
    this._time = 0;
    this._hoveredOption = -1;
    this._lastSpokenLine = null;
  }

  update(dt) {
    this._time += dt;
  }

  // ─── Dialogue Box ───────────────────────────────────────────────────────────

  renderDialogue(ctx, dialogue, currentLineIndex, w, h) {
    if (!dialogue || !dialogue.lines || currentLineIndex >= dialogue.lines.length) return;
    const line = dialogue.lines[currentLineIndex];

    // Trigger spoken voice line if line changed
    if (this._lastSpokenLine !== line.text) {
      this._lastSpokenLine = line.text;
      voiceEngine.speak(line.text, line.speaker);
    }

    ctx.save();
    const boxW = Math.min(840, w - 48);
    const boxH = 150;
    const boxX = (w - boxW) / 2;
    const boxY = h - boxH - 24;

    // Dark Tactical Translucent Frame
    ctx.fillStyle = 'rgba(8, 10, 18, 0.92)';
    ctx.strokeStyle = '#00f3ff';
    ctx.lineWidth = 1.5;
    this._roundRect(ctx, boxX, boxY, boxW, boxH, 8, true, true);

    // Speaker Accent Tag
    const speakerColors = {
      'ATLAS': '#ffb700',
      'INFORMANT KIRA': '#00f3ff',
      'INNER VOICE': '#9900ff',
      'PLAYER': '#ffffff',
    };
    const color = speakerColors[line.speaker] || '#00f3ff';

    // Speaker Portrait / Icon Box
    ctx.fillStyle = '#141424';
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.5;
    ctx.fillRect(boxX + 16, boxY + 16, 56, 56);
    ctx.strokeRect(boxX + 16, boxY + 16, 56, 56);

    // Portrait initial
    ctx.fillStyle = color;
    ctx.font = 'bold 22px monospace';
    ctx.textAlign = 'center';
    ctx.fillText((line.speaker || 'P')[0], boxX + 44, boxY + 52);

    // Speaker Name
    ctx.fillStyle = color;
    ctx.shadowColor = color;
    ctx.shadowBlur = 8;
    ctx.font = 'bold 14px monospace';
    ctx.textAlign = 'left';
    ctx.fillText(line.speaker, boxX + 88, boxY + 36);

    // Dialogue Line Text
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#e6f0ff';
    ctx.font = '16px monospace';
    this._wrapText(ctx, line.text, boxX + 88, boxY + 68, boxW - 108, 24);

    // Continue Prompt with blinking arrow
    const blink = Math.sin(this._time * 6) > 0;
    ctx.fillStyle = blink ? '#00f3ff' : '#666688';
    ctx.font = '12px monospace';
    ctx.textAlign = 'right';
    ctx.fillText('[SPACE / CLICK] CONTINUE ▶', boxX + boxW - 20, boxY + boxH - 16);

    ctx.restore();
  }

  // ─── Interactive Choice Cards ──────────────────────────────────────────────

  renderChoice(ctx, choice, w, h) {
    if (!choice) return;

    ctx.save();
    // Dim background
    ctx.fillStyle = 'rgba(4, 6, 12, 0.88)';
    ctx.fillRect(0, 0, w, h);

    // Title Prompt
    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = 'rgba(0, 243, 255, 0.6)';
    ctx.shadowBlur = 12;
    ctx.font = `bold ${Math.min(28, w * 0.045)}px monospace`;
    ctx.textAlign = 'center';
    this._wrapText(ctx, choice.prompt, w / 2, 90, w * 0.8, 38);

    if (choice.context) {
      ctx.shadowBlur = 0;
      ctx.fillStyle = '#8899aa';
      ctx.font = `${Math.min(15, w * 0.025)}px monospace`;
      this._wrapText(ctx, choice.context, w / 2, 145, w * 0.7, 24);
    }

    // Option Cards
    const startY = 200;
    const optH = 75;
    const boxW = Math.min(640, w * 0.85);
    const boxX = (w - boxW) / 2;

    choice.options.forEach((opt, i) => {
      const y = startY + i * (optH + 16);
      const isHovered = this._hoveredOption === i;

      // Card Box
      ctx.fillStyle = isHovered ? '#1c1f32' : '#101220';
      ctx.strokeStyle = isHovered ? '#00f3ff' : '#2a2f4a';
      ctx.lineWidth = isHovered ? 2 : 1;
      if (isHovered) {
        ctx.shadowColor = '#00f3ff';
        ctx.shadowBlur = 14;
      }
      this._roundRect(ctx, boxX, y, boxW, optH, 8, true, true);
      ctx.shadowBlur = 0;

      // Hotkey Tag [1], [2], [3]
      ctx.fillStyle = isHovered ? '#00f3ff' : '#ff0055';
      ctx.font = 'bold 18px monospace';
      ctx.textAlign = 'left';
      ctx.fillText(`[${i + 1}]`, boxX + 18, y + 36);

      // Option Text
      ctx.fillStyle = isHovered ? '#ffffff' : '#ddddff';
      ctx.font = `bold ${Math.min(16, w * 0.028)}px monospace`;
      this._wrapText(ctx, opt.text, boxX + 60, y + 32, boxW - 80, 22);

      if (opt.subtext) {
        ctx.fillStyle = '#7788aa';
        ctx.font = '11px monospace';
        ctx.fillText(opt.subtext, boxX + 60, y + 58);
      }
    });

    // Helper prompt
    ctx.fillStyle = '#556688';
    ctx.font = '13px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('Press [1] [2] [3] or Click to make your choice', w / 2, startY + choice.options.length * (optH + 16) + 30);

    ctx.restore();
  }

  // ─── Final Choice ("WHO IS THE VILLAIN?") ───────────────────────────────────

  renderFinalChoice(ctx, eligibleEndings, w, h) {
    ctx.save();
    ctx.fillStyle = '#020206';
    ctx.fillRect(0, 0, w, h);

    // Dramatic Crimson Header Bar
    ctx.fillStyle = '#cc0000';
    ctx.fillRect(0, 0, w, 4);

    // Title
    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = '#ff0033';
    ctx.shadowBlur = 18;
    ctx.font = `900 ${Math.min(38, w * 0.055)}px monospace`;
    ctx.textAlign = 'center';
    ctx.fillText('WHO IS THE VILLAIN?', w / 2, 75);

    ctx.shadowBlur = 0;
    ctx.fillStyle = '#8899aa';
    ctx.font = '15px monospace';
    ctx.fillText('The final choice defines your legacy.', w / 2, 110);

    const allEndings = [ENDING.VILLAIN, ENDING.HERO, ENDING.SAVIOR, ENDING.HUMAN];
    const y0 = 150;
    const optH = 92;
    const boxW = Math.min(680, w * 0.85);
    const boxX = (w - boxW) / 2;

    allEndings.forEach((ending, i) => {
      const content = ENDING_CONTENT[ending];
      const isEligible = eligibleEndings ? eligibleEndings.includes(ending) : true;
      const y = y0 + i * (optH + 12);
      const isHovered = this._hoveredOption === i;

      // Box
      ctx.fillStyle = isEligible ? (isHovered ? '#1a1d30' : '#101222') : '#08080e';
      ctx.strokeStyle = isEligible ? (isHovered ? '#00f3ff' : '#333b5c') : '#181824';
      ctx.lineWidth = isHovered ? 2 : 1;
      if (isHovered && isEligible) {
        ctx.shadowColor = '#00f3ff';
        ctx.shadowBlur = 14;
      }
      this._roundRect(ctx, boxX, y, boxW, optH, 8, true, true);
      ctx.shadowBlur = 0;

      // Key [1]-[4]
      ctx.fillStyle = isEligible ? '#ff0055' : '#444455';
      ctx.font = 'bold 17px monospace';
      ctx.textAlign = 'left';
      ctx.fillText(`[${i + 1}]`, boxX + 18, y + 36);

      // Title
      ctx.fillStyle = isEligible ? '#ffffff' : '#555566';
      ctx.font = `bold ${Math.min(18, w * 0.03)}px monospace`;
      ctx.fillText(`BECOME ${content.title.toUpperCase()}`, boxX + 56, y + 32);

      // Headline
      ctx.fillStyle = isEligible ? '#99aacc' : '#444455';
      ctx.font = '13px monospace';
      ctx.fillText(content.headline, boxX + 56, y + 56);

      if (!isEligible) {
        ctx.fillStyle = '#ff5555';
        ctx.font = '10px monospace';
        ctx.fillText('[Choices did not align with this path]', boxX + 56, y + 76);
      }
    });

    ctx.restore();
  }

  // ─── Ending Display ────────────────────────────────────────────────────────

  renderEnding(ctx, ending, score, breakdown, w, h) {
    const content = ENDING_CONTENT[ending] || {
      title: 'THE SURVIVOR',
      headline: 'You reached the end.',
      text: 'The city continues into the night.'
    };

    ctx.save();

    // 1. Render Anime Ending Artwork Backdrop (if available)
    const endingImages = {
      [ENDING.VILLAIN]: 'src/assets/cinematics/scene8_ending_villain.jpg',
      [ENDING.HERO]: 'src/assets/cinematics/scene7_ending_hero.jpg',
      [ENDING.SAVIOR]: 'src/assets/cinematics/scene7_ending_hero.jpg',
      [ENDING.HUMAN]: 'src/assets/cinematics/scene2_fist_powerless.png',
    };
    const imgPath = endingImages[ending];

    let hasImage = false;
    if (imgPath && typeof Image !== 'undefined') {
      if (!this.imageCache) this.imageCache = {};
      let img = this.imageCache[imgPath];
      if (!img) {
        img = new Image();
        img.src = imgPath;
        this.imageCache[imgPath] = img;
      }

      if (img.complete && img.naturalWidth > 0 && typeof ctx.drawImage === 'function') {
        hasImage = true;
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

        // Dark gradient vignette
        const artGrad = ctx.createLinearGradient(0, 0, 0, h);
        artGrad.addColorStop(0, 'rgba(2, 2, 8, 0.75)');
        artGrad.addColorStop(0.5, 'rgba(2, 2, 8, 0.55)');
        artGrad.addColorStop(1, 'rgba(2, 2, 8, 0.9)');
        ctx.fillStyle = artGrad;
        ctx.fillRect(0, 0, w, h);
      }
    }

    if (!hasImage) {
      const bgColors = {
        [ENDING.VILLAIN]: '#140004',
        [ENDING.HERO]: '#001408',
        [ENDING.SAVIOR]: '#000c14',
        [ENDING.HUMAN]: '#121204',
      };
      ctx.fillStyle = bgColors[ending] || '#050508';
      ctx.fillRect(0, 0, w, h);
    }

    // 2. Translucent Glassmorphic Center Card
    const cardW = Math.min(880, w - 60);
    const cardH = Math.min(540, h - 80);
    const cardX = (w - cardW) / 2;
    const cardY = (h - cardH) / 2;

    ctx.fillStyle = 'rgba(10, 12, 22, 0.88)';
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.lineWidth = 1.5;
    this._roundRect(ctx, cardX, cardY, cardW, cardH, 12, true, true);

    // Title
    const titleColors = {
      [ENDING.VILLAIN]: '#ff0033',
      [ENDING.HERO]: '#00ff88',
      [ENDING.SAVIOR]: '#00f3ff',
      [ENDING.HUMAN]: '#ffb700',
    };
    const accentColor = titleColors[ending] || '#ffffff';

    ctx.fillStyle = accentColor;
    ctx.shadowColor = accentColor;
    ctx.shadowBlur = 20;
    ctx.font = `900 ${Math.min(42, w * 0.07)}px monospace`;
    ctx.textAlign = 'center';
    ctx.fillText(`ENDING: ${content.title.toUpperCase()}`, w / 2, cardY + 55);

    // Headline
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#ffffff';
    ctx.font = `italic ${Math.min(20, w * 0.032)}px Georgia, serif`;
    ctx.fillText(content.headline, w / 2, cardY + 95);

    // Divider line
    ctx.strokeStyle = accentColor;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(w / 2 - 180, cardY + 115);
    ctx.lineTo(w / 2 + 180, cardY + 115);
    ctx.stroke();

    // Story text
    ctx.fillStyle = '#ccd5e8';
    ctx.font = `${Math.min(15, w * 0.024)}px Georgia, serif`;
    const lines = content.text.split('\n');
    lines.forEach((line, i) => {
      ctx.fillText(line.trim(), w / 2, cardY + 150 + i * 24);
    });

    // Score & Breakdown
    const scoreY = cardY + cardH - 110;
    ctx.fillStyle = '#ffffff';
    ctx.font = `bold ${Math.min(28, w * 0.045)}px monospace`;
    ctx.fillText(`FINAL SCORE: ${(score || 0).toLocaleString()}`, w / 2, scoreY);

    if (breakdown) {
      ctx.fillStyle = '#8899aa';
      ctx.font = '12px monospace';
      const stats = [
        `Base: ${breakdown.base || 0}`,
        `Time Bonus: +${breakdown.timeBonus || 0}`,
        `Combat Bonus: +${breakdown.combatBonus || 0}`,
        `Multiplier: ×${breakdown.endingMultiplier || 1}`,
      ];
      ctx.fillText(stats.join('  |  '), w / 2, scoreY + 28);
    }

    // Action Prompts
    ctx.fillStyle = '#00f3ff';
    ctx.font = 'bold 15px monospace';
    ctx.fillText('[R] PLAY AGAIN   |   [L] VIEW LEADERBOARD', w / 2, cardY + cardH - 35);

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

export const dialogueAndChoiceUI = new DialogueAndChoiceUI();
