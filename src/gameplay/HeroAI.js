/**
 * SCAR — THE LAST CHOICE
 * Hero AI Boss & State Machine (KAUSTUB — GAMEPLAY)
 * 
 * States: OBSERVE, FOLLOW, CONFRONT, COUNTER, RETREAT
 * Integrated with Sirish's TeamAPI, EventBus, and GameState.
 */

import { KaustubAPI } from '../integration/TeamAPI.js';
import { eventBus, EVENTS } from '../core/EventBus.js';
import { POWER_PATH } from '../core/GameState.js';

export const HERO_STATES = {
  OBSERVE: 'OBSERVE',
  FOLLOW: 'FOLLOW',
  CONFRONT: 'CONFRONT',
  COUNTER: 'COUNTER',
  RETREAT: 'RETREAT'
};

export class HeroAI {
  constructor(x = 600, y = 300) {
    this.x = x;
    this.y = y;
    this.state = HERO_STATES.OBSERVE;

    this.maxHealth = 300;
    this.health = 300;
    this.speed = 140;
    this.radius = 24;

    this.isAlive = true;
    this.inFinalBattle = false;
    this.attackCooldown = 0;
    this.stateTimer = 0;

    this.dialogueText = '';
    this.dialogueTimer = 0;
  }

  detectPlayer(player) {
    if (this.state === HERO_STATES.OBSERVE) {
      this.state = HERO_STATES.FOLLOW;
      this.showDialogue("I sense a new presence... Someone born without a scar.");
      KaustubAPI.heroEncountered();
      eventBus.emit(EVENTS.HERO_DETECTED_PLAYER, { heroState: this.state });
    }
  }

  triggerConfrontation() {
    this.state = HERO_STATES.CONFRONT;
    this.showDialogue("Your choices reverberate through the city grid. Stop before it's too late!");
    eventBus.emit(EVENTS.HERO_ENCOUNTER, { heroState: this.state });
  }

  startFinalBattle() {
    this.inFinalBattle = true;
    this.state = HERO_STATES.COUNTER;
    this.showDialogue("If you will not turn back, I will end this myself!");
    eventBus.emit(EVENTS.FINAL_BATTLE_STARTED, { heroState: this.state });
  }

  showDialogue(text, duration = 4.0) {
    this.dialogueText = text;
    this.dialogueTimer = duration;
  }

  update(dt, player, powerSystem, projectiles, particleEffects) {
    if (!this.isAlive) return;

    if (this.attackCooldown > 0) this.attackCooldown -= dt;
    if (this.dialogueTimer > 0) this.dialogueTimer -= dt;

    const dx = player.x - this.x;
    const dy = player.y - this.y;
    const dist = Math.hypot(dx, dy);

    // Adapt combat parameters based on actual player power path
    const playerPath = KaustubAPI.getPowerPath();
    let aggressionFactor = 1.0;
    let attackDelay = 1.6;

    if (playerPath === POWER_PATH.AGGRESSIVE || playerPath === 'DESTRUCTION') {
      // Aggressive player -> Hero becomes aggressive
      aggressionFactor = 1.5;
      attackDelay = 1.0;
    } else if (playerPath === POWER_PATH.PROTECTIVE || playerPath === 'PROTECTION') {
      // Protective player -> Hero becomes hesitant
      aggressionFactor = 0.8;
      attackDelay = 2.2;
    } else if (playerPath === POWER_PATH.STRATEGIC || playerPath === 'CONTROL') {
      // Strategic player -> Hero becomes cautious
      aggressionFactor = 1.1;
      attackDelay = 1.8;
    }

    switch (this.state) {
      case HERO_STATES.OBSERVE:
        if (dist < 350) {
          this.detectPlayer(player);
        }
        break;

      case HERO_STATES.FOLLOW:
        if (dist > 220) {
          this.x += (dx / dist) * (this.speed * 0.7) * dt;
          this.y += (dy / dist) * (this.speed * 0.7) * dt;
        } else if (dist < 150) {
          this.x -= (dx / dist) * (this.speed * 0.5) * dt;
          this.y -= (dy / dist) * (this.speed * 0.5) * dt;
        }
        break;

      case HERO_STATES.CONFRONT:
        if (dist > 160) {
          this.x += (dx / dist) * this.speed * dt;
          this.y += (dy / dist) * this.speed * dt;
        }
        break;

      case HERO_STATES.COUNTER:
        if (dist > 80 && playerPath !== POWER_PATH.STRATEGIC) {
          this.x += (dx / dist) * (this.speed * aggressionFactor) * dt;
          this.y += (dy / dist) * (this.speed * aggressionFactor) * dt;
        } else if (playerPath === POWER_PATH.STRATEGIC && dist < 180) {
          // Keep tactical distance against Strategic control player
          this.x -= (dx / dist) * this.speed * dt;
          this.y -= (dy / dist) * this.speed * dt;
        }

        if (dist <= 200 && this.attackCooldown <= 0) {
          this.attackCooldown = attackDelay;
          this.executeHeroAttack(player, dx, dy, dist, projectiles, particleEffects, playerPath);
        }
        break;

      case HERO_STATES.RETREAT:
        this.x -= (dx / dist) * (this.speed * 1.4) * dt;
        this.y -= (dy / dist) * (this.speed * 1.4) * dt;

        this.stateTimer += dt;
        if (this.stateTimer > 2.0) {
          this.state = HERO_STATES.COUNTER;
          this.stateTimer = 0;
        }
        break;
    }
  }

