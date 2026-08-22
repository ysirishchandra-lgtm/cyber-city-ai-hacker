/**
 * SCAR — THE LAST CHOICE
 * PrototypeRenderer.js (Cinematic Visual Engine)
 * Author: Ashwidha (Visual / UI / Cinematic Lead)
 *
 * Replaces the minimal prototype with full AAA cyberpunk visual presentation:
 * - Real-time Weather & Atmospheric City Renderer
 * - Dynamic Lighting, Shaders, CRT Scanlines & Glitch VFX
 * - High-Fidelity Character & Hero AI Visuals
 * - Cinematic Opening, Attack Sequence & Power Awakening
 * - High-Tech Tactical Visor HUD
 * - Responsive Keyboard, Mouse & Mobile Touch Controls
 */

import { shaderPipeline } from '../visuals/ShaderPipeline.js';
import { particleSystem } from '../visuals/ParticleSystem.js';
import { cityEnvironment } from '../visuals/CityEnvironment.js';
import { characterRenderer } from '../visuals/CharacterRenderer.js';
import { cinematicsEngine } from '../visuals/CinematicsEngine.js';
import { cyberHUD } from '../visuals/CyberHUD.js';
import { dialogueAndChoiceUI } from '../visuals/DialogueAndChoiceUI.js';
import { threeJSRenderer3D } from '../visuals/ThreeJSRenderer3D.js';

import { ENDING, POWER_PATH } from '../core/GameState.js';
import { eventBus, EVENTS } from '../core/EventBus.js';

export class PrototypeRenderer {
  constructor(canvasId = 'scar-canvas') {
    this._canvasId = canvasId;
    this._canvas = null;
    this._ctx = null;

    // Overlay State
    this._currentChoice = null;
    this._currentDialogue = null;
    this._dialogueLine = 0;
    this._finalChoiceOptions = null;
    this._showEndingScreen = null;

    // Camera
    this.camera = { x: 0, y: 0 };
    this._lastTime = typeof performance !== 'undefined' ? performance.now() : Date.now();
    this._levelBanner = null;
  }

  async init() {
    if (typeof document === 'undefined') return;
    this._canvas = document.getElementById(this._canvasId) || document.querySelector('canvas');
    if (!this._canvas) throw new Error(`Canvas #${this._canvasId} not found`);

    this._ctx = this._canvas.getContext('2d');
    this._resize();

    // Initialize 3D Three.js WebGL Renderer
    try {
      await threeJSRenderer3D.init(this._canvas);
    } catch (err) {
      console.warn('[PrototypeRenderer] ThreeJS 3D initialization fallback:', err);
    }

    window.addEventListener('resize', () => {
      this._resize();
      if (threeJSRenderer3D.initialized) threeJSRenderer3D.resize();
    });
    window.addEventListener('keydown', (e) => this._handleKey(e));
    window.addEventListener('click', (e) => this._handleClick(e));
    window.addEventListener('mousemove', (e) => this._handleMouseMove(e));

    // Listen to level start for title card announcement
    eventBus.on(EVENTS.LEVEL_STARTED, ({ level }) => {
      const titles = {
        1: { main: 'LEVEL 1: THE POWERLESS', sub: 'RAIN DISTRICT // INFILTRATE THE WAREHOUSE' },
        2: { main: 'LEVEL 2: EVOLUTION', sub: 'TRANSIT DISTRICT // RESISTANCE RESCUE & ESCAPE' },
        3: { main: 'LEVEL 3: IDENTITY', sub: 'CORPORATE SKYBRIDGE // ATLAS CONFRONTATION' }
      };
      const info = titles[level] || { main: `LEVEL ${level}`, sub: 'MISSION ACTIVE' };
      this._levelBanner = { ...info, timer: 3.5 };
      shaderPipeline.triggerFlash('#00f3ff', 0.5);
    });

    // Listen to power awakening for screen-wide VFX burst
    eventBus.on(EVENTS.POWER_AWAKENED, (data) => {
      shaderPipeline.triggerFlash('#00f3ff', 0.85);
      shaderPipeline.triggerGlitch(0.7);
      shaderPipeline.addShake(0.8);
      const winW = typeof window !== 'undefined' ? window.innerWidth : 1280;
      const winH = typeof window !== 'undefined' ? window.innerHeight : 720;
      if (data && data.path === POWER_PATH.AGGRESSIVE) {
        particleSystem.spawnNova(winW / 2, winH / 2, 260, '#ff2200');
      } else if (data && data.path === POWER_PATH.PROTECTIVE) {
        particleSystem.spawnBarrier(winW / 2, winH / 2, 5.0, '#0099ff');
      } else {
        particleSystem.spawnStasisGrid(winW / 2, winH / 2, 300, '#00ff88');
      }
    });

    console.log('[Ashwidha] Cinematic Cyberpunk Visual Engine Online');
  }

