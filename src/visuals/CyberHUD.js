/**
 * SCAR — THE LAST CHOICE
 * CyberHUD.js — Tactical Visor, Circular Radar Minimap & Action Badges
 * Author: Ashwidha & Sirish (Visual / Systems Integration)
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

    // Render tutorial exploration banner during CITY_EXPLORATION phase
    if (state.gamePhase === 'CITY_EXPLORATION') {
      this._renderTutorialBanner(ctx, w, h);
    }

    // 1. Top-Left: Player Health, Stamina & Focus
    this._renderPlayerStatus(ctx, state, 24, 24);

    // 2. Top-Right: Time Remaining & Mission Tracker
    this._renderTopRightStatus(ctx, missionSystem, state, w - 280, 24);

    // 3. Center Screen: Dynamic Aim Crosshair
    this._renderAimReticle(ctx, w / 2, h / 2);

    // 4. In-World Floating Objective Indicator (Center-Left) with dynamic spatial distance
    this._renderInWorldObjective(ctx, w / 2, h / 2 - 60);

    // 5. Bottom-Left: Circular Tactical Radar Minimap
    this._renderRadarMinimap(ctx, 80, h - 80, 48);

    // 6. Bottom-Right: Tactical Action Ability Diamonds (Adapt Q, Dodge Space, Focus R)
    this._renderActionAbilityDiamonds(ctx, state, w - 240, h - 70);

    // 7. Dynamic Combat & Execution Feedback
    this._renderCombatFeedback(ctx, w, h);
  }

  _renderTutorialBanner(ctx, w, h) {
    ctx.save();
    const pulse = Math.sin(this._time * 4) * 0.2 + 0.8;
    const bannerW = Math.min(740, w * 0.9);
    const bannerH = 46;
    const bx = (w - bannerW) / 2;
    const by = 20;

    ctx.fillStyle = 'rgba(5, 12, 22, 0.92)';
    ctx.strokeStyle = '#00f3ff';
    ctx.lineWidth = 1.5;
    ctx.shadowColor = '#00f3ff';
    ctx.shadowBlur = 12;
    ctx.fillRect(bx, by, bannerW, bannerH);
    ctx.strokeRect(bx, by, bannerW, bannerH);

    ctx.fillStyle = '#00f3ff';
    ctx.font = 'bold 12px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('🎓 TUTORIAL EXPLORATION: MOVE WITH WASD | SHIFT SPRINT | SPACE DODGE | LEFT CLICK ATTACK', w / 2, by + 18);

    ctx.fillStyle = '#ffb700';
    ctx.font = 'bold 11px monospace';
    ctx.fillText(`APPROACH CLUE OR CHECKPOINT & PRESS [E] TO LAUNCH CORPORATE RAID!`, w / 2, by + 34);

    ctx.restore();
  }

  _renderCombatFeedback(ctx, w, h) {
    if (typeof window === 'undefined') return;
    const gameplayState = window.__SCAR_GAMEPLAY_STATE__;
    if (!gameplayState || !gameplayState.player) return;

    ctx.save();

    // Warehouse Entrance Level 2 Trigger Prompt
    if (gameplayState.warehouseTarget?.playerAtWarehouse) {
      const pulse = Math.sin(this._time * 6) * 3;
      const btnW = 360;
      const btnH = 52;
      const bx = (w - btnW) / 2;
      const by = h / 2 + 25 + pulse;

      ctx.fillStyle = 'rgba(0, 243, 255, 0.95)';
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2.5;
      ctx.shadowColor = '#00f3ff';
      ctx.shadowBlur = 24;
      ctx.fillRect(bx, by, btnW, btnH);
      ctx.strokeRect(bx, by, btnW, btnH);

      ctx.fillStyle = '#050a14';
      ctx.font = 'bold 15px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(`🚪 PRESS [E] OR CLICK HERE TO`, w / 2, by + 22);
      ctx.fillText(`ENTER WAREHOUSE (LEVEL 2)`, w / 2, by + 40);
    } else if (lowHpEnemy) {
      const pulse = Math.sin(this._time * 8) * 4;
      ctx.fillStyle = 'rgba(255, 0, 51, 0.9)';
      ctx.shadowColor = '#ff0033';
      ctx.shadowBlur = 16;
      ctx.font = 'bold 16px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(`⚡ [E] EXECUTE ENEMY`, w / 2, h / 2 + 50 + pulse);
    }

    ctx.restore();
  }

  _renderPlayerStatus(ctx, state, x, y) {
    ctx.save();
    const hp = state.health || 100;
    const maxHp = state.maxHealth || 100;
    const hpPct = Math.max(0, Math.min(1, hp / maxHp));
    const ghostPct = Math.max(0, Math.min(1, this._ghostHealth / maxHp));

    // CYBERWARE INTEGRITY/HEALTH Label
    ctx.fillStyle = '#00f3ff';
    ctx.font = 'bold 11px monospace';
    ctx.shadowColor = '#00f3ff';
    ctx.shadowBlur = 6;
    ctx.fillText('CYBERWARE INTEGRITY/HEALTH', x, y + 10);

    // Health Bar Gauge (Cyan / Crimson Fill)
    const barW = 200;
    const barH = 8;
    ctx.fillStyle = '#0d0d18';
    ctx.fillRect(x, y + 16, barW, barH);

    // Damage Ghost Bar
    ctx.fillStyle = '#ff5555';
    ctx.fillRect(x, y + 16, barW * ghostPct, barH);

    // Active Health Fill (Vibrant Cyan/Crimson)
    ctx.fillStyle = '#00f3ff';
    ctx.shadowColor = '#00f3ff';
    ctx.shadowBlur = 8;
    ctx.fillRect(x, y + 16, barW * hpPct, barH);

    // STAMINA Label & Bar
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#e2e8f0';
    ctx.font = 'bold 10px monospace';
    ctx.fillText('STAMINA', x, y + 38);

    ctx.fillStyle = '#0d0d18';
    ctx.fillRect(x, y + 44, barW * 0.75, 6);
    ctx.fillStyle = '#ffd000';
    ctx.shadowColor = '#ffd000';
    ctx.shadowBlur = 6;
    ctx.fillRect(x, y + 44, barW * 0.75 * (state.stamina ? state.stamina / 100 : 1.0), 6);

    ctx.restore();
  }

  _renderTopRightStatus(ctx, missionSystem, state, x, y) {
    ctx.save();
    // DEADLINE TIMER Header
    ctx.textAlign = 'right';
    ctx.fillStyle = '#a0aec0';
    ctx.font = 'bold 10px monospace';
    ctx.fillText('DEADLINE TIMER', x + 250, y + 10);

    const hours = typeof state.hoursRemaining === 'number' ? state.hoursRemaining : 7;
    const mins = Math.floor((this._time * 12) % 60);
    const secs = Math.floor((this._time * 35) % 60);
    const timeStr = `${String(Math.floor(hours)).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')} / 30:00`;

    // Cyber Timer Badge Box
    ctx.fillStyle = 'rgba(6, 12, 24, 0.85)';
    ctx.strokeStyle = '#00f3ff';
    ctx.lineWidth = 1.5;
    ctx.shadowColor = '#00f3ff';
    ctx.shadowBlur = 8;
    ctx.fillRect(x + 55, y + 14, 195, 24);
    ctx.strokeRect(x + 55, y + 14, 195, 24);

    ctx.fillStyle = '#00f3ff';
    ctx.font = 'bold 15px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(timeStr, x + 152, y + 31);

    ctx.restore();
  }

  _renderInWorldObjective(ctx, x, y) {
    ctx.save();
    const pulse = Math.sin(this._time * 5) * 3;
    const gameplayState = typeof window !== 'undefined' ? window.__SCAR_GAMEPLAY_STATE__ : null;

    let distMeters = 128;
    let isCompleted = false;

    if (gameplayState && gameplayState.player) {
      const targetX = (gameplayState.warehouseTarget && gameplayState.warehouseTarget.x) || 900;
      const targetY = (gameplayState.warehouseTarget && gameplayState.warehouseTarget.y) || 350;
      const targetRadius = (gameplayState.warehouseTarget && gameplayState.warehouseTarget.radius) || 50;

      const px = gameplayState.player.x;
      const py = gameplayState.player.y;
      const dist = Math.hypot(targetX - px, targetY - py);

      // Scaled so starting dist (~701px) translates to ~128m down to 0m at <= 50px radius
      distMeters = Math.max(0, Math.round((dist - targetRadius) / 5.1));
      if (dist <= targetRadius || gameplayState.warehouseTarget?.completed) {
        distMeters = 0;
        isCompleted = true;
      }
    }

    // Tactical Cyan Hexagonal Visor Objective Badge: REACH THE WAREHOUSE [128m]
    const badgeW = 220;
    const badgeH = 28;
    const badgeX = x - badgeW / 2;
    const badgeY = y - 30;

    const themeColor = isCompleted ? '#00ff88' : '#00f3ff';

    // Badge Frame
    ctx.fillStyle = 'rgba(6, 12, 22, 0.88)';
    ctx.strokeStyle = themeColor;
    ctx.lineWidth = 1.5;
    ctx.shadowColor = themeColor;
    ctx.shadowBlur = 10;

    ctx.beginPath();
    ctx.moveTo(badgeX - 10, badgeY + badgeH / 2);
    ctx.lineTo(badgeX, badgeY);
    ctx.lineTo(badgeX + badgeW, badgeY);
    ctx.lineTo(badgeX + badgeW + 10, badgeY + badgeH / 2);
    ctx.lineTo(badgeX + badgeW, badgeY + badgeH);
    ctx.lineTo(badgeX, badgeY + badgeH);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Objective Text
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 12px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const objText = isCompleted ? 'WAREHOUSE REACHED [0m]' : `REACH THE WAREHOUSE [${distMeters}m]`;
    ctx.fillText(objText, x, badgeY + badgeH / 2);

    // Floating Downward Diamond Pointer
    ctx.fillStyle = themeColor;
    ctx.shadowBlur = 12;
    ctx.beginPath();
    ctx.moveTo(x, badgeY + badgeH + 6 + pulse * 0.5);
    ctx.lineTo(x + 5, badgeY + badgeH + 12 + pulse * 0.5);
    ctx.lineTo(x, badgeY + badgeH + 18 + pulse * 0.5);
    ctx.lineTo(x - 5, badgeY + badgeH + 12 + pulse * 0.5);
    ctx.closePath();
    ctx.fill();

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
    ctx.moveTo(cx, cy - radius); ctx.lineTo(cx + radius, cy);
    ctx.stroke();

    // North Indicator
    ctx.fillStyle = '#00f3ff';
    ctx.font = 'bold 9px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('N', cx, cy - radius + 11);

    // Player Chevron in Center
    const gameplayState = typeof window !== 'undefined' ? window.__SCAR_GAMEPLAY_STATE__ : null;
    const playerAngle = (gameplayState?.player?.facingAngle) || 0;

    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(playerAngle);
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.moveTo(0, -6);
    ctx.lineTo(5, 5);
    ctx.lineTo(0, 2);
    ctx.lineTo(-5, 5);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    // Warehouse Objective Beacon Blip on Radar
    if (gameplayState && gameplayState.player) {
      const targetX = 900;
      const targetY = 350;
      const dx = targetX - gameplayState.player.x;
      const dy = targetY - gameplayState.player.y;
      const radarScale = 0.045;
      const rx = Math.max(-radius + 6, Math.min(radius - 6, dx * radarScale));
      const ry = Math.max(-radius + 6, Math.min(radius - 6, dy * radarScale));

      ctx.fillStyle = gameplayState.warehouseTarget?.completed ? '#00ff88' : '#00f3ff';
      ctx.shadowColor = ctx.fillStyle;
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.arc(cx + rx, cy + ry, 3.5, 0, Math.PI * 2);
      ctx.fill();
    }

    // Enemy Red Threat Pips
    if (gameplayState && gameplayState.enemies && gameplayState.player) {
      gameplayState.enemies.forEach(en => {
        const dx = en.x - gameplayState.player.x;
        const dy = en.y - gameplayState.player.y;
        const rx = dx * 0.045;
        const ry = dy * 0.045;
        if (Math.hypot(rx, ry) < radius - 4) {
          ctx.fillStyle = '#ff0033';
          ctx.shadowColor = '#ff0033';
          ctx.shadowBlur = 6;
          ctx.beginPath();
          ctx.arc(cx + rx, cy + ry, 2.5, 0, Math.PI * 2);
          ctx.fill();
        }
      });
    }

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

      ctx.fillStyle = 'rgba(10, 16, 28, 0.85)';
      ctx.strokeStyle = ab.active ? '#00f3ff' : '#4b5563';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(x, cy, 22 + pulse, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

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
