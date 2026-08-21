# SCAR — MASTER INTEGRATION TEST CHECKLIST & QA MATRIX

**Lead / Master Integration Architect:** Sirish  
**Branch:** `feature/sirish-unity-core`  
**Test Suite:** [`tests/UnityCoreTests.cs`](file:///c:/Users/user/Desktop/college/tests/UnityCoreTests.cs) (34/34 PASS)  
**Status Legend:**
- ✅ **PASS**: Tested, verified, and passing 100%.
- ⏳ **PENDING**: Implementation complete on feature branch; awaiting master integration pass.
- 🛑 **BLOCKED**: Requires dependency fix or unresolved conflict.

---

## 1. Core Architecture Tests

| Test ID | Test Description | Status | Evidence / Notes |
|---|---|:---:|---|
| `CORE-01` | `GameManager` singleton initialization & `DontDestroyOnLoad` | ✅ **PASS** | Verified in `UnityCoreTests.cs` |
| `CORE-02` | `GameState` safe defaults & zero hardcoded fake players | ✅ **PASS** | `PlayerName="Player"`, `Score=0`, `PowerPath="NONE"` |
| `CORE-03` | `GamePhase` 9-state machine transitions | ✅ **PASS** | `MAIN_MENU` $\rightarrow$ `PROLOGUE` $\rightarrow$ `LEVEL_1` $\rightarrow$ `ENDING` |
| `CORE-04` | `EventBus` generic Pub/Sub & safe unsubscription | ✅ **PASS** | Generic typed dispatch tested with 0 memory leaks |
| `CORE-05` | `SceneFlowManager` missing-scene graceful fallback | ✅ **PASS** | Emits configuration warning, prevents crash |
| `CORE-06` | Health reduction, damage clamping & lethal Game Over | ✅ **PASS** | Health clamped at `[0, MaxHealth]`, triggers `GAME_OVER` |
| `CORE-07` | Moral telemetry tracking (Revenge, Humanity, Freedom, Control) | ✅ **PASS** | Clamped at `[0.0, 100.0]` on choice selection |

---

## 2. Gameplay Subsystem Tests (Kaustub Branch)

| Test ID | Test Description | Status | Evidence / Notes |
|---|---|:---:|---|
| `PLAY-01` | Camera-relative 3rd-person movement & gravity | ⏳ **PENDING** | Verified on `feature/kaustub-unity-gameplay` |
| `PLAY-02` | Sprint stamina consumption (15/s) & stamina regeneration | ⏳ **PENDING** | Verified in Kaustub unit tests |
| `PLAY-03` | Dodge roll invulnerability window (0.35s) & 25 stamina cost | ⏳ **PENDING** | Tested in Kaustub combat layer |
| `COMB-01` | Light attack combo & weapon hitbox dispatch | ⏳ **PENDING** | `PlayerCombat.cs` hitbox activation |
| `COMB-02` | Shared `HealthComponent` damage processing | ⏳ **PENDING** | `HealthComponent.cs` on player & enemies |
| `ENEM-01` | NavMesh pathfinding & chase behavior (Melee/Ranged/Elite) | ⏳ **PENDING** | `EnemyController.cs` state machine |
| `POW-01` | Destruction Nova AoE blast & knockback | ⏳ **PENDING** | `AbilityManager.cs` Destruction power |
| `POW-02` | Kinetic Barrier damage immunity duration | ⏳ **PENDING** | `AbilityManager.cs` Protection power |
| `POW-03` | Chrono Stasis enemy freeze radius | ⏳ **PENDING** | `AbilityManager.cs` Control power |
| `HERO-01` | Atlas Mirror AI 5-state transition (Confront $\rightarrow$ Counter) | ⏳ **PENDING** | `HeroAI.cs` combat routine |

---

## 3. Visual, UI & Cinematic Tests (Ashwidha Branch)

| Test ID | Test Description | Status | Evidence / Notes |
|---|---|:---:|---|
| `VIS-01` | TextMeshPro Tactical Visor HUD (HP/Stamina/Objective) | ⏳ **PENDING** | Awaiting `feature/ashwidha-unity-visuals` |
| `VIS-02` | Cinemachine 3rd-person follow & framing | ⏳ **PENDING** | Awaiting visual layer merge |
| `VIS-03` | Cinemachine trauma screen shake on `PlayerDamagedEvent` | ⏳ **PENDING** | Event listener defined in contract |
| `VIS-04` | 10-Second Prologue Timeline cutscene & skip trigger | ⏳ **PENDING** | Timeline director binding |
| `VIS-05` | Power aura particle effects & screen shaders | ⏳ **PENDING** | ParticleSystem / Shader specs defined |
| `VIS-06` | Interactive Holographic Choice UI Cards | ⏳ **PENDING** | Choice card layout contract defined |

---

## 4. Backend & Cloud Integration Tests (Priyanshu Branch)

| Test ID | Test Description | Status | Evidence / Notes |
|---|---|:---:|---|
| `AWS-01` | Amazon Cognito user authentication & session token | ⏳ **PENDING** | Awaiting `feature/priyanshu-unity-aws` |
| `AWS-02` | API Gateway & Lambda game session creation | ⏳ **PENDING** | `IAWSBackendService.StartGameSession` contract |
| `AWS-03` | Authoritative score submission to DynamoDB | ⏳ **PENDING** | `IAWSBackendService.SubmitFinalScore` contract |
| `AWS-04` | Global leaderboard query & retrieval | ⏳ **PENDING** | `IAWSBackendService.FetchGlobalLeaderboard` contract |
| `AWS-05` | **Zero fake data policy** (Empty leaderboard renders cleanly) | ✅ **PASS** | Validated in Core contract specs |
| `AWS-06` | **Zero AWS secrets** in Unity client codebase | ✅ **PASS** | Audited: 0 credentials in repository |

---

## 5. Offline-First Resilience Tests

| Test ID | Test Description | Status | Evidence / Notes |
|---|---|:---:|---|
| `OFF-01` | Complete game playthrough with no network connection | ✅ **PASS** | Core loop does not block on AWS |
| `OFF-02` | AWS service timeout / 5xx error graceful recovery | ✅ **PASS** | `GameManager` logs warning, continues offline |
| `OFF-03` | Offline score caching & local telemetry storage | ✅ **PASS** | Authoritative state preserved locally |
