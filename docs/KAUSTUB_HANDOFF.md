# SCAR — THE LAST CHOICE: Kaustub Gameplay Handoff & Integration Contract

**Developer:** KAUSTUB — GAMEPLAY / POWERS / HERO AI  
**Branch:** `feature/kaustub-gameplay`  
**Status:** FEATURE COMPLETE & INTEGRATION FROZEN  

---

## 1. Owned Files

Kaustub owns all files within the `src/gameplay/` directory:
- `src/gameplay/Player.js`: Player entity, movement, aiming, combat slashes, stamina, and `TeamAPI` position sync.
- `src/gameplay/PowerSystem.js`: Awakened powers (`DESTRUCTION` -> Destruction Nova, `PROTECTION` -> Kinetic Barrier, `STRATEGIC` -> Stasis Hack).
- `src/gameplay/EnemySpawner.js`: Enemy AI & entities (`DRONE`, `ENFORCER`, `STALKER`, `SENTINEL`) reporting kills to `KaustubAPI.enemyDefeated()`.
- `src/gameplay/HeroAI.js`: Hero Boss state machine (`OBSERVE`, `FOLLOW`, `CONFRONT`, `COUNTER`, `RETREAT`) adapting aggression to player's power path.
- `src/gameplay/KaustubGameplayEngine.js`: Master engine implementing Sirish's `GameManager` engine contract.

---

## 2. Gameplay Entry Point (`kaustubEngine`)

`kaustubEngine` is registered into Sirish's `gameManager` in `src/game.js`:

```javascript
import { gameManager } from './integration/GameManager.js';
import { kaustubEngine } from './gameplay/KaustubGameplayEngine.js';

gameManager.registerEngine(kaustubEngine);
```

### Interface Methods Implemented:
- `init()`: Initializes player, powers, and inputs.
- `update(state, dt)`: Executes gameplay simulation tick when `gameState.isPlaying()` is true.
- `setScene(sceneName)`: Transitions gameplay scenes (`CITY_NORMAL`, `LEVEL_1`, `LEVEL_2`, `LEVEL_3`, `FINAL_BATTLE`).
- `reset()`: Resets all entities to initial level state.

---

## 3. Player API (`src/gameplay/Player.js`)

- **Movement**: WASD / Arrow keys for 8-directional movement.
- **Sprint**: `Shift` key increases speed from 180 to 300 px/sec while draining stamina.
- **Aiming**: Facing angle cone aims towards mouse cursor in world space.
- **Melee Combat**: Left-click performs arc slash dealing 25 damage with knockback.
- **Position Sync**: Calls `KaustubAPI.updatePosition(x, y)` whenever player moves.
- **Damage Sync**: Calls `KaustubAPI.playerTakeDamage(amount)` when taking damage.

---

## 4. Power System API (`src/gameplay/PowerSystem.js`)

Reads current path from `KaustubAPI.getPowerPath()`:
1. **`AGGRESSIVE` / `DESTRUCTION`** → **Destruction Nova**: 180px radius explosion dealing 75 damage and pushing back hostiles.
2. **`PROTECTIVE` / `PROTECTION`** → **Kinetic Barrier**: 3.5s invulnerability shield blocking 100% incoming damage.
3. **`STRATEGIC` / `CONTROL`** → **Stasis Hack**: 220px radius EMP field freezing enemies in stasis for 4.0 seconds.

Activates via `Spacebar` with a 5.0s cooldown.

---

## 5. Enemy System API (`src/gameplay/EnemySpawner.js`)

Four enemy archetypes:
- `DRONE` (L1): Weak melee drone (40 HP, 8 DMG).
- `ENFORCER` (L2): Ranged cyber enforcer (80 HP, 15 DMG, fires laser projectiles).
- `STALKER` (L2): Fast melee stalker (60 HP, 18 DMG, 190 speed).
- `SENTINEL` (L3): Heavy elite sentinel (140 HP, 25 DMG).

When an enemy's HP reaches 0, it calls:
```javascript
KaustubAPI.enemyDefeated(this.id);
```
This notifies Sirish's `GameState` and `MissionSystem` of the defeat fact.

