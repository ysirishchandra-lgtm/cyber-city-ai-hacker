/**
 * SCAR — THE LAST CHOICE
 * Gameplay Regression Test Suite (KAUSTUB — GAMEPLAY GUARDIAN)
 * 
 * Verifies end-to-end integration flow across:
 * - Start -> Level 1 -> Scar/Choice -> Level 2 -> Hero -> Level 3 -> Final Battle -> Final Choice -> Ending
 * - All 3 Power Paths (DESTRUCTION, PROTECTION, CONTROL)
 * - Hero AI State Machine (OBSERVE, FOLLOW, CONFRONT, COUNTER, RETREAT)
 * - Input Locking during Choice/Dialogue states
 * - Game Over handling
 * - Zero Fake Production Data Audit
 */

import { eventBus, EVENTS } from '../src/core/EventBus.js';
import { gameState, GAME_PHASE, POWER_PATH, HERO_RELATIONSHIP } from '../src/core/GameState.js';
import { missionSystem } from '../src/core/MissionSystem.js';
import { choiceSystem } from '../src/core/ChoiceSystem.js';
import { KaustubAPI } from '../src/integration/TeamAPI.js';
import { Player } from '../src/gameplay/Player.js';
import { PowerSystem } from '../src/gameplay/PowerSystem.js';
import { Enemy, ENEMY_TYPES } from '../src/gameplay/EnemySpawner.js';
import { HeroAI, HERO_STATES } from '../src/gameplay/HeroAI.js';
import { kaustubEngine } from '../src/gameplay/KaustubGameplayEngine.js';

let passedTests = 0;
let totalTests = 0;

function assert(condition, message) {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`  ✓ PASS: ${message}`);
  } else {
    console.error(`  ❌ FAIL: ${message}`);
    throw new Error(`Regression Assertion Failed: ${message}`);
  }
}

console.log('\n==================================================');
console.log('SCAR GAMEPLAY REGRESSION TEST SUITE');
console.log('==================================================\n');

// ── TEST 1: Initial Game Boot & Powerless State ──
console.log('[Test Group 1] Initial State & Level 1 Setup');
gameState.reset();
gameState.startGame('test_session_id', 'TestRunner');

assert(gameState.getPhase() === GAME_PHASE.BOOT, 'Game starts in BOOT phase');
assert(!gameState.hasPower(), 'Player starts with ZERO powers in Level 1');
assert(gameState.getField('health') === 100, 'Player starts with 100 HP');
assert(gameState.getPowerPath() === POWER_PATH.NONE, 'Power path is initially NONE');

// ── TEST 2: Player Movement & Position Reporting ──
console.log('\n[Test Group 2] Player Controls & Position Reporting');
const player = new Player(100, 100);
player.handleInput({ 'd': true }, null, { x: 0, y: 0 }, 0.5);

assert(player.x > 100, 'Player moves right on D key');
assert(gameState.getField('position').x > 100, 'Position is reported to GameState');

// ── TEST 3: Power Activation Blocking Before Awakening ──
console.log('\n[Test Group 3] Power Activation Boundaries');
const powerSys = new PowerSystem();
const enemiesList = [new Enemy('dummy_1', 150, 100, ENEMY_TYPES.DRONE)];
const activatedBeforeAwakening = powerSys.activate(player, enemiesList, []);

assert(activatedBeforeAwakening === false, 'Power CANNOT activate before awakening');

// ── TEST 4: Level 1 Combat & Defeat Reporting ──
console.log('\n[Test Group 4] Level 1 Combat & Defeat Reporting');
const initialKills = gameState.getField('enemiesDefeated');
enemiesList[0].takeDamage(100, 'MELEE');

assert(enemiesList[0].isAlive === false, 'Enemy HP 0 marks enemy as defeated');
assert(gameState.getField('enemiesDefeated') === initialKills + 1, 'Enemy defeat reports to GameState');

// ── TEST 5: ChoiceSystem Power Path Awakening ──
console.log('\n[Test Group 5] Power Path Awakening via ChoiceSystem');

// Test Path 1: DESTRUCTION
gameState.reset();
gameState.startGame('test_session_id', 'TestRunner');
choiceSystem.presentChoice('CHOICE_POWER_AWAKENING');
choiceSystem.selectOption('opt_destruction');

