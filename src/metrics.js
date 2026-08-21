/**
 * SCAR — THE LAST CHOICE
 * Real-Time Metrics & Choice Tracker (KAUSTUB — GAMEPLAY)
 * 
 * Tracks actual gameplay stats without hardcoded/fake numbers.
 */

import { eventBus, GAME_EVENTS } from './events.js';

export class GameplayMetrics {
  constructor() {
    this.reset();
    this.setupListeners();
  }

  reset() {
    this.startTime = Date.now();
    this.endTime = null;
    this.elapsedSeconds = 0;
    
    this.health = 100;
    this.maxHealth = 100;
    
    this.enemiesDefeated = 0;
    this.missionsCompleted = [];
    this.powerUsageCount = 0;
    this.damageReceived = 0;
    
    // Action choices tracker for power path calculation
    this.actionCounts = {
      aggressive: 0,
      protective: 0,
      strategic: 0
    };
    
    this.choices = []; // Detailed record of explicit player choices
    this.dominantPath = 'NONE'; // 'NONE' | 'DESTRUCTION' | 'PROTECTION' | 'CONTROL'
    
    this.heroResult = 'UNDECIDED'; // 'DEFEATED_HERO' | 'SPARED_HERO' | 'DEFEATED_BY_HERO'
    this.finalChoice = null; // 'VILLAIN' | 'HERO' | 'SAVIOR' | 'HUMAN'
  }

  setupListeners() {
    eventBus.on(GAME_EVENTS.ENEMY_DEFEATED, (payload) => {
      this.enemiesDefeated += 1;
    });

    eventBus.on(GAME_EVENTS.POWER_AWAKENED, (payload) => {
      if (payload.data && payload.data.path) {
        this.dominantPath = payload.data.path;
      }
    });

    eventBus.on(GAME_EVENTS.FINAL_CHOICE_MADE, (payload) => {
      if (payload.data && payload.data.choice) {
        this.finalChoice = payload.data.choice;
      }
    });
  }

  recordAction(type, description) {
    if (['aggressive', 'protective', 'strategic'].includes(type)) {
      this.actionCounts[type] += 1;
      
      const newPath = this.calculateDominantPath();
      if (newPath !== this.dominantPath && this.dominantPath !== 'NONE') {
        this.dominantPath = newPath;
        eventBus.emit(GAME_EVENTS.POWER_PATH_CHANGED, {
          path: this.dominantPath,
          counts: { ...this.actionCounts }
        });
      }
    }

    const choiceRecord = {
      timestamp: Date.now(),
      type,
      description,
      currentStats: {
        health: this.health,
        enemiesDefeated: this.enemiesDefeated
      }
    };
    
    this.choices.push(choiceRecord);
    
    eventBus.emit(GAME_EVENTS.CHOICE_MADE, choiceRecord);
  }

  calculateDominantPath() {
    const { aggressive, protective, strategic } = this.actionCounts;
    if (aggressive === 0 && protective === 0 && strategic === 0) return 'NONE';
    
    if (aggressive >= protective && aggressive >= strategic) {
      return 'DESTRUCTION';
    } else if (protective >= aggressive && protective >= strategic) {
      return 'PROTECTION';
    } else {
      return 'CONTROL';
    }
  }

  recordDamage(amount) {
    this.damageReceived += amount;
    this.health = Math.max(0, this.health - amount);
  }

  heal(amount) {
    this.health = Math.min(this.maxHealth, this.health + amount);
  }

  recordPowerUse(powerName) {
    this.powerUsageCount += 1;
  }

  completeMission(missionId, title) {
    if (!this.missionsCompleted.includes(missionId)) {
      this.missionsCompleted.push(missionId);
    }
  }

  finishGame(finalChoice, heroResult = 'SPARED_HERO') {
    this.endTime = Date.now();
    this.elapsedSeconds = Math.floor((this.endTime - this.startTime) / 1000);
    this.finalChoice = finalChoice;
    this.heroResult = heroResult;
  }

  getSummary() {
    const totalTime = this.endTime 
      ? Math.floor((this.endTime - this.startTime) / 1000)
      : Math.floor((Date.now() - this.startTime) / 1000);

    return {
      time: totalTime,
      health: this.health,
      maxHealth: this.maxHealth,
      enemiesDefeated: this.enemiesDefeated,
      missionsCompleted: [...this.missionsCompleted],
      powerUsage: this.powerUsageCount,
      choices: [...this.choices],
      actionCounts: { ...this.actionCounts },
      dominantPath: this.dominantPath,
      damageReceived: this.damageReceived,
      heroResult: this.heroResult,
      finalChoice: this.finalChoice
    };
  }
}

export const metrics = new GameplayMetrics();
