/**
 * SCAR — THE LAST CHOICE
 * Player Entity Controller (KAUSTUB — GAMEPLAY)
 * 
 * Integrated with Sirish's TeamAPI, EventBus, and GameState.
 */

import { KaustubAPI } from '../integration/TeamAPI.js';
import { eventBus, EVENTS } from '../core/EventBus.js';
import { gameState } from '../core/GameState.js';

export class Player {
  constructor(x = 100, y = 100) {
    this.x = x;
    this.y = y;
    this.vx = 0;
    this.vy = 0;
    this.speed = 180;
    this.sprintSpeed = 300;
    this.radius = 16;

    this.facingAngle = 0;
    this.isMoving = false;
    this.isSprinting = false;

    this.stamina = 100;
    this.maxStamina = 100;

    this.attackCooldown = 0;
    this.attackRate = 0.28;
    this.isAttacking = false;
    this.attackAnimationTimer = 0;
    this.comboStep = 0;
    this.comboResetTimer = 0;

    this.lastEmittedX = x;
    this.lastEmittedY = y;
    this.dodgeTimer = 0;
  }

  reset(x = 100, y = 100) {
    this.x = x;
    this.y = y;
    this.vx = 0;
    this.vy = 0;
    this.stamina = 100;
    this.attackCooldown = 0;
    this.isAttacking = false;
    this.comboStep = 0;
    this.comboResetTimer = 0;
    this.dodgeTimer = 0;
    KaustubAPI.updatePosition(x, y);
  }

  dodge() {
    if (this.stamina >= 20 && this.dodgeTimer <= 0) {
      this.stamina -= 20;
      this.dodgeTimer = 0.35; // 350ms invulnerability window + dash
      this.x += Math.cos(this.facingAngle) * 45;
      this.y += Math.sin(this.facingAngle) * 45;
      KaustubAPI.updatePosition(Math.round(this.x), Math.round(this.y));
      return true;
    }
    return false;
  }

  handleInput(keys, mousePos, camera, dt) {
    if (KaustubAPI.isChoiceBlocking()) return;

    if (this.dodgeTimer > 0) {
      this.dodgeTimer -= dt;
    }

    if (this.comboResetTimer > 0) {
      this.comboResetTimer -= dt;
      if (this.comboResetTimer <= 0) {
        this.comboStep = 0;
      }
    }

    let dx = 0;
    let dy = 0;

    if (keys['w'] || keys['W'] || keys['ArrowUp']) dy -= 1;
    if (keys['s'] || keys['S'] || keys['ArrowDown']) dy += 1;
    if (keys['a'] || keys['A'] || keys['ArrowLeft']) dx -= 1;
    if (keys['d'] || keys['D'] || keys['ArrowRight']) dx += 1;

    if (dx !== 0 && dy !== 0) {
      dx *= 0.7071;
      dy *= 0.7071;
    }

    this.isSprinting = (keys['Shift'] || keys['shift']) && this.stamina > 10;
    const currentSpeed = this.isSprinting ? this.sprintSpeed : this.speed;

    if (this.isSprinting) {
      this.stamina = Math.max(0, this.stamina - 30 * dt);
    } else {
      this.stamina = Math.min(this.maxStamina, this.stamina + 20 * dt);
    }

    this.vx = dx * currentSpeed;
    this.vy = dy * currentSpeed;

    this.x += this.vx * dt;
    this.y += this.vy * dt;

    if (dx !== 0 || dy !== 0) {
      this.isMoving = true;
      const distMoved = Math.hypot(this.x - this.lastEmittedX, this.y - this.lastEmittedY);
      if (distMoved > 25) {
        this.lastEmittedX = this.x;
        this.lastEmittedY = this.y;
        KaustubAPI.updatePosition(Math.round(this.x), Math.round(this.y));
      }
    } else {
      this.isMoving = false;
    }

    if (mousePos && camera) {
      const worldMouseX = mousePos.x + camera.x;
      const worldMouseY = mousePos.y + camera.y;
      this.facingAngle = Math.atan2(worldMouseY - this.y, worldMouseX - this.x);
    } else if (dx !== 0 || dy !== 0) {
      this.facingAngle = Math.atan2(dy, dx);
    }

    if (this.attackCooldown > 0) {
      this.attackCooldown -= dt;
    }

    if (this.attackAnimationTimer > 0) {
      this.attackAnimationTimer -= dt;
      if (this.attackAnimationTimer <= 0) {
        this.isAttacking = false;
      }
    }
  }

