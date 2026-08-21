/**
 * SCAR — THE LAST CHOICE
 * CharacterRenderer.js — Fluid Humanoid Combat Animations, Stride Physics & Enemy Models
 * Author: Ashwidha & Sirish (Visual / Systems Integration)
 *
 * Implements fully animated human cyberpunk protagonist wearing tactical jacket, combat pants,
 * and boots with soft contact shadow, fluid 8-way locomotion, and 3-hit combo katana strikes.
 */

import { POWER_PATH } from '../core/GameState.js';
import { audioEngine } from './AudioEngine.js';
import { particleSystem } from './ParticleSystem.js';

export class CharacterRenderer {
  constructor() {
    this._time = 0;
    this.trailHistory = [];
    this.lastAttacking = false;
    this.comboStep = 0;
    this.lastHealth = 100;
  }

  update(dt) {
    this._time += dt;

    // Prune sprint & dodge trail history
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
      sprintDodgeTimer = 0,
      dodgeTimer = 0,
      stridePhase: externalStridePhase,
      strideTime: externalStrideTime,
      health = 100,
      stamina = 100
    } = player;

    const activeDodgeTimer = sprintDodgeTimer || dodgeTimer || 0;
    const isDodging = activeDodgeTimer > 0;

    // Audio & Combat Reaction triggers
    if (isAttacking && !this.lastAttacking) {
      this.comboStep = (this.comboStep + 1) % 3;
      audioEngine.playSlash();
    }
    this.lastAttacking = isAttacking;

    if (health < this.lastHealth) {
      audioEngine.playHurt();
      particleSystem.spawnBloodSpark(x, y);
    }
    this.lastHealth = health;

    const speed = Math.hypot(vx, vy);
    const isMovingActual = isMoving || speed > 10;
    const strideFreq = isSprinting ? 16.0 : (isMovingActual ? 10.5 : 0);
    const animTime = externalStrideTime !== undefined ? externalStrideTime : this._time;
    const stridePhase = externalStridePhase !== undefined ? externalStridePhase : Math.sin(animTime * strideFreq);
    const idleBreath = isMovingActual ? 0 : Math.sin(this._time * 3.5) * 1.2;
    const coatFlutter = Math.sin(this._time * 14 + (speed * 0.05)) * (isSprinting ? 10 : (isMovingActual ? 5 : 1.5));

    // 1. Record Sprint & Dodge Blur Trails
    if ((isSprinting || isDodging) && Math.random() < 0.45) {
      this.trailHistory.push({
        x,
        y,
        angle: facingAngle,
        life: 0.22,
        maxLife: 0.22,
        isDodging,
        color: state?.powerUnlocked ? this._getPowerColor(state.powerPath) : 'rgba(0, 243, 255, 0.45)'
      });

      if (isDodging && Math.random() < 0.35) {
        particleSystem.spawnDashTrail(x, y, facingAngle, '#00f3ff');
      }
    }

