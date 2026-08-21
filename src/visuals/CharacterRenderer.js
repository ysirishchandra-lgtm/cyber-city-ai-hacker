/**
 * SCAR — THE LAST CHOICE
 * CharacterRenderer.js — Visual Rendering of Player, Enemies, and Hero (Atlas)
 * Author: Ashwidha (Visual / UI / Cinematic Lead)
 */

import { POWER_PATH } from '../core/GameState.js';

export class CharacterRenderer {
  constructor() {
    this._time = 0;
  }

  update(dt) {
    this._time += dt;
  }

  // ─── Render Player ─────────────────────────────────────────────────────────

  renderPlayer(ctx, player, state) {
    if (!player) return;
    const { x, y, facingAngle = 0, isAttacking, stamina = 100 } = player;

    ctx.save();
    ctx.translate(x, y);

    // 1. Ground Drop Shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.55)';
    ctx.beginPath();
    ctx.ellipse(0, 14, 18, 8, 0, 0, Math.PI * 2);
    ctx.fill();

    // 2. Power Awakening Aura (if unlocked)
    if (state && state.powerUnlocked) {
      const powerColor = {
        [POWER_PATH.AGGRESSIVE]: '#ff2200',
        [POWER_PATH.PROTECTIVE]: '#0099ff',
        [POWER_PATH.STRATEGIC]: '#00ff88',
      }[state.powerPath] || '#00f3ff';

      const auraPulse = Math.sin(this._time * 6) * 3;
      ctx.save();
      ctx.strokeStyle = powerColor;
      ctx.lineWidth = 2;
      ctx.shadowColor = powerColor;
      ctx.shadowBlur = 16;
      ctx.beginPath();
      ctx.arc(0, 0, 24 + auraPulse, 0, Math.PI * 2);
      ctx.stroke();

      // Energy particles around player
      for (let i = 0; i < 3; i++) {
        const pAngle = this._time * 4 + (i * Math.PI * 2 / 3);
        const px = Math.cos(pAngle) * (20 + auraPulse);
        const py = Math.sin(pAngle) * (20 + auraPulse);
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(px, py, 2, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }

    // 3. Player Body & Trenchcoat (Rotate facing direction)
    ctx.rotate(facingAngle);

    // Trenchcoat Cape/Back
    ctx.fillStyle = '#10101c';
    ctx.beginPath();
    ctx.moveTo(-10, -10);
    ctx.lineTo(8, -12);
    ctx.lineTo(12, 0);
    ctx.lineTo(8, 12);
    ctx.lineTo(-10, 10);
    ctx.lineTo(-14, 0);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = '#282845';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Torso Armor
    ctx.fillStyle = '#1e1e30';
    ctx.beginPath();
    ctx.arc(0, 0, 11, 0, Math.PI * 2);
    ctx.fill();

    // Head / Visor
    ctx.fillStyle = '#2a2a44';
    ctx.beginPath();
    ctx.arc(4, 0, 7, 0, Math.PI * 2);
    ctx.fill();

    // 4. The Glowing Crimson SCAR (Pulsing energy vein)
    if (state && (state.hasScar || state.powerUnlocked)) {
      ctx.save();
      const scarGlow = Math.sin(this._time * 8) * 0.3 + 0.7;
      ctx.strokeStyle = `rgba(255, 0, 50, ${scarGlow})`;
      ctx.shadowColor = '#ff0033';
      ctx.shadowBlur = 12;
      ctx.lineWidth = 2.5;

      // Jagged scar across the right eye/face
      ctx.beginPath();
      ctx.moveTo(3, -5);
      ctx.lineTo(6, -1);
      ctx.lineTo(4, 3);
      ctx.stroke();
      ctx.restore();
    }

    // Hands / Cyber Blades
    ctx.fillStyle = '#00f3ff';
    ctx.shadowColor = '#00f3ff';
    ctx.shadowBlur = isAttacking ? 16 : 4;
    ctx.beginPath();
    ctx.arc(12, -8, 3.5, 0, Math.PI * 2);
    ctx.arc(12, 8, 3.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  // ─── Render Enemies ────────────────────────────────────────────────────────

  renderEnemy(ctx, enemy) {
    if (!enemy || enemy.health <= 0) return;
    const { x, y, type, health, maxHealth = 100, inStasis } = enemy;

    ctx.save();
    ctx.translate(x, y);

    // Drop Shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
    ctx.beginPath();
    ctx.ellipse(0, 12, 16, 7, 0, 0, Math.PI * 2);
    ctx.fill();

    // Stasis Freeze Effect
    if (inStasis) {
      ctx.save();
      ctx.strokeStyle = '#00ff88';
      ctx.shadowColor = '#00ff88';
      ctx.shadowBlur = 14;
      ctx.lineWidth = 2;
      ctx.setLineDash([4, 4]);
      ctx.strokeRect(-20, -20, 40, 40);
      ctx.restore();
    }

    // Archetype Specific Rendering
    if (type === 'DRONE') {
      // Hovering Drone Body
      const hoverY = Math.sin(this._time * 8 + x) * 3;
      ctx.translate(0, hoverY);

      // Rotors
      ctx.strokeStyle = '#444466';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(-18, -12);
      ctx.lineTo(18, -12);
      ctx.moveTo(-18, 12);
      ctx.lineTo(18, 12);
      ctx.stroke();

      // Chassis
      ctx.fillStyle = '#1c1a24';
      ctx.beginPath();
      ctx.arc(0, 0, 12, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#ff0055';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Red Scanner Eye
      ctx.fillStyle = '#ff0055';
      ctx.shadowColor = '#ff0055';
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.arc(4, 0, 4, 0, Math.PI * 2);
      ctx.fill();

    } else if (type === 'ENFORCER') {
      // Armored Enforcer Body
      ctx.fillStyle = '#22202c';
      ctx.fillRect(-12, -12, 24, 24);
      ctx.strokeStyle = '#ffb700';
      ctx.lineWidth = 2;
      ctx.strokeRect(-12, -12, 24, 24);

      // Gold Tactical Visor
      ctx.fillStyle = '#ffb700';
      ctx.shadowColor = '#ffb700';
      ctx.shadowBlur = 8;
      ctx.fillRect(2, -4, 10, 8);

    } else if (type === 'STALKER') {
      // Shadow Stalker (Purple Stealth Silhouette)
      ctx.save();
      ctx.globalAlpha = 0.85;
      ctx.fillStyle = '#120824';
      ctx.strokeStyle = '#9900ff';
      ctx.shadowColor = '#9900ff';
      ctx.shadowBlur = 12;
      ctx.lineWidth = 2;

      ctx.beginPath();
      ctx.moveTo(-14, -14);
      ctx.lineTo(14, 0);
      ctx.lineTo(-14, 14);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.restore();

    } else if (type === 'SENTINEL') {
      // Heavy Mecha Sentinel
      ctx.fillStyle = '#181822';
      ctx.strokeStyle = '#ff2200';
      ctx.lineWidth = 3;
      ctx.shadowColor = '#ff2200';
      ctx.shadowBlur = 14;

      ctx.beginPath();
      ctx.arc(0, 0, 22, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Core Reactor
      ctx.fillStyle = '#ff2200';
      ctx.beginPath();
      ctx.arc(0, 0, 8, 0, Math.PI * 2);
      ctx.fill();
    }

    // Mini Health Bar above Enemy
    const hpPct = Math.max(0, health / maxHealth);
    ctx.fillStyle = '#111111';
    ctx.fillRect(-18, -26, 36, 4);
    ctx.fillStyle = hpPct > 0.4 ? '#ff2255' : '#ffaa00';
    ctx.fillRect(-18, -26, 36 * hpPct, 4);

    ctx.restore();
  }

  // ─── Render Hero (Atlas) ───────────────────────────────────────────────────

  renderHero(ctx, hero, state) {
    if (!hero || !hero.isAlive) return;
    const { x, y, health = 250, maxHealth = 250, state: heroState } = hero;

    ctx.save();
    ctx.translate(x, y);

    const isHostile = heroState === 'CONFRONT' || heroState === 'COUNTER' || state?.phase === 'FINAL_BATTLE';
    const heroColor = isHostile ? '#ff0033' : '#ffcc00';
    const floatY = Math.sin(this._time * 4) * 6;
    ctx.translate(0, floatY);

    // 1. Energy Ripple Shadow
    ctx.fillStyle = isHostile ? 'rgba(255, 0, 50, 0.2)' : 'rgba(255, 204, 0, 0.2)';
    ctx.beginPath();
    ctx.ellipse(0, 26, 28, 12, 0, 0, Math.PI * 2);
    ctx.fill();

    // 2. Majestic / Tyrant Energy Aura
    ctx.save();
    ctx.strokeStyle = heroColor;
    ctx.lineWidth = 2.5;
    ctx.shadowColor = heroColor;
    ctx.shadowBlur = 24;
    ctx.beginPath();
    ctx.arc(0, 0, 32 + Math.sin(this._time * 5) * 4, 0, Math.PI * 2);
    ctx.stroke();

    // Celestial Halo / Jagged Crown
    if (!isHostile) {
      // Golden Halo
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.ellipse(0, -28, 14, 5, 0, 0, Math.PI * 2);
      ctx.stroke();
    } else {
      // Jagged Red Lightning Orbit
      ctx.strokeStyle = '#ff0033';
      ctx.lineWidth = 1.5;
      for (let i = 0; i < 4; i++) {
        const lAngle = this._time * 6 + (i * Math.PI / 2);
        const lx = Math.cos(lAngle) * 36;
        const ly = Math.sin(lAngle) * 36;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(lx, ly);
        ctx.stroke();
      }
    }
    ctx.restore();

    // 3. Hero Armor & Cloak
    // Cloak
    ctx.fillStyle = isHostile ? '#160006' : '#222238';
    ctx.beginPath();
    ctx.moveTo(-16, -16);
    ctx.lineTo(16, -16);
    ctx.lineTo(24, 20);
    ctx.lineTo(-24, 20);
    ctx.closePath();
    ctx.fill();

    // Main Armor Body
    ctx.fillStyle = isHostile ? '#2c040e' : '#f0f4ff';
    ctx.beginPath();
    ctx.arc(0, 0, 16, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = heroColor;
    ctx.lineWidth = 2;
    ctx.stroke();

    // Golden / Red Crest
    ctx.fillStyle = heroColor;
    ctx.shadowColor = heroColor;
    ctx.shadowBlur = 14;
    ctx.beginPath();
    ctx.arc(0, 0, 6, 0, Math.PI * 2);
    ctx.fill();

    // 4. Hero Name & Boss Health Bar (if Final Battle)
    ctx.font = 'bold 13px monospace';
    ctx.textAlign = 'center';
    ctx.fillStyle = heroColor;
    ctx.shadowColor = heroColor;
    ctx.shadowBlur = 8;
    ctx.fillText('ATLAS — THE PRODIGY', 0, -42);

    if (state && state.phase === 'FINAL_BATTLE') {
      const bossHpPct = Math.max(0, health / maxHealth);
      ctx.fillStyle = '#111';
      ctx.fillRect(-45, -34, 90, 6);
      ctx.fillStyle = '#ff0033';
      ctx.fillRect(-45, -34, 90 * bossHpPct, 6);
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1;
      ctx.strokeRect(-45, -34, 90, 6);
    }

    ctx.restore();
  }
}

export const characterRenderer = new CharacterRenderer();