  _resize() {
    if (!this._canvas) return;
    this._canvas.width = typeof window !== 'undefined' ? window.innerWidth : 1280;
    this._canvas.height = typeof window !== 'undefined' ? window.innerHeight : 720;
  }

  // ─── Cinematic Panels ───────────────────────────────────────────────────────

  showCinematic(panels, phase, onDone) {
    cinematicsEngine.startSequence(panels, phase, onDone);
  }

  // ─── Choices ───────────────────────────────────────────────────────────────

  showChoice(choice) {
    this._currentChoice = choice;
  }

  // ─── Dialogue ──────────────────────────────────────────────────────────────

  showDialogue(dialogue) {
    this._currentDialogue = dialogue;
    this._dialogueLine = 0;
  }

  // ─── Final Choice ──────────────────────────────────────────────────────────

  showFinalChoice(eligibleEndings) {
    this._finalChoiceOptions = eligibleEndings;
  }

  // ─── Ending Screen ─────────────────────────────────────────────────────────

  showEnding(ending, score, breakdown) {
    this._showEndingScreen = { ending, score, breakdown };
  }

  // ─── Main Render Loop ──────────────────────────────────────────────────────

  render(state, dt = 0.016) {
    const ctx = this._ctx;
    if (!ctx) return;
    const w = this._canvas.width;
    const h = this._canvas.height;

    // 1. Update Visual Systems
    shaderPipeline.update(dt);
    particleSystem.update(dt, this.camera);
    cityEnvironment.update(dt, particleSystem);
    characterRenderer.update(dt);
    cinematicsEngine.update(dt);
    cyberHUD.update(dt, state);
    dialogueAndChoiceUI.update(dt);

    // Synchronize 3rd-person action camera with gameplay
    const gameplayState = typeof window !== 'undefined' ? window.__SCAR_GAMEPLAY_STATE__ : (typeof globalThis !== 'undefined' ? globalThis.__SCAR_GAMEPLAY_STATE__ : null);
    if (gameplayState && gameplayState.player) {
      const facingAngle = gameplayState.player.facingAngle || 0;
      // 3rd-person action lead-ahead offset
      const leadX = Math.cos(facingAngle) * 75;
      const leadY = Math.sin(facingAngle) * 75;

      const targetCamX = gameplayState.player.x - w / 2 + leadX;
      const targetCamY = gameplayState.player.y - h / 2 + leadY;
      this.camera.x += (targetCamX - this.camera.x) * 0.12;
      this.camera.y += (targetCamY - this.camera.y) * 0.12;
    } else if (gameplayState && gameplayState.camera) {
      this.camera.x += (gameplayState.camera.x - this.camera.x) * 0.12;
      this.camera.y += (gameplayState.camera.y - this.camera.y) * 0.12;
    }

    // 2. Pre-pass (Screen Shake / Rotation)
    shaderPipeline.applyPrePass(ctx, w, h);

    // 3. Clear Screen
    ctx.fillStyle = '#05050a';
    ctx.fillRect(0, 0, w, h);

    // 4. Render Active Layer
    if (cinematicsEngine.active) {
      // Cinematic Cutscene Mode
      cinematicsEngine.render(ctx, w, h);
    } else if (this._showEndingScreen) {
      // Ending Screen Mode
      dialogueAndChoiceUI.renderEnding(
        ctx,
        this._showEndingScreen.ending,
        this._showEndingScreen.score,
        this._showEndingScreen.breakdown,
        w, h
      );
    } else if (this._finalChoiceOptions) {
      // Final Choice Screen ("WHO IS THE VILLAIN?")
      dialogueAndChoiceUI.renderFinalChoice(ctx, this._finalChoiceOptions, w, h);
    } else if (this._currentChoice) {
      // Interactive Choice Overlay Mode
      dialogueAndChoiceUI.renderChoice(ctx, this._currentChoice, w, h);
    } else {
      // ─── Active World Gameplay Render ──────────────────────────────────────
      // Get mission objectives for waypoint rendering
      let activeObjectives = [];
      try {
        import('../integration/TeamAPI.js').then(({ AshwidhaAPI }) => {
          activeObjectives = AshwidhaAPI?.getActiveMissions()?.flatMap(m => m.objectives) || [];
        });
      } catch (e) {}

      // A. Render 3D WebGL Scene if initialized
      if (threeJSRenderer3D.initialized) {
        threeJSRenderer3D.render(gameplayState);
      } else {
        cityEnvironment.render(ctx, this.camera, activeObjectives);
      }

      // B. Render World Entities
      if (gameplayState) {
        ctx.save();
        ctx.translate(-this.camera.x, -this.camera.y);

        // Render Enemies
        if (gameplayState.enemies) {
          gameplayState.enemies.forEach(e => characterRenderer.renderEnemy(ctx, e));
        }

        // Render Hero (Atlas)
        if (gameplayState.hero) {
          characterRenderer.renderHero(ctx, gameplayState.hero, state);
        }

        // Render Player
        if (gameplayState.player) {
          characterRenderer.renderPlayer(ctx, gameplayState.player, state);
        }

        // Render Projectiles
        if (gameplayState.projectiles) {
          gameplayState.projectiles.forEach(p => {
            ctx.save();
            ctx.fillStyle = p.color || '#ff0055';
            ctx.shadowColor = p.color || '#ff0055';
            ctx.shadowBlur = 10;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.radius || 4, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
          });
        }

        ctx.restore();
      }

      // C. Render Particles (Combat FX & Weather)
      particleSystem.render(ctx, this.camera);

      // D. Render Tactical HUD
      let missionSys = null;
      try {
        import('../core/MissionSystem.js').then(({ missionSystem }) => {
          missionSys = missionSystem;
        });
      } catch (e) {}
      cyberHUD.render(ctx, state, missionSys, w, h);

      // E. Render Active Dialogue Overlay
      if (this._currentDialogue) {
        dialogueAndChoiceUI.renderDialogue(ctx, this._currentDialogue, this._dialogueLine, w, h);
      }

      // E2. Render Level Title Card Banner
      if (this._levelBanner) {
        this._levelBanner.timer -= dt;
        const bannerAlpha = Math.min(1, this._levelBanner.timer);
        ctx.save();
        ctx.globalAlpha = bannerAlpha;
        ctx.fillStyle = 'rgba(5, 7, 15, 0.88)';
        ctx.fillRect(0, h * 0.35, w, 120);
        ctx.strokeStyle = '#00f3ff';
        ctx.lineWidth = 2;
        ctx.strokeRect(0, h * 0.35, w, 120);

        ctx.fillStyle = '#00f3ff';
        ctx.shadowColor = '#00f3ff';
        ctx.shadowBlur = 20;
        ctx.font = 'bold 28px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(this._levelBanner.main, w / 2, h * 0.35 + 50);

        ctx.fillStyle = '#ffffff';
        ctx.shadowBlur = 0;
        ctx.font = '14px monospace';
        ctx.fillText(this._levelBanner.sub, w / 2, h * 0.35 + 85);
        ctx.restore();

        if (this._levelBanner.timer <= 0) this._levelBanner = null;
      }

      // F. Render Pause Menu Overlay
      if (this.isPaused) {
        this._renderPauseMenu(ctx, w, h);
      }
    }

    // 5. Post-Pass (CRT Scanlines, Vignette, Glitch Artifacts & Letterbox)
    shaderPipeline.applyPostPass(ctx, w, h);
  }

