/**
 * SCAR — THE LAST CHOICE
 * GameManager.js — Master orchestrator
 * Author: Sirish (Lead/Integration)
 *
 * Owns the main game loop and phase transitions.
 * Calls Kaustub's engine, Ashwidha's renderer, Priyanshu's auth.
 * This is the spine of the game.
 */

import { eventBus, EVENTS } from '../core/EventBus.js';
import { gameState, GAME_PHASE } from '../core/GameState.js';
import { missionSystem } from '../core/MissionSystem.js';
import { choiceSystem } from '../core/ChoiceSystem.js';
import { scoreSystem } from '../core/ScoreSystem.js';
import {
  INTRO_PANELS, ATTACK_PANELS, SCAR_PANELS, DIALOGUES, CHOICES
} from '../story/StoryContent.js';

// Cross-environment animation frame helpers
const safeRequestAnimationFrame = (callback) => {
  if (typeof requestAnimationFrame === 'function') {
    return requestAnimationFrame(callback);
  }
  return setTimeout(() => callback(typeof performance !== 'undefined' ? performance.now() : Date.now()), 16);
};

const safeCancelAnimationFrame = (id) => {
  if (typeof cancelAnimationFrame === 'function') {
    cancelAnimationFrame(id);
  } else {
    clearTimeout(id);
  }
};

class GameManager {
  constructor() {
    this._running = false;
    this._animationFrameId = null;
    this._lastTimestamp = 0;
    this._cityFallbackTimer = null;

    // Team module references — registered by each developer
    this._renderer = null;   // Ashwidha registers this
    this._engine = null;     // Kaustub registers this
    this._backend = null;    // Priyanshu registers this

    this._setupListeners();
  }

  // ─── Team Module Registration ───────────────────────────────────────────────

  /**
   * ASHWIDHA calls this to register her renderer.
   * @param {object} renderer - Must implement: init(), render(state, dt), showCinematic(panels), showChoice(choice), showDialogue(dialogueId), showEnding(ending, score)
   */
  registerRenderer(renderer) {
    this._renderer = renderer;
    console.log('[GameManager] Renderer registered (Ashwidha)');
  }

  /**
   * KAUSTUB calls this to register his game engine.
   * @param {object} engine - Must implement: init(), update(state, dt), reset()
   */
  registerEngine(engine) {
    this._engine = engine;
    console.log('[GameManager] Game engine registered (Kaustub)');
  }

  /**
   * PRIYANSHU calls this to register his backend module.
   * @param {object} backend - Must implement: authenticate(), submitScore(payload), getLeaderboard()
   */
  registerBackend(backend) {
    this._backend = backend;
    console.log('[GameManager] Backend registered (Priyanshu)');
  }

  // ─── Setup ─────────────────────────────────────────────────────────────────

  _setupListeners() {
    eventBus.on(EVENTS.CINEMATIC_COMPLETE, () => this._onCinematicComplete());
    eventBus.on(EVENTS.DIALOGUE_START, (data) => this._onDialogueStart(data));
    eventBus.on(EVENTS.DIALOGUE_COMPLETE, () => this._onDialogueComplete());
    eventBus.on(EVENTS.FINAL_CHOICE_MADE, ({ ending }) => this._onFinalChoiceMade(ending));
    eventBus.on(EVENTS.SCORE_CALCULATED, (data) => this._onScoreCalculated(data));
    eventBus.on(EVENTS.LEVEL_COMPLETED, ({ level }) => this._advanceLevel(level));
    eventBus.on(EVENTS.MISSION_COMPLETED, ({ missionId }) => this._onMissionCompleted(missionId));
  }

  // ─── Game Boot ─────────────────────────────────────────────────────────────

  /**
   * Called once on page load. Initializes all systems.
   */
  async init() {
    console.log('[GameManager] Initializing SCAR...');

    // Init renderer (Ashwidha)
    if (this._renderer) await this._renderer.init();

    // Init engine (Kaustub)
    if (this._engine) await this._engine.init();

    gameState.setPhase(GAME_PHASE.BOOT);
    console.log('[GameManager] Ready. Awaiting authentication.');
  }

  /**
   * Called after Priyanshu's auth completes.
   * playerId = null means guest (score won't be saved to leaderboard).
   */
  async startGame(playerId = null, playerName = null) {
    gameState.startGame(playerId, playerName);
    this._running = true;
    this._startGameLoop();
    await this._runIntro();
  }

  // ─── Phase: Cinematic Intro ────────────────────────────────────────────────