    // Render Ghost Motion Blur Trails
    for (const trail of this.trailHistory) {
      const alpha = (trail.life / trail.maxLife) * 0.4;
      ctx.save();
      ctx.translate(trail.x, trail.y);
      ctx.rotate(trail.angle);
      ctx.fillStyle = trail.color;
      ctx.globalAlpha = alpha;
      ctx.beginPath();
      ctx.ellipse(0, 0, 18, 10, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    ctx.save();
    ctx.translate(x, y);

    // 2. Dynamic Soft Contact Ground Shadow (Accurately follows movement)
    ctx.save();
    const shadowStretchX = 18 + (isSprinting ? 8 : (isMovingActual ? 4 : 0));
    const shadowStretchY = 10 + (isMovingActual ? 2 : 0);
    const shadowAlpha = isDodging ? 0.35 : 0.72;

    const shadowGrad = ctx.createRadialGradient(0, 2, 2, 0, 2, shadowStretchX);
    shadowGrad.addColorStop(0, `rgba(0, 0, 0, ${shadowAlpha})`);
    shadowGrad.addColorStop(0.5, `rgba(0, 0, 0, ${shadowAlpha * 0.5})`);
    shadowGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');

    ctx.fillStyle = shadowGrad;
    ctx.beginPath();
    ctx.ellipse(0, 2, shadowStretchX, shadowStretchY, 0, 0, Math.PI * 2);
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

      // Orbiting energy sparks
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

    // 4. Rotate Facing Direction (Smooth Slerp Rotation)
    ctx.rotate(facingAngle);

    // Dodge Roll Airborne Tumble Rotation
    if (isDodging) {
      const rollProgress = 1 - (activeDodgeTimer / 0.35);
      const rollAngle = rollProgress * Math.PI * 2;
      ctx.rotate(rollAngle);
      // Lift character slightly in pseudo-3D roll height
      const rollHeight = Math.sin(rollProgress * Math.PI) * 10;
      ctx.translate(0, -rollHeight);
    }

    // ─── Humanoid Body Components (Tactical Cyberpunk Protagonist) ──────────

    // A. Animated Combat Pants & Boots (8-Way Stride Cycle)
    ctx.save();
    const legSwing = stridePhase * (isSprinting ? 10 : (isMovingActual ? 6.5 : 0));
    const leftLegOffset = legSwing;
    const rightLegOffset = -legSwing;

    // Left Cargo Leg (Combat Pants)
    ctx.fillStyle = '#141624';
    ctx.beginPath();
    ctx.roundRect(-9 + leftLegOffset, -13, 11, 7, 3);
    ctx.fill();
    // Left Knee Armor Plate
    ctx.fillStyle = '#22253a';
    ctx.fillRect(-6 + leftLegOffset, -14, 4, 3);
    // Left Combat Boot
    ctx.fillStyle = '#282b40';
    ctx.fillRect(-9 + leftLegOffset + 5, -14, 6, 8);
    // Cyan Boot Sole Tread Accent
    ctx.fillStyle = '#00f3ff';
    ctx.fillRect(-9 + leftLegOffset + 9, -13, 2, 6);

    // Right Cargo Leg (Combat Pants)
    ctx.fillStyle = '#141624';
    ctx.beginPath();
    ctx.roundRect(-9 + rightLegOffset, 6, 11, 7, 3);
    ctx.fill();
    // Right Knee Armor Plate
    ctx.fillStyle = '#22253a';
    ctx.fillRect(-6 + rightLegOffset, 11, 4, 3);
    // Right Combat Boot
    ctx.fillStyle = '#282b40';
    ctx.fillRect(-9 + rightLegOffset + 5, 6, 6, 8);
    // Cyan Boot Sole Tread Accent
    ctx.fillStyle = '#00f3ff';
    ctx.fillRect(-9 + rightLegOffset + 9, 7, 2, 6);
    ctx.restore();

    // B. Tactical Cyberpunk Trenchcoat / Jacket (Dynamic Flowing Tails)
    ctx.save();
    ctx.fillStyle = '#0e101c';
    ctx.strokeStyle = '#1e2238';
    ctx.lineWidth = 1.5;

    ctx.beginPath();
    ctx.moveTo(-6, -11);
    ctx.lineTo(9, -13);
    ctx.lineTo(13, 0);
    ctx.lineTo(9, 13);
    ctx.lineTo(-6, 11);
    const coatStretch = isSprinting ? -26 : (isMovingActual ? -18 : -12);
    ctx.quadraticCurveTo(-14, coatFlutter, coatStretch, coatFlutter * 1.5);
    ctx.quadraticCurveTo(-14, -coatFlutter, -6, -11);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Cyan Luminescent Seam Piping on Jacket Back
    ctx.strokeStyle = '#00f3ff';
    ctx.shadowColor = '#00f3ff';
    ctx.shadowBlur = 6;
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(-5, -6);
    ctx.lineTo(6, -8);
    ctx.lineTo(6, 8);
    ctx.lineTo(-5, 6);
    ctx.stroke();
    ctx.restore();

    // C. Armored Torso with Tactical Rig & High Collar
    ctx.save();
    // High Collar
    ctx.fillStyle = '#22263d';
    ctx.beginPath();
    ctx.roundRect(-8, -10, 6, 20, 3);
    ctx.fill();

    // Main Torso Armor Vest
    ctx.fillStyle = '#181a2c';
    ctx.strokeStyle = '#00f3ff';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(-7, -9 + idleBreath, 16, 18, 4);
    ctx.fill();
    ctx.stroke();

    // Tactical Chest Rig Harness
    ctx.fillStyle = '#0c0e18';
    ctx.fillRect(-3, -6 + idleBreath, 8, 12);

    // Glowing Power Core Diode
    ctx.fillStyle = state?.powerUnlocked ? this._getPowerColor(state.powerPath) : '#00f3ff';
    ctx.shadowColor = ctx.fillStyle;
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.arc(2, 0 + idleBreath, 2.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // D. Left Arm & Tactical Combat Glove (Swings with Stride)
    ctx.save();
    const armSwing = stridePhase * (isSprinting ? 7 : (isMovingActual ? 4 : 0));
    ctx.fillStyle = '#1e2238';
    ctx.beginPath();
    ctx.arc(2 - armSwing, -12, 4.5, 0, Math.PI * 2);
    ctx.fill();

    // Forearm Armor
    ctx.fillStyle = '#282d4a';
    ctx.beginPath();
    ctx.roundRect(4 - armSwing, -14, 6, 4, 2);
    ctx.fill();

    // Tactical Glove
    ctx.fillStyle = '#00f3ff';
    ctx.shadowColor = '#00f3ff';
    ctx.shadowBlur = 6;
    ctx.beginPath();
    ctx.arc(8 - armSwing, -12, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // E. Right Arm & Energized High-Frequency Katana Blade
    ctx.save();
    ctx.fillStyle = '#1e2238';
    ctx.beginPath();
    ctx.arc(2 + armSwing, 12, 4.5, 0, Math.PI * 2);
    ctx.fill();

    const bladeColor = state?.powerUnlocked ? this._getPowerColor(state.powerPath) : '#00f3ff';
    const bladeReach = isAttacking ? 34 : 20;

    // Right Weapon Hand (Glove)
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(8 + armSwing, 12, 3.5, 0, Math.PI * 2);
    ctx.fill();

    // Katana Tsuba (Handguard) & Hilt
    ctx.fillStyle = '#3a3f5c';
    ctx.fillRect(7 + armSwing, 10, 3, 4);

    // Glowing Katana Blade
    ctx.strokeStyle = bladeColor;
    ctx.shadowColor = bladeColor;
    ctx.shadowBlur = isAttacking ? 24 : 10;
    ctx.lineWidth = isAttacking ? 4.5 : 2.5;
    ctx.beginPath();
    ctx.moveTo(9 + armSwing, 12);
    ctx.lineTo(9 + armSwing + bladeReach, 12);
    ctx.stroke();

    // Blade Center White Core
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(9 + armSwing, 12);
    ctx.lineTo(9 + armSwing + bladeReach * 0.9, 12);
    ctx.stroke();
    ctx.restore();

    // F. Head, Cyber Hair, Visor & The Signature Crimson SCAR
    ctx.save();
    // Head base
    ctx.fillStyle = '#2c304e';
    ctx.beginPath();
    ctx.arc(4, 0, 8, 0, Math.PI * 2);
    ctx.fill();

    // Dark Spiky Cyberpunk Hair
    ctx.fillStyle = '#121422';
    ctx.beginPath();
    ctx.moveTo(-2, -7);
    ctx.lineTo(2, -9);
    ctx.lineTo(5, -6);
    ctx.lineTo(7, -8);
    ctx.lineTo(8, 0);
    ctx.lineTo(7, 8);
    ctx.lineTo(5, 6);
    ctx.lineTo(2, 9);
    ctx.lineTo(-2, 7);
    ctx.closePath();
    ctx.fill();

    // Glowing Cyan Ocular Visor
    ctx.fillStyle = '#00f3ff';
    ctx.shadowColor = '#00f3ff';
    ctx.shadowBlur = 10;
    ctx.fillRect(7, -3.5, 4, 7);

    // 5. THE SCAR: A deep, pulsing crimson energy wound across the right eye/face
    if (state && (state.hasScar || state.powerUnlocked || true)) {
      ctx.save();
      const scarPulse = Math.sin(this._time * 8) * 0.35 + 0.65;
      ctx.strokeStyle = `rgba(255, 0, 50, ${scarPulse})`;
      ctx.shadowColor = '#ff0033';
      ctx.shadowBlur = 18;
      ctx.lineWidth = 2.5;

      ctx.beginPath();
      ctx.moveTo(2, -7);
      ctx.lineTo(7, -2);
      ctx.lineTo(4, 5);
      ctx.stroke();

      // Crackling scar energy ember
      if (Math.random() < 0.4) {
        ctx.fillStyle = '#ffffff';
        ctx.shadowColor = '#ff0055';
        ctx.shadowBlur = 8;
        ctx.fillRect(6 + (Math.random() * 4 - 2), -2 + (Math.random() * 4 - 2), 2, 2);
      }
      ctx.restore();
    }
    ctx.restore();

    // 6. Dynamic 3-Hit Attack Arc & Slash Trail
    if (isAttacking) {
      ctx.save();
      const slashColor = state?.powerUnlocked ? this._getPowerColor(state.powerPath) : 'rgba(0, 243, 255, 0.9)';
      ctx.strokeStyle = slashColor;
      ctx.shadowColor = slashColor;
      ctx.shadowBlur = 26;
      ctx.lineWidth = 4.5;
      ctx.beginPath();

      if (this.comboStep === 0) {
        // Combo 1: Horizontal Slash
        ctx.arc(6, 0, 42, -Math.PI * 0.45, Math.PI * 0.45);
      } else if (this.comboStep === 1) {
        // Combo 2: Rising Upper Cut
        ctx.arc(8, 0, 46, -Math.PI * 0.6, Math.PI * 0.25);
      } else {
        // Combo 3: Heavy Cleave Finisher
        ctx.arc(10, 0, 52, -Math.PI * 0.5, Math.PI * 0.5);
      }
      ctx.stroke();

      // Inner white cutting edge
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(8, 0, 42, -Math.PI * 0.3, Math.PI * 0.3);
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
      const spotGrad = ctx.createRadialGradient(8, 0, 2, 16, 0, 38);
      spotGrad.addColorStop(0, 'rgba(255, 0, 85, 0.38)');
      spotGrad.addColorStop(1, 'rgba(255, 0, 85, 0)');
      ctx.fillStyle = spotGrad;
      ctx.beginPath();
      ctx.arc(16, 0, 38, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // Rotor Arms
      ctx.strokeStyle = '#333348';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(-16, -14); ctx.lineTo(16, 14);
      ctx.moveTo(-16, 14); ctx.lineTo(16, -14);
      ctx.stroke();

      // Spinning Rotor Discs
      const rotorBlur = Math.sin(this._time * 25) * 5;
      ctx.fillStyle = 'rgba(0, 243, 255, 0.35)';
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

      ctx.fillStyle = '#181824';
      ctx.fillRect(-8 + stride, -10, 8, 6);
      ctx.fillRect(-8 - stride, 4, 8, 6);

      ctx.fillStyle = '#222232';
      ctx.strokeStyle = '#ffb700';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(-10, -12, 20, 24, 4);
      ctx.fill();
      ctx.stroke();

      // Riot Shield
      ctx.fillStyle = '#10101c';
      ctx.strokeStyle = '#00f3ff';
      ctx.lineWidth = 2.5;
      ctx.shadowColor = '#00f3ff';
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.roundRect(8, -14, 6, 28, 2);
      ctx.fill();
      ctx.stroke();

      // Shock Baton
      ctx.strokeStyle = '#ffb700';
      ctx.shadowColor = '#ffb700';
      ctx.shadowBlur = 10;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(-4, 12);
      ctx.lineTo(14, 16);
      ctx.stroke();

      ctx.fillStyle = '#323246';
      ctx.beginPath();
      ctx.arc(2, 0, 7, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#ffb700';
      ctx.fillRect(4, -3, 4, 6);

    } else if (type === 'STALKER') {
      // ─── STALKER: Slender Cyber-Ninja Humanoid ────────────────────────────
      ctx.save();
      ctx.globalAlpha = 0.92;

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
      const mechStep = Math.sin(this._time * 6) * 5;
      ctx.fillStyle = '#101018';
      ctx.fillRect(-16 + mechStep, -16, 12, 8);
      ctx.fillRect(-16 - mechStep, 8, 12, 8);

      ctx.fillStyle = '#1a1a28';
      ctx.strokeStyle = '#ff2200';
      ctx.lineWidth = 3;
      ctx.shadowColor = '#ff2200';
      ctx.shadowBlur = 16;
      ctx.beginPath();
      ctx.roundRect(-14, -14, 28, 28, 6);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#0a0a10';
      ctx.fillRect(8, -12, 18, 5);
      ctx.fillRect(8, 7, 18, 5);

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

    // 1. Telekinetic Ripple Drop Shadow
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

    ctx.fillStyle = isHostile ? '#320412' : '#f0f4ff';
    ctx.beginPath();
    ctx.arc(0, 0, 16, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = heroColor;
    ctx.lineWidth = 2;
    ctx.stroke();

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
