/**
 * SCAR — THE LAST CHOICE
 * MissionSystem.js — Mission contract management
 * Author: Sirish (Lead/Integration)
 *
 * Manages mission lifecycle: start → objective tracking → complete/fail
 * Missions are data-driven — defined in StoryContent.js
 * Kaustub's engine calls triggerObjective() when gameplay goals are met
 */

import { eventBus, EVENTS } from './EventBus.js';
import { gameState } from './GameState.js';
import { MISSIONS } from '../story/StoryContent.js';

class MissionSystem {
  constructor() {
    /** @type {Map<string, object>} Active mission instances */
    this._active = new Map();

    this._setupListeners();
  }

  _setupListeners() {
    eventBus.on(EVENTS.LEVEL_STARTED, ({ level }) => {
      const levelMissions = this._getMissionsForLevel(level);
      if (levelMissions.length > 0) {
        this.startMission(levelMissions[0].id);
      }
    });
  }

  _getMissionsForLevel(level) {
    return MISSIONS.filter(m => m.level === level);
  }

  /**
   * Start a mission by ID.
   * @param {string} missionId
   */
  startMission(missionId) {
    const template = MISSIONS.find(m => m.id === missionId);
    if (!template) {
      console.warn(`[MissionSystem] Unknown mission: ${missionId}`);
      return;
    }

    const instance = {
      ...template,
      startTime: Date.now(),
      objectives: template.objectives.map(obj => ({
        ...obj,
        progress: 0,
        completed: false,
      })),
      status: 'active',
    };

    this._active.set(missionId, instance);
    gameState.setMission(missionId);
    eventBus.emit(EVENTS.MISSION_STARTED, { missionId, title: template.title });
  }

  /**
   * Called by Kaustub's gameplay engine when an objective condition is met.
   * @param {string} missionId
   * @param {string} objectiveId
   * @param {number} [progress] - Optional: partial progress (0–1)
   */
  triggerObjective(missionId, objectiveId, progress = 1) {
    const mission = this._active.get(missionId);
    if (!mission || mission.status !== 'active') return;

    const obj = mission.objectives.find(o => o.id === objectiveId);
    if (!obj || obj.completed) return;

    obj.progress = Math.min(1, progress);
    if (obj.progress >= 1) {
      obj.completed = true;
    }

    eventBus.emit(EVENTS.MISSION_OBJECTIVE_UPDATED, {
      missionId,
      objectiveId,
      progress: obj.progress,
      completed: obj.completed,
    });

    // Check if all required objectives done
    this._checkCompletion(missionId);
  }

  _checkCompletion(missionId) {
    const mission = this._active.get(missionId);
    if (!mission) return;

    const allRequired = mission.objectives
      .filter(o => o.required)
      .every(o => o.completed);

    if (allRequired) {
      mission.status = 'completed';
      mission.endTime = Date.now();
      this._active.delete(missionId);
      gameState.completeMission(missionId);

      // Auto-chain to next mission
      if (mission.nextMission) {
        setTimeout(() => this.startMission(mission.nextMission), 1500);
      }
    }
  }

  /**
   * Fail a mission (e.g. player died, time expired).
   * @param {string} missionId
   * @param {string} [reason]
   */
  failMission(missionId, reason = 'Unknown') {
    const mission = this._active.get(missionId);
    if (!mission) return;

    mission.status = 'failed';
    mission.failReason = reason;
    this._active.delete(missionId);
    gameState.failMission(missionId);
  }

  /**
   * Get current active missions (read-only snapshot).
   */
  getActiveMissions() {
    return Array.from(this._active.values()).map(m => ({ ...m }));
  }

  /**
   * Get a specific mission's current state.
   */
  getMission(missionId) {
    const m = this._active.get(missionId);
    return m ? { ...m } : null;
  }

  /**
   * Integration point: Kaustub's engine checks this to know
   * what objective conditions to watch for.
   */
  getCurrentObjectives() {
    const result = [];
    for (const mission of this._active.values()) {
      for (const obj of mission.objectives) {
        if (!obj.completed) {
          result.push({
            missionId: mission.id,
            objectiveId: obj.id,
            description: obj.description,
            type: obj.type,
            target: obj.target,
            progress: obj.progress,
            required: obj.required,
          });
        }
      }
    }
    return result;
  }
}

export const missionSystem = new MissionSystem();
