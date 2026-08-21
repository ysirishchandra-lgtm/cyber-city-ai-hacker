# Cyber City AI Hacker - Game Design Document

## Core Concept
A cloud-powered cyberpunk game combining AI, hacking challenges, and AWS.

## "Reverse Development" Pillars
1. **Mechanic First**: The core fun comes from interactive hacking minigames (typing, pattern matching, logic puzzles).
2. **Glitch as a Feature**: Visual glitches (screen tearing, color artifacting) will be used as a gameplay mechanic (e.g., to reveal hidden paths or code vulnerabilities).
3. **The 5-Second Hook**: The game must clearly communicate its "AI hacking" vibe instantly via a terminal-like HUD superimposed on a gritty 3D/2D cyberpunk background.

## Technical Architecture (Option C: Web + Mobile Hybrid)
- **Client**: Phaser 4 for the main gameplay loop. Next.js for menus, leaderboards, and UI.
- **Backend**: NestJS handling API requests. Colyseus handling real-time multiplayer sessions (e.g., hacking races).
- **Cloud**: AWS GameLift for scaling multiplayer server instances.

## Progression
1. Landing Page (Next.js)
2. Auth (Better Auth / Clerk)
3. Game Lobby (Next.js)
4. Play (Phaser Canvas)
5. Results / Leaderboard (Next.js + Postgres)
