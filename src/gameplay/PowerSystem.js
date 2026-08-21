/**
 * SCAR — THE LAST CHOICE
 * Power System Module (KAUSTUB — GAMEPLAY)
 * 
 * Integrated with Sirish's POWER_PATH enum and GameState.
 */

import { KaustubAPI } from '../integration/TeamAPI.js';
import { eventBus, EVENTS } from '../core/EventBus.js';
import { POWER_PATH, gameState } from '../core/GameState.js';

export class PowerSystem {
  constructor() {
    this.cooldownTimer = 0;
    this.maxCooldown = 5.0;
    this.activeDuration = 0;
    this.isShieldActive = false;
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
    const unlocked = gameState.hasPower();
    return unlocked && this.cooldownTimer <= 0;
  }

  activate(player, enemies, particleEffects) {
    if (!this.canActivate()) return false;

    const path = KaustubAPI.getPowerPath();
    this.cooldownTimer = this.maxCooldown;

    switch (path) {
      case POWER_PATH.AGGRESSIVE:
      case 'DESTRUCTION':
        this.executeDestructionNova(player, enemies, particleEffects);
        break;

      case POWER_PATH.PROTECTIVE:
      case 'PROTECTION':
        this.executeKineticBarrier(player, enemies, particleEffects);
        break;

      case POWER_PATH.STRATEGIC:
      case 'CONTROL':
        this.executeStasisHack(player, enemies, particleEffects);
        break;

      default:
        // Default to destruction nova if path is general
        this.executeDestructionNova(player, enemies, particleEffects);
        break;
    }

    return true;
  }

  executeDestructionNova(player, enemies, particleEffects) {
    const novaRadius = 180;
    const novaDamage = 75;

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

    enemies.forEach(enemy => {
      if (enemy.isAlive) {
        const dx = enemy.x - player.x;
        const dy = enemy.y - player.y;
        const dist = Math.hypot(dx, dy);
        if (dist <= novaRadius) {
          enemy.takeDamage(novaDamage, 'DESTRUCTION');
          if (dist > 0) {
            enemy.x += (dx / dist) * 60;
            enemy.y += (dy / dist) * 60;
          }
        }
      }
    });
  }

  executeKineticBarrier(player, enemies, particleEffects) {
    this.activeDuration = 3.5;
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
          enemy.applyStasis(4.0);
        }
      }
    });
  }
}
