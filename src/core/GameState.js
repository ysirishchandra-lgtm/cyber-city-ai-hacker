/**
 * SCAR — THE LAST CHOICE
 * GameState.js — Central state machine
 * Author: Sirish (Lead/Integration)
 *
 * Single source of truth for all game state.
 * All reads/writes go through this module.
 * Never mutate state directly from outside.
 */

import { eventBus, EVENTS } from './EventBus.js';

// ─── Game Phase Enum ──────────────────────────────────────────────────────────
export const GAME_PHASE = {
  BOOT: 'BOOT',
  CINEMATIC_INTRO: 'CINEMATIC_INTRO',
  CITY_EXPLORATION: 'CITY_EXPLORATION',
  ATTACK_SEQUENCE: 'ATTACK_SEQUENCE',
  SCAR_MOMENT: 'SCAR_MOMENT',
  LEVEL_1: 'LEVEL_1',         // The Weak
  LEVEL_2: 'LEVEL_2',         // The Rising
  LEVEL_3: 'LEVEL_3',         // The Threat
  FINAL_BATTLE: 'FINAL_BATTLE',
  FINAL_CHOICE: 'FINAL_CHOICE',
  ENDING: 'ENDING',
  GAME_OVER: 'GAME_OVER',
};

// ─── Power Path Enum ──────────────────────────────────────────────────────────
export const POWER_PATH = {
  NONE: 'NONE',
  AGGRESSIVE: 'AGGRESSIVE',   // → DESTRUCTION
  PROTECTIVE: 'PROTECTIVE',   // → PROTECTION
  STRATEGIC: 'STRATEGIC',     // → CONTROL
};

// ─── Ending Enum ─────────────────────────────────────────────────────────────
export const ENDING = {
  NONE: 'NONE',
  VILLAIN: 'VILLAIN',
  HERO: 'HERO',
  SAVIOR: 'SAVIOR',
  HUMAN: 'HUMAN',   // Unlock condition: all balanced choices
};

// ─── Hero Relationship ────────────────────────────────────────────────────────
export const HERO_RELATIONSHIP = {
  UNKNOWN: 'UNKNOWN',
  AWARE: 'AWARE',
  SUSPICIOUS: 'SUSPICIOUS',
  HOSTILE: 'HOSTILE',
  HUNTING: 'HUNTING',
};

// ─── Initial State ────────────────────────────────────────────────────────────
const createInitialState = () => ({
  // Identity — null until authenticated
  playerId: null,
  playerName: null,

  // Position (used by Kaustub's engine)
  position: { x: 0, y: 0 },

  // Vitals
  health: 100,
  maxHealth: 100,

  // Power
  powerPath: POWER_PATH.NONE,
  powerLevel: 0,
  powerUnlocked: false,

  // Progress
  phase: GAME_PHASE.BOOT,
  currentLevel: 0,
  currentMissionId: null,
  completedMissions: [],
  failedMissions: [],

  // Story tracking
  choiceHistory: [],          // [{choiceId, selected, timestamp, pathInfluence}]
  aggressiveCount: 0,
  protectiveCount: 0,
  strategicCount: 0,

  // Antagonist
  heroRelationship: HERO_RELATIONSHIP.UNKNOWN,
  heroEncounters: 0,

  // Performance
  enemiesDefeated: 0,
  objectivesCompleted: 0,
  damageTaken: 0,
  gameStartTime: null,
  gameEndTime: null,
  levelStartTimes: {},

  // Score
  score: 0,

  // Session
  gameStatus: 'idle',   // idle | playing | paused | complete | failed
  ending: ENDING.NONE,
});

// ─── GameState Class ──────────────────────────────────────────────────────────
class GameState {
  constructor() {
    this._state = createInitialState();
    this._snapshots = []; // for undo/replay in QA
  }

  // ── Reads ────────────────────────────────────────────────────────────────

  get() {
    return { ...this._state };
  }

