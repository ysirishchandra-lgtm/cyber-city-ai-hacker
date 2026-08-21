/**
 * SCAR — THE LAST CHOICE
 * TeamAPI.js — Integration contracts for all team members
 * Author: Sirish (Lead/Integration)
 *
 * This file is the bridge between all four developers.
 * Each section defines what Sirish's systems EXPECT from each teammate,
 * and what each teammate CAN CALL from Sirish's systems.
 *
 * READ THIS BEFORE TOUCHING ANOTHER DEV'S FILES.
 */

import { eventBus, EVENTS } from '../core/EventBus.js';
import { gameState, GAME_PHASE, POWER_PATH } from '../core/GameState.js';
import { missionSystem } from '../core/MissionSystem.js';
import { choiceSystem } from '../core/ChoiceSystem.js';
import { scoreSystem } from '../core/ScoreSystem.js';

// ═══════════════════════════════════════════════════════════════════════════════
// ASHWIDHA — UI/UX INTEGRATION API
// ═══════════════════════════════════════════════════════════════════════════════

export const AshwidhaAPI = {
  /**
   * ASHWIDHA CALLS THIS → Present a choice to the player.
   * Never call choiceSystem directly.
   */
  presentChoice: (choiceId) => choiceSystem.presentChoice(choiceId),

  /**
   * ASHWIDHA CALLS THIS → Player selected a choice option.
   */
  selectOption: (optionId) => choiceSystem.selectOption(optionId),

  /**
   * ASHWIDHA CALLS THIS → Player made final ending choice.
   */
  makeFinalChoice: (ending) => choiceSystem.makeFinalChoice(ending),

  /**
   * ASHWIDHA READS THIS → Is there a choice pending to render?
   */
  getPendingChoice: () => choiceSystem.getPendingChoice(),

  /**
   * ASHWIDHA READS THIS → Current game state for HUD rendering.
   */
  getGameState: () => gameState.get(),

  /**
   * ASHWIDHA READS THIS → Active missions for HUD objectives display.
   */
  getActiveMissions: () => missionSystem.getActiveMissions(),

  /**
   * ASHWIDHA LISTENS TO THESE EVENTS for UI triggers:
   *
   * EVENTS.DIALOGUE_START     → render dialogue box
   * EVENTS.DIALOGUE_COMPLETE  → close dialogue box
   * EVENTS.CHOICE_PRESENTED   → render choice overlay
   * EVENTS.HUD_UPDATE         → re-render HUD
   * EVENTS.CINEMATIC_START    → start cinematic sequence
   * EVENTS.CINEMATIC_COMPLETE → end cinematic
   * EVENTS.ENDING_TRIGGERED   → show ending screen
   * EVENTS.SCORE_CALCULATED   → show score breakdown
   * EVENTS.POWER_AWAKENED     → show power path reveal animation
   * EVENTS.LEVEL_STARTED      → show level title card
   */
  events: {
    onDialogueStart: (cb) => eventBus.on(EVENTS.DIALOGUE_START, cb),
    onChoicePresented: (cb) => eventBus.on(EVENTS.CHOICE_PRESENTED, cb),
    onHudUpdate: (cb) => eventBus.on(EVENTS.HUD_UPDATE, cb),
    onCinematicStart: (cb) => eventBus.on(EVENTS.CINEMATIC_START, cb),
    onEndingTriggered: (cb) => eventBus.on(EVENTS.ENDING_TRIGGERED, cb),
    onScoreCalculated: (cb) => eventBus.on(EVENTS.SCORE_CALCULATED, cb),
    onPowerAwakened: (cb) => eventBus.on(EVENTS.POWER_AWAKENED, cb),
    onLevelStarted: (cb) => eventBus.on(EVENTS.LEVEL_STARTED, cb),
    onMissionStarted: (cb) => eventBus.on(EVENTS.MISSION_STARTED, cb),
    onMissionCompleted: (cb) => eventBus.on(EVENTS.MISSION_COMPLETED, cb),
  },

  /**
   * ASHWIDHA EMITS THESE when animations complete:
   */
  emitCinematicComplete: () => eventBus.emit(EVENTS.CINEMATIC_COMPLETE),
  emitDialogueComplete: () => eventBus.emit(EVENTS.DIALOGUE_COMPLETE),
};

// ═══════════════════════════════════════════════════════════════════════════════
// KAUSTUB — GAMEPLAY / AI INTEGRATION API
// ═══════════════════════════════════════════════════════════════════════════════

