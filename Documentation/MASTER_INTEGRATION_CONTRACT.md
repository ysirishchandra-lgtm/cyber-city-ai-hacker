# SCAR — MASTER INTEGRATION CONTRACT

**Lead / Master Integration Architect:** Sirish  
**Project:** SCAR — The Last Choice (Unity 6 / C# / AWS)  
**Status:** **FROZEN CORE ARCHITECTURE SPECIFICATION**

---

## 1. System Architecture & Dependency Model

```text
                        ┌───────────────────────────────┐
                        │          SIRISH CORE          │
                        │  GameManager, GameState,      │
                        │  EventBus, GameEvents,        │
                        │  SceneFlowManager, Contracts  │
                        └───────────────┬───────────────┘
                                        │
             ┌──────────────────────────┼──────────────────────────┐
             ↓                          ↓                          ↓
      KAUSTUB (Gameplay)        ASHWIDHA (Visual/UI)      PRIYANSHU (AWS/Cloud)
   • PlayerController & Stats  • TextMeshPro HUD          • Cognito Authentication
   • Combat, Hitboxes/Hurtboxes• Cinemachine Virtual Cams • API Gateway & Lambda
   • Enemy & Boss AI           • Timeline Cutscenes       • DynamoDB Persistence
   • Power Mechanics           • Particle & Shader VFX    • Offline-First Client
             │                          │                          │
             └──────────────────────────┼──────────────────────────┘
                                        ↓
                           ┌─────────────────────────┐
                           │   UNIFIED GAME BUILD    │
                           └─────────────────────────┘
```

---

## 2. Inviolable Architectural Rules

1. **Gameplay Cannot Own Core**: `PlayerController`, `EnemyController`, and `Combat` scripts call into `GameManager.Instance.State` and `EventBus`, but never instantiate or dictate core lifecycle rules.
2. **Visuals Cannot Own Gameplay State**: UI, HUD, and Timeline cutscenes consume events from `EventBus`. They cannot modify health, spawn enemies, or bypass combat rules.
3. **Backend Cannot Control Gameplay**: AWS service calls are asynchronous and fire-and-forget. The gameplay loop never yields or pauses waiting for network packets.
4. **AWS is Never Required to Play**: Full vertical-slice gameplay operates 100% offline. Network loss or server timeouts log warnings locally and allow uninterrupted play.
5. **UI Cannot Directly Modify Authoritative State**: Player choices, pauses, and power selections are dispatched via `EventBus` or `GameManager` methods, which perform authoritative bounds checking.

---

## 3. Canonical Event Contract Matrix

| Event Name | Publisher | Payload Structure | Primary Consumers | Purpose |
|---|---|---|---|---|
| **`GAME_STARTED`** | Sirish (`GameManager`) | `string PlayerId, string PlayerName` | UI, Ashwidha (HUD), Priyanshu (AWS Session) | Triggers game initialization, session tracking, and HUD setup. |
| **`PHASE_CHANGED`** | Sirish (`GameState`) | `GamePhase PreviousPhase, GamePhase NewPhase` | SceneFlowManager, Ashwidha (Timeline/VFX), Kaustub (AI) | Coordinates high-level scene and gameplay phase transitions. |
| **`LEVEL_STARTED`** | Sirish (`GameState`) | `int LevelIndex, string LevelName` | Ashwidha (HUD Objective), Kaustub (Enemy Spawner) | Activates level geometry, spawner waves, and waypoint markers. |
| **`PLAYER_DAMAGED`** | Kaustub (`PlayerHealth`) | `float DamageAmount, float RemainingHealth, string DamageSource` | Ashwidha (HUD Health Bar, Cinemachine Shake), Priyanshu (Telemetry) | Updates player vital HUD, triggers screen trauma and hurt SFX. |
| **`PLAYER_DIED`** | Kaustub (`PlayerHealth`) / Sirish (`GameState`) | `string CauseOfDeath, int FinalScore` | Ashwidha (Death Overlay), SceneFlowManager, Priyanshu (Stats) | Halts player input, renders game over screen, records death telemetry. |
| **`ENEMY_DEFEATED`** | Kaustub (`EnemyController`) | `string EnemyId, string EnemyType, int TotalDefeated` | Sirish (`GameState.Score`), Ashwidha (HUD Score Rollup, VFX), Priyanshu | Increments defeat count, awards combat score, spawns defeat VFX. |
| **`CLUE_DISCOVERED`**| Kaustub (`PlayerInteraction`)| `string ClueId, string Description` | Ashwidha (Investigation UI, Audio Log), Sirish (`GameState`) | Records narrative lore progress and updates investigation log. |
| **`POWER_AWAKENED`** | Sirish (`ChoiceSystem` / `GameState`) | `string PowerPath, string PowerName` | Kaustub (`AbilityManager`), Ashwidha (Aura VFX, HUD Icon) | Unlocks chosen ability (Destruction, Barrier, Stasis) in gameplay & UI. |
| **`CHOICE_PRESENTED`**| Sirish (`ChoiceSystem`)| `string ChoiceId, string Title, string[] Options` | Ashwidha (Choice UI Cards), Kaustub (Pause / Focus) | Renders interactive holographic moral choice overlay. |
| **`CHOICE_SELECTED`** | Ashwidha (`ChoiceUI`) | `string ChoiceId, string SelectedOptionId, int ChoiceIndex` | Sirish (`GameState.MoralAxes`), Kaustub (Combat Multipliers) | Updates Revenge/Humanity/Freedom/Control moral meters. |
| **`BOSS_DEFEATED`** | Kaustub (`HeroAI`) | `string BossId, float BattleDuration` | Sirish (`GameState`), Ashwidha (Timeline Transition), Priyanshu | Concludes combat phase, triggers cinematic transition to Final Choice. |
| **`FINAL_CHOICE_MADE`**| Ashwidha (`ChoiceUI`) | `string EndingId` | Sirish (`GameState.SetEnding`), SceneFlowManager | Sets narrative ending (Villain, Hero, Savior, Human). |
| **`ENDING_TRIGGERED`**| Sirish (`GameState`) | `string EndingId, int FinalScore` | Ashwidha (Ending Timeline), Priyanshu (DynamoDB Save, Leaderboard) | Initiates final cinematic, persists score to cloud database, fetches leaderboard. |
| **`GAME_OVER`** | Sirish (`GameState`) | `string CauseOfDeath, int FinalScore` | Ashwidha (Game Over UI), SceneFlowManager | Offers restart / main menu navigation upon player defeat. |

---

## 4. Shared C# Contract Interfaces

- **`IDamageable`**: Standard interface implemented by all damageable entities:
  ```csharp
  public interface IDamageable
  {
      float CurrentHealth { get; }
      float MaxHealth { get; }
      bool IsAlive { get; }
      void TakeDamage(float amount, string damageSource = "Unknown");
      void Heal(float amount);
  }
  ```

- **`IPowerAbility`**: Superpower contract implemented by ability components:
  ```csharp
  public interface IPowerAbility
  {
      string AbilityId { get; }
      string AbilityName { get; }
      string PowerPath { get; }
      float CooldownDuration { get; }
      float RemainingCooldown { get; }
      bool IsReady { get; }
      bool CanActivate();
      void Activate();
  }
  ```

- **`IAWSBackendService`**: Cloud backend contract implemented by Priyanshu:
  ```csharp
  public interface IAWSBackendService
  {
      bool IsAuthenticated { get; }
      string ActivePlayerId { get; }
      string ActiveSessionId { get; }
      void RegisterUser(string username, string email, string password, Action<bool, string> onComplete);
      void AuthenticateUser(string email, string password, Action<bool, string> onComplete);
      void StartGameSession(string playerId, Action<bool, string> onComplete);
      void SubmitFinalScore(GameState state, Action<bool, string> onComplete);
      void FetchGlobalLeaderboard(Action<bool, List<LeaderboardEntryDTO>> onComplete);
  }
  ```

---

## 5. Branch & Merge Integration Protocol

1. All feature development occurs strictly on isolated branches (`feature/sirish-unity-core`, `feature/kaustub-unity-gameplay`, `feature/ashwidha-unity-visuals`, `feature/priyanshu-unity-aws`).
2. Only Sirish (Lead/Integration) executes merges into `feature/sirish-unity-core` or `main`.
3. Every merge must be accompanied by pre-merge safety tags, test execution, and handoff documentation updates.
