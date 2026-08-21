using System;
using UnityEngine;

namespace Scar.Core
{
    /// <summary>
    /// SCAR — The Last Choice
    /// Master Game Orchestrator (Unity 6).
    /// Coordinates GameState, SceneFlowManager, EventBus, and cloud services.
    /// Author: Sirish (Lead / Master Integration)
    /// </summary>
    public class GameManager : MonoBehaviour
    {
        public static GameManager Instance { get; private set; }

        [Header("State Container")]
        [SerializeField] private GameState _gameState = new GameState();

        [Header("Subsystem References")]
        [SerializeField] private SceneFlowManager _sceneFlow;

        [Header("Debug Settings")]
        [SerializeField] private bool _verboseLogging = true;

        public GameState State { get { return _gameState; } }
        public SceneFlowManager SceneFlow { get { return _sceneFlow; } }

        // Cloud backend adapter registered by Priyanshu
        private IAWSBackendService _awsBackend;
        public IAWSBackendService AWSBackend { get { return _awsBackend; } }

        private void Awake()
        {
            if (Instance != null && Instance != this)
            {
                Debug.LogWarning("[GameManager] Duplicate GameManager detected. Destroying duplicate.");
                Destroy(gameObject);
                return;
            }

            Instance = this;
            DontDestroyOnLoad(gameObject);

            if (_sceneFlow == null)
            {
                _sceneFlow = GetComponent<SceneFlowManager>();
                if (_sceneFlow == null)
                {
                    _sceneFlow = gameObject.AddComponent<SceneFlowManager>();
                }
            }

            InitializeCore();
        }

        private void OnDestroy()
        {
            if (Instance == this)
            {
                UnsubscribeCoreEvents();
                Instance = null;
            }
        }

        private void InitializeCore()
        {
            if (_verboseLogging) Debug.Log("[GameManager] Initializing SCAR Unity 6 Core Systems...");

            _gameState.ResetForNewGame();
            SubscribeCoreEvents();

            if (_verboseLogging) Debug.Log("[GameManager] Core Systems Online. Ready for team subsystems.");
        }

        private void SubscribeCoreEvents()
        {
            EventBus.Subscribe<GameEvents.PhaseChangedEvent>(OnPhaseChanged);
            EventBus.Subscribe<GameEvents.EndingReachedEvent>(OnEndingReached);
            EventBus.Subscribe<GameEvents.GameOverEvent>(OnGameOver);
        }

        private void UnsubscribeCoreEvents()
        {
            EventBus.Unsubscribe<GameEvents.PhaseChangedEvent>(OnPhaseChanged);
            EventBus.Unsubscribe<GameEvents.EndingReachedEvent>(OnEndingReached);
            EventBus.Unsubscribe<GameEvents.GameOverEvent>(OnGameOver);
        }

        // ─── Team Registration APIs ───────────────────────────────────────────────

        /// <summary>
        /// PRIYANSHU calls this to register his AWS Cloud Backend service implementation.
        /// </summary>
        public void RegisterAWSBackend(IAWSBackendService backendService)
        {
            _awsBackend = backendService;
            if (_verboseLogging) Debug.Log("[GameManager] AWS Backend Service registered successfully.");
        }

        // ─── Game Lifecycle Methods ───────────────────────────────────────────────

        public void StartNewGame(string playerId, string playerName)
        {
            _gameState.ResetForNewGame();
            _gameState.SetPlayerIdentity(playerId, playerName);

            if (_verboseLogging) Debug.Log("[GameManager] Starting game for player: " + _gameState.PlayerName + " (" + _gameState.PlayerId + ")");

            var startEvent = new GameEvents.GameStartedEvent();
            startEvent.PlayerId = _gameState.PlayerId;
            startEvent.PlayerName = _gameState.PlayerName;
            EventBus.Publish(startEvent);

            // If AWS is connected, initialize game session in background without blocking
            if (_awsBackend != null && _awsBackend.IsAuthenticated)
            {
                _awsBackend.StartGameSession(_gameState.PlayerId, delegate(bool success, string sessionId)
                {
                    if (success)
                    {
                        if (_verboseLogging) Debug.Log("[GameManager] Cloud GameSession created: " + sessionId);
                    }
                    else
                    {
                        Debug.LogWarning("[GameManager] Cloud session creation failed. Continuing offline.");
                    }
                });
            }

            // Transition to Prologue
            _gameState.SetPhase(GamePhase.PROLOGUE);
            if (_sceneFlow != null)
            {
                _sceneFlow.LoadPrologue();
            }
        }

        public void AdvanceToLevel1()
        {
            _gameState.SetLevel(1, "Neon District Streets");
            _gameState.SetPhase(GamePhase.LEVEL_1);
            if (_sceneFlow != null) _sceneFlow.LoadLevel1();
        }

        public void AdvanceToLevel2()
        {
            _gameState.SetLevel(2, "Atlas Spire Lower Tier");
            _gameState.SetPhase(GamePhase.LEVEL_2);
            if (_sceneFlow != null) _sceneFlow.LoadLevel2();
        }

        public void TriggerFinalChoice()
        {
            _gameState.SetPhase(GamePhase.FINAL_CHOICE);
        }

        public void TriggerEnding(string endingId)
        {
            _gameState.SetEnding(endingId, 2000);
        }

        // ─── Event Handlers ────────────────────────────────────────────────────────

        private void OnPhaseChanged(GameEvents.PhaseChangedEvent e)
        {
            if (_verboseLogging) Debug.Log("[GameManager] Phase Transition: " + e.PreviousPhase + " -> " + e.NewPhase);
        }

        private void OnEndingReached(GameEvents.EndingReachedEvent e)
        {
            if (_verboseLogging) Debug.Log("[GameManager] Ending Reached: " + e.EndingId + " | Authoritative Final Score: " + e.FinalScore);

            // Submit authoritative score to AWS in background if available
            if (_awsBackend != null)
            {
                _awsBackend.SubmitFinalScore(_gameState, delegate(bool success, string resultMsg)
                {
                    if (success)
                    {
                        if (_verboseLogging) Debug.Log("[GameManager] Score submitted to AWS Cloud: " + resultMsg);
                    }
                    else
                    {
                        Debug.LogWarning("[GameManager] AWS score submission skipped/failed: " + resultMsg + ". Score saved locally.");
                    }
                });
            }

            if (_sceneFlow != null)
            {
                _sceneFlow.LoadEnding();
            }
        }

        private void OnGameOver(GameEvents.GameOverEvent e)
        {
            if (_verboseLogging) Debug.Log("[GameManager] GAME OVER: " + e.CauseOfDeath + " | Final Score: " + e.FinalScore);
        }
    }
}