export const KaustubAPI = {
  /**
   * KAUSTUB CALLS THIS → Player moved to a new position.
   * Call every frame or on significant position change.
   */
  updatePosition: (x, y) => gameState.updatePosition(x, y),

  /**
   * KAUSTUB CALLS THIS → Player took damage.
   */
  playerTakeDamage: (amount) => gameState.takeDamage(amount),

  /**
   * KAUSTUB CALLS THIS → Player healed.
   */
  playerHeal: (amount) => gameState.heal(amount),

  /**
   * KAUSTUB CALLS THIS → Enemy defeated.
   */
  enemyDefeated: (enemyId) => {
    gameState.defeatEnemy();
    // Check if this fulfills any mission objectives
    const objectives = missionSystem.getCurrentObjectives();
    objectives
      .filter(o => o.type === 'DEFEAT_ENEMIES')
      .forEach(o => {
        const state = gameState.get();
        const progress = Math.min(1, state.enemiesDefeated / (o.target.count || 1));
        if (!o.target.targetId || o.target.targetId === enemyId) {
          missionSystem.triggerObjective(o.missionId, o.objectiveId, progress);
        }
      });
  },

  /**
   * KAUSTUB CALLS THIS → Player entered a trigger area.
   * @param {string} areaId - Must match target.areaId in missions
   */
  playerEnteredArea: (areaId) => {
    const objectives = missionSystem.getCurrentObjectives();
    objectives
      .filter(o => o.type === 'REACH_AREA' && o.target.areaId === areaId)
      .forEach(o => missionSystem.triggerObjective(o.missionId, o.objectiveId, 1));
  },

  /**
   * KAUSTUB CALLS THIS → Player interacted with an NPC.
   * @param {string} npcId
   */
  npcInteracted: (npcId) => {
    const objectives = missionSystem.getCurrentObjectives();
    objectives
      .filter(o => (o.type === 'TALK' || o.type === 'INTERACT') && o.target.npcId === npcId)
      .forEach(o => missionSystem.triggerObjective(o.missionId, o.objectiveId, 1));
  },

  /**
   * KAUSTUB CALLS THIS → Player escaped from an area.
   * @param {string} areaId
   */
  playerEscapedArea: (areaId) => {
    const objectives = missionSystem.getCurrentObjectives();
    objectives
      .filter(o => o.type === 'ESCAPE' && o.target.areaId === areaId)
      .forEach(o => missionSystem.triggerObjective(o.missionId, o.objectiveId, 1));
  },

  /**
   * KAUSTUB READS THIS → Is a choice blocking gameplay?
   */
  isChoiceBlocking: () => choiceSystem.isBlocking(),

  /**
   * KAUSTUB READS THIS → Current phase (to know what to render/simulate).
   */
  getCurrentPhase: () => gameState.getPhase(),

  /**
   * KAUSTUB READS THIS → Player's power path for ability set.
   */
  getPowerPath: () => gameState.getPowerPath(),

  /**
   * KAUSTUB READS THIS → All current objectives (for AI + collision detection).
   */
  getCurrentObjectives: () => missionSystem.getCurrentObjectives(),

  /**
   * KAUSTUB READS THIS → Hero's relationship (for AI aggression level).
   */
  getHeroRelationship: () => gameState.getField('heroRelationship'),

  /**
   * KAUSTUB CALLS THIS → Hero encountered the player.
   */
  heroEncountered: () => {
    gameState.recordHeroEncounter();
    const count = gameState.getField('heroEncounters');
    if (count === 1) gameState.updateHeroRelationship(HERO_RELATIONSHIP.AWARE);
    if (count >= 3) gameState.updateHeroRelationship(HERO_RELATIONSHIP.HOSTILE);
  },

  /**
   * KAUSTUB LISTENS TO THESE for combat/AI events:
   */
  events: {
    onLevelStarted: (cb) => eventBus.on(EVENTS.LEVEL_STARTED, cb),
    onPowerAwakened: (cb) => eventBus.on(EVENTS.POWER_AWAKENED, cb),
    onChoicePresented: (cb) => eventBus.on(EVENTS.CHOICE_PRESENTED, cb),
    onHeroDetected: (cb) => eventBus.on(EVENTS.HERO_DETECTED_PLAYER, cb),
    onFinalBattleStarted: (cb) => eventBus.on(EVENTS.FINAL_BATTLE_STARTED, cb),
    onGameCompleted: (cb) => eventBus.on(EVENTS.GAME_COMPLETED, cb),
  },
};

// ═══════════════════════════════════════════════════════════════════════════════
// PRIYANSHU — BACKEND / AWS INTEGRATION API
// ═══════════════════════════════════════════════════════════════════════════════

export const PriyanshuAPI = {
  /**
   * PRIYANSHU CALLS THIS → After auth, set the real player identity.
   * Must be called before game starts for score to be attributed.
   */
  setAuthenticatedPlayer: (playerId, playerName) => {
    gameState.setPlayerId(playerId, playerName);
  },

  /**
   * PRIYANSHU READS THIS → Score submission payload after game ends.
   * Call this after EVENTS.SCORE_CALCULATED fires.
   * This is the ONLY correct way to get score data.
   */
  getScorePayload: () => scoreSystem.getSubmissionPayload(),

  /**
   * PRIYANSHU READS THIS → Is player authenticated?
   */
  isAuthenticated: () => gameState.getField('playerId') !== null,

  /**
   * PRIYANSHU READS THIS → Current player ID.
   */
  getPlayerId: () => gameState.getField('playerId'),

  /**
   * PRIYANSHU LISTENS TO THESE for backend triggers:
   */
  events: {
    onScoreCalculated: (cb) => eventBus.on(EVENTS.SCORE_CALCULATED, cb),
    onGameCompleted: (cb) => eventBus.on(EVENTS.GAME_COMPLETED, cb),
    onGameStarted: (cb) => eventBus.on(EVENTS.GAME_STARTED, cb),
  },

  /**
   * PRIYANSHU EMITS THIS → After score is saved to cloud.
   */
  emitScoreSubmitted: (data) => eventBus.emit(EVENTS.SCORE_SUBMITTED, data),
};

// ─── IMPORT MISSING ENUM ──────────────────────────────────────────────────────
import { HERO_RELATIONSHIP } from '../core/GameState.js';