  getField(key) {
    return this._state[key];
  }

  getPhase() {
    return this._state.phase;
  }

  getPowerPath() {
    return this._state.powerPath;
  }

  isPlaying() {
    return this._state.gameStatus === 'playing';
  }

  isPaused() {
    return this._state.gameStatus === 'paused';
  }

  hasPower() {
    return this._state.powerUnlocked;
  }

  getChoiceHistory() {
    return [...this._state.choiceHistory];
  }

  // ── Writes ───────────────────────────────────────────────────────────────

  /**
   * Generic safe update — merges partial state.
   * Private: use specific action methods instead.
   */
  _update(partial) {
    this._state = { ...this._state, ...partial };
  }

  // ── Actions ──────────────────────────────────────────────────────────────

  startGame(playerId = null, playerName = null) {
    this._update({
      ...createInitialState(),
      playerId,
      playerName,
      gameStatus: 'playing',
      gameStartTime: Date.now(),
    });
    eventBus.emit(EVENTS.GAME_STARTED, { playerId, playerName });
  }

  setPhase(phase) {
    const previous = this._state.phase;
    this._update({ phase });

    if (phase.startsWith('LEVEL_')) {
      const level = parseInt(phase.split('_')[1]);
      this._update({
        currentLevel: level,
        levelStartTimes: {
          ...this._state.levelStartTimes,
          [level]: Date.now(),
        },
      });
      eventBus.emit(EVENTS.LEVEL_STARTED, { level, previous });
    }

    if (phase === GAME_PHASE.FINAL_BATTLE) {
      eventBus.emit(EVENTS.FINAL_BATTLE_STARTED, this.get());
    }
  }

  setPlayerId(playerId, playerName) {
    this._update({ playerId, playerName });
  }

  updatePosition(x, y) {
    this._update({ position: { x, y } });
  }

  takeDamage(amount) {
    const health = Math.max(0, this._state.health - amount);
    this._update({ health, damageTaken: this._state.damageTaken + amount });
    eventBus.emit(EVENTS.PLAYER_DAMAGED, { amount, health });

    if (health <= 0) {
      this.setPhase(GAME_PHASE.GAME_OVER);
    }
  }

  heal(amount) {
    const health = Math.min(this._state.maxHealth, this._state.health + amount);
    this._update({ health });
    eventBus.emit(EVENTS.PLAYER_HEALED, { amount, health });
  }

  receiveScar() {
    // Scar permanently marks the player — health cap reduced by 20
    this._update({ maxHealth: 80, health: Math.min(this._state.health, 80) });
    eventBus.emit(EVENTS.SCAR_RECEIVED, { timestamp: Date.now() });
  }

  awakePower(path) {
    if (!Object.values(POWER_PATH).includes(path) || path === POWER_PATH.NONE) {
      console.warn(`[GameState] Invalid power path: ${path}`);
      return;
    }
    this._update({
      powerPath: path,
      powerLevel: 1,
      powerUnlocked: true,
    });
    eventBus.emit(EVENTS.POWER_AWAKENED, { path, powerLevel: 1 });
  }

  increasePowerLevel() {
    const powerLevel = this._state.powerLevel + 1;
    this._update({ powerLevel });
    eventBus.emit(EVENTS.POWER_LEVEL_UP, { powerLevel, path: this._state.powerPath });
  }

  recordChoice(choiceId, selected, pathInfluence) {
    const entry = {
      choiceId,
      selected,
      pathInfluence, // 'AGGRESSIVE' | 'PROTECTIVE' | 'STRATEGIC' | 'NEUTRAL'
      timestamp: Date.now(),
    };

    const choiceHistory = [...this._state.choiceHistory, entry];
    const update = { choiceHistory };

    if (pathInfluence === 'AGGRESSIVE') update.aggressiveCount = this._state.aggressiveCount + 1;
    if (pathInfluence === 'PROTECTIVE') update.protectiveCount = this._state.protectiveCount + 1;
    if (pathInfluence === 'STRATEGIC') update.strategicCount = this._state.strategicCount + 1;

    // Auto-update power path if not yet chosen and pattern emerging
    if (!this._state.powerUnlocked && choiceHistory.length >= 2) {
      const dominant = this._getDominantPath(update);
      if (dominant && dominant !== this._state.powerPath) {
        update.powerPath = dominant;
        eventBus.emit(EVENTS.POWER_PATH_CHANGED, { path: dominant });
      }
    }

    this._update(update);
    eventBus.emit(EVENTS.CHOICE_MADE, entry);
  }