  executeHeroAttack(player, dx, dy, dist, projectiles, particleEffects, playerPath) {
    if (projectiles) {
      const angle = Math.atan2(dy, dx);

      if (playerPath === POWER_PATH.AGGRESSIVE || playerPath === 'DESTRUCTION') {
        // Triple beam burst against Destruction player
        for (let offset of [-0.3, 0, 0.3]) {
          projectiles.push({
            x: this.x,
            y: this.y,
            vx: Math.cos(angle + offset) * 380,
            vy: Math.sin(angle + offset) * 380,
            damage: 18,
            radius: 5,
            color: '#00ffff',
            isHostile: true,
            life: 2.0
          });
        }
      } else {
        // Focused laser beam
        projectiles.push({
          x: this.x,
          y: this.y,
          vx: Math.cos(angle) * 420,
          vy: Math.sin(angle) * 420,
          damage: 22,
          radius: 7,
          color: '#ffffff',
          isHostile: true,
          life: 2.0
        });
      }
    }
  }

  takeDamage(amount, powerSystem) {
    if (!this.isAlive || !this.inFinalBattle) return;

    this.health -= amount;

    if (amount >= 35 && this.state === HERO_STATES.COUNTER) {
      this.state = HERO_STATES.RETREAT;
      this.stateTimer = 0;
    }

    if (this.health <= 0) {
      this.health = 0;
      this.isAlive = false;

      eventBus.emit(EVENTS.FINAL_BATTLE_STARTED, {
        heroDefeated: true,
        health: 0
      });
    }
  }

  render(ctx, camera) {
    if (!this.isAlive) return;

    const screenX = this.x - camera.x;
    const screenY = this.y - camera.y;

    ctx.save();
    ctx.translate(screenX, screenY);

    ctx.beginPath();
    ctx.arc(0, 0, this.radius + 8, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(0, 243, 255, 0.4)';
    ctx.lineWidth = 3;
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
    ctx.strokeStyle = '#00ffff';
    ctx.lineWidth = 4;
    ctx.shadowColor = '#00ffff';
    ctx.shadowBlur = 18;
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(0, 0, 8, 0, Math.PI * 2);
    ctx.fillStyle = '#00f3ff';
    ctx.fill();

    ctx.restore();

    if (this.dialogueTimer > 0 && this.dialogueText) {
      ctx.font = '14px "Share Tech Mono", monospace';
      const textWidth = ctx.measureText(this.dialogueText).width;
      const bubbleX = screenX - textWidth / 2 - 10;
      const bubbleY = screenY - this.radius - 40;

      ctx.fillStyle = 'rgba(10, 10, 20, 0.85)';
      ctx.strokeStyle = '#00ffff';
      ctx.lineWidth = 1;
      ctx.fillRect(bubbleX, bubbleY, textWidth + 20, 26);
      ctx.strokeRect(bubbleX, bubbleY, textWidth + 20, 26);

      ctx.fillStyle = '#00ffff';
      ctx.fillText(this.dialogueText, bubbleX + 10, bubbleY + 18);
    }

    if (this.inFinalBattle) {
      const barWidth = 60;
      const barHeight = 6;
      const barX = screenX - barWidth / 2;
      const barY = screenY - this.radius - 14;

      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(barX, barY, barWidth, barHeight);

      const hpRatio = this.health / this.maxHealth;
      ctx.fillStyle = '#00ffff';
      ctx.fillRect(barX, barY, barWidth * hpRatio, barHeight);
    }
  }
}
