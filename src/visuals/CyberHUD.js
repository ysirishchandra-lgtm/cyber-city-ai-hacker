/**
 * SCAR — THE LAST CHOICE
 * CyberHUD.js — Minimal, High-Tech Tactical Visor HUD
 * Author: Ashwidha (Visual / UI / Cinematic Lead)
 */

import { POWER_PATH } from '../core/GameState.js';

export class CyberHUD {
  constructor() {
    this._ghostHealth = 100;
    this._time = 0;

    // Mobile Virtual Touch State
    this.isTouchDevice = typeof window !== 'undefined' && (('ontouchstart' in window) || (typeof navigator !== 'undefined' && navigator.maxTouchPoints > 0));
    const winW = typeof window !== 'undefined' ? window.innerWidth : 1280;
    const winH = typeof window !== 'undefined' ? window.innerHeight : 720;
    this.virtualJoystick = { active: false, x: 120, y: winH - 120, radius: 45, touchX: 0, touchY: 0 };
    this.virtualButtons = {
      attack: { x: winW - 80, y: winH - 100, radius: 36, label: 'ATK' },
      power: { x: winW - 160, y: winH - 80, radius: 32, label: 'PWR' },
      sprint: { x: winW - 70, y: winH - 180, radius: 28, label: 'RUN' },
    };
  }

  update(dt, state) {
    this._time += dt;

    // Smooth damage ghost bar transition
    if (state && typeof state.health === 'number') {
      if (this._ghostHealth > state.health) {
        this._ghostHealth -= dt * 25;
        if (this._ghostHealth < state.health) this._ghostHealth = state.health;
      } else {
        this._ghostHealth = state.health;
      }
    }
  }

  render(ctx, state, missionSystem, w, h) {
    if (!state || state.gameStatus !== 'playing') return;

    // ─── Top-Left: Player Health & Stamina Visor ──────────────────────────────
    this._renderPlayerStatus(ctx, state, 24, 24);

    // ─── Top-Right: Tactical Mission & Objective Tracker ─────────────────────
    this._renderMissionTracker(ctx, missionSystem, state, w - 320, 24);

    // ─── Bottom-Left: Power Path Core ────────────────────────────────────────
    this._renderPowerCore(ctx, state, 24, h - 90);

    // ─── Bottom-Right: Threat Level & Telemetry ──────────────────────────────
    this._renderThreatStatus(ctx, state, w - 240, h - 90);

    // ─── Mobile Virtual Controls (if touch enabled) ──────────────────────────
    if (this.isTouchDevice) {
      this._renderVirtualControls(ctx, w, h);
    }
  }

  _renderPlayerStatus(ctx, state, x, y) {
    ctx.save();
    const hp = state.health || 100;
    const maxHp = state.maxHealth || 100;
    const hpPct = Math.max(0, Math.min(1, hp / maxHp));
    const ghostPct = Math.max(0, Math.min(1, this._ghostHealth / maxHp));

    // Outer Tactical Frame
    ctx.fillStyle = 'rgba(10, 12, 22, 0.85)';
    ctx.strokeStyle = 'rgba(0, 243, 255, 0.4)';
    ctx.lineWidth = 1.5;
    this._roundRect(ctx, x, y, 240, 68, 6, true, true);

    // Player ID & Level
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 12px monospace';
    ctx.textAlign = 'left';
    ctx.fillText(`${state.playerName || 'OPERATIVE'}`, x + 14, y + 20);

    ctx.fillStyle = '#00f3ff';
    ctx.font = '10px monospace';
    ctx.fillText(`LVL.${state.level || 1} PHASE: ${state.phase.replace(/_/g, ' ')}`, x + 14, y + 34);

    // Health Bar Gauge
    const barX = x + 14;
    const barY = y + 42;
    const barW = 212;
    const barH = 10;

    // Background track
    ctx.fillStyle = '#161622';
    ctx.fillRect(barX, barY, barW, barH);

    // Damage Ghost Bar
    ctx.fillStyle = '#ff5555';
    ctx.fillRect(barX, barY, barW * ghostPct, barH);

    // Active Health Fill
    const hpColor = hpPct > 0.5 ? '#00ff88' : hpPct > 0.25 ? '#ffb700' : '#ff0033';
    ctx.fillStyle = hpColor;
    ctx.shadowColor = hpColor;
    ctx.shadowBlur = 8;
    ctx.fillRect(barX, barY, barW * hpPct, barH);

    ctx.restore();
  }

