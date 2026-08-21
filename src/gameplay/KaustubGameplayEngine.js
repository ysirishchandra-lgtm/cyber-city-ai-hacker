/**
 * SCAR — THE LAST CHOICE
 * Master Gameplay Engine (KAUSTUB — GAMEPLAY)
 * 
 * Implements Sirish's GameManager engine interface:
 * - init()
 * - update(state, dt)
 * - setScene(sceneName)
 * - reset()
 */

import { KaustubAPI } from '../integration/TeamAPI.js';
import { eventBus, EVENTS } from '../core/EventBus.js';
import { gameState, GAME_PHASE, POWER_PATH } from '../core/GameState.js';
import { Player } from './Player.js';
import { PowerSystem } from './PowerSystem.js';
import { Enemy, ENEMY_TYPES } from './EnemySpawner.js';
import { HeroAI } from './HeroAI.js';

export class KaustubGameplayEngine {
  constructor() {
    this.player = new Player(200, 300);
    this.powerSystem = new PowerSystem();
    this.hero = new HeroAI(1200, 300);

    this.enemies = [];
    this.projectiles = [];
    this.particleEffects = [];

    this.camera = { x: 0, y: 0 };
    this.keys = {};
    this.mousePos = { x: window.innerWidth / 2, y: window.innerHeight / 2 };

    this.currentScene = 'BOOT';
    this._setupInputs();
  }

  async init() {
    console.log('[KaustubEngine] Gameplay engine initialized and bound to TeamAPI & GameState');
    this.reset();
  }

  _setupInputs() {
    window.addEventListener('keydown', (e) => {
      this.keys[e.key] = true;

      if (e.key === ' ' && gameState.isPlaying()) {
        if (gameState.hasPower()) {
          this.powerSystem.activate(this.player, this.enemies, this.particleEffects);
        }
      }
    });

    window.addEventListener('keyup', (e) => {
      this.keys[e.key] = false;
    });

    window.addEventListener('mousemove', (e) => {
      this.mousePos.x = e.clientX;
      this.mousePos.y = e.clientY;
    });

    window.addEventListener('mousedown', (e) => {
      if (e.button === 0 && gameState.isPlaying()) {
        this.player.attack(this.enemies, this.particleEffects);
      }
    });
  }

  reset() {
    this.player.reset(200, 300);
    this.powerSystem = new PowerSystem();
    this.hero = new HeroAI(1200, 300);
    this.enemies = [];
    this.projectiles = [];
    this.particleEffects = [];
  }

  setScene(sceneName) {
    this.currentScene = sceneName;
    console.log(`[KaustubEngine] Setting scene: ${sceneName}`);

    switch (sceneName) {
      case 'CITY_NORMAL':
      case 'LEVEL_1':
        this.setupLevel1();
        break;
      case 'LEVEL_2':
        this.setupLevel2();
        break;
      case 'LEVEL_3':
        this.setupLevel3();
        break;
      case 'FINAL_BATTLE':
        this.setupFinalBattle();
        break;
    }
  }

  setupLevel1() {
    this.player.reset(200, 300);
    // Level 1: Weak drones, zero powers
    this.enemies = [
      new Enemy('drone_1', 500, 200, ENEMY_TYPES.DRONE),
      new Enemy('drone_2', 600, 400, ENEMY_TYPES.DRONE),
      new Enemy('drone_3', 750, 250, ENEMY_TYPES.DRONE),
      new Enemy('drone_4', 850, 450, ENEMY_TYPES.DRONE)
    ];
  }

  setupLevel2() {
    this.player.x = 200;
    this.player.y = 300;
    // Level 2: Enforcers & Stalkers
    this.enemies = [
      new Enemy('enforcer_1', 600, 200, ENEMY_TYPES.ENFORCER),
      new Enemy('stalker_1', 750, 400, ENEMY_TYPES.STALKER),
      new Enemy('enforcer_2', 900, 300, ENEMY_TYPES.ENFORCER),
      new Enemy('stalker_2', 1050, 500, ENEMY_TYPES.STALKER)
    ];

    this.hero.x = 1300;
    this.hero.y = 300;
    this.hero.detectPlayer(this.player);
  }

