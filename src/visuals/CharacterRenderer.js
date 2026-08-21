/**
 * SCAR — THE LAST CHOICE
 * CharacterRenderer.js — Humanoid 3rd-Person Character & Entity Presentation
 * Author: Ashwidha (Visual / UI / Cinematic Lead)
 *
 * Renders full humanoid protagonist with locomotion stride cycles, billowing trenchcoat physics,
 * glowing crimson scar, weapon combo arcs, and distinct humanoid / mech enemy models.
 */

import { POWER_PATH } from '../core/GameState.js';

export class CharacterRenderer {
  constructor() {
    this._time = 0;
    this.trailHistory = [];
  }

  update(dt) {
    this._time += dt;

    // Prune sprint trail history
    this.trailHistory = this.trailHistory.filter(t => {
      t.life -= dt;
      return t.life > 0;
    });
  }

  // ─── Render Humanoid Protagonist ──────────────────────────────────────────

  renderPlayer(ctx, player, state) {
    if (!player) return;
    const {
      x,
      y,
      vx = 0,
      vy = 0,
      facingAngle = 0,
      isMoving = false,
      isSprinting = false,
      isAttacking = false,
      attackAnimationTimer = 0,
      stamina = 100
    } = player;

    const speed = Math.hypot(vx, vy);
    const isMovingActual = isMoving || speed > 10;
    const strideFreq = isSprinting ? 16 : isMovingActual ? 10 : 0;
    const stridePhase = Math.sin(this._time * strideFreq);
    const coatFlutter = Math.sin(this._time * 12 + (speed * 0.05)) * (isSprinting ? 8 : 4);

    // 1. Record Sprint Motion Blur Ghost Trails
    if (isSprinting && Math.random() < 0.35) {
      this.trailHistory.push({
        x,
        y,
        angle: facingAngle,
        life: 0.18,
        maxLife: 0.18,
        color: state?.powerUnlocked ? this._getPowerColor(state.powerPath) : 'rgba(0, 243, 255, 0.4)'
      });
    }

    // Render Ghost Trails
    for (const trail of this.trailHistory) {
      const alpha = (trail.life / trail.maxLife) * 0.4;
      ctx.save();
      ctx.translate(trail.x, trail.y);
      ctx.rotate(trail.angle);
      ctx.fillStyle = trail.color;
      ctx.globalAlpha = alpha;
      ctx.beginPath();
      ctx.ellipse(0, 0, 14, 8, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    ctx.save();
    ctx.translate(x, y);

    // 2. Realistic Ground Drop Shadow (Oval with soft blur)
    ctx.save();
    ctx.fillStyle = 'rgba(0, 0, 0, 0.65)';
    ctx.beginPath();
    ctx.ellipse(0, 16, 18 + (isSprinting ? 6 : 0), 8, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // 3. Power Awakening Ambient Aura (if unlocked)
    if (state && state.powerUnlocked) {
      const powerColor = this._getPowerColor(state.powerPath);
      const auraPulse = Math.sin(this._time * 6) * 4;

      ctx.save();
      ctx.strokeStyle = powerColor;
      ctx.lineWidth = 2.5;
      ctx.shadowColor = powerColor;
      ctx.shadowBlur = 18;
      ctx.beginPath();
      ctx.arc(0, 0, 26 + auraPulse, 0, Math.PI * 2);
      ctx.stroke();

      // Orbiting energy particles
      for (let i = 0; i < 4; i++) {
        const pAngle = this._time * 3.5 + (i * Math.PI / 2);
        const px = Math.cos(pAngle) * (22 + auraPulse);
        const py = Math.sin(pAngle) * (22 + auraPulse);
        ctx.fillStyle = '#ffffff';
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.arc(px, py, 2.5, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }

    // 4. Rotate to Facing / Aiming Direction
    ctx.rotate(facingAngle);

    // ─── Humanoid Body Components ───────────────────────────────────────────

    // A. Animated Legs & Boots (Stride Cycle)
    ctx.save();
    const legOffset1 = stridePhase * (isSprinting ? 9 : 6);
    const legOffset2 = -stridePhase * (isSprinting ? 9 : 6);

    // Left Leg
    ctx.fillStyle = '#121220';
    ctx.beginPath();
    ctx.roundRect(-8 + legOffset1, -12, 10, 6, 3);
    ctx.fill();
    // Left Boot
    ctx.fillStyle = '#222238';
    ctx.fillRect(-8 + legOffset1 + 4, -13, 6, 8);

    // Right Leg
    ctx.fillStyle = '#121220';
    ctx.beginPath();
    ctx.roundRect(-8 + legOffset2, 6, 10, 6, 3);
    ctx.fill();
    // Right Boot
    ctx.fillStyle = '#222238';
    ctx.fillRect(-8 + legOffset2 + 4, 5, 6, 8);
    ctx.restore();

    // B. Flowing Cyber Trenchcoat (Dynamic Tail Physics)
    ctx.save();
    ctx.fillStyle = '#0c0c16';
    ctx.strokeStyle = '#22223a';
    ctx.lineWidth = 1.5;

    ctx.beginPath();
    ctx.moveTo(-6, -10);
    ctx.lineTo(8, -12);
    ctx.lineTo(12, 0);
    ctx.lineTo(8, 12);
    ctx.lineTo(-6, 10);
    // Billowing coat tails stretching backwards
    const coatStretch = isSprinting ? -22 : -16;
    ctx.quadraticCurveTo(-14, coatFlutter, coatStretch, coatFlutter * 1.5);
    ctx.quadraticCurveTo(-14, -coatFlutter, -6, -10);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();

    // C. Armored Torso with Collar
    ctx.save();
    ctx.fillStyle = '#1c1c2e';
    ctx.strokeStyle = '#00f3ff';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(-7, -9, 15, 18, 4);
    ctx.fill();
    ctx.stroke();

    // Cyber Chest Core / Harness
    ctx.fillStyle = '#0e0e18';
    ctx.fillRect(-3, -5, 7, 10);
    ctx.restore();

    // D. Left Arm & Tactical Glove
    ctx.save();
    ctx.fillStyle = '#1c1c2e';
    ctx.beginPath();
    ctx.arc(2, -11, 4.5, 0, Math.PI * 2);
    ctx.fill();
    // Left Hand (Guarding or natural swing)
    ctx.fillStyle = '#00f3ff';
    ctx.beginPath();
    ctx.arc(6 - stridePhase * 3, -11, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // E. Right Arm & Energized Weapon Hand
    ctx.save();
    ctx.fillStyle = '#1c1c2e';
    ctx.beginPath();
    ctx.arc(2, 11, 4.5, 0, Math.PI * 2);
    ctx.fill();

    // Cyber Weapon Blade / Katana in Right Hand
    const bladeColor = state?.powerUnlocked ? this._getPowerColor(state.powerPath) : '#00f3ff';
    const bladeReach = isAttacking ? 28 : 16;

    // Right Hand
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(8 + stridePhase * 3, 11, 3.5, 0, Math.PI * 2);
    ctx.fill();

    // Energy Blade
    ctx.strokeStyle = bladeColor;
    ctx.shadowColor = bladeColor;
    ctx.shadowBlur = isAttacking ? 18 : 6;
    ctx.lineWidth = isAttacking ? 3.5 : 2;
    ctx.beginPath();
    ctx.moveTo(8 + stridePhase * 3, 11);
    ctx.lineTo(8 + stridePhase * 3 + bladeReach, 11);
    ctx.stroke();
    ctx.restore();

    // F. Head, Cyber Visor & THE GLOWING CRIMSON SCAR
    ctx.save();
    // Head / Hair Silhouette
    ctx.fillStyle = '#2d2d48';
    ctx.beginPath();
    ctx.arc(4, 0, 7.5, 0, Math.PI * 2);
    ctx.fill();

    // Cyber Visor / Optical Eye
    ctx.fillStyle = '#00f3ff';
    ctx.shadowColor = '#00f3ff';
    ctx.shadowBlur = 8;
    ctx.fillRect(7, -3, 3.5, 6);

    // 5. THE SCAR: A deep, pulsing crimson energy wound across the right eye/face
    if (state && (state.hasScar || state.powerUnlocked)) {
      ctx.save();
      const scarPulse = Math.sin(this._time * 8) * 0.35 + 0.65;
      ctx.strokeStyle = `rgba(255, 0, 40, ${scarPulse})`;
      ctx.shadowColor = '#ff0033';
      ctx.shadowBlur = 14;
      ctx.lineWidth = 2.5;

      ctx.beginPath();
      ctx.moveTo(2, -6);
      ctx.lineTo(6, -2);
      ctx.lineTo(4, 4);
      ctx.stroke();

      // Spark bleed from scar
      if (Math.random() < 0.25) {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(5 + (Math.random() * 4 - 2), -2 + (Math.random() * 4 - 2), 2, 2);
      }
      ctx.restore();
    }
    ctx.restore();

    // 6. Dynamic Attack Arc & Slash Trail
    if (isAttacking) {
      ctx.save();
      const slashColor = state?.powerUnlocked ? this._getPowerColor(state.powerPath) : 'rgba(0, 243, 255, 0.8)';
      ctx.strokeStyle = slashColor;
      ctx.shadowColor = slashColor;
      ctx.shadowBlur = 22;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(6, 0, 36, -Math.PI * 0.45, Math.PI * 0.45);
      ctx.stroke();

      // Inner cutting ribbon
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(6, 0, 36, -Math.PI * 0.3, Math.PI * 0.3);
      ctx.stroke();
      ctx.restore();
    }

    ctx.restore();
  }

  // ─── Render Visible Humanoid & Mech Enemies ──────────────────────────────

  renderEnemy(ctx, enemy) {
    if (!enemy || enemy.health <= 0) return;
    const { x, y, type, health, maxHealth = 100, inStasis } = enemy;

    ctx.save();
    ctx.translate(x, y);

    // Ground Drop Shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    ctx.beginPath();
    ctx.ellipse(0, 16, 20, 9, 0, 0, Math.PI * 2);
    ctx.fill();

    // Stasis Grid Freeze FX
    if (inStasis) {
      ctx.save();
      ctx.strokeStyle = '#00ff88';
      ctx.shadowColor = '#00ff88';
      ctx.shadowBlur = 16;
      ctx.lineWidth = 2.5;
      ctx.setLineDash([6, 4]);
      ctx.strokeRect(-22, -22, 44, 44);
      ctx.restore();
    }

    if (type === 'DRONE') {
      // ─── DRONE: 3D Hovering Quad-Copter Mech ──────────────────────────────
      const hoverY = Math.sin(this._time * 7 + x * 0.1) * 4;
      ctx.translate(0, hoverY);

      // Red Targeting Ground Spotlight
      ctx.save();
      const spotGrad = ctx.createRadialGradient(8, 0, 2, 16, 0, 35);
      spotGrad.addColorStop(0, 'rgba(255, 0, 85, 0.35)');
      spotGrad.addColorStop(1, 'rgba(255, 0, 85, 0)');
      ctx.fillStyle = spotGrad;
      ctx.beginPath();
      ctx.arc(16, 0, 35, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // 4 Carbon-Fiber Rotor Arms & Spinning Blades
      ctx.strokeStyle = '#333348';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(-16, -14); ctx.lineTo(16, 14);
      ctx.moveTo(-16, 14); ctx.lineTo(16, -14);
      ctx.stroke();

      // Spinning Rotor Discs
      const rotorBlur = Math.sin(this._time * 25) * 5;
      ctx.fillStyle = 'rgba(0, 243, 255, 0.3)';
      [[-16, -14], [16, 14], [-16, 14], [16, -14]].forEach(([rx, ry]) => {
        ctx.beginPath();
        ctx.ellipse(rx, ry, 7 + rotorBlur, 3, 0, 0, Math.PI * 2);
        ctx.fill();
      });

      // Armored Chassis
      ctx.fillStyle = '#141420';
      ctx.beginPath();
      ctx.roundRect(-10, -10, 20, 20, 4);
      ctx.fill();
      ctx.strokeStyle = '#ff0055';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Pulsing Ocular Sensor
      ctx.fillStyle = '#ff0055';
      ctx.shadowColor = '#ff0055';
      ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.arc(4, 0, 4.5, 0, Math.PI * 2);
      ctx.fill();

    } else if (type === 'ENFORCER') {
      // ─── ENFORCER: Heavy Armored SWAT Humanoid ────────────────────────────
      const stride = Math.sin(this._time * 9) * 4;

      // Heavy Armored Legs
      ctx.fillStyle = '#181824';
      ctx.fillRect(-8 + stride, -10, 8, 6);
      ctx.fillRect(-8 - stride, 4, 8, 6);

      // Heavy Body Torso & Tactical Armor
      ctx.fillStyle = '#222232';
      ctx.strokeStyle = '#ffb700';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(-10, -12, 20, 24, 4);
      ctx.fill();
      ctx.stroke();

      // Riot Shield on Left Arm
      ctx.fillStyle = '#10101c';
      ctx.strokeStyle = '#00f3ff';
      ctx.lineWidth = 2.5;
      ctx.shadowColor = '#00f3ff';
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.roundRect(8, -14, 6, 28, 2);
      ctx.fill();
      ctx.stroke();

      // Shock Baton on Right Arm
      ctx.strokeStyle = '#ffb700';
      ctx.shadowColor = '#ffb700';
      ctx.shadowBlur = 10;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(-4, 12);
      ctx.lineTo(14, 16);
      ctx.stroke();

      // Helmet & Amber Tactical Visor
      ctx.fillStyle = '#323246';
      ctx.beginPath();
      ctx.arc(2, 0, 7, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#ffb700';
      ctx.fillRect(4, -3, 4, 6);

    } else if (type === 'STALKER') {
      // ─── STALKER: Slender Cyber-Ninja Humanoid ────────────────────────────
      ctx.save();
      ctx.globalAlpha = 0.9;

      // Low Crouched Stance
      ctx.fillStyle = '#0e041a';
      ctx.strokeStyle = '#9900ff';
      ctx.shadowColor = '#9900ff';
      ctx.shadowBlur = 14;
      ctx.lineWidth = 2;

      ctx.beginPath();
      ctx.moveTo(-12, -10);
      ctx.lineTo(12, 0);
      ctx.lineTo(-12, 10);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Dual Reverse-Grip Ultraviolet Blades
      ctx.strokeStyle = '#d946ef';
      ctx.shadowColor = '#d946ef';
      ctx.shadowBlur = 12;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(6, -8); ctx.lineTo(-14, -14);
      ctx.moveTo(6, 8); ctx.lineTo(-14, 14);
      ctx.stroke();

      ctx.restore();

    } else if (type === 'SENTINEL') {
      // ─── SENTINEL: Heavy Bipedal Combat Mech ──────────────────────────────
      // Heavy Articulated Hydraulic Legs
      const mechStep = Math.sin(this._time * 6) * 5;
      ctx.fillStyle = '#101018';
      ctx.fillRect(-16 + mechStep, -16, 12, 8);
      ctx.fillRect(-16 - mechStep, 8, 12, 8);

      // Heavy Reinforced Chassis
      ctx.fillStyle = '#1a1a28';
      ctx.strokeStyle = '#ff2200';
      ctx.lineWidth = 3;
      ctx.shadowColor = '#ff2200';
      ctx.shadowBlur = 16;
      ctx.beginPath();
      ctx.roundRect(-14, -14, 28, 28, 6);
      ctx.fill();
      ctx.stroke();

      // Twin Gatling Cannons
      ctx.fillStyle = '#0a0a10';
      ctx.fillRect(8, -12, 18, 5);
      ctx.fillRect(8, 7, 18, 5);

      // Glowing Reactor Core
      ctx.fillStyle = '#ff2200';
      ctx.beginPath();
      ctx.arc(0, 0, 8, 0, Math.PI * 2);
      ctx.fill();
    }

    // Mini Health Bar above Enemy
    const hpPct = Math.max(0, health / maxHealth);
    ctx.fillStyle = '#090910';
    ctx.fillRect(-18, -26, 36, 4);
    ctx.fillStyle = hpPct > 0.4 ? '#ff2255' : '#ffaa00';
    ctx.fillRect(-18, -26, 36 * hpPct, 4);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.lineWidth = 0.5;
    ctx.strokeRect(-18, -26, 36, 4);

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

    // 1. Telekinetic Energy Ripple Ground Shadow
    ctx.fillStyle = isHostile ? 'rgba(255, 0, 50, 0.25)' : 'rgba(255, 204, 0, 0.25)';
    ctx.beginPath();
    ctx.ellipse(0, 26, 32, 14, 0, 0, Math.PI * 2);
    ctx.fill();

    // 2. Majestic / Tyrant Energy Aura
    ctx.save();
    ctx.strokeStyle = heroColor;
    ctx.lineWidth = 2.5;
    ctx.shadowColor = heroColor;
    ctx.shadowBlur = 26;
    ctx.beginPath();
    ctx.arc(0, 0, 34 + Math.sin(this._time * 5) * 4, 0, Math.PI * 2);
    ctx.stroke();

    if (!isHostile) {
      // Golden Celestial Halo
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.95)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.ellipse(0, -32, 16, 6, 0, 0, Math.PI * 2);
      ctx.stroke();
    } else {
      // Tyrant Jagged Lightning Bolts
      ctx.strokeStyle = '#ff0033';
      ctx.lineWidth = 2;
      for (let i = 0; i < 5; i++) {
        const lAngle = this._time * 5 + (i * Math.PI * 2 / 5);
        const lx = Math.cos(lAngle) * 40;
        const ly = Math.sin(lAngle) * 40;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(lx, ly);
        ctx.stroke();
      }
    }
    ctx.restore();

    // 3. Regal Cloak & High-Collared Armor
    ctx.fillStyle = isHostile ? '#1a0008' : '#22223a';
    ctx.beginPath();
    ctx.moveTo(-18, -18);
    ctx.lineTo(18, -18);
    ctx.lineTo(26, 24);
    ctx.lineTo(-26, 24);
    ctx.closePath();
    ctx.fill();

    // Main Armor Body
    ctx.fillStyle = isHostile ? '#320412' : '#f0f4ff';
    ctx.beginPath();
    ctx.arc(0, 0, 16, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = heroColor;
    ctx.lineWidth = 2;
    ctx.stroke();

    // Crest
    ctx.fillStyle = heroColor;
    ctx.shadowColor = heroColor;
    ctx.shadowBlur = 14;
    ctx.beginPath();
    ctx.arc(0, 0, 7, 0, Math.PI * 2);
    ctx.fill();

    // 4. Boss Name & Health Bar (in Final Battle)
    ctx.font = 'bold 13px monospace';
    ctx.textAlign = 'center';
    ctx.fillStyle = heroColor;
    ctx.shadowColor = heroColor;
    ctx.shadowBlur = 10;
    ctx.fillText('ATLAS — THE PRODIGY', 0, -44);

    if (state && state.phase === 'FINAL_BATTLE') {
      const bossHpPct = Math.max(0, health / maxHealth);
      ctx.fillStyle = '#0d0d16';
      ctx.fillRect(-50, -36, 100, 7);
      ctx.fillStyle = '#ff0033';
      ctx.fillRect(-50, -36, 100 * bossHpPct, 7);
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1;
      ctx.strokeRect(-50, -36, 100, 7);
    }

    ctx.restore();
  }

  _getPowerColor(powerPath) {
    switch (powerPath) {
      case POWER_PATH.AGGRESSIVE:
        return '#ff2200';
      case POWER_PATH.PROTECTIVE:
        return '#0099ff';
      case POWER_PATH.STRATEGIC:
        return '#00ff88';
      default:
        return '#00f3ff';
    }
  }
}

export const characterRenderer = new CharacterRenderer();
