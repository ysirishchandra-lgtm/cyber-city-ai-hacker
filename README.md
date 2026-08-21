# SCAR — The Last Choice
> "Everyone has a superpower. You have zero."

A narrative choice-driven game for **FRONTIER 2026 — Cloud-Powered Game Development Hackathon**  
Malla Reddy University | 21–22 August 2026

---

## Team

| Member | Role | Branch |
|--------|------|--------|
| **Sirish** | Lead / Story / Integration | `feature/sirish-integration` ✅ |
| **Ashwidha** | UI/UX / Visuals / Cinematics | `feature/ashwidha-ui` |
| **Kaustub** | Gameplay / Powers / AI | `feature/kaustub-gameplay` |
| **Priyanshu** | Backend / AWS / Leaderboard | `feature/priyanshu-backend` |

---

## Architecture

```
index.html                     ← Entry point (Sirish)
src/
  game.js                      ← Boot + wiring (Sirish)
  core/
    EventBus.js                ← All events (Sirish) ← READ FIRST
    GameState.js               ← Central state machine (Sirish)
    MissionSystem.js           ← Mission lifecycle (Sirish)
    ChoiceSystem.js            ← Choices + power path (Sirish)
    ScoreSystem.js             ← Real score from gameplay (Sirish)
  story/
    StoryContent.js            ← All narrative data (Sirish)
  engine/
    PrototypeRenderer.js       ← Working prototype visuals (Sirish → Ashwidha replaces)
  integration/
    GameManager.js             ← Master orchestrator (Sirish)
    TeamAPI.js                 ← Team integration contracts ← READ BEFORE CODING
```

---

## Rules (Non-Negotiable)

- ❌ Never push to `main` directly
- ❌ Never force push
- ❌ Never create fake users, scores, or leaderboard entries
- ❌ Never commit API keys or secrets
- ✅ Work only on your assigned branch
- ✅ Read `TeamAPI.js` before writing any cross-system code

---

## Quick Start

```bash
# Serve locally (no build needed — pure ES modules)
npx serve .
# or
python -m http.server 8080
```

Open `http://localhost:8080` (or 3000) in Chrome.

> **Note:** Must be served over HTTP — ES modules don't work via `file://`

---

## Ashwidha — UI/UX

Your job: Replace `PrototypeRenderer.js` with cyberpunk visuals.

**Read:** `src/integration/TeamAPI.js` → `AshwidhaAPI` section

**Register your renderer:**
```js
import { gameManager } from '../integration/GameManager.js';
gameManager.registerRenderer(yourRenderer);
```

Your renderer must implement:
- `init()` → async setup
- `render(state, dt)` → called every frame
- `showCinematic(panels, phase)` → full-screen cinematic
- `showChoice(choice)` → choice overlay
- `showDialogue(dialogue)` → dialogue box
- `showFinalChoice(eligibleEndings)` → final ending choice
- `showEnding(ending, score, breakdown)` → ending screen

---

## Kaustub — Gameplay / AI

Your job: Implement the game engine (movement, combat, powers, enemy AI).

**Read:** `src/integration/TeamAPI.js` → `KaustubAPI` section

**Register your engine:**
```js
import { gameManager } from '../integration/GameManager.js';
gameManager.registerEngine(yourEngine);
```

**Call these when gameplay events happen:**
```js
KaustubAPI.playerEnteredArea('SAFEHOUSE_L1')   // triggers mission objective
KaustubAPI.enemyDefeated('enemy_id')            // tracks kills + objectives
KaustubAPI.npcInteracted('INFORMANT_KIRA')      // triggers dialogue
KaustubAPI.playerTakeDamage(20)                 // updates health
```

**Check this before moving:**
```js
KaustubAPI.isChoiceBlocking()  // freeze movement when true
```

---

## Priyanshu — Backend / AWS

Your job: Auth, score persistence, real leaderboard.

**Read:** `src/integration/TeamAPI.js` → `PriyanshuAPI` section

**Register your backend:**
```js
import { gameManager } from '../integration/GameManager.js';
gameManager.registerBackend(yourBackend);
```

**After auth:**
```js
PriyanshuAPI.setAuthenticatedPlayer(playerId, playerName);
```

**After game ends, listen to:**
```js
PriyanshuAPI.events.onScoreCalculated(async () => {
  const payload = PriyanshuAPI.getScorePayload();
  await yourAPI.saveScore(payload); // save to DynamoDB / RDS
  PriyanshuAPI.emitScoreSubmitted({ saved: true });
});
```

**Populate leaderboard in `index.html`:**
```js
// In the SHOW_LEADERBOARD event handler — replace lb-empty with real data
const scores = await PriyanshuAPI.getLeaderboard();
// Render as .lb-row elements
```

---

## Game Flow

```
Boot → Start Screen → Cinematic Intro → City Exploration
→ Attack Sequence → Scar Moment
→ Level 1 (The Weak) → Power Awakening Choice
→ Level 2 (The Rising) → Hero Encounter Choice
→ Level 3 (The Threat)
→ Final Battle → Final Choice
→ Ending Screen → Score → Leaderboard
```

## Power Paths

| Path | Behavior | Ending Eligible |
|------|----------|-----------------|
| AGGRESSIVE | High damage, low trust | Villain |
| PROTECTIVE | Shielding, healing | Hero, Savior |
| STRATEGIC | Control, manipulation | Savior, Control |
| Balanced all three | Secret | Human (highest score) |

---

## Score Formula

`Score = (Base + Time + Health + Combat + Objectives + Choices + EligibleBonus) × EndingMultiplier`

| Component | Value |
|-----------|-------|
| Base completion | 1000 |
| Time bonus | +2/sec remaining |
| Health remaining | +3/HP |
| Each enemy defeated | +50 |
| Each objective | +200 |
| Each choice made | +75 |
| Eligible ending bonus | +500 |
| Ending multiplier | Villain ×1.0, Hero ×1.2, Savior ×1.5, Human ×2.0 |

**Score is ALWAYS real. Never randomized.**
