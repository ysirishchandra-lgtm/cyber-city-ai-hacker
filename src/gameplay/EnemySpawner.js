/**
 * SCAR — THE LAST CHOICE
 * Enemy Entity & Spawner System (KAUSTUB — GAMEPLAY)
 * 
 * Integrated with Sirish's KaustubAPI.enemyDefeated().
 */

import { KaustubAPI } from '../integration/TeamAPI.js';

export const ENEMY_TYPES = {
  DRONE: 'DRONE',
  ENFORCER: 'ENFORCER',
  STALKER: 'STALKER',
  SENTINEL: 'SENTINEL',
  DISRUPTOR: 'DISRUPTOR'
};

export class Enemy {
  constructor(id, x, y, type = ENEMY_TYPES.DRONE) {
    this.id = id;
    this.x = x;
    this.y = y;
    this.type = type;
    this.isAlive = true;
    this.inStasis = false;
    this.stasisTimer = 0;
    this.windupTimer = 0;
    this.isWindingUp = false;
    this.hazardArea = null;

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
        this.attackRange = 40;
        this.windupDuration = 0.35;
        this.color = '#ff9900';
        break;

      case ENEMY_TYPES.ENFORCER:
        this.maxHealth = 80;
        this.health = 80;
        this.speed = 120;
        this.radius = 18;
        this.damage = 15;
        this.attackRange = 220;
        this.windupDuration = 0.75;
        this.color = '#ff0055';
        break;

      case ENEMY_TYPES.STALKER:
        this.maxHealth = 60;
        this.health = 60;
        this.speed = 190;
        this.radius = 15;
        this.damage = 18;
        this.attackRange = 45;
        this.windupDuration = 0.3;
        this.color = '#aa00ff';
        break;

      case ENEMY_TYPES.SENTINEL:
        this.maxHealth = 140;
        this.health = 140;
        this.speed = 100;
        this.radius = 22;
        this.damage = 28;
        this.attackRange = 65;
        this.windupDuration = 0.9;
        this.color = '#ff2200';
        break;

      case ENEMY_TYPES.DISRUPTOR:
        this.maxHealth = 70;
        this.health = 70;
        this.speed = 110;
        this.radius = 16;
        this.damage = 12;
        this.attackRange = 160;
        this.windupDuration = 0.8;
        this.color = '#00ffcc';
        break;
    }

