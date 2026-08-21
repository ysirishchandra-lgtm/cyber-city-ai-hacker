/**
 * SCAR — THE LAST CHOICE
 * Enemy AI & Spawner Module (KAUSTUB — GAMEPLAY)
 */

import { eventBus, GAME_EVENTS } from './events.js';

export const ENEMY_TYPES = {
  DRONE: 'DRONE',         // Level 1: Weak Cyber Drone
  ENFORCER: 'ENFORCER',   // Level 2: Cyber Enforcer (Ranged)
  STALKER: 'STALKER',     // Level 2: Cyber Stalker (Fast Melee)
  SENTINEL: 'SENTINEL'    // Level 3: Elite Heavy Sentinel
};

export class Enemy {
  constructor(x, y, type = ENEMY_TYPES.DRONE) {
    this.x = x;
    this.y = y;
    this.type = type;
    this.isAlive = true;
    this.inStasis = false;
    this.stasisTimer = 0;

    this.configureStats();
  }

  configureStats() {
    switch (this.type) {
      case ENEMY_TYPES.DRONE:
        this.maxHealth = 40;
        this.health = 40;
        this.speed = 100;
        this.radius = 14;
        this.damage = 8;
        this.attackRange = 30;
        this.color = '#ff9900';
        break;

      case ENEMY_TYPES.ENFORCER:
        this.maxHealth = 80;
        this.health = 80;
        this.speed = 120;
        this.radius = 18;
        this.damage = 15;
        this.attackRange = 180; // Ranged
        this.color = '#ff0055';
        break;

      case ENEMY_TYPES.STALKER:
        this.maxHealth = 60;
        this.health = 60;
        this.speed = 190; // Fast
        this.radius = 15;
        this.damage = 18;
        this.attackRange = 35;
        this.color = '#aa00ff';
        break;

      case ENEMY_TYPES.SENTINEL:
        this.maxHealth = 140;
        this.health = 140;
        this.speed = 110;
        this.radius = 22;
        this.damage = 25;
        this.attackRange = 40;
        this.color = '#ff0000';
        break;
    }

    this.attackCooldown = 0;
  }

  applyStasis(duration) {
    this.inStasis = true;
    this.stasisTimer = duration;
  }

  update(dt, player, powerSystem, projectiles) {
    if (!this.isAlive) return;

    if (this.inStasis) {
      this.stasisTimer -= dt;
      if (this.stasisTimer <= 0) {
        this.inStasis = false;
      }
      return; // Frozen in place during stasis
    }

    if (this.attackCooldown > 0) {
      this.attackCooldown -= dt;
    }

    const dx = player.x - this.x;
    const dy = player.y - this.y;
    const dist = Math.hypot(dx, dy);

    // Chase player if within detection range (450px)
    if (dist < 450 && dist > 10) {
      const moveX = (dx / dist) * this.speed * dt;
      const moveY = (dy / dist) * this.speed * dt;

      // Keep distance if ranged enforcer
      if (this.type === ENEMY_TYPES.ENFORCER && dist < 120) {
        this.x -= moveX * 0.5;
        this.y -= moveY * 0.5;
      } else {
        this.x += moveX;
        this.y += moveY;
      }
    }

    // Attack logic
    if (dist <= this.attackRange && this.attackCooldown <= 0) {
      this.attackCooldown = 1.5;

      if (this.type === ENEMY_TYPES.ENFORCER) {
        // Fire laser projectile
        if (projectiles) {
          const angle = Math.atan2(dy, dx);
          projectiles.push({
            x: this.x,
            y: this.y,
            vx: Math.cos(angle) * 350,
            vy: Math.sin(angle) * 350,
            damage: this.damage,
            radius: 4,
            color: '#ff0055',
            isHostile: true,
            life: 2.0
          });
        }
      } else {
        // Melee attack
        player.takeDamage(this.damage, powerSystem);
      }
    }
  }

  takeDamage(amount, source = 'MELEE') {
    if (!this.isAlive) return;

    this.health -= amount;
    if (this.health <= 0) {
      this.health = 0;
      this.isAlive = false;

      eventBus.emit(GAME_EVENTS.ENEMY_DEFEATED, {
        type: this.type,
        x: this.x,
        y: this.y,
        source
      });
    }
  }

  render(ctx, camera) {
    if (!this.isAlive) return;

    const screenX = this.x - camera.x;
    const screenY = this.y - camera.y;

    ctx.save();
    ctx.translate(screenX, screenY);

    if (this.inStasis) {
      // Glow green stasis ring
      ctx.beginPath();
      ctx.arc(0, 0, this.radius + 6, 0, Math.PI * 2);
      ctx.strokeStyle = '#00ff66';
      ctx.lineWidth = 3;
      ctx.shadowColor = '#00ff66';
      ctx.shadowBlur = 10;
      ctx.stroke();
    }

    // Body
    ctx.beginPath();
    ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
    ctx.fillStyle = '#111';
    ctx.fill();
    ctx.strokeStyle = this.color;
    ctx.lineWidth = 2.5;
    ctx.shadowColor = this.color;
    ctx.shadowBlur = 8;
    ctx.stroke();

    // Center Core
    ctx.beginPath();
    ctx.arc(0, 0, 4, 0, Math.PI * 2);
    ctx.fillStyle = this.color;
    ctx.fill();

    ctx.restore();

    // Health Bar overhead
    const barWidth = 30;
    const barHeight = 4;
    const barX = screenX - barWidth / 2;
    const barY = screenY - this.radius - 10;

    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillRect(barX, barY, barWidth, barHeight);

    const hpRatio = this.health / this.maxHealth;
    ctx.fillStyle = this.color;
    ctx.fillRect(barX, barY, barWidth * hpRatio, barHeight);
  }
}