---

## 6. Hero AI State Machine (`src/gameplay/HeroAI.js`)

State machine states:
- `OBSERVE`: Stalks player from distance. Fired on Level 2 entry.
- `FOLLOW`: Tracks player upon detection (`KaustubAPI.heroEncountered()`).
- `CONFRONT`: Narrative confrontation before battle (`HERO_ENCOUNTER`).
- `COUNTER`: Boss combat state during Final Battle.
  - *Aggressive Player*: Hero becomes aggressive (triple laser beam burst, 1.0s delay).
  - *Protective Player*: Hero becomes hesitant (defensive probes, 2.2s delay).
  - *Strategic Player*: Hero maintains 180px tactical distance.
- `RETREAT`: Repositions upon taking >= 35 burst damage.

Defeating the Hero in Final Battle calls `gameState.completeMission('M3_FINAL_BATTLE')`, transitioning to `FINAL_CHOICE`.

---

## 7. Gameplay Events Emitted

All events are emitted through Sirish's central `eventBus` (`src/core/EventBus.js`):
- `GAME_STARTED`: `{ playerId, playerName }`
- `PLAYER_MOVED`: `{ x, y }`
- `COMBAT_STARTED`: `{ source: 'player' }`
- `ENEMY_DEFEATED`: `{ total }`
- `SCAR_RECEIVED`: `{ timestamp }`
- `POWER_AWAKENED`: `{ path, powerLevel }`
- `CHOICE_MADE`: `{ choiceId, selected, pathInfluence }`
- `POWER_PATH_CHANGED`: `{ path }`
- `HERO_DETECTED_PLAYER`: `{ phase }`
- `HERO_ENCOUNTER`: `{ count }`
- `FINAL_BATTLE_STARTED`: `{ state }`
- `FINAL_CHOICE_MADE`: `{ choice }`
- `ENDING_TRIGGERED`: `{ ending }`
- `GAME_OVER`: `{ reason }`

---

## 8. TeamAPI Functions Used

Gameplay calls Sirish's integration contracts exclusively:
- `KaustubAPI.updatePosition(x, y)`
- `KaustubAPI.playerTakeDamage(amount)`
- `KaustubAPI.playerHeal(amount)`
- `KaustubAPI.enemyDefeated(enemyId)`
- `KaustubAPI.heroEncountered()`
- `KaustubAPI.getPowerPath()`
- `KaustubAPI.isChoiceBlocking()`
- `KaustubAPI.getCurrentPhase()`
- `KaustubAPI.getCurrentObjectives()`

---

## 9. Rendering Requirements

`kaustubEngine.update()` exports real-time render data to:
```javascript
window.__SCAR_GAMEPLAY_STATE__
```
Containing `player`, `camera`, `enemies`, `hero`, `projectiles`, and `particles`. `PrototypeRenderer` and Ashwidha's renderer read this state to render visual entities.

---

## 10. Power Path Handoff & Selection Flow

In the integrated architecture:
1. Level 1 combat reports action facts (`AGGRESSIVE`, `PROTECTIVE`, `STRATEGIC`) to `gameState.recordChoice()`.
2. When Level 1 enemy wave is cleared, `KaustubGameplayEngine` notifies Level 1 completion.
3. Sirish's `MissionSystem` and `ChoiceSystem` present the narrative **Power Awakening Choice**.
4. Player selects `DESTRUCTION`, `PROTECTION`, or `CONTROL`.
5. `gameState.awakePower(selectedPath)` sets the official path and fires `POWER_AWAKENED`.
6. Level 2 initializes with the player's selected power activated.

---

## 11. Gameplay Boundary & Non-Duplication

- **Kaustub Gameplay Engine**: Reports objective facts (position, damage, enemy kills, power activations).
- **Sirish Core Architecture**: Controls mission objectives, narrative choices, game phases, scoring, and endings.
- **Ashwidha UI/UX**: Controls final HUD overlays, dialogue popups, and cinematic rendering.
- **Priyanshu Backend**: Controls player authentication and AWS cloud leaderboard submission.
