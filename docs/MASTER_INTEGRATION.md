# SCAR — MASTER INTEGRATION SPECIFICATION

## Overview
**SCAR — The Last Choice** is a complete, narrative-driven cyberpunk action RPG built by a 4-developer hackathon team:
- **Sirish** (Lead / Architecture / Narrative & Choice Systems / Master Integration)
- **Kaustub** (Gameplay Engine / Physics / Enemies / Hero AI / Abilities)
- **Ashwidha** (Visual Engine / Shaders / Particle VFX / Tactical HUD / Cinematics)
- **Priyanshu** (Backend API / Express / Prisma ORM / JWT Auth / Score Telemetry / Leaderboard)

---

## 1. System Architecture

```text
                 ┌──────────────────┐
                 │   SCAR FRONTEND  │
                 └────────┬─────────┘
                          │
             ┌────────────┴────────────┐
             ↓                         ↓
      GAMEPLAY ENGINE             VISUAL ENGINE
       KAUSTUB                    ASHWIDHA
             │                         │
             └────────────┬────────────┘
                          ↓
                   SIRISH CORE
                          │
                    ScoreSystem
                          │
                          ↓
                   BACKEND API
                    PRIYANSHU
                          │
              ┌───────────┴───────────┐
              ↓                       ↓
        Authentication           Score API
              │                       │
              └───────────┬───────────┘
                          ↓
                       DATABASE
                          │
                          ↓
                     LEADERBOARD
```

---

## 2. AWS Architecture & Live Deployment Status

```text
       [ CLOUD DEPLOYMENT SPECIFICATION ]
       
         ┌────────────────────────┐
         │     AWS CloudFront     │  (HTTPS Edge Distribution)
         └───────────┬────────────┘
                     │
         ┌───────────┴────────────┐
         │   Application Load     │
         │       Balancer         │
         └───────────┬────────────┘
                     │
       ┌─────────────┴─────────────┐
       │   Amazon ECS / Fargate    │  (Docker Containerized Backend)
       └─────────────┬─────────────┘
                     │
       ┌─────────────┴─────────────┐
       │   Amazon Aurora Postgres  │  (Managed Database Cluster)
       └───────────────────────────┘
```

- **AWS Architecture Status:** `READY` (Container-ready TypeScript Express backend + Prisma ORM configured for RDS/Postgres).
- **AWS Live Deployment Status:** `PENDING` (Operating locally on high-performance Express + SQLite service on port 3000, ready for containerized cloud deployment).

---

## 3. Subsystem Breakdown

### A. Sirish Core Architecture
- **`GameState.js`**: Reactive single-source-of-truth state container with strict validation, phase transitions, and immutability guards.
- **`EventBus.js`**: Strongly-typed decoupled event messaging bus with freeze-protected event constants.
- **`ChoiceSystem.js`**: Moral alignment engine tracking Aggressive, Protective, and Strategic paths with irreversible consequence locking.
- **`MissionSystem.js`**: Real-time waypoint and objective tracking coordinating story beats and level milestones.
- **`ScoreSystem.js`**: Authoritative score calculator with health, combat, choices, and ending multipliers.
- **`GameManager.js`**: Master runtime orchestrator managing the frame-by-frame loop across cutscenes, gameplay, and choice screens.
- **`TeamAPI.js`**: Formal contracts binding Sirish, Kaustub, Ashwidha, and Priyanshu.

### B. Kaustub Gameplay Engine
- **`Player.js`**: Top-down 8-directional movement, inertia, dodge roll, stamina consumption, and melee attacks.
- **`PowerSystem.js`**: Destruction Nova (Aggressive), Kinetic Barrier (Protective), and Chrono Stasis (Strategic) with cooldown management.
- **`EnemySpawner.js`**: Autonomous Drone, Enforcer, Stalker, and Sentinel archetypes with pathfinding and combat behaviors.
- **`HeroAI.js`**: Atlas 5-state finite state machine (`OBSERVE` $\rightarrow$ `FOLLOW` $\rightarrow$ `CONFRONT` $\rightarrow$ `COUNTER` $\rightarrow$ `RETREAT`).

### C. Ashwidha Visual Engine
- **`ShaderPipeline.js`**: Screen shake trauma, chromatic aberration, CRT scanlines, vignette, and glitch VFX.
- **`ParticleSystem.js`**: High-performance canvas particle system capped at 350 particles.
- **`CityEnvironment.js`**: Parallax cyberpunk skyline, holographic signs, neon puddles, and 14 superpower-wielding pedestrians.
- **`CharacterRenderer.js`**: Player scar auras, enemy models, and Atlas Celestial/Tyrant visual modes.
- **`CinematicsEngine.js`**: Full widescreen letterboxed cutscene cards with spacebar skipping and animated typewriter text.
- **`CyberHUD.js`**: Tactical visor HUD with live health, stamina, mission objectives, and power status.
- **`DialogueAndChoiceUI.js`**: Holographic dialogue box, speaker portrait avatars, and choice cards.

### D. Priyanshu Backend & Cloud Telemetry
- **Authentication**: JWT token issuance with bcrypt password hashing (`/api/auth/register`, `/api/auth/login`, `/api/auth/me`).
- **Game Sessions**: Secure UUID session creation and tracking (`/api/game/session`).
- **Score API**: Authoritative score verification and persistence (`/api/scores`).
- **Leaderboard**: Global real-time ranking (`/api/leaderboard`).
- **Database**: Prisma ORM with relational schema (`Player`, `GameSession`, `Score`).

---

## 4. Verification & QA Matrix

| Test Suite | Passing Tests | Pass Rate |
|---|:---:|:---:|
| **Gameplay Regression** (`tests/gameplay-regression.js`) | `29 / 29` | **100%** |
| **Visual Integration QA** (`tests/visual_integration_qa.js`) | `30 / 30` | **100%** |
| **Backend Unit & Integration** (`backend/tests/api.test.ts`) | `11 / 11` | **100%** |
| **Full E2E Master Integration** (`tests/e2e_master_integration.js`) | `4 / 4 Endings` | **100%** |
| **Zero Fake Data Audit** | `0 Mock Records` | **100%** |

---

## 5. Four Distinct Playthrough Paths Verified

1. **Path A — Aggressive**: Destruction Nova $\rightarrow$ Reject Alliance $\rightarrow$ **Villain Ending** (Score: ~4,577)
2. **Path B — Protective**: Kinetic Barrier $\rightarrow$ Accept Alliance $\rightarrow$ **Hero Ending** (Score: ~6,095)
3. **Path C — Strategic**: Chrono Stasis $\rightarrow$ Negotiate Terms $\rightarrow$ **Savior Ending** (Score: ~7,619)
4. **Path D — Balanced**: Kinetic Barrier $\rightarrow$ Balanced Choices $\rightarrow$ **Human Ending (Secret 2.0x)** (Score: ~9,154)

---

## 6. Zero Fake Data & Security Policy
- **Fake Users:** `0`
- **Fake Leaderboard Records:** `0` (Clean `"No players yet."` when database is empty)
- **Secrets Committed:** `0` (`.env` strictly excluded and ignored)
- **Authentication:** Enforced via JSON Web Tokens on all score submissions.