  async _runIntro() {
    gameState.setPhase(GAME_PHASE.CINEMATIC_INTRO);
    eventBus.emit(EVENTS.CINEMATIC_START, { panels: INTRO_PANELS, phase: 'INTRO' });

    if (this._renderer) {
      this._renderer.showCinematic(INTRO_PANELS, 'INTRO');
    } else {
      // Fallback: auto-advance after total duration
      const total = INTRO_PANELS.reduce((s, p) => s + p.duration, 0);
      setTimeout(() => this._onCinematicComplete(), total);
    }
  }

  _onCinematicComplete() {
    const phase = gameState.getPhase();

    switch (phase) {
      case GAME_PHASE.CINEMATIC_INTRO:
        eventBus.emit(EVENTS.INTRO_COMPLETE);
        this._runCityExploration();
        break;
      case GAME_PHASE.ATTACK_SEQUENCE:
        this._runScarMoment();
        break;
      case GAME_PHASE.SCAR_MOMENT:
        this._runLevel(1);
        break;
      default:
        break;
    }
  }

  // ─── Phase: City Exploration ───────────────────────────────────────────────

  _runCityExploration() {
    gameState.setPhase(GAME_PHASE.CITY_EXPLORATION);
    if (this._engine) this._engine.setScene('CITY_NORMAL');
    this._startGameLoop();

    // Preserve Kaustub's engine integration if it provides custom exploration start
    if (this._engine && typeof this._engine.startCityExploration === 'function') {
      this._engine.startCityExploration();
    } else {
      // Safe fallback when running standalone without active gameplay triggers
      if (this._cityFallbackTimer) clearTimeout(this._cityFallbackTimer);
      this._cityFallbackTimer = setTimeout(() => {
        if (gameState.getPhase() === GAME_PHASE.CITY_EXPLORATION) {
          this.triggerAttack();
        }
      }, 12000);
    }
  }

  /**
   * Called by Kaustub's engine when attack should begin.
   */
  triggerAttack() {
    if (this._cityFallbackTimer) {
      clearTimeout(this._cityFallbackTimer);
      this._cityFallbackTimer = null;
    }
    gameState.setPhase(GAME_PHASE.ATTACK_SEQUENCE);
    eventBus.emit(EVENTS.ATTACK_STARTED);
    eventBus.emit(EVENTS.CINEMATIC_START, { panels: ATTACK_PANELS, phase: 'ATTACK' });

    if (this._renderer) {
      this._renderer.showCinematic(ATTACK_PANELS, 'ATTACK');
    } else {
      const total = ATTACK_PANELS.reduce((s, p) => s + p.duration, 0);
      setTimeout(() => this._onCinematicComplete(), total);
    }
  }

  // ─── Phase: Scar Moment ────────────────────────────────────────────────────

  _runScarMoment() {
    gameState.setPhase(GAME_PHASE.SCAR_MOMENT);
    gameState.receiveScar();
    eventBus.emit(EVENTS.CINEMATIC_START, { panels: SCAR_PANELS, phase: 'SCAR' });

    if (this._renderer) {
      this._renderer.showCinematic(SCAR_PANELS, 'SCAR');
    } else {
      const total = SCAR_PANELS.reduce((s, p) => s + p.duration, 0);
      setTimeout(() => this._onCinematicComplete(), total);
    }
  }

  // ─── Phase: Levels ─────────────────────────────────────────────────────────

  _runLevel(level) {
    const phaseMap = {
      1: GAME_PHASE.LEVEL_1,
      2: GAME_PHASE.LEVEL_2,
      3: GAME_PHASE.LEVEL_3,
    };
    const phase = phaseMap[level];
    if (!phase) return;

    gameState.setPhase(phase);

    if (this._engine) this._engine.setScene(`LEVEL_${level}`);
    this._startGameLoop();
  }

  _advanceLevel(completedLevel) {
    if (completedLevel < 3) {
      this._runLevel(completedLevel + 1);
    } else {
      this._runFinalBattle();
    }
  }

