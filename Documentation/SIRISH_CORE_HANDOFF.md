# SCAR — SIRISH CORE INTEGRATION HANDOFF
**Lead / Master Integration:** Sirish  
**Branch:** `feature/sirish-unity-core`  
**Engine:** Unity 6 (C#)

---

## 1. Overview
This document establishes the official integration contract for the 4-developer SCAR team.
The core foundation is **modular, event-driven, and decoupled**. No team member needs to directly modify another member's internal systems.

---

## 2. Team Integration Contracts

```text
                     ┌────────────────────────────────┐
                     │          CORE LAYER            │
                     │          (SIRISH)              │
                     │  GameManager, GameState,       │
                     │  EventBus, GameEvents,         │
                     │  SceneFlowManager              │
                     └───────────────┬────────────────┘
                                     │
           ┌─────────────────────────┼─────────────────────────┐
           ↓                         ↓                         ↓
    GAMEPLAY LAYER             VISUAL/UI LAYER          BACKEND LAYER
       (KAUSTUB)                 (ASHWIDHA)              (PRIYANSHU)
 • PlayerController        • TextMeshPro HUD        • IAWSBackendService
 • IDamageable             • Cinemachine Shake      • Cognito Auth
 • IPowerAbility           • Timeline Cutscenes     • DynamoDB Scores
 • Enemy/Boss AI           • Particle & Shader VFX  • Offline-First Client
```

---

### A. Kaustub — Gameplay / AI Integration

1. **State Mutation**:
   - Access `GameManager.Instance.State` to record enemy defeats:
     ```csharp
     GameManager.Instance.State.RecordEnemyDefeated(enemyId, "Drone", scoreValue: 100);
     ```
   - When player takes damage:
     ```csharp
     GameManager.Instance.State.ApplyDamage(damageAmount, "Drone_Laser");
     ```
   - When unlocking or triggering powers:
     ```csharp
     GameManager.Instance.State.UnlockPower("AGGRESSIVE", "Destruction Nova");
     ```
2. **Interface Implementation**:
   - Implement `IDamageable` on Player, Enemy Drones, Enforcers, Stalkers, and Hero Atlas.
   - Implement `IPowerAbility` on ability handler components.
3. **Event Publishing**:
   - Publish gameplay events via `EventBus.Publish(new GameEvents.BossDefeatedEvent { ... })`.

---

### B. Ashwidha — UI, VFX & Cinematics Integration

1. **Event Listening**:
   - Subscribe to typed events in `OnEnable()` and unsubscribe in `OnDisable()`:
     ```csharp
     private void OnEnable()
     {
         EventBus.Subscribe<GameEvents.PlayerDamagedEvent>(OnPlayerDamaged);
         EventBus.Subscribe<GameEvents.PowerUnlockedEvent>(OnPowerUnlocked);
         EventBus.Subscribe<GameEvents.ChoicePresentedEvent>(OnChoicePresented);
         EventBus.Subscribe<GameEvents.EndingReachedEvent>(OnEndingReached);
     }

     private void OnDisable()
     {
         EventBus.Unsubscribe<GameEvents.PlayerDamagedEvent>(OnPlayerDamaged);
         EventBus.Unsubscribe<GameEvents.PowerUnlockedEvent>(OnPowerUnlocked);
         EventBus.Unsubscribe<GameEvents.ChoicePresentedEvent>(OnChoicePresented);
         EventBus.Unsubscribe<GameEvents.EndingReachedEvent>(OnEndingReached);
     }
     ```
2. **HUD & Visuals**:
   - Read `GameManager.Instance.State.Health` and `Score` directly for TextMeshPro displays.
   - Trigger Cinemachine screen shake upon receiving `PlayerDamagedEvent`.
   - Play Timeline cutscenes upon receiving `PhaseChangedEvent`.

---

### C. Priyanshu — Backend / AWS Cloud Integration

1. **Implement `IAWSBackendService`**:
   - Create class implementing `IAWSBackendService` (e.g. `AWSCloudService : MonoBehaviour, IAWSBackendService`).
2. **Register with GameManager**:
   - In `Start()` or `Awake()`:
     ```csharp
     GameManager.Instance.RegisterAWSBackend(this);
     ```
3. **Score Telemetry & Resilience**:
   - `GameManager` automatically invokes `SubmitFinalScore(GameState state, callback)` upon game completion.
   - **Critical Rule**: If AWS connection is offline or fails, return `(false, "Offline")` in callback; **never crash the game**.

---

## 3. Dependency Direction Rules

```text
       Core (GameManager, GameState, EventBus)
         ↑
       Gameplay (Player, Enemies, Powers)
         ↑
       Visuals/UI (HUD, VFX, Cameras, Cutscenes)

       Core
         ↑
       Backend Adapter (IAWSBackendService implementation)
```

1. **No Circular Dependencies**: Gameplay and UI depend on Core; Core NEVER depends on Gameplay or UI concrete classes.
2. **Zero Fake Data**: `GameState` initializes with clean defaults (`PlayerName = "Player"`, `Score = 0`). Real scores come only from authoritative gameplay telemetry.
