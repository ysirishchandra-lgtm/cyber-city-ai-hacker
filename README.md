# SCAR — THE LAST CHOICE
> *"Everyone has a superpower. The player has ZERO."*

A narrative choice-driven 3D action cyberpunk game created for the **FRONTIER 2026 — Cloud-Powered Game Development Hackathon**.

---

## 🎮 Game Overview

In a neon-drenched metropolis where every citizen was born with extraordinary superhuman abilities, you are an ordinary young man with zero powers. Confronted and brutally scarred by a syndicate of high-tier enforcers, you embark on a 72-hour journey fueled by insecurity and revenge — only to discover that power changes what you can do, but choices decide who you become.

### 🌟 Core Features
- **Cinematic 3D Over-The-Shoulder Action**: Smooth WASD movement, 3-hit katana combo ribbons, and 360° aerodynamic dodge rolls with invulnerability frames.
- **72-Hour Survival Deadline**: Visible HUD countdown (`TIME REMAINING: 72:00:00`) where travel, exploration, and combat decisions consume time under pressure.
- **Three-Level Progression**:
  - **Level 1 — The Powerless**: Insecurity, investigation, and the climactic scar reaction that unlocks `[Q] ADAPT`.
  - **Level 2 — Evolution**: Moral decisions (trapped civilians, enemy mercy, shortcuts), emotional pressure system, and `[R] EVOLVE`.
  - **Level 3 — Identity**: The city reacts to your moral profile; showdown against the city's prodigy **Atlas**.
- **Adaptive Hero AI (Atlas)**: Atlas observes your playstyle in real time — countering spammed abilities, parrying aggression, and questioning your choices.
- **Glitch / Replay Memory**: The world remembers previous runs; subtle glitch flickers, prior-choice dialogue references, and secret time-freeze ability `[G] GLITCH`.
- **4 Divergent Endings**: The Avenger (Villain), The Tyrant, The Savior, and The Self (Human).
- **Zero Fake Data Telemetry**: Authentic AWS backend integration saving real scores, sessions, and player profiles.

---

## 🕹️ Controls Guide

| Input | Action | Tactical Description |
|---|---|---|
| **`W`, `A`, `S`, `D`** | Movement | Directional stride cycle with dynamic flowing coat physics |
| **`Mouse Movement`** | Over-the-Shoulder Aim | Directional camera lead |
| **`Left Mouse Button`** | Katana 3-Hit Combo | Horizontal Strike $\rightarrow$ Rising Upper $\rightarrow$ Heavy Cleave |
| **`Space` / `Left Shift`** | 360° Dodge Roll | Aerodynamic tumble with invulnerability frames |
| **`Q` / `Right Mouse`** | Activate Awakened Power | Triggers unlocked Power Path (Nova / Barrier / Stasis) |
| **`R`** | Evolve Superpower | Overcharges active power duration and attack strength |
| **`G`** | Secret Glitch Power | Temporal distortion that freezes surrounding enemies |
| **`E`** | Investigate & Comms | Intercept clues & tactical radio dialogue with Informant Kira |
| **`Space` / `Click`** | Advance Story | Progress dialogue and skip cutscenes |
| **`1, 2, 3`** | Moral Choices | Select critical story decisions |
| **`Escape`** | Tactical Pause Menu | Pause game, view controls, toggle audio, or quit to title |

---

## 🚀 How to Run

### 1. Web Frontend Engine
```bash
# Start frontend web server from the project root
python -m http.server 8080
```
Open **`http://localhost:8080`** in your browser.

### 2. Live Cloud Backend API & Database
```bash
# Install dependencies & initialize SQLite database
npm install --prefix backend
npx --prefix backend prisma db push

# Start backend daemon
node backend/src/server.js
```
The backend API will run live on **`http://localhost:3000`**.

---

## ⚡ Hackathon Demo Selector (For Judges)

The game includes a dedicated **DEMO SELECTOR** button on the title screen for instant access to any section:
1. **Level 1**: The Powerless (Investigation & basic combat)
2. **Boss 1 & Awakening**: Enforcer showdown & `[Q] ADAPT` moment
3. **Level 2**: Evolution & Moral Choices (Trapped civilian & mercy dilemma)
4. **Level 3 & Atlas Boss**: The Prodigy showdown with adaptive combat AI
5. **Final Confrontation**: 4 Divergent Endings & Journey Reflection

---

## ☁️ AWS Cloud Architecture

```text
  [ SCAR Web Engine ]
         │
         ▼  (HTTPS / REST API)
  [ Express / API Gateway ]
         │
         ├─────────────────────────────┬────────────────────────────┐
         ▼                             ▼                            ▼
  [ DynamoDB / SQLite ]        [ AWS Bedrock AI ]          [ CloudWatch ]
  • Player Sessions            • Personalized Reflection   • Real-Time Telemetry
  • Global Leaderboards        • Narrative Profile         • Choice Distribution
  • Previous Run Memory
```

- **DynamoDB / SQLite Store**: Authoritative storage of player sessions, choice history, and score telemetry.
- **AWS Bedrock Runtime**: Generates personalized psychological player reflections based on gameplay choices and emotional pressure profile.
- **Previous Run Memory**: Powers the Glitch System by retrieving previous run actions to alter NPC dialogue on subsequent playthroughs.

---

## 🛡️ Test Suites & Verification

- **Master E2E Backend Database Test**: **4 / 4 Narrative Paths PASS (100%)**
- **Backend API Jest Test Suite**: **22 / 22 PASS (100%)**
- **Visual & Particle System QA Suite**: **30 / 30 PASS (100%)**
- **Gameplay State Machine Regression Suite**: **29 / 29 PASS (100%)**
- **Total Automated Tests**: **85 / 85 PASS**
- **Zero Fake Data Rule**: **100% Compliant**

---

## 📜 Third-Party Open Source Libraries & Licenses

- **Three.js / WebGL / Canvas2D** — MIT License
- **Web Speech API** — W3C Standard Specification
- **Express.js** — MIT License
- **Prisma ORM** — Apache 2.0 License
- **Jest** — MIT License
