# SCAR — MASTER SCENE PLAN & FLOW SPECIFICATION

**Author:** Sirish (Lead / Master Integration Engineer)  
**Project:** SCAR — The Last Choice (Unity 6 / C#)  
**Status:** **FROZEN SPECIFICATION**

---

## 1. Scene Pipeline Overview

```text
  [ MainMenu ] ─────────► [ Prologue ] ─────────► [ Level1_Streets ]
                                                         │
                                                         ▼
  [ Ending ] ◄───────── [ Level2_Atlas ] ◄─────── [ Power Awakening ]
```

---

## 2. Detailed Scene Specifications

### Scene 1: `MainMenu`
- **Owner**: Sirish (Core) & Ashwidha (UI)
- **Required Systems**: `GameManager`, `EventBus`, `SceneFlowManager`, TextMeshPro UI, AWS Auth Client.
- **Entry Condition**: Game application startup or return from Game Over / Ending.
- **Exit Condition**: Player enters name/credentials and clicks "ENTER NEO-VERIDIA".
- **Required UI**: Title banner ("SCAR: THE LAST CHOICE"), Auth login/register modal, Start Game button, Settings button, Global Leaderboard overlay.
- **Required Gameplay**: None (Interactive UI and camera background rotation).
- **Required AWS Interaction**: Amazon Cognito user authentication / registration, optional pre-fetch of global leaderboard.

---

### Scene 2: `Prologue`
- **Owner**: Ashwidha (Cinematics / Timeline) & Sirish (Core)
- **Required Systems**: `TimelineDirector`, Cinemachine virtual camera, AudioSource voiceover, `SceneFlowManager`.
- **Entry Condition**: `GameManager.StartNewGame()` called from Main Menu.
- **Exit Condition**: 10-second prologue cinematic finishes or player presses Space/Skip.
- **Required UI**: "PRESS SPACE TO SKIP", subtitle bar with animated typewriter text.
- **Required Gameplay**: Camera track along Neon District skyline showcasing powered civilians.
- **Required AWS Interaction**: Background creation of active UUID `GameSession` in DynamoDB.

---

### Scene 3: `Level1_Streets`
- **Owner**: Kaustub (Gameplay) & Ashwidha (Visuals/Environment)
- **Required Systems**: `PlayerController`, `HealthComponent`, `EnemySpawner` (Drones), `NavMeshSurface`, Tactical HUD, `ChoiceSystem`.
- **Entry Condition**: Prologue completion (`SceneFlowManager.LoadLevel1()`).
- **Exit Condition**: Patrol drone wave defeated $\rightarrow$ Power Awakening choice completed.
- **Required UI**: Tactical Visor HUD (HP, Stamina, Objective: "SURVIVE PATROL DRONE AMBUSH", Minimap).
- **Required Gameplay**:
  1. 3rd-person movement and sprint through cyber city alleys.
  2. Ambush trigger with explosion and screen trauma shake.
  3. Combat wave against 4 autonomous Drone enemies.
  4. Choice modal: "POWER AWAKENING" (Destruction Nova, Kinetic Barrier, Chrono Stasis).
- **Required AWS Interaction**: None (Telemetry buffered locally).

---

### Scene 4: `Level2_Atlas`
- **Owner**: Kaustub (AI / Combat) & Ashwidha (Lighting / Boss VFX)
- **Required Systems**: `PlayerController` with awakened power, `EnemyController` (Enforcers/Stalkers), `HeroAI` (Atlas Boss), Choice UI.
- **Entry Condition**: Power Awakening choice selected (`SceneFlowManager.LoadLevel2()`).
- **Exit Condition**: Atlas defeated $\rightarrow$ Final moral choice ("WHO IS THE VILLAIN?") confirmed.
- **Required UI**: Tactical HUD with awakened power cooldown wheel, Atlas Boss HP bar, Choice Cards.
- **Required Gameplay**:
  1. Advanced combat against Stalkers and Enforcers utilizing awakened power ability.
  2. Atlas Mirror Encounter (`HeroAI` state machine adapting to player's power path).
  3. Climactic confrontation and pause for Final Moral Choice.
- **Required AWS Interaction**: None (Telemetry buffered locally).

---

### Scene 5: `Ending`
- **Owner**: Sirish (Scoring / State), Ashwidha (Cinematics), Priyanshu (AWS Cloud Telemetry)
- **Required Systems**: `GameState.ScoreSystem`, Timeline Director, TextMeshPro Score Breakdown, AWS Client.
- **Entry Condition**: Final Choice submitted (`GameManager.TriggerEnding()`).
- **Exit Condition**: Player reviews final score/leaderboard and returns to `MainMenu`.
- **Required UI**:
  - Ending title & narrative epilogue (Villain / Hero / Savior / Human).
  - Detailed telemetry breakdown (Enemies defeated, choices made, damage taken, completion time).
  - Authoritative calculated score with ending multipliers.
  - Live global leaderboard ranking overlay.
  - "RETURN TO MAIN MENU" button.
- **Required Gameplay**: Cinematic camera resolution matching chosen ending.
- **Required AWS Interaction**:
  1. Authoritative score payload submission to API Gateway $\rightarrow$ Lambda $\rightarrow$ DynamoDB.
  2. Real-time fetch of top 10 global leaderboard ranks.
