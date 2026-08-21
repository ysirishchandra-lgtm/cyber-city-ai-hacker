/**
 * SCAR — THE LAST CHOICE
 * game.js — Entry point
 * Author: Sirish (Lead/Integration)
 *
 * Boots the game. Wires all modules together.
 * Waits for auth before starting.
 */

import { gameManager } from './integration/GameManager.js';
import { PrototypeRenderer } from './engine/PrototypeRenderer.js';
import { eventBus, EVENTS } from './core/EventBus.js';

// ─── Wire prototype renderer ──────────────────────────────────────────────────
const renderer = new PrototypeRenderer('scar-canvas');
gameManager.registerRenderer(renderer);

// ─── Stubs — Kaustub and Priyanshu register their modules here ───────────────
// These will be replaced when teammates merge their branches.

const engineStub = {
  async init() {
    console.log('[Engine Stub] Kaustub engine not yet merged. Using minimal stub.');
  },
  update(state, dt) {
    // No-op until Kaustub merges
  },
  setScene(sceneName) {
    console.log(`[Engine Stub] Scene: ${sceneName}`);
  },
  reset() {},
};
gameManager.registerEngine(engineStub);

const backendStub = {
  async authenticate() {
    // Returns null until Priyanshu merges — guest mode
    return null;
  },
  async submitScore(payload) {
    console.log('[Backend Stub] Score payload ready for submission:', payload);
    console.log('[Backend Stub] Priyanshu backend not yet merged. Score not saved.');
  },
  async getLeaderboard() {
    return [];
  },
};
gameManager.registerBackend(backendStub);

// ─── Boot ─────────────────────────────────────────────────────────────────────
async function boot() {
  await gameManager.init();

  // Try auth (Priyanshu's module will replace this)
  let playerId = null;
  let playerName = null;

  try {
    const authResult = await backendStub.authenticate();
    if (authResult) {
      playerId = authResult.playerId;
      playerName = authResult.playerName;
    }
  } catch (err) {
    console.warn('[Boot] Auth failed, starting as guest:', err);
  }

  // Show start screen overlay
  document.getElementById('start-screen').classList.remove('hidden');

  document.getElementById('btn-start').addEventListener('click', async () => {
    const nameInput = document.getElementById('player-name');
    const name = nameInput?.value?.trim() || 'Player';
    document.getElementById('start-screen').classList.add('hidden');
    await gameManager.startGame(playerId, name);
  });
}

// ─── Global events for debugging ─────────────────────────────────────────────
eventBus.on(EVENTS.GAME_STARTED, (d) => console.log('[SCAR] Game started', d));
eventBus.on(EVENTS.LEVEL_STARTED, (d) => console.log('[SCAR] Level', d.level));
eventBus.on(EVENTS.POWER_AWAKENED, (d) => console.log('[SCAR] Power awakened:', d.path));
eventBus.on(EVENTS.CHOICE_MADE, (d) => console.log('[SCAR] Choice made:', d));
eventBus.on(EVENTS.SCORE_CALCULATED, (d) => console.log('[SCAR] Score:', d.score));
eventBus.on(EVENTS.ENDING_TRIGGERED, (d) => console.log('[SCAR] Ending:', d.ending));

// ─── Start ────────────────────────────────────────────────────────────────────
boot().catch(console.error);
