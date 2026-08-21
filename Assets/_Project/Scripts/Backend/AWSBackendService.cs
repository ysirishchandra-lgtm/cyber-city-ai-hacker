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

        public bool IsAuthenticated => _isAuthenticated;
        public string ActivePlayerId => _activePlayerId;
        public string ActiveSessionId => _activeSessionId;

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
            var res = await _apiClient.PostAsync<AuthResponse>("/auth/register", req);

            if (res != null && res.success)
            {
                onComplete?.Invoke(true, "Registration successful");
            }
            else
            {
                onComplete?.Invoke(false, "Registration failed");
            }
        }

        public async void AuthenticateUser(string email, string password, Action<bool, string> onComplete)
        {
            var req = new AuthRequest { email = email, password = password };
            var res = await _apiClient.PostAsync<AuthResponse>("/auth/login", req);

            if (res != null && !string.IsNullOrEmpty(res.token))
            {
                _apiClient.SetAuthToken(res.token);
                _activePlayerId = res.playerId;
                _isAuthenticated = true;
                onComplete?.Invoke(true, "Authentication successful");
            }
            else
            {
                _isAuthenticated = false;
                onComplete?.Invoke(false, "Authentication failed");
            }
        }

        public async void StartGameSession(string playerId, Action<bool, string> onComplete)
        {
            if (!_isAuthenticated)
            {
                onComplete?.Invoke(false, "Not authenticated");
                return;
            }

            // In a real implementation this might post to /game/session to get a session ID
            // For now we mock the session creation and rely on the local GUID or response
            var req = new { playerId = playerId };
            var res = await _apiClient.PostAsync<AuthResponse>("/game/session", req);

            if (res != null && res.success)
            {
                _activeSessionId = res.message; // Assuming message contains sessionId
                onComplete?.Invoke(true, _activeSessionId);
            }
            else
            {
                // Fallback to local session
                _activeSessionId = Guid.NewGuid().ToString();
                onComplete?.Invoke(true, _activeSessionId); // Offline fallback
            }
        }

        public async void SubmitFinalScore(GameState state, Action<bool, string> onComplete)
        {
            // Always save locally first as offline fallback
            SaveLocally(state);

            if (!_isAuthenticated)
            {
                onComplete?.Invoke(false, "Saved locally (Offline)");
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
                completionTime = 0, // Should be passed from GameState if tracked
                damageReceived = 0,
                powerUsage = 0
            };

            var success = await _apiClient.PostAsync<bool>("/scores", payload);
            if (success)
            {
                onComplete?.Invoke(true, "Score submitted successfully");
            }
            else
            {
                onComplete?.Invoke(false, "Score submission failed. Saved locally.");
            }
        }

        public async void FetchGlobalLeaderboard(Action<bool, List<LeaderboardEntryDTO>> onComplete)
        {
            var res = await _apiClient.GetAsync<LeaderboardResponse>("/leaderboard");
            
            if (res != null && res.entries != null)
            {
                onComplete?.Invoke(true, res.entries);
            }
            else
            {
                // Empty fallback instead of fabricated data
                onComplete?.Invoke(false, new List<LeaderboardEntryDTO>());
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

            await _apiClient.PostAsync<bool>("/analytics", evt);
            // Non-blocking, failure is ignored or we could cache locally
        }

        private void SaveLocally(GameState state)
        {
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
            _localSave.Save(data);
        }
    }
}
