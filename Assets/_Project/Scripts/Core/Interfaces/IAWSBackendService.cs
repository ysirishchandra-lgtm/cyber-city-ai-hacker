using System;
using System.Collections.Generic;

namespace Scar.Core
{
    /// <summary>
    /// SCAR — The Last Choice
    /// Contract for Priyanshu's AWS Cloud Backend Services (Cognito, API Gateway, Lambda, DynamoDB).
    /// Used by: Priyanshu (Backend Implementation) & Sirish (GameManager Score Telemetry).
    /// </summary>
    public interface IAWSBackendService
    {
        bool IsAuthenticated { get; }
        string ActivePlayerId { get; }
        string ActiveSessionId { get; }

        void RegisterUser(string username, string email, string password, Action<bool, string> onComplete);
        void AuthenticateUser(string email, string password, Action<bool, string> onComplete);
        void StartGameSession(string playerId, Action<bool, string> onComplete);
        void SubmitFinalScore(GameState state, Action<bool, string> onComplete);
        void FetchGlobalLeaderboard(Action<bool, List<LeaderboardEntryDTO>> onComplete);
    }

    /// <summary>
    /// Global Leaderboard Record DTO
    /// </summary>
    [System.Serializable]
    public struct LeaderboardEntryDTO
    {
        public int Rank;
        public string PlayerName;
        public int Score;
        public string Ending;
        public int CompletionTimeSeconds;
    }
}
