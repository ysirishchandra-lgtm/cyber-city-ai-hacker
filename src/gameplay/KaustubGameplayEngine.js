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
    this.mousePos = {
      x: typeof window !== 'undefined' ? window.innerWidth / 2 : 400,
      y: typeof window !== 'undefined' ? window.innerHeight / 2 : 300
    };

    this.currentScene = 'BOOT';
    this.levelTransitionTimer = 0;
    this._setupInputs();
  }

  async init() {
    console.log('[KaustubEngine] Gameplay engine initialized and bound to TeamAPI & GameState');
    this.reset();
    this.exportRenderState();
  }

  _setupInputs() {
    if (typeof window === 'undefined') return;

    window.addEventListener('keydown', (e) => {
      this.keys[e.key] = true;

      if ((e.key === 'e' || e.key === 'E') && gameState.isPlaying()) {
        KaustubAPI.npcInteracted('INFORMANT_KIRA');
        eventBus.emit(EVENTS.CLUE_DISCOVERED, { target: 'INTERACTABLE_CLUE' });
      }

      if ((e.key === 'q' || e.key === 'Q') && gameState.isPlaying()) {
        if (gameState.hasPower()) {
          this.powerSystem.activate(this.player, this.enemies, this.particleEffects);
        }
      }

      if ((e.key === 'r' || e.key === 'R') && gameState.isPlaying()) {
        if (gameState.hasPower()) {
          this.powerSystem.activate(this.player, this.enemies, this.particleEffects);
        }
      }

      if ((e.key === 'g' || e.key === 'G') && gameState.isPlaying()) {
        // Secret Glitch Power: Freeze all enemies in stasis
        this.enemies.forEach(en => { en.inStasis = true; en.stasisTimer = 2.5; });
        import('../visuals/ShaderPipeline.js').then(({ shaderPipeline }) => {
          shaderPipeline.triggerGlitch(0.9);
          shaderPipeline.addShake(0.6);
        });
        import('../visuals/AudioEngine.js').then(({ audioEngine }) => {
          audioEngine.playPowerActivation('STRATEGIC');
        });
      }

      if (e.key === ' ' && gameState.isPlaying()) {
        this.player.dodge();
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
      if (!gameState.isPlaying()) return;

      if (e.button === 0) {
        // Left Click = Light Attack (3-hit combo)
        this.player.attack(this.enemies, this.particleEffects);
      } else if (e.button === 2) {
        // Right Click = Power activation after awakening, or Heavy Attack
        if (gameState.hasPower()) {
          this.powerSystem.activate(this.player, this.enemies, this.particleEffects);
        } else {
          this.player.heavyAttack(this.enemies, this.particleEffects);
        }
      }
    });

    window.addEventListener('contextmenu', (e) => {
      // Prevent default context menu on right click during gameplay
      if (gameState.isPlaying()) e.preventDefault();
    });
  }

  reset() {
    this.player.reset(200, 300);
    this.powerSystem = new PowerSystem();
    this.hero = new HeroAI(1200, 300);
    this.enemies = [];
    this.projectiles = [];
    this.particleEffects = [];
    this.levelTransitionTimer = 0;
    this._areaTriggersChecked = {};
    this.exportRenderState();
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
    this.exportRenderState();
  }

  setupLevel1() {
    this.player.reset(200, 300);
    this.enemies = [
      new Enemy('drone_1', 500, 200, ENEMY_TYPES.DRONE),
      new Enemy('drone_2', 600, 400, ENEMY_TYPES.DRONE),
      new Enemy('drone_3', 750, 250, ENEMY_TYPES.DRONE),
      new Enemy('drone_4', 850, 450, ENEMY_TYPES.DRONE)
    ];
    this._areaTriggersChecked = {};
  }

  setupLevel2() {
    this.player.x = 200;
    this.player.y = 300;
    this.enemies = [
      new Enemy('enforcer_1', 600, 200, ENEMY_TYPES.ENFORCER),
      new Enemy('stalker_1', 750, 400, ENEMY_TYPES.STALKER),
      new Enemy('enforcer_2', 900, 300, ENEMY_TYPES.ENFORCER),
      new Enemy('stalker_2', 1050, 500, ENEMY_TYPES.STALKER)
    ];

    this.hero.x = 1300;
    this.hero.y = 300;
    this.hero.detectPlayer(this.player);
    this._areaTriggersChecked = {};
  }

  setupLevel3() {
    this.player.x = 200;
    this.player.y = 300;
    this.enemies = [
      new Enemy('sentinel_1', 550, 250, ENEMY_TYPES.SENTINEL),
      new Enemy('sentinel_2', 750, 450, ENEMY_TYPES.SENTINEL),
      new Enemy('enforcer_3', 950, 300, ENEMY_TYPES.ENFORCER)
    ];

    this.hero.triggerConfrontation();
    this._areaTriggersChecked = {};
  }

  setupFinalBattle() {
    this.enemies = [];
    this.hero.x = 800;
    this.hero.y = 300;
    this.hero.startFinalBattle();
    KaustubAPI.npcInteracted('ATLAS_FINAL');
  }

  update(state, dt) {
    if (!gameState.isPlaying()) return;

    this.powerSystem.update(dt);

    // Update Player
    this.player.handleInput(this.keys, this.mousePos, this.camera, dt);

    // Camera follow
    const winW = typeof window !== 'undefined' ? window.innerWidth : 800;
    const winH = typeof window !== 'undefined' ? window.innerHeight : 600;
    const targetCamX = this.player.x - winW / 2;
    const targetCamY = this.player.y - winH / 2;
    this.camera.x += (targetCamX - this.camera.x) * 0.1;
    this.camera.y += (targetCamY - this.camera.y) * 0.1;

    // Check dynamic area triggers based on player progression
    if (this.currentScene === 'LEVEL_1' || this.currentScene === 'CITY_NORMAL') {
      KaustubAPI.playerEnteredArea('SAFEHOUSE_L1');
      if (this.player.x > 350) {
        KaustubAPI.npcInteracted('INFORMANT_KIRA');
        KaustubAPI.playerEnteredArea('OLD_DISTRICT');
      }
    } else if (this.currentScene === 'LEVEL_2') {
      if (this.player.x > 450) {
        KaustubAPI.playerEscapedArea('PATROL_ZONE');
      }
      if (this.player.x > 900) {
        KaustubAPI.playerEnteredArea('ROOFTOP_MEETING');
      }
    } else if (this.currentScene === 'LEVEL_3' || this.currentScene === 'FINAL_BATTLE') {
      if (this.player.x > 600) {
        KaustubAPI.playerEnteredArea('ATLAS_DISTRICT');
        KaustubAPI.npcInteracted('ATLAS_FINAL');
      }
    }

    // Update Enemies
    this.enemies.forEach(enemy => {
      if (enemy.isAlive) {
        enemy.update(dt, this.player, this.powerSystem, this.projectiles);
      }
    });

    // Update Hero AI
    if (this.currentScene !== 'LEVEL_1' && this.currentScene !== 'CITY_NORMAL') {
      this.hero.update(dt, this.player, this.powerSystem, this.projectiles, this.particleEffects);
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

    // Export render state
    this.exportRenderState();
  }

  exportRenderState() {
    if (typeof window === 'undefined') return;
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
