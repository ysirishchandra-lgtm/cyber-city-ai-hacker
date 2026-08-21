using System;
using System.Collections.Generic;

namespace Scar.Backend
{
    [Serializable]
    public class AuthRequest
    {
        public string email;
        public string password;
        public string username;
    }

    [Serializable]
    public class AuthResponse
    {
        public string token;
        public string playerId;
        public string message;
        public bool success;
    }

    [Serializable]
    public class ScoreSubmission
    {
        public string playerId;
        public string sessionId;
        public int score;
        public string ending;
        public string powerPath;
        public int choicesCount;
        public int enemiesDefeated;
        public int missionsCompleted;
        // Mock data missing from GameState
        public int completionTime;
        public int damageReceived;
        public int powerUsage;
    }

    [Serializable]
    public class GameSaveData
    {
        public string playerId;
        public string playerName;
        public int currentLevel;
        public string unlockedPower;
        public float revenge;
        public float humanity;
        public float freedom;
        public float control;
        public int score;
        public string ending;
    }

    [Serializable]
    public class AnalyticsEvent
    {
        public string playerId;
        public string eventName;
        public string timestamp;
        public int level;
        public string metadata;
    }

    [Serializable]
    public class LeaderboardResponse
    {
        public List<Core.LeaderboardEntryDTO> entries;
    }
}