  _getDominantPath(state) {
    const a = state.aggressiveCount ?? this._state.aggressiveCount;
    const p = state.protectiveCount ?? this._state.protectiveCount;
    const s = state.strategicCount ?? this._state.strategicCount;
    const max = Math.max(a, p, s);
    if (max === 0) return null;
    if (a === max) return POWER_PATH.AGGRESSIVE;
    if (p === max) return POWER_PATH.PROTECTIVE;
    if (s === max) return POWER_PATH.STRATEGIC;
    return null;
  }

  setMission(missionId) {
    this._update({ currentMissionId: missionId });
    eventBus.emit(EVENTS.MISSION_STARTED, { missionId });
  }

  completeMission(missionId) {
    const completedMissions = [...this._state.completedMissions, missionId];
    const objectivesCompleted = this._state.objectivesCompleted + 1;
    this._update({ completedMissions, objectivesCompleted, currentMissionId: null });
    eventBus.emit(EVENTS.MISSION_COMPLETED, { missionId });
  }

  failMission(missionId) {
    const failedMissions = [...this._state.failedMissions, missionId];
    this._update({ failedMissions, currentMissionId: null });
    eventBus.emit(EVENTS.MISSION_FAILED, { missionId });
  }

  defeatEnemy() {
    this._update({ enemiesDefeated: this._state.enemiesDefeated + 1 });
    eventBus.emit(EVENTS.ENEMY_DEFEATED, { total: this._state.enemiesDefeated + 1 });
  }

  updateHeroRelationship(relationship) {
    const previous = this._state.heroRelationship;
    this._update({ heroRelationship: relationship });
    eventBus.emit(EVENTS.HERO_RELATIONSHIP_CHANGED, { previous, current: relationship });

    if (relationship === HERO_RELATIONSHIP.AWARE && previous === HERO_RELATIONSHIP.UNKNOWN) {
      eventBus.emit(EVENTS.HERO_DETECTED_PLAYER, { phase: this._state.phase });
    }
  }

  recordHeroEncounter() {
    this._update({ heroEncounters: this._state.heroEncounters + 1 });
    eventBus.emit(EVENTS.HERO_ENCOUNTER, { count: this._state.heroEncounters + 1 });
  }

  triggerEnding(ending) {
    const gameEndTime = Date.now();
    this._update({
      ending,
      gameStatus: 'complete',
      gameEndTime,
      phase: GAME_PHASE.ENDING,
    });
    eventBus.emit(EVENTS.ENDING_TRIGGERED, { ending, state: this.get() });
  }

  pause() {
    if (this._state.gameStatus === 'playing') {
      this._update({ gameStatus: 'paused' });
      eventBus.emit(EVENTS.GAME_PAUSED);
    }
  }

  resume() {
    if (this._state.gameStatus === 'paused') {
      this._update({ gameStatus: 'playing' });
      eventBus.emit(EVENTS.GAME_RESUMED);
    }
  }

  reset() {
    this._state = createInitialState();
    eventBus.clear();
  }

  /**
   * Snapshot for QA — returns current state without exposing reference
   */
  snapshot() {
    const snap = JSON.parse(JSON.stringify(this._state));
    this._snapshots.push(snap);
    return snap;
  }

  getSnapshots() {
    return [...this._snapshots];
  }
}

// Singleton
export const gameState = new GameState();
