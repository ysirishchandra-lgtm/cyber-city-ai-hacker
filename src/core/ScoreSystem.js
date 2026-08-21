/**
 * SCAR — THE LAST CHOICE
 * ScoreSystem.js — Real score calculation from gameplay
 * Author: Sirish (Lead/Integration)
 *
 * Score is ALWAYS derived from actual gameplay.
 * Never randomized. Never fabricated.
 * Submitted to Priyanshu's backend for cloud leaderboard.
 */

import { eventBus, EVENTS } from './EventBus.js';
import { gameState, ENDING } from './GameState.js';
import { choiceSystem } from './ChoiceSystem.js';

// ─── Score Weights ────────────────────────────────────────────────────────────
const WEIGHTS = {
  BASE_COMPLETION: 1000,

  // Time bonus (seconds remaining from max 600s = 10 min)
  TIME_BONUS_PER_SECOND: 2,
  MAX_GAME_TIME_SECONDS: 600,

  // Health efficiency
  HEALTH_REMAINING_MULTIPLIER: 3,     // per HP remaining
  DAMAGE_TAKEN_PENALTY: -1,           // per HP lost

  // Combat
  ENEMY_DEFEATED: 50,

  // Objectives
  OBJECTIVE_BONUS: 200,

  // Choices
  CHOICE_BONUS: 75,                   // per meaningful choice made

  // Ending multipliers
  ENDING_MULTIPLIER: {
    [ENDING.VILLAIN]: 1.0,
    [ENDING.HERO]: 1.2,
    [ENDING.SAVIOR]: 1.5,
    [ENDING.HUMAN]: 2.0,              // secret ending — highest reward
    [ENDING.NONE]: 0.5,
  },

  // Eligible ending bonus
  ELIGIBLE_ENDING_BONUS: 500,
};

class ScoreSystem {
  constructor() {
    this._finalScore = null;
    this._breakdown = null;

    eventBus.on(EVENTS.ENDING_TRIGGERED, () => this.calculate());
  }

  /**
   * Calculate final score from real gameplay data.
   * Called automatically when ending is triggered.
   * @returns {object} Score breakdown
   */
  calculate() {
    const state = gameState.get();
    const breakdown = {};

    // Base
    breakdown.base = WEIGHTS.BASE_COMPLETION;

    // Time bonus
    const gameTimeSeconds = state.gameEndTime
      ? Math.floor((state.gameEndTime - state.gameStartTime) / 1000)
      : WEIGHTS.MAX_GAME_TIME_SECONDS;
    const timeRemaining = Math.max(0, WEIGHTS.MAX_GAME_TIME_SECONDS - gameTimeSeconds);
    breakdown.timeBonus = timeRemaining * WEIGHTS.TIME_BONUS_PER_SECOND;

    // Health
    breakdown.healthBonus = state.health * WEIGHTS.HEALTH_REMAINING_MULTIPLIER;
    breakdown.damagePenalty = state.damageTaken * WEIGHTS.DAMAGE_TAKEN_PENALTY;

    // Combat
    breakdown.combatBonus = state.enemiesDefeated * WEIGHTS.ENEMY_DEFEATED;

    // Objectives
    breakdown.objectivesBonus = state.objectivesCompleted * WEIGHTS.OBJECTIVE_BONUS;

    // Choices
    breakdown.choicesBonus = state.choiceHistory.length * WEIGHTS.CHOICE_BONUS;

    // Eligible ending
    const eligible = choiceSystem.getEligibleEndings();
    breakdown.eligibleBonus = eligible.includes(state.ending)
      ? WEIGHTS.ELIGIBLE_ENDING_BONUS
      : 0;

    // Subtotal
    const subtotal = Object.values(breakdown).reduce((a, b) => a + b, 0);

    // Ending multiplier
    const multiplier = WEIGHTS.ENDING_MULTIPLIER[state.ending] ?? 1.0;
    breakdown.endingMultiplier = multiplier;

    const total = Math.max(0, Math.round(subtotal * multiplier));
    breakdown.total = total;

    this._finalScore = total;
    this._breakdown = breakdown;

    gameState._update({ score: total });
    eventBus.emit(EVENTS.SCORE_CALCULATED, {
      score: total,
      breakdown,
      ending: state.ending,
      playerId: state.playerId,
      playerName: state.playerName,
    });

    return { score: total, breakdown };
  }

  getFinalScore() {
    return this._finalScore;
  }

  getBreakdown() {
    return this._breakdown ? { ...this._breakdown } : null;
  }

  /**
   * Prepare score payload for Priyanshu's cloud submission.
   * @returns {object|null} Submission-ready payload
   */
  getSubmissionPayload() {
    if (!this._finalScore) return null;

    const state = gameState.get();
    return {
      playerId: state.playerId,
      playerName: state.playerName,
      score: this._finalScore,
      ending: state.ending,
      powerPath: state.powerPath,
      choicesCount: state.choiceHistory.length,
      enemiesDefeated: state.enemiesDefeated,
      missionsCompleted: state.objectivesCompleted,
      gameDurationSeconds: state.gameEndTime && state.gameStartTime
        ? Math.floor((state.gameEndTime - state.gameStartTime) / 1000)
        : null,
      submittedAt: new Date().toISOString(),
    };
  }
}

export const scoreSystem = new ScoreSystem();
