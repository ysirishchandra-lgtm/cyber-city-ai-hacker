# SCAR — THE LAST CHOICE: Ashwidha Visual Integration Handoff & Contract

**Developer:** ASHWIDHA — VISUAL / UI / CINEMATIC LEAD  
**Branch:** `feature/ashwidha-ui`  
**Status:** FEATURE COMPLETE, QA VERIFIED (30/30 TESTS PASSED)  

---

## 1. Owned Modules & Visual Architecture

All visual presentation systems are cleanly decoupled and located in `src/visuals/` and `src/engine/`:

- `src/engine/PrototypeRenderer.js`: Master visual orchestrator registered into Sirish's `GameManager.registerRenderer()`.
- `src/visuals/ShaderPipeline.js`: Post-processing pipeline handling screen shake trauma, chromatic aberration RGB split, matrix glitch artifacts, screen flashes, CRT scanlines, vignette, and cinematic letterboxing.
- `src/visuals/ParticleSystem.js`: Real-time weather rainfall with wind drift, splash ripples, steam vents, combat slash arcs, spark bursts, and power FX (`Destruction Nova`, `Kinetic Barrier`, `Stasis Hack`) with hard memory cap at 350 particles.
- `src/visuals/CityEnvironment.js`: Atmospheric 2.5D cyberpunk world with multi-layered parallax skyline, wet reflective asphalt puddles, holographic neon signage, streetlamps with volumetric light cones, 14 superpowered roaming civilians, and glowing mission beacon pillars.
- `src/visuals/CharacterRenderer.js`: Entity renderer for the Player (with glowing crimson scar & power auras), Enemies (`DRONE`, `ENFORCER`, `STALKER`, `SENTINEL`), and Hero Atlas (with Celestial Halo early and Tyrant Lightning in Final Battle).
- `src/visuals/CinematicsEngine.js`: Movie-like cinematic sequence engine handling Black Screen intros, typography pulses, attack ambushes, the Scar moment, and Title Card transitions.
- `src/visuals/CyberHUD.js`: Minimal tactical visor HUD with dynamic health damage ghost bars, stamina meter, mission objective tracker with live checkmarks, power core status, and threat level telemetry.
- `src/visuals/DialogueAndChoiceUI.js`: Cyberpunk dialogue box with speaker portrait avatars (Atlas, Kira, Inner Voice, Player), typewriter text, interactive choice cards (`[1]`, `[2]`, `[3]`), Final Choice screen (`"WHO IS THE VILLAIN?"`), and atmospheric Ending screens with real score breakdown.

---

## 2. Integration Hooks & Contracts

### A. Renderer Registration (`src/game.js`)
`PrototypeRenderer` is instantiated and registered into Sirish's `gameManager`:
```javascript
import { PrototypeRenderer } from './engine/PrototypeRenderer.js';
const renderer = new PrototypeRenderer('scar-canvas');
gameManager.registerRenderer(renderer);
```

### B. Game State & Gameplay Feed
`PrototypeRenderer.render(state, dt)` consumes:
1. Sirish's `GameState` for player health, maxHealth, level, phase, powerUnlocked, powerPath, and score.
2. Kaustub's `window.__SCAR_GAMEPLAY_STATE__` for live entity positions (`player`, `enemies`, `hero`, `projectiles`, `particles`, `camera`).
3. Sirish's `MissionSystem` for active objectives and waypoint beacon targets.

### C. EventBus Visual Listeners (`src/core/EventBus.js`)
- `EVENTS.POWER_AWAKENED`: Triggers radial shockwave flash and particle nova / barrier / stasis grid.
- `EVENTS.ATTACK_STARTED`: Triggers camera trauma shake and red warning glitch distortion.
- `EVENTS.CINEMATIC_COMPLETE`: Emitted when cutscene sequence finishes, transitioning smoothly to gameplay.
- `EVENTS.DIALOGUE_COMPLETE`: Emitted when dialogue lines finish.
- `EVENTS.SHOW_LEADERBOARD`: Toggles the classified leaderboard modal.

---

## 3. Strict Quality & Anti-Fabrication Rules Followed

1. **Zero Fake Data**: Leaderboard modal strictly checks backend and displays `"No players yet."` when empty. No hardcoded or demo user records exist in any visual file.
2. **Real Scores Only**: Final score and breakdown stats displayed on ending screens are pulled directly from `ScoreSystem.calculate()` and `scoreSystem.getSubmissionPayload()`.
3. **No Duplicate State**: The visual layer never maintains duplicate game state; choices are immediately forwarded to `ChoiceSystem.selectOption()` and `ChoiceSystem.makeFinalChoice()`.
4. **Environment Isolation**: All visual files guard `window`, `document`, and `performance` for 100% headless test execution.

---

## 4. Responsive & Mobile Touch Support

- **Canvas DPI Scaling**: Canvas automatically resizes to `window.innerWidth` and `window.innerHeight`.
- **Desktop & Mobile Inputs**: Supports `WASD` / Arrow keys + Mouse aim + Left click attack + `Spacebar` for powers/skips, alongside on-screen Virtual Joystick and Touch Action Buttons (`ATK`, `PWR`, `RUN`) when a touchscreen device is detected.

---

## 5. Performance Verification

- Automated QA test suite `tests/visual_integration_qa.js` verified 30/30 tests passed (100%).
- Particle bounds capped to prevent memory accumulation.
- 60 FPS target maintained during active combat, rain weather, and screen-wide power VFX.

