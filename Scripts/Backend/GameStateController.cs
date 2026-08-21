using System;
using System.Collections.Generic;
using UnityEngine;

namespace GameHack.Backend
{
    /// <summary>
    /// Tracks score calculation, run timers, combo counters, and current level objectives.
    /// Central game-session controller — no rendering dependencies.
    /// </summary>
    public class GameStateController : MonoBehaviour
    {
        // ─── Events ───────────────────────────────────────────────────────────
        public event Action<int>         OnScoreChanged;        // total score
        public event Action<int>         OnComboChanged;        // current combo count
        public event Action<float>       OnTimerTick;           // seconds remaining
        public event Action<string>      OnObjectiveCompleted;  // objectiveID
        public event Action<GamePhase>   OnPhaseChanged;

        // ─── Inspector Config ─────────────────────────────────────────────────
        [Header("Scoring")]
        [SerializeField] private int   _baseKillScore    = 100;
        [SerializeField] private float _comboTimeWindow  = 2.5f;  // sec between hits to maintain combo
        [SerializeField] private float _comboMultStep    = 0.25f; // multiplier added per combo hit

        [Header("Level Timer")]
        [SerializeField] private float _levelTimerMax    = 300f;  // seconds
        [SerializeField] private bool  _timerCountsDown  = true;

        // ─── Runtime State ────────────────────────────────────────────────────
        private int   _totalScore;
        private int   _comboCount;
        private float _comboTimer;
        private float _levelTimer;
        private GamePhase _currentPhase = GamePhase.Lobby;

        // Objective registry: objectiveID → completed?
        private readonly Dictionary<string, bool> _objectives = new Dictionary<string, bool>();

        // ─── Properties ──────────────────────────────────────────────────────
        public int   TotalScore    => _totalScore;
        public int   ComboCount    => _comboCount;
        public float ComboMultiplier => 1f + (_comboCount * _comboMultStep);
        public float LevelTimer    => _levelTimer;
        public GamePhase Phase     => _currentPhase;

        // ─────────────────────────────────────────────────────────────────────
        private void Awake()
        {
            _levelTimer = _timerCountsDown ? _levelTimerMax : 0f;
        }

        private void Update()
        {
            if (_currentPhase != GamePhase.InGame) return;

            float dt = Time.deltaTime;
            TickTimer(dt);
            TickCombo(dt);
        }

        // ─── Phase API ────────────────────────────────────────────────────────

        public void SetPhase(GamePhase phase)
        {
            if (_currentPhase == phase) return;
            _currentPhase = phase;
            OnPhaseChanged?.Invoke(phase);
        }

        public void StartGame()
        {
            _totalScore  = 0;
            _comboCount  = 0;
            _comboTimer  = 0f;
            _levelTimer  = _timerCountsDown ? _levelTimerMax : 0f;
            _objectives.Clear();
            SetPhase(GamePhase.InGame);
        }

        // ─── Score & Combo API ────────────────────────────────────────────────

        /// <summary>
        /// Register a hit/kill event. Score is multiplied by current combo multiplier.
        /// </summary>
        public void RegisterHit(bool isKill = false)
        {
            _comboCount++;
            _comboTimer = _comboTimeWindow; // reset window

            int basePoints = isKill ? _baseKillScore : _baseKillScore / 4;
            int scored = Mathf.RoundToInt(basePoints * ComboMultiplier);

            _totalScore += scored;
            OnScoreChanged?.Invoke(_totalScore);
            OnComboChanged?.Invoke(_comboCount);
        }

        /// <summary>Add flat bonus score (for objectives, time bonuses, etc.)</summary>
        public void AddBonusScore(int amount)
        {
            _totalScore += amount;
            OnScoreChanged?.Invoke(_totalScore);
        }

        /// <summary>Manually reset the combo (e.g., on player taking damage).</summary>
        public void BreakCombo()
        {
            if (_comboCount == 0) return;
            _comboCount = 0;
            _comboTimer = 0f;
            OnComboChanged?.Invoke(0);
        }

        // ─── Objective API ────────────────────────────────────────────────────

        public void RegisterObjective(string objectiveID)
        {
            if (!_objectives.ContainsKey(objectiveID))
                _objectives[objectiveID] = false;
        }

        public void CompleteObjective(string objectiveID)
        {
            if (_objectives.ContainsKey(objectiveID) && !_objectives[objectiveID])
            {
                _objectives[objectiveID] = true;
                OnObjectiveCompleted?.Invoke(objectiveID);
            }
        }

        public bool IsObjectiveComplete(string objectiveID) =>
            _objectives.TryGetValue(objectiveID, out bool done) && done;

        public bool AllObjectivesComplete()
        {
            foreach (var kv in _objectives)
                if (!kv.Value) return false;
            return true;
        }

        // ─── Private Ticks ────────────────────────────────────────────────────

        private void TickTimer(float dt)
        {
            if (_timerCountsDown)
            {
                _levelTimer -= dt;
                if (_levelTimer <= 0f)
                {
                    _levelTimer = 0f;
                    SetPhase(GamePhase.GameOver);
                }
            }
            else
            {
                _levelTimer += dt;
            }
            OnTimerTick?.Invoke(_levelTimer);
        }

        private void TickCombo(float dt)
        {
            if (_comboCount <= 0) return;
            _comboTimer -= dt;
            if (_comboTimer <= 0f)
                BreakCombo();
        }
    }

    public enum GamePhase
    {
        Lobby,
        InGame,
        Paused,
        GameOver,
        Victory
    }
}
