/**
 * SCAR — THE LAST CHOICE
 * Event Bus Module (KAUSTUB — GAMEPLAY)
 * 
 * Mandated Events:
 * 1. GAME_STARTED
 * 2. PLAYER_MOVED
 * 3. COMBAT_STARTED
 * 4. ENEMY_DEFEATED
 * 5. SCAR_RECEIVED
 * 6. POWER_AWAKENED
 * 7. CHOICE_MADE
 * 8. POWER_PATH_CHANGED
 * 9. HERO_DETECTED
 * 10. HERO_CONFRONTATION
 * 11. FINAL_BATTLE_STARTED
 * 12. FINAL_BATTLE_COMPLETED
 * 13. FINAL_CHOICE_MADE
 * 14. ENDING_TRIGGERED
 * 15. GAME_OVER
 */

export const GAME_EVENTS = {
  GAME_STARTED: 'GAME_STARTED',
  PLAYER_MOVED: 'PLAYER_MOVED',
  COMBAT_STARTED: 'COMBAT_STARTED',
  ENEMY_DEFEATED: 'ENEMY_DEFEATED',
  SCAR_RECEIVED: 'SCAR_RECEIVED',
  POWER_AWAKENED: 'POWER_AWAKENED',
  CHOICE_MADE: 'CHOICE_MADE',
  POWER_PATH_CHANGED: 'POWER_PATH_CHANGED',
  HERO_DETECTED: 'HERO_DETECTED',
  HERO_CONFRONTATION: 'HERO_CONFRONTATION',
  FINAL_BATTLE_STARTED: 'FINAL_BATTLE_STARTED',
  FINAL_BATTLE_COMPLETED: 'FINAL_BATTLE_COMPLETED',
  FINAL_CHOICE_MADE: 'FINAL_CHOICE_MADE',
  ENDING_TRIGGERED: 'ENDING_TRIGGERED',
  GAME_OVER: 'GAME_OVER'
};

class EventBus {
  constructor() {
    this.listeners = {};
    this.eventHistory = [];
  }

  on(eventType, callback) {
    if (!this.listeners[eventType]) {
      this.listeners[eventType] = [];
    }
    this.listeners[eventType].push(callback);
    return () => this.off(eventType, callback);
  }

  off(eventType, callback) {
    if (!this.listeners[eventType]) return;
    this.listeners[eventType] = this.listeners[eventType].filter(cb => cb !== callback);
  }

  emit(eventType, data = {}) {
    const payload = {
      event: eventType,
      timestamp: Date.now(),
      data
    };
    this.eventHistory.push(payload);
    
    // Also dispatch as custom window DOM event for cross-module integration
    try {
      const windowEvent = new CustomEvent(`scar:${eventType}`, { detail: payload });
      window.dispatchEvent(windowEvent);
    } catch (e) {
      // Ignore non-browser environments if any
    }

    if (this.listeners[eventType]) {
      this.listeners[eventType].forEach(callback => {
        try {
          callback(payload);
        } catch (err) {
          console.error(`Error handling event ${eventType}:`, err);
        }
      });
    }

    console.log(`[SCAR Event] ${eventType}`, data);
  }

  getHistory() {
    return [...this.eventHistory];
  }
}

export const eventBus = new EventBus();
