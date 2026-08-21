/**
 * SCAR — THE LAST CHOICE
 * BackendClient.js — Real HTTP Client for Priyanshu's Backend
 * Author: Sirish (Lead/Integration) & Priyanshu (Backend)
 *
 * Connects frontend to Express + Prisma Backend API:
 * - Authentication (Register / Login / JWT)
 * - Game Sessions (UUID Tracking)
 * - Authoritative Score Submission
 * - Real-time Global Leaderboard
 */

export class BackendClient {
  constructor(baseUrl = 'http://localhost:3000') {
    this.baseUrl = baseUrl;
    this.token = null;
    this.player = null;
    this.currentSessionId = null;

    // Load existing token from storage if available
    if (typeof sessionStorage !== 'undefined') {
      this.token = sessionStorage.getItem('scar_jwt_token');
      const savedUser = sessionStorage.getItem('scar_user');
      if (savedUser) {
        try {
          this.player = JSON.parse(savedUser);
        } catch (e) {}
      }
    }
  }

  setToken(token, user = null) {
    this.token = token;
    this.player = user;
    if (typeof sessionStorage !== 'undefined') {
      if (token) {
        sessionStorage.setItem('scar_jwt_token', token);
        if (user) sessionStorage.setItem('scar_user', JSON.stringify(user));
      } else {
        sessionStorage.removeItem('scar_jwt_token');
        sessionStorage.removeItem('scar_user');
      }
    }
  }

  async healthCheck() {
    try {
      const res = await fetch(`${this.baseUrl}/api/health`);
      return res.ok;
    } catch (e) {
      return false;
    }
  }

  async register(name, email, password) {
    const res = await fetch(`${this.baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password }),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Registration failed');
    return data;
  }

  async authenticate(email, password) {
    if (!email || !password) {
      // Check if we already have a valid session
      if (this.token && this.player) {
        return { playerId: this.player.id, playerName: this.player.name, token: this.token };
      }
      return null;
    }

    const res = await fetch(`${this.baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Authentication failed');

    this.setToken(data.token, data.user);
    return {
      playerId: data.user.id,
      playerName: data.user.name,
      token: data.token,
    };
  }

  async createGameSession() {
    if (!this.token) return null;

    try {
      const res = await fetch(`${this.baseUrl}/api/game/session`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.token}`,
        },
      });

      if (!res.ok) {
        console.warn('[Backend] Could not create game session:', res.statusText);
        return null;
      }

      const data = await res.json();
      this.currentSessionId = data.id;
      return data.id;
    } catch (e) {
      console.warn('[Backend] Session creation error:', e.message);
      return null;
    }
  }

  async submitScore(payload) {
    if (!payload) return null;
    if (!this.token) {
      console.log('[Backend] Player is unauthenticated. Score logged locally only.');
      return null;
    }

    // Ensure we have an active session ID
    if (!this.currentSessionId) {
      await this.createGameSession();
    }

    if (!this.currentSessionId) {
      console.warn('[Backend] Cannot submit score without a valid game session.');
      return null;
    }

    const scoreBody = {
      sessionId: this.currentSessionId,
      score: payload.score,
      powerPath: payload.powerPath || 'NONE',
      ending: payload.ending || 'HUMAN',
      enemiesDefeated: payload.enemiesDefeated || 0,
      missionsCompleted: payload.missionsCompleted || 0,
      choicesCount: payload.choicesCount || 0,
      damageReceived: payload.damageReceived || 0,
      powerUsage: payload.powerUsage || 0,
      completionTime: payload.gameDurationSeconds || 60,
    };

    try {
      const res = await fetch(`${this.baseUrl}/api/scores`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.token}`,
        },
        body: JSON.stringify(scoreBody),
      });

      const data = await res.json();
      if (!res.ok) {
        console.warn('[Backend] Score submission rejected by server:', data.error);
        return null;
      }

      console.log('[Backend] Score saved to database successfully:', data);
      this.currentSessionId = null; // Session completed
      return data;
    } catch (e) {
      console.warn('[Backend] Score submission network error:', e.message);
      return null;
    }
  }

  async getLeaderboard() {
    try {
      const res = await fetch(`${this.baseUrl}/api/leaderboard`);
      if (!res.ok) return [];
      return await res.json();
    } catch (e) {
      console.warn('[Backend] Leaderboard fetch error:', e.message);
      return [];
    }
  }
}

export const backendClient = new BackendClient();
