using System;
using System.Collections.Generic;
using UnityEngine;
using Scar.Core;

namespace Scar.Backend
{
    public class AWSBackendService : MonoBehaviour, IAWSBackendService
    {
        [SerializeField] private AWSConfig _config;
        
        private AWSApiClient _apiClient;
        private LocalSaveService _localSave;

        private string _activePlayerId = string.Empty;
        private string _activeSessionId = string.Empty;
        private bool _isAuthenticated = false;

        public bool IsAuthenticated { get { return _isAuthenticated; } }
        public string ActivePlayerId { get { return _activePlayerId; } }
        public string ActiveSessionId { get { return _activeSessionId; } }

        private AWSApiClient ApiClient
        {
            get
            {
                if (_apiClient == null)
                {
                    if (_config == null)
                    {
                        _config = ScriptableObject.CreateInstance<AWSConfig>();
                    }
                    _apiClient = new AWSApiClient(_config);
                }
                return _apiClient;
            }
        }

        private LocalSaveService LocalSave
        {
            get
            {
                if (_localSave == null)
                {
                    _localSave = new LocalSaveService();
                }
                return _localSave;
            }
        }

        private void Awake()
        {
            if (_config == null)
            {
                _config = ScriptableObject.CreateInstance<AWSConfig>();
                Debug.LogWarning("[AWSBackendService] AWSConfig is missing. Created default in-memory config.");
            }
            
            _apiClient = new AWSApiClient(_config);
            _localSave = new LocalSaveService();
        }

        public async void RegisterUser(string username, string email, string password, Action<bool, string> onComplete)
        {
            var req = new AuthRequest { username = username, email = email, password = password };
            var res = await ApiClient.PostAsync<AuthResponse>("/auth/register", req);

            if (res != null && res.success)
            {
                if (onComplete != null) onComplete(true, "Registration successful");
            }
            else
            {
                if (onComplete != null) onComplete(false, "Registration failed");
            }
        }

        public async void AuthenticateUser(string email, string password, Action<bool, string> onComplete)
        {
            var req = new AuthRequest { email = email, password = password };
            var res = await ApiClient.PostAsync<AuthResponse>("/auth/login", req);

            if (res != null && !string.IsNullOrEmpty(res.token))
            {
                ApiClient.SetAuthToken(res.token);
                _activePlayerId = res.playerId;
                _isAuthenticated = true;
                if (onComplete != null) onComplete(true, "Authentication successful");
            }
            else
            {
                _isAuthenticated = false;
                if (onComplete != null) onComplete(false, "Authentication failed");
            }
        }

        public async void StartGameSession(string playerId, Action<bool, string> onComplete)
        {
            if (!_isAuthenticated)
            {
                // Offline fallback session
                _activeSessionId = Guid.NewGuid().ToString();
                if (onComplete != null) onComplete(true, _activeSessionId);
                return;
            }

            var req = new AuthRequest { username = playerId };
            var res = await ApiClient.PostAsync<AuthResponse>("/game/session", req);

            if (res != null && res.success)
            {
                _activeSessionId = res.message;
                if (onComplete != null) onComplete(true, _activeSessionId);
            }
            else
            {
                _activeSessionId = Guid.NewGuid().ToString();
                if (onComplete != null) onComplete(true, _activeSessionId); // Offline fallback
            }
        }

        public async void SubmitFinalScore(GameState state, Action<bool, string> onComplete)
        {
            if (state == null) return;

            // Always save locally first as offline fallback
            SaveLocally(state);

            if (!_isAuthenticated)
            {
                if (onComplete != null) onComplete(false, "Saved locally (Offline)");
                return;
            }

            var payload = new ScoreSubmission
            {
                playerId = state.PlayerId,
                sessionId = _activeSessionId,
                score = state.Score,
                ending = state.Ending,
                powerPath = state.PowerPath,
                choicesCount = state.ChoicesMade,
                enemiesDefeated = state.EnemiesDefeated,
                missionsCompleted = state.MissionsCompleted,
                completionTime = 0,
                damageReceived = 0,
                powerUsage = 0
            };

            var success = await ApiClient.PostAsync<bool>("/scores", payload);
            if (success)
            {
                if (onComplete != null) onComplete(true, "Score submitted successfully");
            }
            else
            {
                if (onComplete != null) onComplete(false, "Score submission failed. Saved locally.");
            }
        }

        public async void FetchGlobalLeaderboard(Action<bool, List<LeaderboardEntryDTO>> onComplete)
        {
            var res = await ApiClient.GetAsync<LeaderboardResponse>("/leaderboard");
            
            if (res != null && res.entries != null)
            {
                if (onComplete != null) onComplete(true, res.entries);
            }
            else
            {
                // Empty fallback without fake data
                if (onComplete != null) onComplete(false, new List<LeaderboardEntryDTO>());
            }
        }

        public async void SendAnalyticsEvent(string eventName, int currentLevel, string metadata = "")
        {
            if (!_isAuthenticated) return;

            var evt = new AnalyticsEvent
            {
                playerId = _activePlayerId,
                eventName = eventName,
                timestamp = DateTime.UtcNow.ToString("o"),
                level = currentLevel,
                metadata = metadata
            };

            await ApiClient.PostAsync<bool>("/analytics", evt);
        }

        private void SaveLocally(GameState state)
        {
            if (state == null) return;
            var data = new GameSaveData
            {
                playerId = state.PlayerId,
                playerName = state.PlayerName,
                currentLevel = state.CurrentLevel,
                unlockedPower = state.PowerPath,
                revenge = state.Revenge,
                humanity = state.Humanity,
                freedom = state.Freedom,
                control = state.Control,
                score = state.Score,
                ending = state.Ending
            };
            LocalSave.Save(data);
        }
    }
}