  _renderMissionTracker(ctx, missionSystem, state, x, y) {
    const activeMissions = missionSystem ? missionSystem.getActiveMissions() : [];
    if (!activeMissions || activeMissions.length === 0) return;

    ctx.save();
    const currentMission = activeMissions[0];

    // Tactical Card Frame
    ctx.fillStyle = 'rgba(10, 12, 22, 0.85)';
    ctx.strokeStyle = 'rgba(255, 183, 0, 0.4)';
    ctx.lineWidth = 1.5;
    this._roundRect(ctx, x, y, 296, 110, 6, true, true);

    // Header with glowing icon
    ctx.fillStyle = '#ffb700';
    ctx.shadowColor = '#ffb700';
    ctx.shadowBlur = 8;
    ctx.font = 'bold 11px monospace';
    ctx.textAlign = 'left';
    ctx.fillText(`▶ MISSION: ${currentMission.title.toUpperCase()}`, x + 14, y + 22);

    ctx.shadowBlur = 0;
    ctx.fillStyle = '#aaaaaa';
    ctx.font = '10px monospace';
    ctx.fillText(`${currentMission.description}`, x + 14, y + 38);

    // Objectives List
    let objY = y + 58;
    currentMission.objectives.forEach(obj => {
      const isDone = obj.completed;
      ctx.fillStyle = isDone ? '#00ff88' : '#ffffff';
      ctx.font = '11px monospace';
      const check = isDone ? '[✓]' : '[ ]';
      ctx.fillText(`${check} ${obj.description}`, x + 14, objY);
      objY += 18;
    });

    ctx.restore();
  }

  _renderPowerCore(ctx, state, x, y) {
    ctx.save();
    ctx.fillStyle = 'rgba(10, 12, 22, 0.85)';
    ctx.strokeStyle = 'rgba(0, 243, 255, 0.4)';
    ctx.lineWidth = 1.5;
    this._roundRect(ctx, x, y, 220, 64, 6, true, true);

    if (!state.powerUnlocked) {
      ctx.fillStyle = '#666677';
      ctx.font = 'bold 12px monospace';
      ctx.textAlign = 'left';
      ctx.fillText('⚡ POWER: UNLOCKED [NONE]', x + 14, y + 26);
      ctx.font = '10px monospace';
      ctx.fillText('STATUS: POWERLESS HUMAN', x + 14, y + 46);
    } else {
      const pathColors = {
        [POWER_PATH.AGGRESSIVE]: { label: 'DESTRUCTION NOVA', color: '#ff2200' },
        [POWER_PATH.PROTECTIVE]: { label: 'KINETIC BARRIER', color: '#0099ff' },
        [POWER_PATH.STRATEGIC]: { label: 'STASIS HACK', color: '#00ff88' },
      };

      const pathInfo = pathColors[state.powerPath] || { label: state.powerPath, color: '#00f3ff' };

      ctx.fillStyle = pathInfo.color;
      ctx.shadowColor = pathInfo.color;
      ctx.shadowBlur = 10;
      ctx.font = 'bold 13px monospace';
      ctx.textAlign = 'left';
      ctx.fillText(`⚡ ${pathInfo.label}`, x + 14, y + 26);

      ctx.shadowBlur = 0;
      ctx.fillStyle = '#ffffff';
      ctx.font = '10px monospace';
      ctx.fillText('READY — [SPACEBAR] TO ACTIVATE', x + 14, y + 46);
    }
    ctx.restore();
  }

  _renderThreatStatus(ctx, state, x, y) {
    ctx.save();
    ctx.fillStyle = 'rgba(10, 12, 22, 0.85)';
    ctx.strokeStyle = 'rgba(255, 0, 85, 0.4)';
    ctx.lineWidth = 1.5;
    this._roundRect(ctx, x, y, 216, 64, 6, true, true);

    const isBoss = state.phase === 'FINAL_BATTLE';
    const threatText = isBoss ? 'THREAT: ATLAS (BOSS)' : 'THREAT: HOSTILE SECTOR';
    const threatColor = isBoss ? '#ff0033' : '#ff0055';

    ctx.fillStyle = threatColor;
    ctx.shadowColor = threatColor;
    ctx.shadowBlur = 10;
    ctx.font = 'bold 12px monospace';
    ctx.textAlign = 'left';
    ctx.fillText(`⚠ ${threatText}`, x + 14, y + 26);

    ctx.shadowBlur = 0;
    ctx.fillStyle = '#888899';
    ctx.font = '10px monospace';
    ctx.fillText(`ENEMIES DEFEATED: ${state.enemiesDefeated || 0}`, x + 14, y + 46);
    ctx.restore();
  }

  _renderVirtualControls(ctx, w, h) {
    ctx.save();
    // 1. Virtual Joystick Base
    ctx.strokeStyle = 'rgba(0, 243, 255, 0.3)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(120, h - 120, 50, 0, Math.PI * 2);
    ctx.stroke();

    ctx.fillStyle = 'rgba(0, 243, 255, 0.15)';
    ctx.beginPath();
    ctx.arc(120, h - 120, 22, 0, Math.PI * 2);
    ctx.fill();

    // 2. Action Buttons
    const buttons = [
      { x: w - 80, y: h - 90, r: 32, label: 'ATK', color: '#ff0055' },
      { x: w - 160, y: h - 80, r: 28, label: 'PWR', color: '#00f3ff' },
      { x: w - 80, y: h - 170, r: 26, label: 'RUN', color: '#ffb700' },
    ];

    buttons.forEach(btn => {
      ctx.strokeStyle = btn.color;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(btn.x, btn.y, btn.r, 0, Math.PI * 2);
      ctx.stroke();

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 12px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(btn.label, btn.x, btn.y + 4);
    });

    ctx.restore();
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

export const cyberHUD = new CyberHUD();