  _renderPauseMenu(ctx, w, h) {
    ctx.save();
    ctx.fillStyle = 'rgba(2, 4, 10, 0.88)';
    ctx.fillRect(0, 0, w, h);

    const boxW = Math.min(560, w * 0.9);
    const boxH = 360;
    const bx = (w - boxW) / 2;
    const by = (h - boxH) / 2;

    ctx.fillStyle = 'rgba(10, 14, 24, 0.95)';
    ctx.strokeStyle = '#00f3ff';
    ctx.lineWidth = 2;
    ctx.shadowColor = '#00f3ff';
    ctx.shadowBlur = 16;
    ctx.strokeRect(bx, by, boxW, boxH);
    ctx.fillRect(bx, by, boxW, boxH);

    ctx.fillStyle = '#00f3ff';
    ctx.font = 'bold 26px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('SYSTEM PAUSED', w / 2, by + 45);

    ctx.fillStyle = '#ffffff';
    ctx.font = '13px monospace';
    ctx.fillText('CONTROLS & TACTICAL PROTOCOLS', w / 2, by + 85);

    const controls = [
      'WASD / ARROWS : 3D Movement & Directional Stride',
      'MOUSE LOOK   : Over-the-Shoulder Camera Lead',
      'LEFT CLICK   : 3-Hit Katana Combo Ribbon Attack',
      'SPACE / SHIFT: 360° Dodge Roll (Invulnerability)',
      'Q / R CLICK  : Activate Awakened Power (Nova/Barrier/Stasis)',
      'E KEY        : Investigate Clues & Comms Intercept',
      'SPACE / CLICK: Advance Dialogue & Skip Cutscenes',
    ];

    ctx.font = '11px monospace';
    ctx.fillStyle = '#94a3b8';
    ctx.textAlign = 'left';
    controls.forEach((ctrl, i) => {
      ctx.fillText(`• ${ctrl}`, bx + 35, by + 120 + i * 22);
    });

    ctx.textAlign = 'center';
    ctx.fillStyle = '#ff0055';
    ctx.font = 'bold 13px monospace';
    ctx.fillText('[ESC] RESUME  |  [T] QUIT TO TITLE', w / 2, by + boxH - 25);

    ctx.restore();
  }