  attack(enemies, particleEffects) {
    if (this.attackCooldown > 0 || KaustubAPI.isChoiceBlocking()) return false;

    // 3-Hit Combo sequence: Step 1 (25 dmg) -> Step 2 (32 dmg) -> Step 3 (45 dmg finisher)
    this.comboStep = (this.comboStep % 3) + 1;
    this.comboResetTimer = 0.85;

    this.attackCooldown = this.attackRate;
    this.isAttacking = true;
    this.attackAnimationTimer = 0.2;

    const attackRange = 75;
    const baseDamage = 25;
    const comboMultipliers = { 1: 1.0, 2: 1.28, 3: 1.8 };
    const attackDamage = Math.round(baseDamage * (comboMultipliers[this.comboStep] || 1.0));
    const attackArc = Math.PI / 2;

    let hitAny = false;

    if (particleEffects) {
      const slashColors = { 1: '#00ffff', 2: '#00ff88', 3: '#ff0055' };
      particleEffects.push({
        type: 'slash',
        x: this.x + Math.cos(this.facingAngle) * 30,
        y: this.y + Math.sin(this.facingAngle) * 30,
        angle: this.facingAngle,
        color: slashColors[this.comboStep] || '#00ffff',
        life: 0.18,
        maxLife: 0.18
      });
    }

    // Record Aggressive choice action influence in GameState
    gameState.recordChoice('COMBAT_MELEE_ATTACK', `Executed combo strike step ${this.comboStep}`, 'AGGRESSIVE');

    enemies.forEach(enemy => {
      if (enemy.isAlive) {
        const dx = enemy.x - this.x;
        const dy = enemy.y - this.y;
        const dist = Math.hypot(dx, dy);

        if (dist <= attackRange) {
          const angleToEnemy = Math.atan2(dy, dx);
          let angleDiff = Math.abs(this.facingAngle - angleToEnemy);
          while (angleDiff > Math.PI) angleDiff = Math.abs(angleDiff - 2 * Math.PI);

          if (angleDiff <= attackArc / 2) {
            enemy.takeDamage(attackDamage, 'MELEE');
            hitAny = true;
            
            // Knockback on hit, extra knockback on 3rd combo finisher
            const knockbackDist = this.comboStep === 3 ? 45 : 25;
            enemy.x += Math.cos(this.facingAngle) * knockbackDist;
            enemy.y += Math.sin(this.facingAngle) * knockbackDist;
          }
        }
      }
    });

    return hitAny;
  }

  takeDamage(amount, powerSystem) {
    if (this.dodgeTimer > 0) {
      // Invulnerable during dodge roll
      return 0;
    }

    if (powerSystem && powerSystem.isShieldActive) {
      gameState.recordChoice('SHIELD_ABSORB', 'Absorbed damage with Kinetic Barrier', 'PROTECTIVE');
      return 0;
    }

    KaustubAPI.playerTakeDamage(amount);
    gameState.recordChoice('TAKE_DAMAGE_SURVIVAL', 'Endured enemy damage', 'PROTECTIVE');
    return amount;
  }

  render(ctx, camera) {
    const screenX = this.x - camera.x;
    const screenY = this.y - camera.y;

    ctx.save();
    ctx.translate(screenX, screenY);

    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.arc(0, 0, 35, this.facingAngle - Math.PI / 6, this.facingAngle + Math.PI / 6);
    ctx.closePath();
    ctx.fillStyle = 'rgba(0, 243, 255, 0.15)';
    ctx.fill();

    if (this.isAttacking) {
      ctx.beginPath();
      ctx.arc(0, 0, 45, this.facingAngle - Math.PI / 4, this.facingAngle + Math.PI / 4);
      ctx.strokeStyle = '#00ffff';
      ctx.lineWidth = 4;
      ctx.shadowColor = '#00ffff';
      ctx.shadowBlur = 10;
      ctx.stroke();
    }

    ctx.rotate(this.facingAngle);
    ctx.beginPath();
    ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
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
    ctx.shadowColor = '#ff0055';
    ctx.shadowBlur = 8;
    ctx.fill();

    ctx.restore();
  }
}
