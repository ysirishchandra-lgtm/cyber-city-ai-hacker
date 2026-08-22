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

    // 1. Top-Left: Player Health, Stamina & Moral Path Alignment
    this._renderPlayerStatus(ctx, state, 24, 24);

    // 2. Top-Right: Time Remaining & Mission Tracker
    this._renderTopRightStatus(ctx, missionSystem, state, w - 280, 24);

    // 3. Center Screen: Dynamic Aim Crosshair
    this._renderAimReticle(ctx, w / 2, h / 2);

    // 4. In-World Floating Objective Indicator & 3D Directional Compass Arrow
    this._renderInWorldObjective(ctx, state, w / 2, h / 2 - 60, w, h);

    // 5. Objective Confirmation Toasts
    this._renderObjectiveToast(ctx, state, w / 2, 85);

    // 6. Contextual One-Time Onboarding Prompts (Show, Don't Tell)
    this._renderContextualOnboarding(ctx, state, w, h);

    // 7. Bottom-Left: Circular Tactical Radar Minimap
    this._renderRadarMinimap(ctx, 80, h - 80, 48);

    // 8. Bottom-Right: Tactical Action Ability Diamonds (Adapt Q, Dodge Space, Focus R)
    this._renderActionAbilityDiamonds(ctx, state, w - 240, h - 70);

    // 9. Dynamic Combat & Execution Feedback
    this._renderCombatFeedback(ctx, w, h);
  }

  _renderObjectiveToast(ctx, state, cx, cy) {
    const toast = state.objectiveToast;
    if (!toast || toast.timer <= 0) return;

    ctx.save();
    const alpha = Math.min(1, toast.timer);
    ctx.globalAlpha = alpha;

    const toastW = 340;
    const toastH = 36;
    const tx = cx - toastW / 2;

    ctx.fillStyle = 'rgba(6, 15, 28, 0.92)';
    ctx.strokeStyle = '#00ff88';
    ctx.lineWidth = 2;
    ctx.shadowColor = '#00ff88';
    ctx.shadowBlur = 14;
    ctx.fillRect(tx, cy, toastW, toastH);
    ctx.strokeRect(tx, cy, toastW, toastH);

    ctx.fillStyle = '#00ff88';
    ctx.font = 'bold 13px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(toast.text, cx, cy + toastH / 2);
    ctx.restore();
  }

  _renderContextualOnboarding(ctx, state, w, h) {
    const gameplayState = typeof window !== 'undefined' ? window.__SCAR_GAMEPLAY_STATE__ : null;
    const player = gameplayState?.player;
    if (!player) return;

    let prompt = null;
    let promptColor = '#00f3ff';

    // 1. Initial Movement Prompt
    if (!state.onboarding?.movement && this._time < 7.0) {
      if (player.vx !== 0 || player.vy !== 0) {
        import('../core/GameState.js').then(({ gameState }) => gameState.markOnboardingLearned('movement'));
      } else {
        prompt = '[WASD / ARROWS] MOVE  •  [SHIFT] SPRINT';
        promptColor = '#00f3ff';
      }
    }

    // 2. Incoming Attack Dodge Prompt
    const windingEnemy = gameplayState.enemies?.find(e => e.isWindingUp);
    if (windingEnemy && !state.onboarding?.dodge) {
      prompt = '⚡ [SPACE] DODGE ROLL (INVULNERABILITY WINDOW)';
      promptColor = '#ffb700';
      if (player.isDodging) {
        import('../core/GameState.js').then(({ gameState }) => gameState.markOnboardingLearned('dodge'));
      }
    }

    // 3. Melee Attack Prompt on Enemy Proximity
    const nearbyEnemy = gameplayState.enemies?.find(e => e.isAlive && Math.hypot(e.x - player.x, e.y - player.y) < 110);
    if (nearbyEnemy && !state.onboarding?.attack && !windingEnemy) {
      prompt = '⚔️ [LEFT CLICK] 3-HIT KATANA COMBO';
      promptColor = '#00f3ff';
      if (player.isAttacking) {
        import('../core/GameState.js').then(({ gameState }) => gameState.markOnboardingLearned('attack'));
      }
    }

    // 4. Power Activation Prompt upon Awakening
    if (state.powerUnlocked && !state.onboarding?.power) {
      const powerKey = state.powerPath === POWER_PATH.AGGRESSIVE ? '[Q] DESTRUCTION NOVA' : (state.powerPath === POWER_PATH.PROTECTIVE ? '[Q] KINETIC BARRIER' : '[Q] CHRONO STASIS');
      prompt = `⚡ PRESS ${powerKey} TO ACTIVATE AWAKENED POWER`;
      promptColor = '#d946ef';
    }

    if (prompt) {
      ctx.save();
      const pulse = Math.sin(this._time * 6) * 3;
      const boxW = Math.min(520, w * 0.8);
      const boxH = 34;
      const bx = (w - boxW) / 2;
      const by = h - 130 + pulse;

      ctx.fillStyle = 'rgba(8, 12, 22, 0.9)';
      ctx.strokeStyle = promptColor;
      ctx.lineWidth = 2;
      ctx.shadowColor = promptColor;
      ctx.shadowBlur = 12;
      ctx.fillRect(bx, by, boxW, boxH);
      ctx.strokeRect(bx, by, boxW, boxH);

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 12px monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(prompt, w / 2, by + boxH / 2);
      ctx.restore();
    }
  }

  _renderCombatFeedback(ctx, w, h) {
    if (typeof window === 'undefined') return;
    const gameplayState = window.__SCAR_GAMEPLAY_STATE__;
    if (!gameplayState || !gameplayState.player) return;

    ctx.save();

    // Execution Prompt
    const lowHpEnemy = gameplayState.enemies?.find(e => e.health <= e.maxHealth * 0.28);
    if (lowHpEnemy) {
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

    // Real-Time Moral Path Alignment Badge
    const a = state.aggressiveCount || 0;
    const p = state.protectiveCount || 0;
    const s = state.strategicCount || 0;
    const total = a + p + s;
    let alignmentText = 'ALIGNMENT: NEUTRAL (POWERLESS)';
    let alignColor = '#94a3b8';

    if (total > 0) {
      if (a >= p && a >= s) {
        alignmentText = `ALIGNMENT: THE AVENGER (${Math.round((a / total) * 100)}%)`;
        alignColor = '#ff2200';
      } else if (p >= a && p >= s) {
        alignmentText = `ALIGNMENT: THE SAVIOR (${Math.round((p / total) * 100)}%)`;
        alignColor = '#00ff88';
      } else {
        alignmentText = `ALIGNMENT: THE ARBITER (${Math.round((s / total) * 100)}%)`;
        alignColor = '#00f3ff';
      }
    }

    ctx.fillStyle = alignColor;
    ctx.shadowColor = alignColor;
    ctx.shadowBlur = 6;
    ctx.font = 'bold 9px monospace';
    ctx.fillText(alignmentText, x, y + 64);

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

  _renderInWorldObjective(ctx, state, x, y, w, h) {
    ctx.save();
    const pulse = Math.sin(this._time * 5) * 3;
    const gameplayState = typeof window !== 'undefined' ? window.__SCAR_GAMEPLAY_STATE__ : null;
    const player = gameplayState?.player;
    const phase = state?.phase || 'LEVEL_1';

    let targetX = 900;
    let targetY = 350;
    let objTitle = 'INFILTRATE WAREHOUSE';

    if (phase === 'LEVEL_2') {
      targetX = 1400;
      targetY = 400;
      objTitle = 'EVADE TRANSIT PATROLS';
    } else if (phase === 'LEVEL_3' || phase === 'FINAL_BATTLE') {
      targetX = 1300;
      targetY = 480;
      objTitle = 'CONFRONT ATLAS THE PRODIGY';
    }

    let distMeters = 128;
    let isCompleted = false;
    let angleToTarget = 0;

    if (player) {
      const dx = targetX - player.x;
      const dy = targetY - player.y;
      const dist = Math.hypot(dx, dy);
      angleToTarget = Math.atan2(dy, dx);

      distMeters = Math.max(0, Math.round(dist / 5.1));
      if (dist <= 60) {
        distMeters = 0;
        isCompleted = true;
      }
    }

    // Tactical Cyan Hexagonal Visor Objective Badge
    const badgeW = 260;
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
    ctx.font = 'bold 11px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const objText = isCompleted ? `${objTitle} [0m]` : `${objTitle} [${distMeters}m]`;
    ctx.fillText(objText, x, badgeY + badgeH / 2);

    // 3D Directional Compass Needle Indicator
    ctx.save();
    ctx.translate(badgeX + badgeW - 14, badgeY + badgeH / 2);
    ctx.rotate(angleToTarget);
    ctx.fillStyle = themeColor;
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.moveTo(8, 0);
    ctx.lineTo(-5, -5);
    ctx.lineTo(-2, 0);
    ctx.lineTo(-5, 5);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

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