  // ─── Input Handling ────────────────────────────────────────────────────────

  _handleKey(e) {
    // 0. Toggle Pause
    if (e.code === 'Escape') {
      if (!cinematicsEngine.active && !this._showEndingScreen) {
        this.isPaused = !this.isPaused;
        return;
      }
    }

    if (this.isPaused) {
      if (e.code === 'KeyT') {
        location.reload();
      }
      return;
    }

    // 1. Cinematic skip
    if (cinematicsEngine.active) {
      if (e.code === 'Space' || e.code === 'Enter') {
        cinematicsEngine.skip();
        return;
      }
    }

    // 2. Dialogue line progression
    if (this._currentDialogue) {
      if (e.code === 'Space' || e.code === 'Enter') {
        this._dialogueLine++;
        if (this._dialogueLine >= this._currentDialogue.lines.length) {
          this._currentDialogue = null;
          this._dialogueLine = 0;
          eventBus.emit(EVENTS.DIALOGUE_COMPLETE);
        }
        return;
      }
    }

    // 3. Choice selection
    if (this._currentChoice) {
      const idx = parseInt(e.key) - 1;
      if (idx >= 0 && idx < this._currentChoice.options.length) {
        const opt = this._currentChoice.options[idx];
        this._currentChoice = null;
        import('../core/ChoiceSystem.js').then(({ choiceSystem }) => {
          choiceSystem.selectOption(opt.id);
        });
      }
      return;
    }

    // 4. Final choice selection
    if (this._finalChoiceOptions) {
      const allEndings = [ENDING.VILLAIN, ENDING.HERO, ENDING.SAVIOR, ENDING.HUMAN];
      const idx = parseInt(e.key) - 1;
      if (idx >= 0 && idx < allEndings.length) {
        const ending = allEndings[idx];
        this._finalChoiceOptions = null;
        import('../core/ChoiceSystem.js').then(({ choiceSystem }) => {
          choiceSystem.makeFinalChoice(ending);
        });
      }
      return;
    }

    // 5. Ending screen actions
    if (this._showEndingScreen) {
      if (e.code === 'KeyR') {
        location.reload();
      }
      if (e.code === 'KeyL') {
        eventBus.emit('SHOW_LEADERBOARD');
      }
    }
  }

