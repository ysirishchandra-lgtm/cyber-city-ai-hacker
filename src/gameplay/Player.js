/**
 * SCAR — THE LAST CHOICE
 * Player Entity Controller (Sirish & Kaustub — Gameplay / Locomotion)
 * 
 * Fully animated human protagonist with fluid Free-Fire/PUBG-style locomotion,
 * smooth slerp/lerp angular rotation, ground contact physics, and interaction triggers.
 */

import { KaustubAPI } from '../integration/TeamAPI.js';
import { eventBus, EVENTS } from '../core/EventBus.js';
import { gameState } from '../core/GameState.js';
import { characterRenderer } from '../visuals/CharacterRenderer.js';

/**
 * Normalizes an angle difference to [-PI, PI] for shortest rotation path
 */
function normalizeAngleDiff(diff) {
  while (diff < -Math.PI) diff += Math.PI * 2;
  while (diff > Math.PI) diff -= Math.PI * 2;
  return diff;
}

export class Player {
  constructor(x = 200, y = 300) {
    this.x = x;
    this.y = y;
    this.vx = 0;
    this.vy = 0;

    // Locomotion tuning (Free-Fire / PUBG inspired responsive movement)
    this.walkSpeed = 160;
    this.jogSpeed = 225;
    this.sprintSpeed = 340;
    this.radius = 16;

    // Angular orientation & smooth turning (slerp/lerp)
    this.facingAngle = 0;
    this.targetFacingAngle = 0;
    this.turnSpeed = 16.0; // rad/s smooth turning rate

    // Locomotion & animation states
    this.isMoving = false;
    this.isSprinting = false;
    this.locomotionState = 'IDLE'; // 'IDLE' | 'WALK' | 'JOG' | 'SPRINT' | 'DODGE'
    this.stridePhase = 0;
    this.strideTime = 0;

    // Stamina & Resource Pools
    this.stamina = 100;
    this.maxStamina = 100;

    // Combat & Attack
    this.attackCooldown = 0;
    this.attackRate = 0.28;
    this.isAttacking = false;
    this.attackAnimationTimer = 0;
    this.comboStep = 0;
    this.comboResetTimer = 0;

    // Dodge Roll (360° aerodynamic roll with i-frames)
    this.dodgeTimer = 0;
    this.maxDodgeTime = 0.35;
    this.dodgeVx = 0;
    this.dodgeVy = 0;

    this.lastEmittedX = x;
    this.lastEmittedY = y;
  }

  reset(x = 200, y = 300) {
    this.x = x;
    this.y = y;
    this.vx = 0;
    this.vy = 0;
    this.facingAngle = 0;
    this.targetFacingAngle = 0;
    this.isMoving = false;
    this.isSprinting = false;
    this.locomotionState = 'IDLE';
    this.stridePhase = 0;
    this.strideTime = 0;
    this.stamina = 100;
    this.attackCooldown = 0;
    this.isAttacking = false;
    this.comboStep = 0;
    this.comboResetTimer = 0;
    this.dodgeTimer = 0;
    this.dodgeVx = 0;
    this.dodgeVy = 0;
    this.lastEmittedX = x;
    this.lastEmittedY = y;
    KaustubAPI.updatePosition(x, y);
  }

  /**
   * Execute 360° Dodge Roll with directional momentum & invulnerability frames
   */
  dodge() {
    if (this.stamina >= 20 && this.dodgeTimer <= 0) {
      this.stamina -= 20;
      this.dodgeTimer = this.maxDodgeTime;
      this.locomotionState = 'DODGE';

      // Roll in movement direction if moving, otherwise forward in facing angle
      const rollAngle = (Math.hypot(this.vx, this.vy) > 10)
        ? Math.atan2(this.vy, this.vx)
        : this.facingAngle;

      const rollSpeed = 480;
      this.dodgeVx = Math.cos(rollAngle) * rollSpeed;
      this.dodgeVy = Math.sin(rollAngle) * rollSpeed;

      KaustubAPI.updatePosition(Math.round(this.x), Math.round(this.y));
      return true;
    }
    return false;
  }

