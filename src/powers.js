/**
 * SCAR — THE LAST CHOICE
 * Power System Module (KAUSTUB — GAMEPLAY)
 * 
 * Implements 3 distinct power paths:
 * 1. AGGRESSIVE -> DESTRUCTION (Destruction Nova)
 * 2. PROTECTIVE -> PROTECTION (Kinetic Barrier)
 * 3. STRATEGIC -> CONTROL (Stasis Hack)
 */

import { eventBus, GAME_EVENTS } from './events.js';
import { metrics } from './metrics.js';

export const POWER_PATHS = {
  NONE: 'NONE',
  DESTRUCTION: 'DESTRUCTION',
  PROTECTION: 'PROTECTION',
  CONTROL: 'CONTROL'
};

export class PowerSystem {
  constructor() {
    this.currentPath = POWER_PATHS.NONE;
    this.unlocked = false;
    this.cooldownTimer = 0;
    this.maxCooldown = 5.0; // seconds
    this.activeDuration = 0;
    this.isShieldActive = false;
  }

  awakenPower(dominantPath) {
    this.currentPath = dominantPath || POWER_PATHS.DESTRUCTION;
    this.unlocked = true;
    this.cooldownTimer = 0;
    
    eventBus.emit(GAME_EVENTS.POWER_AWAKENED, {
      path: this.currentPath,
      name: this.getPowerName(),
      description: this.getPowerDescription()
    });
  }

  getPowerName() {
    switch (this.currentPath) {
      case POWER_PATHS.DESTRUCTION:
        return 'DESTRUCTION NOVA';
      case POWER_PATHS.PROTECTION:
        return 'KINETIC BARRIER';
      case POWER_PATHS.CONTROL:
        return 'STASIS HACK';
      default:
        return 'DORMANT';
    }
  }

  getPowerDescription() {
    switch (this.currentPath) {
      case POWER_PATHS.DESTRUCTION:
        return 'Unleashes a devasting cyber-energy explosion dealing heavy damage to all surrounding hostiles.';
      case POWER_PATHS.PROTECTION:
        return 'Deploys an impenetrable kinetic forcefield, absorbing damage and knocking back enemies.';
      case POWER_PATHS.CONTROL:
        return 'Emits an EMP pulse that freezes all hostiles in stasis and disables automated defenses.';
      default:
        return 'No awakened powers yet. Seek out the Scar.';
    }
  }

  update(dt) {
    if (this.cooldownTimer > 0) {
      this.cooldownTimer = Math.max(0, this.cooldownTimer - dt);
    }
    if (this.activeDuration > 0) {
      this.activeDuration = Math.max(0, this.activeDuration - dt);
      if (this.activeDuration === 0) {
        this.isShieldActive = false;
      }
    }
  }

  canActivate() {
    return this.unlocked && this.cooldownTimer <= 0;
  }

  activate(player, enemies, particleEffects) {
    if (!this.canActivate()) return false;

    this.cooldownTimer = this.maxCooldown;
    metrics.recordPowerUse(this.getPowerName());

    switch (this.currentPath) {
      case POWER_PATHS.DESTRUCTION:
        this.executeDestructionNova(player, enemies, particleEffects);
        break;
      case POWER_PATHS.PROTECTION:
        this.executeKineticBarrier(player, enemies, particleEffects);
        break;
      case POWER_PATHS.CONTROL:
        this.executeStasisHack(player, enemies, particleEffects);
        break;
    }

    return true;
  }

  executeDestructionNova(player, enemies, particleEffects) {
    const novaRadius = 180;
    const novaDamage = 75;

    // Visual effect
    if (particleEffects) {
      particleEffects.push({
        type: 'nova',
        x: player.x,
        y: player.y,
        radius: 10,
        maxRadius: novaRadius,
        color: '#ff0055',
        life: 0.5,
        maxLife: 0.5
      });
    }

    // Hit hostiles in radius
    enemies.forEach(enemy => {
      if (enemy.isAlive) {
        const dx = enemy.x - player.x;
        const dy = enemy.y - player.y;
        const dist = Math.hypot(dx, dy);
        if (dist <= novaRadius) {
          enemy.takeDamage(novaDamage, 'DESTRUCTION');
          // Push back
          if (dist > 0) {
            enemy.x += (dx / dist) * 60;
            enemy.y += (dy / dist) * 60;
          }
        }
      }
    });

    metrics.recordAction('aggressive', 'Activated Destruction Nova');
  }

  executeKineticBarrier(player, enemies, particleEffects) {
    this.activeDuration = 3.5; // 3.5 sec shield
    this.isShieldActive = true;

    if (particleEffects) {
      particleEffects.push({
        type: 'barrier',
        x: player.x,
        y: player.y,
        color: '#00ffff',
        life: 3.5,
        maxLife: 3.5
      });
    }

    // Knockback nearby enemies
    enemies.forEach(enemy => {
      if (enemy.isAlive) {
        const dx = enemy.x - player.x;
        const dy = enemy.y - player.y;
        const dist = Math.hypot(dx, dy);
        if (dist <= 120 && dist > 0) {
          enemy.x += (dx / dist) * 80;
          enemy.y += (dy / dist) * 80;
        }
      }
    });

    metrics.recordAction('protective', 'Activated Kinetic Barrier');
  }

  executeStasisHack(player, enemies, particleEffects) {
    const stasisRadius = 220;

    if (particleEffects) {
      particleEffects.push({
        type: 'stasis',
        x: player.x,
        y: player.y,
        radius: stasisRadius,
        color: '#00ff66',
        life: 0.8,
        maxLife: 0.8
      });
    }

    enemies.forEach(enemy => {
      if (enemy.isAlive) {
        const dist = Math.hypot(enemy.x - player.x, enemy.y - player.y);
        if (dist <= stasisRadius) {
          enemy.applyStasis(4.0); // Freeze for 4 seconds
        }
      }
    });

    metrics.recordAction('strategic', 'Activated Stasis Hack');
  }
}
