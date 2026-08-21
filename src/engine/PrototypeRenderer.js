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
    this._lastTime = performance.now();
  }

  async init() {
    if (typeof document === 'undefined') return;
    this._canvas = document.getElementById(this._canvasId) || document.querySelector('canvas');
    if (!this._canvas) throw new Error(`Canvas #${this._canvasId} not found`);

    this._ctx = this._canvas.getContext('2d');
    this._resize();

    window.addEventListener('resize', () => this._resize());
    window.addEventListener('keydown', (e) => this._handleKey(e));
    window.addEventListener('click', (e) => this._handleClick(e));
    window.addEventListener('mousemove', (e) => this._handleMouseMove(e));

    // Listen to power awakening for screen-wide VFX burst
    eventBus.on(EVENTS.POWER_AWAKENED, (data) => {
      shaderPipeline.triggerFlash('#00f3ff', 0.85);
      shaderPipeline.triggerGlitch(0.7);
      shaderPipeline.addShake(0.8);
      if (data && data.path === POWER_PATH.AGGRESSIVE) {
        particleSystem.spawnNova(window.innerWidth / 2, window.innerHeight / 2, 260, '#ff2200');
      } else if (data && data.path === POWER_PATH.PROTECTIVE) {
        particleSystem.spawnBarrier(window.innerWidth / 2, window.innerHeight / 2, 5.0, '#0099ff');
      } else {
        particleSystem.spawnStasisGrid(window.innerWidth / 2, window.innerHeight / 2, 300, '#00ff88');
      }
    });

    console.log('[Ashwidha] Cinematic Cyberpunk Visual Engine Online');
  }

  _resize() {
    if (!this._canvas) return;
    this._canvas.width = window.innerWidth;
    this._canvas.height = window.innerHeight;
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

    // Synchronize camera with gameplay if available
    const gameplayState = window.__SCAR_GAMEPLAY_STATE__;
    if (gameplayState && gameplayState.camera) {
      this.camera.x += (gameplayState.camera.x - this.camera.x) * 0.15;
      this.camera.y += (gameplayState.camera.y - this.camera.y) * 0.15;
    } else if (gameplayState && gameplayState.player) {
      const targetCamX = gameplayState.player.x - w / 2;
      const targetCamY = gameplayState.player.y - h / 2;
      this.camera.x += (targetCamX - this.camera.x) * 0.15;
      this.camera.y += (targetCamY - this.camera.y) * 0.15;
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

      // A. Render City Environment
      cityEnvironment.render(ctx, this.camera, activeObjectives);

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
    }

    // 5. Post-Pass (CRT Scanlines, Vignette, Glitch Artifacts & Letterbox)
    shaderPipeline.applyPostPass(ctx, w, h);
  }

  // ─── Input Handling ────────────────────────────────────────────────────────

  _handleKey(e) {
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
