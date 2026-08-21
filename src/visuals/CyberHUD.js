/**
 * SCAR — THE LAST CHOICE
 * CyberHUD.js — Tactical Visor, Circular Radar Minimap & Action Badges
 * Author: Ashwidha (Visual / UI / Cinematic Lead)
 */

import { POWER_PATH } from '../core/GameState.js';

export class CyberHUD {
  constructor() {
    this._ghostHealth = 100;
    this._time = 0;
    this.isTouchDevice = typeof window !== 'undefined' && (('ontouchstart' in window) || (typeof navigator !== 'undefined' && navigator.maxTouchPoints > 0));
  }

  update(dt, state) {
    this._time += dt;

    // Smooth damage ghost bar transition
    if (state && typeof state.health === 'number') {
      if (this._ghostHealth > state.health) {
        this._ghostHealth -= dt * 30;
        if (this._ghostHealth < state.health) this._ghostHealth = state.health;
      } else {
        this._ghostHealth = state.health;
      }
    }
  }

  render(ctx, state, missionSystem, w, h) {
    if (!state || state.gameStatus !== 'playing') return;

    // 1. Top-Left: Player Health, Stamina & Focus
    this._renderPlayerStatus(ctx, state, 24, 24);

    // 2. Top-Right: Time Remaining & Mission Tracker
    this._renderTopRightStatus(ctx, missionSystem, state, w - 280, 24);

    // 3. Center Screen: Dynamic Aim Crosshair
    this._renderAimReticle(ctx, w / 2, h / 2);

    // 4. In-World Floating Objective Indicator (Center-Left)
    this._renderInWorldObjective(ctx, w / 2, h / 2 - 60);

    // 5. Bottom-Left: Circular Tactical Radar Minimap
    this._renderRadarMinimap(ctx, 80, h - 80, 48);

    // 6. Bottom-Right: Tactical Action Ability Diamonds (Adapt Q, Dodge Space, Focus R)
    this._renderActionAbilityDiamonds(ctx, state, w - 240, h - 70);
  }

  _renderPlayerStatus(ctx, state, x, y) {
    ctx.save();
    const hp = state.health || 100;
    const maxHp = state.maxHealth || 100;
    const hpPct = Math.max(0, Math.min(1, hp / maxHp));
    const ghostPct = Math.max(0, Math.min(1, this._ghostHealth / maxHp));

    // HEALTH Label
    ctx.fillStyle = '#00f3ff';
    ctx.font = 'bold 11px monospace';
    ctx.fillText('HEALTH', x, y + 10);

    // Health Bar Gauge
    const barW = 180;
    const barH = 7;
    ctx.fillStyle = '#0d0d18';
    ctx.fillRect(x, y + 16, barW, barH);

    // Damage Ghost Bar
    ctx.fillStyle = '#ff5555';
    ctx.fillRect(x, y + 16, barW * ghostPct, barH);

    // Active Health Fill (Crimson red like reference image)
    ctx.fillStyle = '#ff1a35';
    ctx.shadowColor = '#ff1a35';
    ctx.shadowBlur = 8;
    ctx.fillRect(x, y + 16, barW * hpPct, barH);

    // STAMINA Label & Bar
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#00f3ff';
    ctx.font = 'bold 11px monospace';
    ctx.fillText('STAMINA', x, y + 38);

    ctx.fillStyle = '#0d0d18';
    ctx.fillRect(x, y + 44, barW * 0.7, 6);
    ctx.fillStyle = '#00f3ff';
    ctx.shadowColor = '#00f3ff';
    ctx.shadowBlur = 6;
    ctx.fillRect(x, y + 44, barW * 0.7 * (state.stamina ? state.stamina / 100 : 1.0), 6);

    // FOCUS Pips
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#6b7280';
    ctx.font = 'bold 10px monospace';
    ctx.fillText('FOCUS', x, y + 64);
    for (let i = 0; i < 4; i++) {
      ctx.strokeStyle = '#00f3ff';
      ctx.lineWidth = 1;
      ctx.strokeRect(x + 48 + i * 14, y + 56, 10, 8);
      if (i < 2) {
        ctx.fillStyle = 'rgba(0, 243, 255, 0.6)';
        ctx.fillRect(x + 48 + i * 14, y + 56, 10, 8);
      }
    }

    ctx.restore();
  }

