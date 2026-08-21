/**
 * SCAR — THE LAST CHOICE
 * EventBus.js — Central pub/sub event system
 * Author: Sirish (Lead/Integration)
 *
 * All game systems communicate through this bus.
 * No direct coupling between systems.
 */

export const EVENTS = {
  // Game lifecycle
  GAME_STARTED: 'GAME_STARTED',
  GAME_PAUSED: 'GAME_PAUSED',
  GAME_RESUMED: 'GAME_RESUMED',
  GAME_COMPLETED: 'GAME_COMPLETED',

  // Story progression
  INTRO_COMPLETE: 'INTRO_COMPLETE',
  ATTACK_STARTED: 'ATTACK_STARTED',
  ATTACK_COMPLETE: 'ATTACK_COMPLETE',
  SCAR_RECEIVED: 'SCAR_RECEIVED',

  // Level flow
  LEVEL_STARTED: 'LEVEL_STARTED',
  LEVEL_COMPLETED: 'LEVEL_COMPLETED',
  MISSION_STARTED: 'MISSION_STARTED',
  MISSION_OBJECTIVE_UPDATED: 'MISSION_OBJECTIVE_UPDATED',
  MISSION_COMPLETED: 'MISSION_COMPLETED',
  MISSION_FAILED: 'MISSION_FAILED',

  // Power system
  POWER_AWAKENED: 'POWER_AWAKENED',
  POWER_PATH_CHANGED: 'POWER_PATH_CHANGED',
  POWER_LEVEL_UP: 'POWER_LEVEL_UP',

  // Choice system
  CHOICE_PRESENTED: 'CHOICE_PRESENTED',
  CHOICE_MADE: 'CHOICE_MADE',

  // Hero / antagonist
  HERO_DETECTED_PLAYER: 'HERO_DETECTED_PLAYER',
  HERO_ENCOUNTER: 'HERO_ENCOUNTER',
  HERO_RELATIONSHIP_CHANGED: 'HERO_RELATIONSHIP_CHANGED',

  // Combat
  PLAYER_DAMAGED: 'PLAYER_DAMAGED',
  PLAYER_HEALED: 'PLAYER_HEALED',
  ENEMY_DEFEATED: 'ENEMY_DEFEATED',

  // Ending
  FINAL_BATTLE_STARTED: 'FINAL_BATTLE_STARTED',
  FINAL_CHOICE_MADE: 'FINAL_CHOICE_MADE',
  ENDING_TRIGGERED: 'ENDING_TRIGGERED',

  // Score / Cloud
  SCORE_CALCULATED: 'SCORE_CALCULATED',
  SCORE_SUBMITTED: 'SCORE_SUBMITTED',

  // UI (consumed by Ashwidha's system)
  DIALOGUE_START: 'DIALOGUE_START',
  DIALOGUE_COMPLETE: 'DIALOGUE_COMPLETE',
  HUD_UPDATE: 'HUD_UPDATE',
  CINEMATIC_START: 'CINEMATIC_START',
  CINEMATIC_COMPLETE: 'CINEMATIC_COMPLETE',
};

class EventBus {
  constructor() {
    /** @type {Map<string, Set<Function>>} */
    this._listeners = new Map();
    this._history = []; // for debugging + QA
  }

  /**
   * Subscribe to an event.
   * @param {string} event - Event name from EVENTS
   * @param {Function} callback - Handler function
   * @returns {Function} Unsubscribe function
   */
  on(event, callback) {
    if (!this._listeners.has(event)) {
      this._listeners.set(event, new Set());
    }
    this._listeners.get(event).add(callback);

    // Return unsubscribe fn
    return () => this.off(event, callback);
  }

  /**
   * Subscribe once — auto-removes after first trigger.
   */
  once(event, callback) {
    const wrapper = (data) => {
      callback(data);
      this.off(event, wrapper);
    };
    return this.on(event, wrapper);
  }

  /**
   * Unsubscribe from an event.
   */
  off(event, callback) {
    if (this._listeners.has(event)) {
      this._listeners.get(event).delete(callback);
    }
  }

  /**
   * Emit an event with optional payload.
   * @param {string} event
   * @param {*} data
   */
  emit(event, data = null) {
    const entry = { event, data, timestamp: Date.now() };
    this._history.push(entry);

    if (this._listeners.has(event)) {
      this._listeners.get(event).forEach(cb => {
        try {
          cb(data);
        } catch (err) {
          console.error(`[EventBus] Error in handler for "${event}":`, err);
        }
      });
    }
  }

  /**
   * Get event history (for QA/debugging).
   */
  getHistory() {
    return [...this._history];
  }

  /**
   * Clear all listeners (call on game reset).
   */
  clear() {
    this._listeners.clear();
    this._history = [];
  }
}

// Singleton — one bus for the entire game
export const eventBus = new EventBus();