  /**
   * Fluid 8-directional input, smooth velocity interpolation, and slerp rotation
   */
  handleInput(keys, mousePos, camera, dt) {
    if (KaustubAPI.isChoiceBlocking()) {
      this.vx = 0;
      this.vy = 0;
      this.isMoving = false;
      this.isSprinting = false;
      this.locomotionState = 'IDLE';
      return;
    }

    // 1. Update Dodge State & Movement Momentum
    if (this.dodgeTimer > 0) {
      this.dodgeTimer -= dt;
      this.x += this.dodgeVx * dt;
      this.y += this.dodgeVy * dt;

      // Friction on dodge roll
      this.dodgeVx *= Math.pow(0.2, dt);
      this.dodgeVy *= Math.pow(0.2, dt);

      if (this.dodgeTimer <= 0) {
        this.locomotionState = this.isMoving ? (this.isSprinting ? 'SPRINT' : 'JOG') : 'IDLE';
      }
    }

    // 2. Combo Reset Timer
    if (this.comboResetTimer > 0) {
      this.comboResetTimer -= dt;
      if (this.comboResetTimer <= 0) {
        this.comboStep = 0;
      }
    }

    // 3. 8-Directional Movement Input Vector
    let inputX = 0;
    let inputY = 0;

    if (keys['w'] || keys['W'] || keys['ArrowUp']) inputY -= 1;
    if (keys['s'] || keys['S'] || keys['ArrowDown']) inputY += 1;
    if (keys['a'] || keys['A'] || keys['ArrowLeft']) inputX -= 1;
    if (keys['d'] || keys['D'] || keys['ArrowRight']) inputX += 1;

    // Diagonal normalization for consistent velocity
    if (inputX !== 0 && inputY !== 0) {
      inputX *= 0.7071;
      inputY *= 0.7071;
    }

    const hasInput = (inputX !== 0 || inputY !== 0);

    // 4. Sprint & Stamina Calculation
    const sprintKey = keys['Shift'] || keys['shift'];
    this.isSprinting = !!(sprintKey && hasInput && this.stamina > 5);

    let targetSpeed = 0;
    if (hasInput) {
      if (this.isSprinting) {
        targetSpeed = this.sprintSpeed;
        this.locomotionState = 'SPRINT';
        this.stamina = Math.max(0, this.stamina - 28 * dt);
      } else {
        targetSpeed = this.jogSpeed;
        this.locomotionState = 'JOG';
        this.stamina = Math.min(this.maxStamina, this.stamina + 20 * dt);
      }
    } else {
      targetSpeed = 0;
      this.locomotionState = this.dodgeTimer > 0 ? 'DODGE' : 'IDLE';
      this.stamina = Math.min(this.maxStamina, this.stamina + 25 * dt);
    }

    // 5. Smooth Velocity Acceleration & Deceleration (Friction)
    const targetVx = inputX * targetSpeed;
    const targetVy = inputY * targetSpeed;
    const accelRate = hasInput ? 18.0 : 22.0; // responsive acceleration & braking

    this.vx += (targetVx - this.vx) * Math.min(1, accelRate * dt);
    this.vy += (targetVy - this.vy) * Math.min(1, accelRate * dt);

    if (this.dodgeTimer <= 0) {
      this.x += this.vx * dt;
      this.y += this.vy * dt;
    }

    const currentSpeed = Math.hypot(this.vx, this.vy);
    this.isMoving = currentSpeed > 10;

    // 6. Stride Cycle Animation Phase
    if (this.isMoving) {
      const strideFreq = this.isSprinting ? 16.0 : (currentSpeed > 120 ? 11.0 : 7.0);
      this.strideTime += dt * strideFreq;
      this.stridePhase = Math.sin(this.strideTime);
    } else {
      // Smoothly return stride phase to neutral
      this.strideTime += dt * 2.0;
      this.stridePhase *= Math.pow(0.1, dt);
    }

    // 7. Smooth Angular Rotation (Slerp / Lerp toward aim vector / movement vector)
    if (mousePos && camera) {
      const worldMouseX = mousePos.x + camera.x;
      const worldMouseY = mousePos.y + camera.y;
      this.targetFacingAngle = Math.atan2(worldMouseY - this.y, worldMouseX - this.x);
    } else if (hasInput) {
      this.targetFacingAngle = Math.atan2(inputY, inputX);
    }

    const angleDiff = normalizeAngleDiff(this.targetFacingAngle - this.facingAngle);
    this.facingAngle += angleDiff * Math.min(1, this.turnSpeed * dt);

    // 8. Spatial Position Emission Sync
    if (this.isMoving) {
      const distMoved = Math.hypot(this.x - this.lastEmittedX, this.y - this.lastEmittedY);
      if (distMoved > 20) {
        this.lastEmittedX = this.x;
        this.lastEmittedY = this.y;
        KaustubAPI.updatePosition(Math.round(this.x), Math.round(this.y));
      }
    }

    // 9. Combat Timers
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

    // 3-Hit Combo Sequence: Step 1 (25 dmg) -> Step 2 (32 dmg) -> Step 3 (45 dmg finisher)
    this.comboStep = (this.comboStep % 3) + 1;
    this.comboResetTimer = 0.85;

    this.attackCooldown = this.attackRate;
    this.isAttacking = true;
    this.attackAnimationTimer = 0.22;

    const attackRange = 80;
    const baseDamage = 25;
    const comboMultipliers = { 1: 1.0, 2: 1.3, 3: 1.85 };
    const attackDamage = Math.round(baseDamage * (comboMultipliers[this.comboStep] || 1.0));
    const attackArc = Math.PI / 2;

    let hitAny = false;

    if (particleEffects) {
      const slashColors = { 1: '#00f3ff', 2: '#00ff88', 3: '#ff0055' };
      particleEffects.push({
        type: 'slash',
        x: this.x + Math.cos(this.facingAngle) * 32,
        y: this.y + Math.sin(this.facingAngle) * 32,
        angle: this.facingAngle,
        color: slashColors[this.comboStep] || '#00f3ff',
        life: 0.2,
        maxLife: 0.2
      });
    }

    gameState.recordChoice('COMBAT_MELEE_ATTACK', `Executed combo strike step ${this.comboStep}`, 'AGGRESSIVE');

    enemies.forEach(enemy => {
      if (enemy.isAlive) {
        const dx = enemy.x - this.x;
        const dy = enemy.y - this.y;
        const dist = Math.hypot(dx, dy);

        if (dist <= attackRange) {
          const angleToEnemy = Math.atan2(dy, dx);
          let angleDiff = Math.abs(normalizeAngleDiff(this.facingAngle - angleToEnemy));

          if (angleDiff <= attackArc / 2) {
            enemy.takeDamage(attackDamage, 'MELEE');
            hitAny = true;

            const knockbackDist = this.comboStep === 3 ? 48 : 26;
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
      // Invulnerable during aerodynamic dodge roll
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

  /**
   * Render humanoid protagonist directly if called as a standalone or fallback renderer
   */
  render(ctx, camera) {
    characterRenderer.renderPlayer(ctx, this, gameState);
  }
}
