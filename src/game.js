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
import { audioEngine } from './visuals/AudioEngine.js';

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
        audioEngine.init();
        audioEngine.startBGM();
        audioEngine.playUIClick();
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

// ─── Hackathon Judge Rapid Demo Router ─────────────────────────────────────────
if (typeof window !== 'undefined') {
  window.__SCAR_DEMO_JUMP__ = async (stage) => {
    audioEngine.init();
    audioEngine.startBGM();
    audioEngine.playUIClick();

    const startScreen = document.getElementById('start-screen');
    if (startScreen) startScreen.classList.add('hidden');

    const nameInput = document.getElementById('player-name');
    const name = nameInput?.value?.trim() || 'Judge';

    if (stage === 'LEVEL_1') {
      await gameManager.startGame('judge_session', name);
    } else if (stage === 'BOSS_1') {
      await gameManager.startGame('judge_session', name);
      // Skip straight to boss in warehouse
      kaustubEngine.player.x = 880;
      kaustubEngine.player.y = 350;
      kaustubEngine.update({ phase: 'LEVEL_1' }, 0.016);
    } else if (stage === 'LEVEL_2') {
      await gameManager.startGame('judge_session', name);
      const { gameState } = await import('./core/GameState.js');
      gameState.unlockPower('PROTECTIVE');
      gameManager._runLevel(2);
    } else if (stage === 'LEVEL_3') {
      await gameManager.startGame('judge_session', name);
      const { gameState } = await import('./core/GameState.js');
      gameState.unlockPower('STRATEGIC');
      gameManager._runLevel(3);
    } else if (stage === 'FINAL_CHOICE') {
      await gameManager.startGame('judge_session', name);
      const { gameState } = await import('./core/GameState.js');
      gameState.unlockPower('AGGRESSIVE');
      gameManager._runFinalChoice();
    }
  };
}

// ─── Start ────────────────────────────────────────────────────────────────────
boot().catch(console.error);
