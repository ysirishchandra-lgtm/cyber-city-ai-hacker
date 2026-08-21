/**
 * SCAR — THE LAST CHOICE
 * Core Gameplay Engine & Renderer (KAUSTUB — GAMEPLAY)
 */

import { eventBus, GAME_EVENTS } from './events.js';
import { metrics } from './metrics.js';
import { Player } from './player.js';
import { PowerSystem, POWER_PATHS } from './powers.js';
import { Enemy, ENEMY_TYPES } from './enemies.js';
import { HeroAI, HERO_STATES } from './hero-ai.js';

export const GAME_STATES = {
  START_SCREEN: 'START_SCREEN',
  LEVEL_1: 'LEVEL_1',           // The Weak (No Powers)
  SCAR_EVENT: 'SCAR_EVENT',     // Awakening
  LEVEL_2: 'LEVEL_2',           // Awakened Power
  LEVEL_3: 'LEVEL_3',           // Hunted & Confrontation
  FINAL_BATTLE: 'FINAL_BATTLE', // Boss Fight
  FINAL_CHOICE: 'FINAL_CHOICE', // Becoming Hero/Villain/Savior/Human
  ENDING: 'ENDING',
  GAME_OVER: 'GAME_OVER'
};

export class GameEngine {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');

    this.width = canvas.width = window.innerWidth;
    this.height = canvas.height = window.innerHeight;

    this.gameState = GAME_STATES.START_SCREEN;

    this.camera = { x: 0, y: 0 };
    this.keys = {};
    this.mousePos = { x: this.width / 2, y: this.height / 2 };

    this.player = new Player(200, 300);
    this.powerSystem = new PowerSystem();
    this.hero = new HeroAI(1200, 300);

    this.enemies = [];
    this.projectiles = [];
    this.particleEffects = [];

    this.levelTimer = 0;
    this.lastTime = performance.now();