    this.attackCooldown = 0;
  }

  applyStasis(duration) {
    this.inStasis = true;
    this.stasisTimer = duration;
    this.isWindingUp = false;
    this.windupTimer = 0;
  }

  update(dt, player, powerSystem, projectiles) {
    if (!this.isAlive) return;

    if (this.inStasis) {
      this.stasisTimer -= dt;
      if (this.stasisTimer <= 0) {
        this.inStasis = false;
      }
      return;
    }

    if (this.attackCooldown > 0) {
      this.attackCooldown -= dt;
    }

    const dx = player.x - this.x;
    const dy = player.y - this.y;
    const dist = Math.hypot(dx, dy);

    // 1. Handle Windup State & Telegraphed Attack Execution
    if (this.isWindingUp) {
      this.windupTimer -= dt;
      if (this.windupTimer <= 0) {
        this.isWindingUp = false;
        this.attackCooldown = 1.8;

        if (this.type === ENEMY_TYPES.ENFORCER) {
          if (projectiles) {
            const angle = Math.atan2(dy, dx);
            projectiles.push({
              x: this.x,
              y: this.y,
              vx: Math.cos(angle) * 380,
              vy: Math.sin(angle) * 380,
              damage: this.damage,
              radius: 5,
              color: '#ff0055',
              isHostile: true,
              life: 2.0
            });
          }
        } else if (this.type === ENEMY_TYPES.SENTINEL) {
          // Ground Slam AoE
          if (dist <= 85) {
            player.takeDamage(this.damage, powerSystem);
          }
          import('../visuals/ShaderPipeline.js').then(({ shaderPipeline }) => {
            shaderPipeline.addShake(0.5);
          });
        } else if (this.type === ENEMY_TYPES.DISRUPTOR) {
          // Spawn localized EMP hazard zone at player's location
          this.hazardArea = { x: player.x, y: player.y, radius: 55, life: 3.0, maxLife: 3.0 };
        } else {
          // Melee strike (Drone / Stalker)
          if (dist <= this.attackRange + 15) {
            player.takeDamage(this.damage, powerSystem);
          }
        }
      }
      return; // Freeze movement during attack windup execution
    }

    // 2. Tactical Movement AI
    if (dist < 480 && dist > 10) {
      const moveX = (dx / dist) * this.speed * dt;
      const moveY = (dy / dist) * this.speed * dt;

      if (this.type === ENEMY_TYPES.ENFORCER && dist < 150) {
        this.x -= moveX * 0.5;
        this.y -= moveY * 0.5;
      } else if (this.type === ENEMY_TYPES.STALKER && dist < 220 && dist > 60) {
        // Flank circling
        this.x += -moveY * 1.2;
        this.y += moveX * 1.2;
      } else {
        this.x += moveX;
        this.y += moveY;
      }
    }

    // 3. Initiate Windup when in Range
    if (dist <= this.attackRange && this.attackCooldown <= 0 && !this.isWindingUp) {
      this.isWindingUp = true;
      this.windupTimer = this.windupDuration;
    }

    // 4. Update Disruptor EMP Hazard Field
    if (this.hazardArea) {
      this.hazardArea.life -= dt;
      if (Math.hypot(player.x - this.hazardArea.x, player.y - this.hazardArea.y) < this.hazardArea.radius) {
        if (Math.random() < 0.1) {
          player.takeDamage(3, powerSystem);
        }
      }
      if (this.hazardArea.life <= 0) {
        this.hazardArea = null;
      }
    }
  }

  takeDamage(amount, source = 'MELEE') {
    if (!this.isAlive) return;

    this.health -= amount;
    if (this.health <= 0) {
      this.health = 0;
      this.isAlive = false;
      this.isWindingUp = false;
      this.hazardArea = null;

      // Report enemy defeat to TeamAPI (Sirish's GameState and MissionSystem)
      KaustubAPI.enemyDefeated(this.id);
    }
  }

  render(ctx, camera) {
    if (!this.isAlive) return;

    const screenX = this.x - camera.x;
    const screenY = this.y - camera.y;

    ctx.save();
    ctx.translate(screenX, screenY);

    // 1. Telegraph Visual Indicators
    if (this.isWindingUp) {
      const progress = 1 - (this.windupTimer / this.windupDuration);
      if (this.type === ENEMY_TYPES.SENTINEL) {
        // Expanding Red Danger Circle
        ctx.strokeStyle = 'rgba(255, 34, 0, 0.8)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(0, 0, 65 * progress, 0, Math.PI * 2);
        ctx.stroke();
        ctx.fillStyle = 'rgba(255, 34, 0, 0.18)';
        ctx.fill();
      } else if (this.type === ENEMY_TYPES.ENFORCER) {
        // Laser Targeting Line
        ctx.strokeStyle = 'rgba(255, 0, 85, 0.7)';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([6, 4]);
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(200, 0);
        ctx.stroke();
        ctx.setLineDash([]);
      } else {
        // Warning Halo
        ctx.strokeStyle = '#ff0033';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.arc(0, 0, this.radius + 8 * progress, 0, Math.PI * 2);
        ctx.stroke();
      }
    }

    if (this.inStasis) {
      ctx.beginPath();
      ctx.arc(0, 0, this.radius + 6, 0, Math.PI * 2);
      ctx.strokeStyle = '#00ff66';
      ctx.lineWidth = 3;
      ctx.shadowColor = '#00ff66';
      ctx.shadowBlur = 10;
      ctx.stroke();
    }

    ctx.beginPath();
    ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
    ctx.fillStyle = '#111';
    ctx.fill();
    ctx.strokeStyle = this.color;
    ctx.lineWidth = 2.5;
    ctx.shadowColor = this.color;
    ctx.shadowBlur = 8;
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(0, 0, 4, 0, Math.PI * 2);
    ctx.fillStyle = this.color;
    ctx.fill();

    ctx.restore();

    // 2. Render Disruptor Hazard Area
    if (this.hazardArea) {
      ctx.save();
      const hx = this.hazardArea.x - camera.x;
      const hy = this.hazardArea.y - camera.y;
      ctx.strokeStyle = 'rgba(0, 255, 204, 0.6)';
      ctx.fillStyle = 'rgba(0, 255, 204, 0.12)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(hx, hy, this.hazardArea.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    }

    // 3. Overhead Health Bar
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
