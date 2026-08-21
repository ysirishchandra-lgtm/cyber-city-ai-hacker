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

import { kaustubEngine } from './gameplay/KaustubGameplayEngine.js';
import { backendClient } from './backend/BackendClient.js';

// Register Kaustub's Gameplay Engine
gameManager.registerEngine(kaustubEngine);

// Register Priyanshu's Backend
gameManager.registerBackend(backendClient);

// ─── Boot ─────────────────────────────────────────────────────────────────────
async function boot() {
  await gameManager.init();

  // Try authenticating existing session
  let playerId = null;
  let playerName = null;

  try {
    const authResult = await backendClient.authenticate();
    if (authResult) {
      playerId = authResult.playerId;
      playerName = authResult.playerName;
      console.log(`[Boot] Authenticated player: ${playerName} (${playerId})`);
    }
  } catch (err) {
    console.warn('[Boot] Auth check failed:', err.message);
  }

  // Show start screen overlay in browser
  if (typeof document !== 'undefined') {
    const startScreen = document.getElementById('start-screen');
    if (startScreen) startScreen.classList.remove('hidden');

    const btnStart = document.getElementById('btn-start');
    if (btnStart) {
      btnStart.addEventListener('click', async () => {
        const nameInput = document.getElementById('player-name');
        const name = nameInput?.value?.trim() || 'Player';
        if (startScreen) startScreen.classList.add('hidden');
        await gameManager.startGame(playerId, name);
      });
    }
  }
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
