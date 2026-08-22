# Third-Party Notices & Open Source Attributions

This project acknowledges the use, inspiration, and architecture references from the following open-source software and community projects:

---

## 📦 Runtime Dependencies & Core Frameworks

### 1. Express.js
- **License**: MIT License
- **Copyright**: (c) StrongLoop, Inc., TJ Holowaychuk, and Express contributors
- **Usage**: Backend REST API server, routing, and middleware orchestration (`backend/src/server.js`).

### 2. Prisma ORM / SQLite3
- **License**: Apache License 2.0
- **Copyright**: (c) Prisma Data, Inc.
- **Usage**: Relational database ORM schema, migrations, and local database persistence (`backend/prisma/schema.prisma`).

### 3. Helmet & CORS
- **License**: MIT License
- **Copyright**: (c) 2012-2024 Evan Hahn, Adam Baldwin (Helmet) / Troy Goode (CORS)
- **Usage**: HTTP security headers and Cross-Origin Resource Sharing middleware.

### 4. Jest & Supertest
- **License**: MIT License
- **Copyright**: (c) Meta Platforms, Inc. and affiliates
- **Usage**: Automated backend unit & integration test suites.

---

## 💡 Architectural & Gameplay Design References

The following open-source projects provided conceptual design patterns and architectural references for Canvas-based game development:

### 1. Street Fighter Canvas Engine (`alfredang/street-fighter-game`)
- **Repository**: [https://github.com/alfredang/street-fighter-game](https://github.com/alfredang/street-fighter-game)
- **License**: MIT License
- **Inspiration**: Frame-dependent hitboxes, hit-stop / micro-freeze feel, combo feedback escalation, and smooth damage ghost health bar animations.

### 2. Kaetram Open Source MMORPG (`Veradictus/kaetram-open`)
- **Repository**: [https://github.com/Veradictus/kaetram-open](https://github.com/Veradictus/kaetram-open) (Extended from Mozilla BrowserQuest)
- **License**: AGPL-3.0 License / MIT
- **Inspiration**: Dialogue / NPC interaction structures, in-world quest step tracking, and plain-language objective waypoint delivery.

### 3. Canvas JS 2D RPG Engine (`vkramer/Canvas-JS-2D-RPG`)
- **Repository**: [https://github.com/vkramer/Canvas-JS-2D-RPG](https://github.com/vkramer/Canvas-JS-2D-RPG)
- **License**: MIT License
- **Inspiration**: Canvas multi-layer district rendering, world space coordinate partitioning, and entity collision checks.

### 4. OpenGame Agentic Coding Framework (`leigest519/OpenGame`)
- **Repository**: [https://github.com/leigest519/OpenGame](https://github.com/leigest519/OpenGame)
- **License**: MIT License
- **Inspiration**: Agentic verification patterns, sandbox execution loops, and automated regression test methodology.

---

## 🛡️ License Compliance Note
All game assets, procedural synthwave audio synthesis algorithms, 3D character geometries, state machines, story scripts, and shaders in **SCAR: The Last Choice** are custom-authored by the development team. No proprietary or unlicensed third-party code has been copied verbatim.