  setupLevel3() {
    this.player.x = 200;
    this.player.y = 300;
    // Level 3: Elite Heavy Sentinels
    this.enemies = [
      new Enemy('sentinel_1', 550, 250, ENEMY_TYPES.SENTINEL),
      new Enemy('sentinel_2', 750, 450, ENEMY_TYPES.SENTINEL),
      new Enemy('enforcer_3', 950, 300, ENEMY_TYPES.ENFORCER)
    ];

    this.hero.triggerConfrontation();
  }

  setupFinalBattle() {
    this.enemies = []; // Clear minion enemies
    this.hero.startFinalBattle();
  }

  update(state, dt) {
    if (!gameState.isPlaying()) return;

    this.powerSystem.update(dt);

    // Update Player
    this.player.handleInput(this.keys, this.mousePos, this.camera, dt);

    // Smooth Camera lerp
    const targetCamX = this.player.x - window.innerWidth / 2;
    const targetCamY = this.player.y - window.innerHeight / 2;
    this.camera.x += (targetCamX - this.camera.x) * 0.1;
    this.camera.y += (targetCamY - this.camera.y) * 0.1;

    // Update Enemies
    let aliveCount = 0;
    this.enemies.forEach(enemy => {
      if (enemy.isAlive) {
        aliveCount++;
        enemy.update(dt, this.player, this.powerSystem, this.projectiles);
      }
    });

    // Check Level 1 completion & trigger Scar Awakening
    if (aliveCount === 0 && (this.currentScene === 'LEVEL_1' || this.currentScene === 'CITY_NORMAL')) {
      if (!gameState.hasPower()) {
        gameState.receiveScar();
        const dominantPath = gameState._getDominantPath(gameState.get()) || POWER_PATH.AGGRESSIVE;
        gameState.awakePower(dominantPath);
        eventBus.emit(EVENTS.LEVEL_COMPLETED, { level: 1 });
      }
    } else if (aliveCount === 0 && this.currentScene === 'LEVEL_2') {
      eventBus.emit(EVENTS.LEVEL_COMPLETED, { level: 2 });
    } else if (aliveCount === 0 && this.currentScene === 'LEVEL_3') {
      eventBus.emit(EVENTS.LEVEL_COMPLETED, { level: 3 });
    }

    // Update Hero AI
    if (this.currentScene !== 'LEVEL_1' && this.currentScene !== 'CITY_NORMAL') {
      this.hero.update(dt, this.player, this.powerSystem, this.projectiles, this.particleEffects);

      if (this.currentScene === 'FINAL_BATTLE' && !this.hero.isAlive) {
        gameState.triggerEnding('HERO');
      }
    }

    // Update Projectiles
    this.projectiles = this.projectiles.filter(p => {
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.life -= dt;

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

    // Export internal render state for Ashwidha's renderer or PrototypeRenderer
    this.exportRenderState();
  }

  exportRenderState() {
    window.__SCAR_GAMEPLAY_STATE__ = {
      player: {
        x: this.player.x,
        y: this.player.y,
        radius: this.player.radius,
        facingAngle: this.player.facingAngle,
        isAttacking: this.player.isAttacking,
        health: gameState.getField('health'),
        stamina: this.player.stamina
      },
      camera: this.camera,
      enemies: this.enemies.filter(e => e.isAlive).map(e => ({
        id: e.id,
        x: e.x,
        y: e.y,
        type: e.type,
        health: e.health,
        maxHealth: e.maxHealth,
        color: e.color,
        inStasis: e.inStasis
      })),
      hero: {
        x: this.hero.x,
        y: this.hero.y,
        isAlive: this.hero.isAlive,
        health: this.hero.health,
        maxHealth: this.hero.maxHealth,
        state: this.hero.state,
        dialogueText: this.hero.dialogueText
      },
      projectiles: this.projectiles.map(p => ({ x: p.x, y: p.y, radius: p.radius, color: p.color })),
      particles: this.particleEffects.map(pt => ({ x: pt.x, y: pt.y, radius: pt.radius, color: pt.color, type: pt.type }))
    };
  }
}

export const kaustubEngine = new KaustubGameplayEngine();