  _onMissionCompleted(missionId) {
    // Special triggers for story beats
    if (missionId === 'M1_POWER_AWAKENING') {
      choiceSystem.presentChoice('CHOICE_POWER_AWAKENING');
      if (this._renderer) {
        const choice = choiceSystem.getPendingChoice();
        this._renderer.showChoice(choice);
      }
      // After choice + aftermath dialogue: level 1 completes
      eventBus.once(EVENTS.CHOICE_MADE, (choiceEntry) => {
        const option = CHOICES.flatMap(c => c.options).find(o => o.id === choiceEntry?.selected);
        if (option?.consequences?.followUpDialogue) {
          eventBus.once(EVENTS.DIALOGUE_COMPLETE, () => {
            setTimeout(() => {
              eventBus.emit(EVENTS.LEVEL_COMPLETED, { level: 1 });
            }, 1000);
          });
        } else {
          setTimeout(() => {
            eventBus.emit(EVENTS.LEVEL_COMPLETED, { level: 1 });
          }, 2000);
        }
      });
    }

    if (missionId === 'M2_HERO_CONTACT') {
      if (this._renderer) {
        this._renderer.showDialogue(DIALOGUES.d_hero_first_contact);
      }
      eventBus.once(EVENTS.DIALOGUE_COMPLETE, () => {
        choiceSystem.presentChoice('CHOICE_HERO_OFFER');
        if (this._renderer) {
          this._renderer.showChoice(choiceSystem.getPendingChoice());
        }
        eventBus.once(EVENTS.CHOICE_MADE, (choiceEntry) => {
          const option = CHOICES.flatMap(c => c.options).find(o => o.id === choiceEntry?.selected);
          if (option?.consequences?.followUpDialogue) {
            eventBus.once(EVENTS.DIALOGUE_COMPLETE, () => {
              setTimeout(() => {
                eventBus.emit(EVENTS.LEVEL_COMPLETED, { level: 2 });
              }, 1000);
            });
          } else {
            setTimeout(() => {
              eventBus.emit(EVENTS.LEVEL_COMPLETED, { level: 2 });
            }, 1500);
          }
        });
      });
    }

    if (missionId === 'M3_FINAL_BATTLE') {
      this._runFinalChoice();
    }
  }

  // ─── Phase: Final Battle ───────────────────────────────────────────────────

  _runFinalBattle() {
    gameState.setPhase(GAME_PHASE.FINAL_BATTLE);
    if (this._renderer) {
      this._renderer.showDialogue(DIALOGUES.d_final_confrontation);
    }
    if (this._engine) this._engine.setScene('FINAL_BATTLE');
    this._startGameLoop();
  }

  // ─── Phase: Final Choice ───────────────────────────────────────────────────

  _runFinalChoice() {
    gameState.setPhase(GAME_PHASE.FINAL_CHOICE);

    const eligible = choiceSystem.getEligibleEndings();
    if (this._renderer) {
      this._renderer.showFinalChoice(eligible);
    }
  }

  _onFinalChoiceMade(ending) {
    // scoreSystem auto-calculates via ENDING_TRIGGERED event
  }

  // ─── Phase: Score + Ending ─────────────────────────────────────────────────

  _onScoreCalculated(data) {
    if (this._renderer) {
      this._renderer.showEnding(data.ending, data.score, data.breakdown);
    }

    // Submit to Priyanshu's cloud if authenticated
    if (this._backend && gameState.getField('playerId')) {
      const payload = scoreSystem.getSubmissionPayload();
      this._backend.submitScore(payload).catch(err => {
        console.error('[GameManager] Score submission failed:', err);
      });
    }

    eventBus.emit(EVENTS.GAME_COMPLETED, gameState.get());
  }

  // ─── Game Loop ─────────────────────────────────────────────────────────────

  _startGameLoop() {
    if (this._animationFrameId) return;
    this._lastTimestamp = typeof performance !== 'undefined' ? performance.now() : Date.now();
    this._loop(this._lastTimestamp);
  }

  _loop(timestamp) {
    if (!this._running) return;

    const dt = Math.min((timestamp - this._lastTimestamp) / 1000, 0.05); // cap at 50ms
    this._lastTimestamp = timestamp;

    const state = gameState.get();

    // Skip update if choice is blocking
    if (!choiceSystem.isBlocking()) {
      if (this._engine) this._engine.update(state, dt);
    }

    if (this._renderer) this._renderer.render(state, dt);

    this._animationFrameId = safeRequestAnimationFrame((t) => this._loop(t));
  }

  _stopGameLoop() {
    if (this._animationFrameId) {
      safeCancelAnimationFrame(this._animationFrameId);
      this._animationFrameId = null;
    }
  }

  // ─── Utility ───────────────────────────────────────────────────────────────

  pause() {
    gameState.pause();
    this._stopGameLoop();
  }

  resume() {
    gameState.resume();
    this._startGameLoop();
  }

  reset() {
    if (this._cityFallbackTimer) {
      clearTimeout(this._cityFallbackTimer);
      this._cityFallbackTimer = null;
    }
    this._stopGameLoop();
    this._running = false;
    gameState.reset();
    if (this._engine) this._engine.reset();
  }

  _onDialogueStart(data) {
    if (!data) return;
    const dialogueId = typeof data === 'string' ? data : data.dialogueId;
    const dialogue = DIALOGUES[dialogueId] || (typeof data === 'object' && data.lines ? data : null);

    if (dialogue && this._renderer) {
      this._stopGameLoop();
      this._renderer.showDialogue(dialogue);
    }
  }

  _onDialogueComplete() {
    // If running and no choice is blocking, resume game loop
    if (this._running && !choiceSystem.isBlocking()) {
      this._startGameLoop();
    }
  }
}

// Singleton
export const gameManager = new GameManager();