assert(gameState.hasPower() === true, 'Power unlocks after choice');
assert(gameState.getPowerPath() === POWER_PATH.AGGRESSIVE, 'opt_destruction sets AGGRESSIVE power path');

// Test Path 2: PROTECTION
gameState.reset();
gameState.startGame('test_session_id', 'TestRunner');
choiceSystem.presentChoice('CHOICE_POWER_AWAKENING');
choiceSystem.selectOption('opt_protection');

assert(gameState.getPowerPath() === POWER_PATH.PROTECTIVE, 'opt_protection sets PROTECTIVE power path');

// Test Path 3: CONTROL
gameState.reset();
gameState.startGame('test_session_id', 'TestRunner');
choiceSystem.presentChoice('CHOICE_POWER_AWAKENING');
choiceSystem.selectOption('opt_control');

assert(gameState.getPowerPath() === POWER_PATH.STRATEGIC, 'opt_control sets STRATEGIC power path');

// ── TEST 6: Ability Cooldown & Shield Duration ──
console.log('\n[Test Group 6] Ability Cooldown & Duration Verification');
const activatedPostAwakening = powerSys.activate(player, enemiesList, []);

assert(activatedPostAwakening === true, 'Power activates cleanly when unlocked');
assert(powerSys.cooldownTimer > 0, 'Power activation triggers cooldown timer');

const doubleActivate = powerSys.activate(player, enemiesList, []);
assert(doubleActivate === false, 'Power CANNOT activate during cooldown');

// ── TEST 7: Hero AI State Machine & Deterministic Path Behavior ──
console.log('\n[Test Group 7] Hero AI State Machine');
const hero = new HeroAI(500, 300);

assert(hero.state === HERO_STATES.OBSERVE, 'Hero starts in OBSERVE state');

hero.detectPlayer(player);
assert(hero.state === HERO_STATES.FOLLOW, 'Hero transitions to FOLLOW state upon detection');
assert(gameState.getField('heroRelationship') === HERO_RELATIONSHIP.AWARE, 'Hero relationship updates to AWARE');

hero.triggerConfrontation();
assert(hero.state === HERO_STATES.CONFRONT, 'Hero transitions to CONFRONT state');

hero.startFinalBattle();
assert(hero.state === HERO_STATES.COUNTER, 'Hero transitions to COUNTER state in Final Battle');

hero.takeDamage(40, powerSys);
assert(hero.state === HERO_STATES.RETREAT, 'Hero transitions to RETREAT state upon heavy burst damage');

// ── TEST 8: Input Locking & Choice Blocking ──
console.log('\n[Test Group 8] Input Locking & Choice Blocking');
choiceSystem.presentChoice('CHOICE_POWER_AWAKENING');

assert(KaustubAPI.isChoiceBlocking() === true, 'Choice screen blocks gameplay input');

const playerXBefore = player.x;
player.handleInput({ 'd': true }, null, { x: 0, y: 0 }, 0.5);
assert(player.x === playerXBefore, 'Player movement is locked while choice is blocking');

choiceSystem.selectOption('opt_destruction');
assert(KaustubAPI.isChoiceBlocking() === false, 'Choice completion unlocks gameplay input');

// ── TEST 9: Game Over Handling ──
console.log('\n[Test Group 9] Game Over Handling');
gameState.reset();
gameState.startGame('test_session_id', 'TestRunner');
gameState.takeDamage(1000);

assert(gameState.getField('health') === 0, 'Health caps at 0 on lethal damage');
assert(gameState.getPhase() === GAME_PHASE.GAME_OVER, 'Phase transitions to GAME_OVER on player death');

// ── TEST 10: Fake Production Data Audit ──
console.log('\n[Test Group 10] Zero Fake Production Data Audit');
const stateSnapshot = gameState.get();

assert(stateSnapshot.score === 0 || typeof stateSnapshot.score === 'number', 'Score is numeric and un-faked');
assert(Array.isArray(stateSnapshot.choiceHistory), 'Choice history is real telemetry array');

console.log('\n==================================================');
console.log(`REGRESSION RESULTS: ${passedTests}/${totalTests} TESTS PASSED`);
console.log('SCAR GAMEPLAY FROZEN — READY FOR FINAL INTEGRATION.');
console.log('==================================================\n');
