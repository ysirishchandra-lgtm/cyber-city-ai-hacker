# SCAR — ASHWIDHA VISUAL / UI INTEGRATION AUDIT & SPECIFICATION

**Auditor:** Sirish (Lead / Master Integration Engineer)  
**Target Branch:** `origin/feature/ashwidha-unity-visuals`  
**Current Status:** **BRANCH PENDING (Awaiting Unity Visual Layer Push)**  
**Target Core Branch:** `feature/sirish-unity-core` (`85bb6ca`)

---

## 1. Architectural Principles for Ashwidha's Visual Layer

```text
               ┌───────────────────────────────┐
               │    SCAR CORE (SIRISH)         │
               │   EventBus & GameState        │
               └───────────────┬───────────────┘
                               │
               ┌───────────────┴───────────────┐
               ↓ (Publishes GameEvents)        ↓
        GAMEPLAY (KAUSTUB)              VISUAL / UI (ASHWIDHA)
      Combat, Player, Enemies         TextMeshPro HUD, Cinemachine,
                                      Timeline, VFX & Shaders
```

### Critical Architecture Rule:
- **Event-Driven Consumption**: Visual and UI components must **listen** to Core events rather than driving gameplay logic.
- **Direction of Control**:
  - `EventBus` $\rightarrow$ `HUD` (TextMeshPro) $\rightarrow$ `VFX` (Particle bursts) $\rightarrow$ `Cinematics` (Timeline) $\rightarrow$ `Camera` (Cinemachine Shake).
  - **PROHIBITED**: `UI` $\rightarrow$ direct `GameState` mutation $\rightarrow$ gameplay physics.

---

## 2. Component Specifications & Requirements

### A. Tactical Visor HUD (TextMeshPro + Unity UI)
- **Health & Stamina Bar**: Bound to `GameManager.Instance.State.Health` and `PlayerController.Stamina`.
- **Objective Tracker**: Displays active mission objective from `GameEvents.LevelStartedEvent` and `GameEvents.PhaseChangedEvent`.
- **Power Icon & Cooldown Wheel**: Radial fill image bound to `IPowerAbility.RemainingCooldown`.
- **Score Counter**: Animated numerical roll-up listening to `GameEvents.EnemyDefeatedEvent`.

### B. Cinemachine Camera System
- **3rd-Person Follow Camera**: `CinemachineCamera` with `OrbitalFollow` or `3rdPersonFollow` targeting Player transform.
- **Trauma Screen Shake**: `CinemachineImpulseSource` triggered automatically when `GameEvents.PlayerDamagedEvent` fires.
- **Boss Framing Camera**: Secondary virtual camera targeting both Player and Atlas for dramatic framing in `FINAL_BATTLE`.

### C. Timeline Cutscenes
- **Prologue Timeline**: 10-second cinematic pan introducing Neo-Veridia. Emits `GameEvents.PhaseChangedEvent` upon completion.
- **Scar Awakening Sequence**: Timeline cutscene blending from explosion into glowing crimson scar reveal.
- **Ending Sequences**: 4 distinct Timeline director assets for Villain, Hero, Savior, and Human resolutions.

### D. Particle & Shader VFX
- **Destruction Nova**: Fiery crimson shockwave particle prefab.
- **Kinetic Barrier**: Hexagonal blue energy shield mesh with Fresnel shader.
- **Chrono Stasis**: Emerald quantum grid particle field.
- **Post-Processing**: Volume Profile with Bloom, Chromatic Aberration, Vignette, and Film Grain.

---

## 3. Integration Checklist for Ashwidha

- [ ] Use `namespace Scar.UI` and `namespace Scar.Visuals`.
- [ ] Place all scripts in `Assets/_Project/Scripts/UI_Visuals/`.
- [ ] Place all prefabs in `Assets/_Project/Prefabs/UI/` and `Assets/_Project/Prefabs/VFX/`.
- [ ] Subscribe to `GameEvents` in `OnEnable()` and unsubscribe in `OnDisable()`.
- [ ] Ensure 0 compilation errors and 0 missing prefab references.

---

## 4. Audit Verdict
**Status:** `READY FOR IMPLEMENTATION` (Core contracts and event bindings are established and frozen).
