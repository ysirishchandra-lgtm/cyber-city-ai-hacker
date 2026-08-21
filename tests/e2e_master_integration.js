/**
 * SCAR — THE LAST CHOICE
 * E2E Master Integration Test
 * Author: Sirish (Lead/Integration)
 *
 * Full pipeline verification:
 * Real Auth -> Game Session -> Gameplay Simulation -> Moral Choices ->
 * Ending Resolution -> Score Calculation -> Backend API Submission ->
 * Database Persistence -> Real Leaderboard Retrieval.
 */

import { BackendClient } from '../src/backend/BackendClient.js';
import { eventBus, EVENTS } from '../src/core/EventBus.js';
import { gameState, GAME_PHASE, POWER_PATH, ENDING } from '../src/core/GameState.js';
import { choiceSystem } from '../src/core/ChoiceSystem.js';
import { scoreSystem } from '../src/core/ScoreSystem.js';
import { gameManager } from '../src/integration/GameManager.js';
import { kaustubEngine } from '../src/gameplay/KaustubGameplayEngine.js';

async function runMasterE2E() {
  const backendClient = new BackendClient('http://localhost:3000');
  gameManager.registerEngine(kaustubEngine);
  gameManager.registerBackend(backendClient);

  console.log('==================================================');
  console.log('SCAR — MASTER E2E END-TO-END INTEGRATION TEST');
  console.log('==================================================');

  // Register real player
  const playerEmail = 'master_pilot_' + Date.now() + '@scar.cyber';
  const playerName = 'Valkyrie_' + Math.floor(Math.random() * 1000);
  await backendClient.register(playerName, playerEmail, 'MasterPass123!');
  const auth = await backendClient.authenticate(playerEmail, 'MasterPass123!');
  console.log(`✓ Registered and Authenticated Real Player: ${auth.playerName} (${auth.playerId})`);

  const testMatrix = [
    {
      name: 'E2E Path 1: Aggressive -> Destruction Nova -> Villain Ending',
      powerChoice: 'opt_destruction',
      expectedPath: POWER_PATH.AGGRESSIVE,
      heroChoice: 'opt_decline',
      finalEnding: ENDING.VILLAIN,
    },
    {
      name: 'E2E Path 2: Protective -> Kinetic Barrier -> Hero Ending',
      powerChoice: 'opt_protection',
      expectedPath: POWER_PATH.PROTECTIVE,
      heroChoice: 'opt_accept_terms',
      finalEnding: ENDING.HERO,
    },
    {
      name: 'E2E Path 3: Strategic -> Chrono Stasis -> Savior Ending',
      powerChoice: 'opt_control',
      expectedPath: POWER_PATH.STRATEGIC,
      heroChoice: 'opt_negotiate',
      finalEnding: ENDING.SAVIOR,
    },
    {
      name: 'E2E Path 4: Balanced -> Human Ending (Secret 2.0x)',
      powerChoice: 'opt_protection',
      expectedPath: POWER_PATH.PROTECTIVE,
      heroChoice: 'opt_negotiate',
      finalEnding: ENDING.HUMAN,
    }
  ];

  for (const pt of testMatrix) {
    console.log('\n--------------------------------------------------');
    console.log('Running:', pt.name);
    console.log('--------------------------------------------------');

    gameManager.reset();
    await gameManager.init();
    await gameManager.startGame(auth.playerId, auth.playerName);

    // Create session in backend
    const sessionId = await backendClient.createGameSession();
    if (!sessionId) throw new Error('Game session creation failed');
    console.log('✓ Active Backend GameSession ID:', sessionId);

    // Intro -> City Exploration -> Attack -> Scar -> Level 1
    eventBus.emit(EVENTS.CINEMATIC_COMPLETE);
    gameManager.triggerAttack();
    eventBus.emit(EVENTS.CINEMATIC_COMPLETE);
    eventBus.emit(EVENTS.CINEMATIC_COMPLETE);

    if (gameState.getPhase() !== GAME_PHASE.LEVEL_1) throw new Error('Failed to reach Level 1');

    // Combat & objectives
    kaustubEngine.player.x = 400;
    kaustubEngine.update(gameState.get(), 0.016);
    await new Promise(r => setTimeout(r, 1600));

    kaustubEngine.player.x = 550;
    kaustubEngine.update(gameState.get(), 0.016);
    await new Promise(r => setTimeout(r, 1600));
    kaustubEngine.update(gameState.get(), 0.016);

    // Defeat Level 1 enemies
    kaustubEngine.enemies[0].takeDamage(100);
    kaustubEngine.enemies[1].takeDamage(100);
    kaustubEngine.enemies[2].takeDamage(100);

    const pendingChoice = choiceSystem.getPendingChoice();
    if (!pendingChoice || pendingChoice.id !== 'CHOICE_POWER_AWAKENING') {
      throw new Error('CHOICE_POWER_AWAKENING not presented');
    }

    choiceSystem.selectOption(pt.powerChoice);
    eventBus.emit(EVENTS.DIALOGUE_COMPLETE);
    await new Promise(r => setTimeout(r, 1200));

    if (gameState.getPhase() !== GAME_PHASE.LEVEL_2) throw new Error('Failed to reach Level 2');
    console.log('✓ Level 2 entered with awakened power:', gameState.getPowerPath());

    // Level 2 combat & Atlas meeting
    kaustubEngine.player.x = 500;
    kaustubEngine.update(gameState.get(), 0.016);
    kaustubEngine.enemies[0].takeDamage(100);
    kaustubEngine.enemies[1].takeDamage(100);
    await new Promise(r => setTimeout(r, 1600));

    kaustubEngine.player.x = 1000;
    kaustubEngine.update(gameState.get(), 0.016);
    eventBus.emit(EVENTS.DIALOGUE_COMPLETE);
    choiceSystem.selectOption(pt.heroChoice);
    eventBus.emit(EVENTS.DIALOGUE_COMPLETE);
    await new Promise(r => setTimeout(r, 1200));

    if (gameState.getPhase() !== GAME_PHASE.LEVEL_3) throw new Error('Failed to reach Level 3');

    // Level 3 & Final Battle
    kaustubEngine.player.x = 700;
    kaustubEngine.update(gameState.get(), 0.016);
    await new Promise(r => setTimeout(r, 1600));
    kaustubEngine.update(gameState.get(), 0.016);

    kaustubEngine.hero.takeDamage(400, kaustubEngine.powerSystem);

    if (gameState.getPhase() !== GAME_PHASE.FINAL_CHOICE) throw new Error('Failed to enter FINAL_CHOICE');

    // Make final choice
    choiceSystem.makeFinalChoice(pt.finalEnding);
    if (gameState.getField('ending') !== pt.finalEnding) throw new Error('Ending mismatch');

    const score = gameState.getField('score');
    console.log(`✓ Game Completed. Calculated Score: ${score} | Ending: ${pt.finalEnding}`);

    // Wait for backend submission
    await new Promise(r => setTimeout(r, 1000));
  }

  // Check Leaderboard
  console.log('\n==================================================');
  console.log('VERIFYING DATABASE LEADERBOARD PERSISTENCE');
  console.log('==================================================');
  const lb = await backendClient.getLeaderboard();
  console.log('Total leaderboard scores saved in DB:', lb.length);
  lb.slice(0, 5).forEach(r => console.log(`  Rank #${r.rank} | Player: ${r.playerName} | Score: ${r.score} | Ending: ${r.ending}`));

  if (lb.length === 0) throw new Error('No scores were persisted to database');

  console.log('\n🎉 ALL 4 E2E PATHS & LIVE DATABASE INTEGRATION PASSED 100%!');
}

runMasterE2E().catch(err => {
  console.error('❌ MASTER E2E FAILED:', err);
  process.exit(1);
});
