/**
 * SCAR — THE LAST CHOICE
 * Master Gameplay Engine (KAUSTUB & SIRISH — Gameplay & Systems)
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

    // Spatial Warehouse Target Objective: Coordinate (900, 350), 50px radius disc
    this.warehouseTarget = { x: 900, y: 350, radius: 50 };
    this._warehouseObjectiveTriggered = false;

    // Environmental Combat Objects
    this.environmentObjects = {
      cameraHack: { x: 480, y: 220, hacked: false, label: 'SECURITY CAM' },
      explosiveBarrel: { x: 820, y: 350, detonated: false, label: 'EXPLOSIVE BARREL' },
      turret: { x: 1180, y: 250, hacked: false, cooldown: 0, label: 'DEFENSE TURRET' },
      electricalPuddle: { x: 700, y: 480, radius: 50 }
    };

    this.ally = null; // Spawned if player chose protective/mercy path

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
        // 1. Check for Execution Finisher
        if (this.player.executeTarget && this.player.executeTarget.isAlive) {
          this.player.execute(this.enemies, this.particleEffects);
          return;
        }

        // 2. Interactive Environmental Objects Check
        const distToCam = Math.hypot(this.player.x - this.environmentObjects.cameraHack.x, this.player.y - this.environmentObjects.cameraHack.y);
        if (distToCam < 75 && !this.environmentObjects.cameraHack.hacked) {
          this.environmentObjects.cameraHack.hacked = true;
          // Stun all nearby enemies
          this.enemies.forEach(en => {
            if (en.isAlive && Math.hypot(en.x - 480, en.y - 220) < 260) {
              en.applyStasis(3.0);
            }
          });
          import('../visuals/ShaderPipeline.js').then(({ shaderPipeline }) => {
            shaderPipeline.triggerFlash('#00f3ff', 0.5);
            shaderPipeline.triggerGlitch(0.4);
          });
          import('../visuals/ParticleSystem.js').then(({ particleSystem }) => {
            particleSystem.spawnDamageNumber(480, 190, 'CAM OVERLOAD: STUN ACTIVE!', true, '#00f3ff');
            particleSystem.spawnNova(480, 220, 180, '#00f3ff');
          });
          eventBus.emit(EVENTS.CLUE_DISCOVERED, { target: 'CAM_HACK_STUN' });
          return;
        }

        const distToBarrel = Math.hypot(this.player.x - this.environmentObjects.explosiveBarrel.x, this.player.y - this.environmentObjects.explosiveBarrel.y);
        if (distToBarrel < 80 && !this.environmentObjects.explosiveBarrel.detonated) {
          this._detonateBarrel();
          return;
        }

        const distToTurret = Math.hypot(this.player.x - this.environmentObjects.turret.x, this.player.y - this.environmentObjects.turret.y);
        if (distToTurret < 75 && !this.environmentObjects.turret.hacked) {
          this.environmentObjects.turret.hacked = true;
          import('../visuals/ParticleSystem.js').then(({ particleSystem }) => {
            particleSystem.spawnDamageNumber(1180, 210, 'TURRET HACKED: ALLY ONLINE!', true, '#00ff88');
          });
          return;
        }

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
        this.player.dodge(this.enemies);
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
        // Check if hitting explosive barrel with attack
        if (Math.hypot(this.player.x - 820, this.player.y - 350) < 95) {
          this._detonateBarrel();
        }
      } else if (e.button === 2) {
        // Right Click = Power activation after awakening, or Heavy Attack
        if (gameState.hasPower()) {
          this.powerSystem.activate(this.player, this.enemies, this.particleEffects);
        } else {
          this.player.heavyAttack(this.enemies, this.particleEffects);
          if (Math.hypot(this.player.x - 820, this.player.y - 350) < 110) {
            this._detonateBarrel();
          }
        }
      }
    });

    window.addEventListener('contextmenu', (e) => {
      if (gameState.isPlaying()) e.preventDefault();
    });
  }

  _detonateBarrel() {
    if (this.environmentObjects.explosiveBarrel.detonated) return;
    this.environmentObjects.explosiveBarrel.detonated = true;

    const bx = this.environmentObjects.explosiveBarrel.x;
    const by = this.environmentObjects.explosiveBarrel.y;

    // Deal 85 explosion damage to all nearby enemies
    this.enemies.forEach(en => {
      if (en.isAlive && Math.hypot(en.x - bx, en.y - by) < 130) {
        en.takeDamage(85, 'EXPLOSION');
      }
    });

    // Check if player in blast radius
    if (Math.hypot(this.player.x - bx, this.player.y - by) < 100) {
      this.player.takeDamage(15, this.powerSystem);
    }

    import('../visuals/ParticleSystem.js').then(({ particleSystem }) => {
      particleSystem.spawnNova(bx, by, 160, '#ff5500');
      particleSystem.spawnImpact(bx, by, '#ffaa00', 30);
      particleSystem.spawnDamageNumber(bx, by - 20, '💥 85 EXPLOSION!', true, '#ff5500');
    });

    import('../visuals/ShaderPipeline.js').then(({ shaderPipeline }) => {
      shaderPipeline.addShake(0.85);
      shaderPipeline.triggerFlash('#ff5500', 0.4);
    });

    import('../visuals/AudioEngine.js').then(({ audioEngine }) => {
      audioEngine.playImpact();
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
    this._warehouseObjectiveTriggered = false;
    this._areaTriggersChecked = {};
    this.environmentObjects.cameraHack.hacked = false;
    this.environmentObjects.explosiveBarrel.detonated = false;
    this.environmentObjects.turret.hacked = false;
    this.ally = null;
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
    this._warehouseObjectiveTriggered = false;
    this._areaTriggersChecked = {};
  }

  setupLevel2() {
    this.player.x = 200;
    this.player.y = 300;
    this.enemies = [
      new Enemy('enforcer_1', 600, 200, ENEMY_TYPES.ENFORCER),
      new Enemy('stalker_1', 750, 400, ENEMY_TYPES.STALKER),
      new Enemy('disruptor_1', 900, 300, ENEMY_TYPES.DISRUPTOR),
      new Enemy('stalker_2', 1050, 500, ENEMY_TYPES.STALKER)
    ];

    // Moral choice gameplay consequence: Rescued civilian / Resistance Ally appears
    if (gameState.getPowerPath() === POWER_PATH.PROTECTIVE || gameState.getField('protectiveCount') > 0) {
      this.ally = {
        x: 250,
        y: 320,
        isAlive: true,
        shootCooldown: 0,
        healCooldown: 4.0
      };
      import('../visuals/ParticleSystem.js').then(({ particleSystem }) => {
        particleSystem.spawnDamageNumber(this.player.x, this.player.y - 30, 'RESISTANCE ALLY DEPLOYED!', true, '#00ff88');
      });
    }

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
      new Enemy('disruptor_2', 750, 450, ENEMY_TYPES.DISRUPTOR),
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

    // Update Player locomotion and combat
    this.player.handleInput(this.keys, this.mousePos, this.camera, dt);

    // Camera follow with smooth damping
    const winW = typeof window !== 'undefined' ? window.innerWidth : 800;
    const winH = typeof window !== 'undefined' ? window.innerHeight : 600;
    const targetCamX = this.player.x - winW / 2;
    const targetCamY = this.player.y - winH / 2;
    this.camera.x += (targetCamX - this.camera.x) * 0.12;
    this.camera.y += (targetCamY - this.camera.y) * 0.12;

    // 1. Environmental Turret AI (if hacked by player)
    if (this.environmentObjects.turret.hacked) {
      this.environmentObjects.turret.cooldown -= dt;
      if (this.environmentObjects.turret.cooldown <= 0) {
        // Target nearest alive enemy
        let nearestEnemy = null;
        let minDist = 450;
        this.enemies.forEach(en => {
          if (en.isAlive) {
            const d = Math.hypot(en.x - 1180, en.y - 250);
            if (d < minDist) {
              minDist = d;
              nearestEnemy = en;
            }
          }
        });

        if (nearestEnemy) {
          this.environmentObjects.turret.cooldown = 1.2;
          const angle = Math.atan2(nearestEnemy.y - 250, nearestEnemy.x - 1180);
          this.projectiles.push({
            x: 1180,
            y: 250,
            vx: Math.cos(angle) * 450,
            vy: Math.sin(angle) * 450,
            damage: 35,
            radius: 5,
            color: '#00ff88',
            isHostile: false,
            life: 1.8
          });
        }
      }
    }

    // 2. Resistance Ally AI (Level 2)
    if (this.ally && this.ally.isAlive) {
      // Follow player at distance
      const distToPlayer = Math.hypot(this.player.x - this.ally.x, this.player.y - this.ally.y);
      if (distToPlayer > 80) {
        const angle = Math.atan2(this.player.y - this.ally.y, this.player.x - this.ally.x);
        this.ally.x += Math.cos(angle) * 120 * dt;
        this.ally.y += Math.sin(angle) * 120 * dt;
      }

      // Shoot at nearest enemy
      this.ally.shootCooldown -= dt;
      if (this.ally.shootCooldown <= 0) {
        let nearest = null;
        let minDist = 380;
        this.enemies.forEach(en => {
          if (en.isAlive) {
            const d = Math.hypot(en.x - this.ally.x, en.y - this.ally.y);
            if (d < minDist) {
              minDist = d;
              nearest = en;
            }
          }
        });

        if (nearest) {
          this.ally.shootCooldown = 1.4;
          const angle = Math.atan2(nearest.y - this.ally.y, nearest.x - this.ally.x);
          this.projectiles.push({
            x: this.ally.x,
            y: this.ally.y,
            vx: Math.cos(angle) * 400,
            vy: Math.sin(angle) * 400,
            damage: 20,
            radius: 4,
            color: '#00ff88',
            isHostile: false,
            life: 1.5
          });
        }
      }

      // Heal player periodically
      this.ally.healCooldown -= dt;
      if (this.ally.healCooldown <= 0) {
        this.ally.healCooldown = 6.0;
        KaustubAPI.playerHeal(12);
        import('../visuals/ParticleSystem.js').then(({ particleSystem }) => {
          particleSystem.spawnDamageNumber(this.player.x, this.player.y - 20, '+12 ALLY HEAL', false, '#00ff88');
        });
      }
    }

    // Check dynamic area triggers & warehouse target zone collision (< 50px radius)
    if (this.currentScene === 'LEVEL_1' || this.currentScene === 'CITY_NORMAL') {
      const distToWarehouse = Math.hypot(
        this.player.x - this.warehouseTarget.x,
        this.player.y - this.warehouseTarget.y
      );

      // Trigger zone completion event when character enters the cyan target disc (< 50px radius)
      if (distToWarehouse <= this.warehouseTarget.radius && !this._warehouseObjectiveTriggered) {
        this._warehouseObjectiveTriggered = true;
        KaustubAPI.playerEnteredArea('SAFEHOUSE_L1');

        eventBus.emit(EVENTS.MISSION_OBJECTIVE_UPDATED, {
          missionId: 'M1_SURVIVE_THE_NIGHT',
          objectiveId: 'obj_reach_safehouse',
          progress: 1,
          completed: true
        });

        eventBus.emit(EVENTS.CLUE_DISCOVERED, {
          target: 'WAREHOUSE_ZONE_COMPLETED',
          x: this.warehouseTarget.x,
          y: this.warehouseTarget.y
        });

        // Trigger celebratory audio and visual burst
        import('../visuals/AudioEngine.js').then(({ audioEngine }) => {
          audioEngine.playPowerActivation('STRATEGIC');
        });
        import('../visuals/ParticleSystem.js').then(({ particleSystem }) => {
          particleSystem.spawnNova(this.warehouseTarget.x, this.warehouseTarget.y, 140, '#00f3ff');
        });
      }

      if (this.player.x > 350) {
        KaustubAPI.npcInteracted('INFORMANT_KIRA');
        KaustubAPI.playerEnteredArea('OLD_DISTRICT');
      }

      // Electrical Puddle Hazard (x: 700, y: 480)
      if (Math.hypot(this.player.x - 700, this.player.y - 480) < 50) {
        if (Math.random() < 0.08) {
          this.player.takeDamage(4, this.powerSystem);
          import('../visuals/ParticleSystem.js').then(({ particleSystem }) => {
            particleSystem.spawnDamageNumber(this.player.x, this.player.y, 'SHOCK 4!', false, '#00f3ff');
          });
        }
      }

      // Puddle shocks enemies
      this.enemies.forEach(en => {
        if (en.isAlive && Math.hypot(en.x - 700, en.y - 480) < 50) {
          en.takeDamage(20 * dt, 'SHOCK');
          en.applyStasis(0.8);
        }
      });
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

    // Update Projectiles (both hostile and friendly)
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
      } else {
        // Friendly projectile hits enemies
        for (let enemy of this.enemies) {
          if (enemy.isAlive) {
            const dist = Math.hypot(p.x - enemy.x, p.y - enemy.y);
            if (dist <= enemy.radius + p.radius) {
              enemy.takeDamage(p.damage, 'PROJECTILE');
              import('../visuals/ParticleSystem.js').then(({ particleSystem }) => {
                particleSystem.spawnDamageNumber(enemy.x, enemy.y, p.damage, false, '#00ff88');
                particleSystem.spawnImpact(enemy.x, enemy.y, '#00ff88', 8);
              });
              return false;
            }
          }
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
        vx: this.player.vx,
        vy: this.player.vy,
        radius: this.player.radius,
        facingAngle: this.player.facingAngle,
        targetFacingAngle: this.player.targetFacingAngle,
        isMoving: this.player.isMoving,
        isSprinting: this.player.isSprinting,
        locomotionState: this.player.locomotionState,
        isAttacking: this.player.isAttacking,
        comboStep: this.player.comboStep,
        sprintDodgeTimer: this.player.dodgeTimer,
        dodgeTimer: this.player.dodgeTimer,
        stridePhase: this.player.stridePhase,
        strideTime: this.player.strideTime,
        health: gameState.getField('health'),
        stamina: this.player.stamina
      },
      camera: this.camera,
      warehouseTarget: {
        x: this.warehouseTarget.x,
        y: this.warehouseTarget.y,
        radius: this.warehouseTarget.radius,
        completed: !!this._warehouseObjectiveTriggered
      },
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
      ally: this.ally ? { x: this.ally.x, y: this.ally.y, isAlive: this.ally.isAlive } : null,
      environmentObjects: this.environmentObjects,
      projectiles: this.projectiles.map(p => ({ x: p.x, y: p.y, radius: p.radius, color: p.color })),
      particles: this.particleEffects.map(pt => ({ x: pt.x, y: pt.y, radius: pt.radius, color: pt.color, type: pt.type }))
    };
  }
}

export const kaustubEngine = new KaustubGameplayEngine();