    this.setupInputs();
    this.setupResizeListener();
  }

  setupInputs() {
    window.addEventListener('keydown', (e) => {
      this.keys[e.key] = true;
      
      if (e.key === ' ' && this.gameState !== GAME_STATES.START_SCREEN && this.gameState !== GAME_STATES.FINAL_CHOICE) {
        // Spacebar activates Power
        if (this.powerSystem.unlocked) {
          this.powerSystem.activate(this.player, this.enemies, this.particleEffects);
        }
      }
    });

    window.addEventListener('keyup', (e) => {
      this.keys[e.key] = false;
    });

    window.addEventListener('mousemove', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      this.mousePos.x = e.clientX - rect.left;
      this.mousePos.y = e.clientY - rect.top;
    });

    window.addEventListener('mousedown', (e) => {
      if (e.button === 0 && this.isGameActive()) {
        // Left click combat attack
        this.player.attack(this.enemies, this.particleEffects);
      }
    });
  }

  setupResizeListener() {
    window.addEventListener('resize', () => {
      this.width = this.canvas.width = window.innerWidth;
      this.height = this.canvas.height = window.innerHeight;
    });
  }

  isGameActive() {
    return [
      GAME_STATES.LEVEL_1,
      GAME_STATES.SCAR_EVENT,
      GAME_STATES.LEVEL_2,
      GAME_STATES.LEVEL_3,
      GAME_STATES.FINAL_BATTLE
    ].includes(this.gameState);
  }

  startGame() {
    metrics.reset();
    this.player = new Player(200, 300);
    this.powerSystem = new PowerSystem();
    this.hero = new HeroAI(1400, 300);
    this.enemies = [];
    this.projectiles = [];
    this.particleEffects = [];

    this.loadLevel1();
    this.gameState = GAME_STATES.LEVEL_1;

    eventBus.emit(GAME_EVENTS.GAME_STARTED, { timestamp: Date.now() });
  }

  loadLevel1() {
    // Level 1: Weak, no powers. Spawns 4 basic Cyber Drones
    this.enemies = [
      new Enemy(500, 200, ENEMY_TYPES.DRONE),
      new Enemy(600, 400, ENEMY_TYPES.DRONE),
      new Enemy(750, 250, ENEMY_TYPES.DRONE),
      new Enemy(850, 450, ENEMY_TYPES.DRONE)
    ];
    metrics.completeMission('level_1_start', 'Survive the Weak District');
  }

  triggerScarEvent() {
    this.gameState = GAME_STATES.SCAR_EVENT;
    eventBus.emit(GAME_EVENTS.SCAR_RECEIVED, { playerHP: this.player.health });

    // Determine dominant choice path and awaken power
    const dominantPath = metrics.calculateDominantPath() || POWER_PATHS.DESTRUCTION;
    this.powerSystem.awakenPower(dominantPath);

    setTimeout(() => {
      this.loadLevel2();
    }, 3000);
  }

  loadLevel2() {
    this.gameState = GAME_STATES.LEVEL_2;
    this.player.x = 200;
    this.player.y = 300;

    // Spawn Enforcers & Stalkers
    this.enemies = [
      new Enemy(600, 200, ENEMY_TYPES.ENFORCER),
      new Enemy(750, 400, ENEMY_TYPES.STALKER),
      new Enemy(900, 300, ENEMY_TYPES.ENFORCER),
      new Enemy(1050, 500, ENEMY_TYPES.STALKER)
    ];

    this.hero.x = 1300;
    this.hero.y = 300;
    this.hero.detectPlayer(this.player);

    metrics.completeMission('level_2_awakened', 'Master Awakened Power');
  }

  loadLevel3() {
    this.gameState = GAME_STATES.LEVEL_3;
    this.player.x = 200;
    this.player.y = 300;

    // Spawn Heavy Sentinels
    this.enemies = [
      new Enemy(550, 250, ENEMY_TYPES.SENTINEL),
      new Enemy(750, 450, ENEMY_TYPES.SENTINEL),
      new Enemy(950, 300, ENEMY_TYPES.ENFORCER)
    ];

    this.hero.triggerConfrontation();

    metrics.completeMission('level_3_hunted', 'Reach Final Chamber');
  }

  startFinalBattle() {
    this.gameState = GAME_STATES.FINAL_BATTLE;
    this.enemies = []; // Clear minion enemies
    this.hero.startFinalBattle();
    metrics.completeMission('final_battle', 'Confront the Hero');
  }

  triggerFinalChoice() {
    this.gameState = GAME_STATES.FINAL_CHOICE;
    eventBus.emit(GAME_EVENTS.ENDING_TRIGGERED, { dominantPath: metrics.dominantPath });
  }

  makeFinalChoice(choice) {
    metrics.finishGame(choice, this.hero.isAlive ? 'SPARED_HERO' : 'DEFEATED_HERO');
    eventBus.emit(GAME_EVENTS.FINAL_CHOICE_MADE, { choice });
    this.gameState = GAME_STATES.ENDING;
  }

  update(dt) {
    if (!this.isGameActive()) return;

    this.powerSystem.update(dt);

    // Update Player Movement & Actions
    this.player.handleInput(this.keys, this.mousePos, this.camera, dt);

    // Smooth Camera lerp following player
    const targetCamX = this.player.x - this.width / 2;
    const targetCamY = this.player.y - this.height / 2;
    this.camera.x += (targetCamX - this.camera.x) * 0.1;
    this.camera.y += (targetCamY - this.camera.y) * 0.1;

    // Update Enemies
    let aliveEnemies = 0;
    this.enemies.forEach(enemy => {
      if (enemy.isAlive) {
        aliveEnemies++;
        enemy.update(dt, this.player, this.powerSystem, this.projectiles);
      }
    });

    // Level Transition Triggers
    if (aliveEnemies === 0) {
      if (this.gameState === GAME_STATES.LEVEL_1) {
        this.triggerScarEvent();
      } else if (this.gameState === GAME_STATES.LEVEL_2) {
        this.loadLevel3();
      } else if (this.gameState === GAME_STATES.LEVEL_3) {
        this.startFinalBattle();
      }
    }

    // Update Hero AI
    if (this.gameState === GAME_STATES.LEVEL_2 || this.gameState === GAME_STATES.LEVEL_3 || this.gameState === GAME_STATES.FINAL_BATTLE) {
      this.hero.update(dt, this.player, this.powerSystem, this.projectiles, this.particleEffects);

      if (this.gameState === GAME_STATES.FINAL_BATTLE && !this.hero.isAlive) {
        this.triggerFinalChoice();
      }
    }

    // Update Projectiles
    this.projectiles = this.projectiles.filter(p => {
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.life -= dt;

      // Hit Player
      if (p.isHostile) {
        const dist = Math.hypot(p.x - this.player.x, p.y - this.player.y);
        if (dist <= this.player.radius + p.radius) {
          this.player.takeDamage(p.damage, this.powerSystem);
          return false;
        }
      }

      return p.life > 0;
    });

    // Update Particles
    this.particleEffects = this.particleEffects.filter(pt => {
      pt.life -= dt;
      if (pt.type === 'nova') {
        pt.radius += (pt.maxRadius - pt.radius) * 0.15;
      }
      return pt.life > 0;
    });

    // Check Player Death
    if (this.player.health <= 0 && this.gameState !== GAME_STATES.GAME_OVER) {
      this.gameState = GAME_STATES.GAME_OVER;
    }
  }

  render() {
    this.ctx.fillStyle = '#0a0a12';
    this.ctx.fillRect(0, 0, this.width, this.height);

    // Draw Cyber Grid Environment
    this.renderEnvironment();

    if (this.isGameActive()) {
      // Render Particles
      this.renderParticles();

      // Render Enemies
      this.enemies.forEach(e => e.render(this.ctx, this.camera));

      // Render Projectiles
      this.projectiles.forEach(p => {
        this.ctx.beginPath();
        this.ctx.arc(p.x - this.camera.x, p.y - this.camera.y, p.radius, 0, Math.PI * 2);
        this.ctx.fillStyle = p.color;
        this.ctx.shadowColor = p.color;
        this.ctx.shadowBlur = 10;
        this.ctx.fill();
      });

      // Render Hero AI
      if (this.gameState !== GAME_STATES.LEVEL_1) {
        this.hero.render(this.ctx, this.camera);
      }

      // Render Player
      this.player.render(this.ctx, this.camera);

      // Render HUD
      this.renderHUD();
    }
  }

  renderEnvironment() {
    const gridSize = 60;
    const startX = -((this.camera.x) % gridSize);
    const startY = -((this.camera.y) % gridSize);

    this.ctx.strokeStyle = 'rgba(0, 243, 255, 0.06)';
    this.ctx.lineWidth = 1;

    for (let x = startX; x < this.width; x += gridSize) {
      this.ctx.beginPath();
      this.ctx.moveTo(x, 0);
      this.ctx.lineTo(x, this.height);
      this.ctx.stroke();
    }

    for (let y = startY; y < this.height; y += gridSize) {
      this.ctx.beginPath();
      this.ctx.moveTo(0, y);
      this.ctx.lineTo(this.width, y);
      this.ctx.stroke();
    }
  }

  renderParticles() {
    this.particleEffects.forEach(pt => {
      const screenX = pt.x - this.camera.x;
      const screenY = pt.y - this.camera.y;

      this.ctx.save();
      if (pt.type === 'nova' || pt.type === 'stasis') {
        this.ctx.beginPath();
        this.ctx.arc(screenX, screenY, pt.radius, 0, Math.PI * 2);
        this.ctx.strokeStyle = pt.color;
        this.ctx.lineWidth = 4;
        this.ctx.shadowColor = pt.color;
        this.ctx.shadowBlur = 15;
        this.ctx.stroke();
      } else if (pt.type === 'barrier') {
        this.ctx.beginPath();
        this.ctx.arc(screenX, screenY, this.player.radius + 15, 0, Math.PI * 2);
        this.ctx.strokeStyle = pt.color;
        this.ctx.lineWidth = 3;
        this.ctx.shadowColor = pt.color;
        this.ctx.shadowBlur = 12;
        this.ctx.stroke();
      }
      this.ctx.restore();
    });
  }

  renderHUD() {
    // Top Left: State & Power Indicator
    this.ctx.font = '16px "Share Tech Mono", monospace';
    this.ctx.fillStyle = '#00f3ff';
    this.ctx.fillText(`STATUS: ${this.gameState}`, 20, 35);

    const powerName = this.powerSystem.getPowerName();
    const cooldownText = this.powerSystem.cooldownTimer > 0 
      ? `(${this.powerSystem.cooldownTimer.toFixed(1)}s)` 
      : '[SPACE TO ACTIVATE]';
    this.ctx.fillStyle = this.powerSystem.unlocked ? '#00ff66' : '#ff0055';
    this.ctx.fillText(`POWER: ${powerName} ${this.powerSystem.unlocked ? cooldownText : '[DORMANT]'}`, 20, 60);

    // Stamina Bar
    this.ctx.fillStyle = 'rgba(0,0,0,0.5)';
    this.ctx.fillRect(20, 75, 150, 8);
    this.ctx.fillStyle = '#00f3ff';
    this.ctx.fillRect(20, 75, (this.player.stamina / this.player.maxStamina) * 150, 8);
  }

  loop(currentTime) {
    const dt = Math.min(0.05, (currentTime - this.lastTime) / 1000);
    this.lastTime = currentTime;

    this.update(dt);
    this.render();

    requestAnimationFrame((t) => this.loop(t));
  }
}