  _renderTopRightStatus(ctx, missionSystem, state, x, y) {
    ctx.save();
    // TIME REMAINING (Cyber Clock)
    ctx.textAlign = 'right';
    ctx.fillStyle = '#00f3ff';
    ctx.font = 'bold 11px monospace';
    ctx.fillText('TIME REMAINING', x + 250, y + 10);

    const hours = typeof state.hoursRemaining === 'number' ? state.hoursRemaining : 47;
    const mins = Math.floor((this._time * 12) % 60);
    const secs = Math.floor((this._time * 35) % 60);
    const timeStr = `${Math.floor(hours)}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 18px monospace';
    ctx.fillText(`${timeStr} 🕒`, x + 250, y + 32);

    // Active Mission Title
    const activeMissions = missionSystem ? missionSystem.getActiveMissions() : [];
    if (activeMissions && activeMissions.length > 0) {
      const mission = activeMissions[0];
      ctx.fillStyle = '#ffb700';
      ctx.font = 'bold 11px monospace';
      ctx.fillText(`▶ ${mission.title.toUpperCase()}`, x + 250, y + 52);

      if (mission.objectives && mission.objectives[0]) {
        ctx.fillStyle = '#cccccc';
        ctx.font = '10px monospace';
        ctx.fillText(mission.objectives[0].description, x + 250, y + 68);
      }
    }

    ctx.restore();
  }

  _renderInWorldObjective(ctx, x, y) {
    ctx.save();
    const pulse = Math.sin(this._time * 5) * 3;

    // Diamond Objective Icon
    ctx.fillStyle = '#ffb700';
    ctx.shadowColor = '#ffb700';
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.moveTo(x - 80, y);
    ctx.lineTo(x - 74, y - 6);
    ctx.lineTo(x - 68, y);
    ctx.lineTo(x - 74, y + 6);
    ctx.closePath();
    ctx.fill();

    // Objective Text
    ctx.font = 'bold 12px monospace';
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'left';
    ctx.fillText('Reach the Warehouse', x - 60, y - 2);
    ctx.fillStyle = '#a0aec0';
    ctx.font = '10px monospace';
    ctx.fillText('128m', x - 60, y + 10);
    ctx.restore();
  }

  _renderRadarMinimap(ctx, cx, cy, radius) {
    ctx.save();
    // Circular Translucent Base
    ctx.fillStyle = 'rgba(8, 12, 22, 0.85)';
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.fill();

    // Cyan Tactical Border
    ctx.strokeStyle = '#00f3ff';
    ctx.lineWidth = 1.5;
    ctx.shadowColor = '#00f3ff';
    ctx.shadowBlur = 8;
    ctx.stroke();

    // Inner Grid Rings
    ctx.shadowBlur = 0;
    ctx.strokeStyle = 'rgba(0, 243, 255, 0.2)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(cx, cy, radius * 0.5, 0, Math.PI * 2);
    ctx.stroke();

    // Crosshair Lines
    ctx.beginPath();
    ctx.moveTo(cx - radius, cy); ctx.lineTo(cx + radius, cy);
    ctx.moveTo(cx, cy - radius); ctx.lineTo(cx, cy + radius);
    ctx.stroke();

    // North Indicator
    ctx.fillStyle = '#00f3ff';
    ctx.font = 'bold 9px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('N', cx, cy - radius + 11);

    // Player Chevron in Center
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.moveTo(cx, cy - 5);
    ctx.lineTo(cx + 4, cy + 4);
    ctx.lineTo(cx, cy + 2);
    ctx.lineTo(cx - 4, cy + 4);
    ctx.closePath();
    ctx.fill();

    // Enemy Red Threat Pips
    const threatAngle = this._time * 0.8;
    const ex = cx + Math.cos(threatAngle) * (radius * 0.65);
    const ey = cy + Math.sin(threatAngle) * (radius * 0.65);
    ctx.fillStyle = '#ff0033';
    ctx.shadowColor = '#ff0033';
    ctx.shadowBlur = 6;
    ctx.beginPath();
    ctx.arc(ex, ey, 3, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  _renderActionAbilityDiamonds(ctx, state, startX, cy) {
    ctx.save();
    const abilities = [
      { label: 'ADAPT', key: 'Q', active: state.powerUnlocked },
      { label: 'DODGE', key: 'SPACE', active: true },
      { label: 'FOCUS', key: 'R', active: true },
    ];

    abilities.forEach((ab, i) => {
      const x = startX + i * 75;
      const pulse = ab.active ? Math.sin(this._time * 4 + i) * 2 : 0;

      // Hexagon / Diamond Card
      ctx.fillStyle = 'rgba(10, 16, 28, 0.85)';
      ctx.strokeStyle = ab.active ? '#00f3ff' : '#4b5563';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(x, cy, 22 + pulse, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Icon/Text
      ctx.fillStyle = ab.active ? '#00f3ff' : '#9ca3af';
      ctx.font = 'bold 9px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(ab.label, x, cy - 2);

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 8px monospace';
      ctx.fillText(ab.key, x, cy + 10);
    });

    ctx.restore();
  }

  _renderAimReticle(ctx, cx, cy) {
    ctx.save();
    ctx.strokeStyle = 'rgba(0, 243, 255, 0.5)';
    ctx.lineWidth = 1.2;

    // Small Center Dot
    ctx.fillStyle = 'rgba(0, 243, 255, 0.8)';
    ctx.beginPath();
    ctx.arc(cx, cy, 2, 0, Math.PI * 2);
    ctx.fill();

    // 4 Corner Aim Brackets
    const size = 12;
    const gap = 8;
    ctx.beginPath();
    // Top-left
    ctx.moveTo(cx - gap - size, cy - gap); ctx.lineTo(cx - gap, cy - gap); ctx.lineTo(cx - gap, cy - gap - size);
    // Top-right
    ctx.moveTo(cx + gap + size, cy - gap); ctx.lineTo(cx + gap, cy - gap); ctx.lineTo(cx + gap, cy - gap - size);
    // Bottom-left
    ctx.moveTo(cx - gap - size, cy + gap); ctx.lineTo(cx - gap, cy + gap); ctx.lineTo(cx - gap, cy + gap + size);
    // Bottom-right
    ctx.moveTo(cx + gap + size, cy + gap); ctx.lineTo(cx + gap, cy + gap); ctx.lineTo(cx + gap, cy + gap + size);
    ctx.stroke();

    ctx.restore();
  }
}

export const cyberHUD = new CyberHUD();
