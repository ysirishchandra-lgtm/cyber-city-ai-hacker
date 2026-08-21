using System;
using UnityEngine;
using GameHack.Backend.Scoring;
using GameHack.Backend.Characters;

namespace GameHack.Backend.Session
{
    public enum SessionState
    {
        NotStarted,
        InRound,
        RoundCompleted,
        EndingSequence,
        RunCompleted,
        Failed
    }

    /// <summary>
    /// Master Game Session Controller for SCAR — BECOME.
    /// Controls overall game lifecycle, round progression (Level 1 to 3 Boss Encounter),
    /// level transitions, reset mechanisms, and persists telemetry/summary payloads.
    /// Fully event-driven and decoupled from graphics/UI.
    /// </summary>
    public class GameSessionManager : MonoBehaviour
    {
        // ─── Events ───────────────────────────────────────────────────────────
        public event Action<int>                  OnRoundStarted;      // roundNumber (1, 2, 3)
        public event Action<int, SessionSummary>  OnRoundCompleted;    // roundNumber, round stats
        public event Action<SessionState>         OnSessionStateChanged;
        public event Action<GameSummaryPayload>   OnRunFinalized;      // summary saved

        // ─── Inspector: Dependencies ──────────────────────────────────────────
        [Header("Dependencies")]
        [SerializeField] private GameStateController      _gameStateController;
        [SerializeField] private PlayerStatsManager       _playerStatsManager;
        [SerializeField] private CharacterArchetypeManager _archetypeManager;
        [SerializeField] private EndingNarrativeController _endingNarrativeController;
        [SerializeField] private StyleRatingSystem        _styleRatingSystem;

        [Header("Session Config")]
        [SerializeField] private int   _maxRounds            = 3;
        [SerializeField] private float _defaultRoundDuration = 300f; // 5 min per level

        // ─── Runtime State ────────────────────────────────────────────────────
        private SessionState   _sessionState = SessionState.NotStarted;
        private int            _currentRound = 1;
        private float          _runStartTime;
        private float          _roundStartTime;
        private int            _totalRoundsCompleted;
        private GameSummaryPayload _lastSummary;

        // ─── Properties ──────────────────────────────────────────────────────
        public SessionState CurrentState        => _sessionState;
        public int          CurrentRound        => _currentRound;
        public float        TotalElapsedTime    => _sessionState != SessionState.NotStarted ? (Time.time - _runStartTime) : 0f;
        public float        RoundElapsedTime    => _sessionState == SessionState.InRound ? (Time.time - _roundStartTime) : 0f;
        public GameSummaryPayload LastSummary   => _lastSummary;

        // ─────────────────────────────────────────────────────────────────────

        private void Awake()
        {
            if (_endingNarrativeController != null)
            {
                _endingNarrativeController.OnRunSummaryReady += HandleRunSummaryReady;
                _endingNarrativeController.OnPostVictoryStateEntered += HandlePostVictoryEntered;
            }
        }

        private void OnDestroy()
        {
            if (_endingNarrativeController != null)
            {
                _endingNarrativeController.OnRunSummaryReady -= HandleRunSummaryReady;
                _endingNarrativeController.OnPostVictoryStateEntered -= HandlePostVictoryEntered;
            }
        }

        // ─── Public Lifecycle API ─────────────────────────────────────────────

        /// <summary>
        /// Starts a full game run from Round 1 or designated starting round.
        /// </summary>
        public void StartRun(int startingRound = 1)
        {
            _runStartTime = Time.time;
            _totalRoundsCompleted = 0;
            _currentRound = Mathf.Clamp(startingRound, 1, _maxRounds);
            
            _gameStateController?.StartGame();
            _styleRatingSystem?.ResetStyle();

            StartRound(_currentRound);
        }

        /// <summary>
        /// Initializes and begins a specific round/level.
        /// </summary>
        public void StartRound(int roundNumber)
        {
            _currentRound = Mathf.Clamp(roundNumber, 1, _maxRounds);
            _roundStartTime = Time.time;
            
            SetState(SessionState.InRound);
            _gameStateController?.SetPhase(GamePhase.InGame);

            Debug.Log($"[GameSessionManager] Starting Round {_currentRound} / {_maxRounds}");
            OnRoundStarted?.Invoke(_currentRound);
        }

        /// <summary>
        /// Concludes the active round and evaluates progression.
        /// </summary>
        public void EndRound()
        {
            if (_sessionState != SessionState.InRound) return;

            float duration = Time.time - _roundStartTime;
            _totalRoundsCompleted++;

            var roundSummary = new SessionSummary
            {
                RoundNumber = _currentRound,
                DurationSeconds = duration,
                ScoreAtEnd = _gameStateController != null ? _gameStateController.TotalScore : 0
            };

            Debug.Log($"[GameSessionManager] Round {_currentRound} Completed in {duration:F1}s. Score: {roundSummary.ScoreAtEnd}");
            
            SetState(SessionState.RoundCompleted);
            OnRoundCompleted?.Invoke(_currentRound, roundSummary);

            if (_currentRound < _maxRounds)
            {
                // Advance to next round automatically or await scene trigger
                _currentRound++;
            }
        }

        /// <summary>
        /// Fully restarts the current session/run back to initial state.
        /// </summary>
        public void RestartRun()
        {
            Debug.Log("[GameSessionManager] Restarting run...");
            _currentRound = 1;
            _totalRoundsCompleted = 0;

            if (_playerStatsManager != null)
            {
                _playerStatsManager.Heal(_playerStatsManager.MaxHealth);
                _playerStatsManager.RestoreEnergy(_playerStatsManager.MaxEnergy);
                _playerStatsManager.TransitionState(PlayerState.Idle);
            }

            _gameStateController?.StartGame();
            _styleRatingSystem?.ResetStyle();

            StartRound(1);
        }

        // ─── Handlers ─────────────────────────────────────────────────────────

        private void HandlePostVictoryEntered()
        {
            SetState(SessionState.EndingSequence);
        }

        private void HandleRunSummaryReady(GameSummaryPayload payload)
        {
            _lastSummary = payload;
            SetState(SessionState.RunCompleted);

            // Log detailed summary metrics
            Debug.Log("=================================================");
            Debug.Log("🏁 [GameSessionManager] RUN COMPLETED & PERSISTED");
            Debug.Log($"Ending Selected    : {payload.SelectedEnding} ({payload.EndingPath})");
            Debug.Log($"Total Run Time     : {payload.RunDurationSeconds:F2} seconds");
            Debug.Log($"Final Game Score   : {payload.FinalScore:N0}");
            Debug.Log($"Max Style Rank     : {payload.MaxStyleRankLabel} (Style Score: {payload.StyleScore})");
            Debug.Log($"Total Damage Taken : {payload.TotalDamageTaken:F0} HP");
            Debug.Log($"Character Archetype: {payload.CharacterUsed}");
            Debug.Log($"Playstyle Profile  : {payload.PlaystyleProfileHash}");
            Debug.Log("=================================================");

            // Save to persistent storage
            SaveSystem.SaveRunSummary(payload, payload.SelectedEnding == "TAKE_CONTROL");

            OnRunFinalized?.Invoke(payload);
        }

        private void SetState(SessionState newState)
        {
            if (_sessionState == newState) return;
            _sessionState = newState;
            OnSessionStateChanged?.Invoke(newState);
        }
    }

    [Serializable]
    public struct SessionSummary
    {
        public int RoundNumber;
        public float DurationSeconds;
        public int ScoreAtEnd;
    }
}