  _handleClick(e) {
    // Click to Enter Warehouse (Level 2 Transition)
    const gameplayState = typeof window !== 'undefined' ? window.__SCAR_GAMEPLAY_STATE__ : null;
    if (gameplayState?.warehouseTarget?.playerAtWarehouse) {
      import('../gameplay/KaustubGameplayEngine.js').then(({ kaustubEngine }) => {
        kaustubEngine.enterWarehouseNextLevel();
      });
      return;
    }

    // Click to advance cinematic
    if (cinematicsEngine.active) {
      cinematicsEngine.skip();
      return;
    }

    // Click to advance dialogue
    if (this._currentDialogue) {
      this._dialogueLine++;
      if (this._dialogueLine >= this._currentDialogue.lines.length) {
        this._currentDialogue = null;
        this._dialogueLine = 0;
        eventBus.emit(EVENTS.DIALOGUE_COMPLETE);
      }
      return;
    }

    // Click to select standard choice card
    if (this._currentChoice) {
      const w = this._canvas.width;
      const boxW = Math.min(640, w * 0.85);
      const boxX = (w - boxW) / 2;
      const startY = 200;
      const optH = 75;

      this._currentChoice.options.forEach((opt, i) => {
        const y = startY + i * (optH + 16);
        if (e.clientX >= boxX && e.clientX <= boxX + boxW && e.clientY >= y && e.clientY <= y + optH) {
          this._currentChoice = null;
          import('../core/ChoiceSystem.js').then(({ choiceSystem }) => {
            choiceSystem.selectOption(opt.id);
          });
        }
      });
      return;
    }

    // Click to select final choice card
    if (this._finalChoiceOptions) {
      const allEndings = [ENDING.VILLAIN, ENDING.HERO, ENDING.SAVIOR, ENDING.HUMAN];
      const w = this._canvas.width;
      const boxW = Math.min(680, w * 0.85);
      const boxX = (w - boxW) / 2;
      const y0 = 150;
      const optH = 92;

      allEndings.forEach((ending, i) => {
        const y = y0 + i * (optH + 12);
        if (e.clientX >= boxX && e.clientX <= boxX + boxW && e.clientY >= y && e.clientY <= y + optH) {
          this._finalChoiceOptions = null;
          import('../core/ChoiceSystem.js').then(({ choiceSystem }) => {
            choiceSystem.makeFinalChoice(ending);
          });
        }
      });
      return;
    }
  }

  _handleMouseMove(e) {
    if (this._currentChoice) {
      const w = this._canvas.width;
      const boxW = Math.min(640, w * 0.85);
      const boxX = (w - boxW) / 2;
      const startY = 200;
      const optH = 75;

      let hovered = -1;
      this._currentChoice.options.forEach((opt, i) => {
        const y = startY + i * (optH + 16);
        if (e.clientX >= boxX && e.clientX <= boxX + boxW && e.clientY >= y && e.clientY <= y + optH) {
          hovered = i;
        }
      });
      dialogueAndChoiceUI._hoveredOption = hovered;
    }
  }

  reset() {
    this._currentChoice = null;
    this._currentDialogue = null;
    this._dialogueLine = 0;
    this._finalChoiceOptions = null;
    this._showEndingScreen = null;
    this.camera = { x: 0, y: 0 };
    cinematicsEngine.active = false;
  }
}

export const renderer = new PrototypeRenderer('scar-canvas');
