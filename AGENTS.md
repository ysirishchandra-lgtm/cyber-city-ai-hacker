# FRONTIER Vibe Coding Agents

This repository is built using the FRONTIER Agentic Workflow. Any AI coding assistant working in this repository must adhere to these rules.

## Tech Stack
- **Game Engine**: Phaser 4 + TypeScript (in `/game-client`)
- **Web UI**: Next.js + Tailwind + shadcn/ui (in `/web-ui`)
- **API Backend**: NestJS + PostgreSQL + Redis (in `/api-server`)
- **Cloud/Infra**: AWS (GameLift, CDK)

## Workflow Directives
1. **No Blind Copy-Pasting**: Study the official examples (e.g., Phaser examples) and implement patterns deliberately.
2. **Reverse Development**: Mechanics and fun first. Build the core hacking minigames and interaction loops before worrying about lore.
3. **Security First**: Verify auth implementations against OWASP ASVS. Do not reinvent cryptography. Use Better Auth or Clerk.

## Task Execution
- Always check `GAME-DESIGN-DOCUMENT.md` before making mechanical changes.
- Write Playwright tests for critical paths (Auth, Gameplay loading).
