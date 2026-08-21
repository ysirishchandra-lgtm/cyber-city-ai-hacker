/**
 * SCAR — THE LAST CHOICE
 * ChoiceSystem.js — Choice presentation and power path tracking
 * Author: Sirish (Lead/Integration)
 *
 * Manages the moral choice system.
 * Choices influence: power path, story dialogue, ending eligibility.
 * Never forces an outcome — tracks tendencies and lets player decide.
 */

import { eventBus, EVENTS } from './EventBus.js';
import { gameState, POWER_PATH, ENDING } from './GameState.js';
import { CHOICES } from '../story/StoryContent.js';

// ─── Objective Type Enum (used by MissionSystem) ──────────────────────────────
export const OBJECTIVE_TYPE = {
  REACH_AREA: 'REACH_AREA',
  DEFEAT_ENEMIES: 'DEFEAT_ENEMIES',
  SURVIVE_TIME: 'SURVIVE_TIME',
  INTERACT: 'INTERACT',
  PROTECT: 'PROTECT',
  ESCAPE: 'ESCAPE',
  TALK: 'TALK',
};

class ChoiceSystem {
  constructor() {
    /** @type {object|null} Currently presented choice */
    this._pending = null;

    /** @type {boolean} Is a choice UI currently blocking? */
    this._isBlocking = false;

    this._setupListeners();
  }

  _setupListeners() {
    // When power awakens, the choice that triggered it is resolved
    eventBus.on(EVENTS.POWER_AWAKENED, ({ path }) => {
      if (this._pending?.id === 'CHOICE_POWER_AWAKENING') {
        this._pending = null;
        this._isBlocking = false;
      }
    });
  }

  /**
   * Present a choice to the player.
   * Blocks gameplay until resolved.
   * @param {string} choiceId - From CHOICES in StoryContent.js
   */
  presentChoice(choiceId) {
    const choice = CHOICES.find(c => c.id === choiceId);
    if (!choice) {
      console.warn(`[ChoiceSystem] Unknown choice: ${choiceId}`);
      return;
    }

    this._pending = { ...choice, presentedAt: Date.now() };
    this._isBlocking = true;
    eventBus.emit(EVENTS.CHOICE_PRESENTED, { choice: this._pending });
  }

  /**
   * Player selects an option.
   * Called by Ashwidha's UI when player clicks a choice button.
   * @param {string} optionId
   */
  selectOption(optionId) {
    if (!this._pending) {
      console.warn('[ChoiceSystem] No pending choice');
      return;
    }

    const option = this._pending.options.find(o => o.id === optionId);
    if (!option) {
      console.warn(`[ChoiceSystem] Unknown option: ${optionId}`);
      return;
    }

    const choiceId = this._pending.id;
    const pathInfluence = option.pathInfluence;

    // Record in game state
    gameState.recordChoice(choiceId, optionId, pathInfluence);

    // Apply immediate consequences
    this._applyConsequences(option);

    this._pending = null;
    this._isBlocking = false;
  }

  _applyConsequences(option) {
    if (!option.consequences) return;

    const c = option.consequences;

    // Health change
    if (c.healthChange) {
      if (c.healthChange > 0) gameState.heal(c.healthChange);
      else gameState.takeDamage(Math.abs(c.healthChange));
    }

    // Power path forced (only for the awakening choice)
    if (c.setPowerPath) {
      gameState.awakePower(c.setPowerPath);
    }

    // Hero relationship shift
    if (c.heroRelationship) {
      gameState.updateHeroRelationship(c.heroRelationship);
    }

    // Emit dialogue/narrative follow-up for Ashwidha
    if (c.followUpDialogue) {
      eventBus.emit(EVENTS.DIALOGUE_START, { dialogueId: c.followUpDialogue });
    }
  }

  /**
   * Is a choice currently blocking gameplay?
   */
  isBlocking() {
    return this._isBlocking;
  }

  /**
   * Get the current pending choice (for Ashwidha's UI to render).
   */
  getPendingChoice() {
    return this._pending ? { ...this._pending } : null;
  }

  /**
   * Determine ending eligibility based on choice history.
   * Called by ScoreSystem at game end.
   * @returns {string[]} List of eligible ending IDs
   */
  getEligibleEndings() {
    const state = gameState.get();
    const a = state.aggressiveCount;
    const p = state.protectiveCount;
    const s = state.strategicCount;
    const total = a + p + s;

    const eligible = [];

    // VILLAIN: predominantly aggressive
    if (a / total > 0.6) eligible.push(ENDING.VILLAIN);

    // HERO: predominantly protective
    if (p / total > 0.6) eligible.push(ENDING.HERO);

    // SAVIOR: protective + strategic balanced
    if (p >= 2 && s >= 2 && a <= 1) eligible.push(ENDING.SAVIOR);

    // HUMAN: all paths balanced (secret ending)
    const isBalanced = Math.abs(a - p) <= 1 && Math.abs(p - s) <= 1 && Math.abs(a - s) <= 1;
    if (isBalanced && total >= 4) eligible.push(ENDING.HUMAN);

    // Fallback: always allow at least villain or hero
    if (eligible.length === 0) {
      eligible.push(a >= p ? ENDING.VILLAIN : ENDING.HERO);
    }

    return eligible;
  }

  /**
   * Final choice — player explicitly picks their ending path.
   * Called during FINAL_CHOICE phase.
   * @param {string} ending - ENDING enum value
   */
  makeFinalChoice(ending) {
    const eligible = this.getEligibleEndings();

    // Player can always choose, but eligible endings get better score
    gameState.triggerEnding(ending);
    eventBus.emit(EVENTS.FINAL_CHOICE_MADE, {
      ending,
      eligible,
      wasEligible: eligible.includes(ending),
    });
  }
}

export const choiceSystem = new ChoiceSystem();
