using System;
using System.Collections.Generic;
using UnityEngine;

namespace GameHack.Backend.Scoring
{
    /// <summary>
    /// Real-time anime-style combo grading engine.
    /// Tracks hit variety, decays rank on inactivity, and rewards
    /// stylish play (perfect dodges, parries, clash wins).
    ///
    /// Style Ranks: D → C → B → A → S → SSS
    ///
    /// Points Matrix:
    ///   Light attack       → +10 pts
    ///   Heavy attack       → +25 pts
    ///   Ability finisher   → +50 pts
    ///   Perfect dodge      → +100 pts
    ///   Perfect parry      → +100 pts
    ///   Clash win          → +500 pts
    ///
    /// Decay penalty: Same attack 3+ times in a row → −70% point gain.
    /// Rank drops if no hit lands within 2.5s window.
    /// </summary>
    public class StyleRatingSystem : MonoBehaviour
    {
        // ─── Events ───────────────────────────────────────────────────────────
        public event Action<StyleRank, int> OnStyleRankChanged;    // (newRank, currentScore)
        public event Action<int>            OnPointsEarned;        // points this action
        public event Action<StyleRank>      OnRankDecayed;         // rank dropped
        public event Action                 OnComboDropped;        // hit window expired

        // ─── Inspector Config ─────────────────────────────────────────────────
        [Header("Decay Timer")]
        [SerializeField] private float _hitWindowDuration = 2.5f; // sec before rank decays

        [Header("Rank Thresholds")]
        [SerializeField] private int _rankC_Threshold   = 200;
        [SerializeField] private int _rankB_Threshold   = 600;
        [SerializeField] private int _rankA_Threshold   = 1400;
        [SerializeField] private int _rankS_Threshold   = 3000;
        [SerializeField] private int _rankSSS_Threshold = 6000;

        [Header("Repeat Penalty")]
        [SerializeField] private int   _repeatThreshold  = 3;     // same attack before penalty
        [SerializeField] private float _repeatMultiplier = 0.30f; // 70% reduction

        // ─── Point Values ─────────────────────────────────────────────────────
        private static readonly Dictionary<StyleAction, int> BasePoints
            = new Dictionary<StyleAction, int>
        {
            [StyleAction.LightAttack]     = 10,
            [StyleAction.HeavyAttack]     = 25,
            [StyleAction.AbilityFinisher] = 50,
            [StyleAction.PerfectDodge]    = 100,
            [StyleAction.PerfectParry]    = 100,
            [StyleAction.ClashWin]        = 500,
        };

        // ─── Runtime State ────────────────────────────────────────────────────
        private int       _totalScore;
        private StyleRank _currentRank  = StyleRank.D;
        private float     _decayTimer;
        private bool      _comboActive;

        // Repeat tracking: last action → consecutive count
        private StyleAction _lastAction  = StyleAction.LightAttack;
        private int         _repeatCount = 0;

        // Per-session peak rank
        private StyleRank _peakRank = StyleRank.D;

        // ─── Properties ──────────────────────────────────────────────────────
        public int       TotalScore  => _totalScore;
        public StyleRank CurrentRank => _currentRank;
        public StyleRank PeakRank    => _peakRank;
        public bool      ComboActive => _comboActive;
        public float     DecayRatio  => _comboActive ? (_decayTimer / _hitWindowDuration) : 0f;

        // ─────────────────────────────────────────────────────────────────────

        private void Update()
        {
            if (!_comboActive) return;

            _decayTimer -= Time.deltaTime;
            if (_decayTimer <= 0f)
                OnHitWindowExpired();
        }

        // ─── Public Scoring API ───────────────────────────────────────────────

        /// <summary>Register a light attack hit.</summary>
        public void RegisterLightAttack()    => AddPoints(StyleAction.LightAttack);

        /// <summary>Register a heavy attack hit.</summary>
        public void RegisterHeavyAttack()    => AddPoints(StyleAction.HeavyAttack);

        /// <summary>Register an ability or special move finisher.</summary>
        public void RegisterAbilityFinisher() => AddPoints(StyleAction.AbilityFinisher);

        /// <summary>Player dodged with frame-perfect timing.</summary>
        public void RegisterPerfectDodge()   => AddPoints(StyleAction.PerfectDodge);

        /// <summary>Player parried with perfect timing.</summary>
        public void RegisterPerfectParry()   => AddPoints(StyleAction.PerfectParry);

        /// <summary>Player won the Phase 3 Clash.</summary>
        public void RegisterClashWin()       => AddPoints(StyleAction.ClashWin);

        /// <summary>Manually reset style (e.g., on player death or stage reset).</summary>
        public void ResetStyle()
        {
            _totalScore  = 0;
            _decayTimer  = 0f;
            _comboActive = false;
            _repeatCount = 0;
            SetRank(StyleRank.D);
        }

        // ─── Core Logic ───────────────────────────────────────────────────────

        private void AddPoints(StyleAction action)
        {
            // Refresh the decay timer
            _decayTimer  = _hitWindowDuration;
            _comboActive = true;

            // Repeat penalty check
            float earnedMultiplier = 1f;
            if (action == _lastAction)
            {
                _repeatCount++;
                if (_repeatCount >= _repeatThreshold)
                    earnedMultiplier = _repeatMultiplier; // 70% reduction
            }
            else
            {
                _repeatCount = 1;
                _lastAction  = action;
            }

            // Calculate and add points
            int baseVal = BasePoints.TryGetValue(action, out int v) ? v : 10;
            int earned  = Mathf.RoundToInt(baseVal * earnedMultiplier);
            _totalScore += earned;

            OnPointsEarned?.Invoke(earned);

            // Recalculate rank
            StyleRank newRank = ScoreToRank(_totalScore);
            if (newRank != _currentRank)
                SetRank(newRank);
        }

        private void OnHitWindowExpired()
        {
            _comboActive = false;
            _decayTimer  = 0f;
            OnComboDropped?.Invoke();

            // Decay rank by one tier
            if (_currentRank > StyleRank.D)
            {
                StyleRank decayed = _currentRank - 1;
                SetRank(decayed);
                OnRankDecayed?.Invoke(decayed);
            }
        }

        private StyleRank ScoreToRank(int score)
        {
            if (score >= _rankSSS_Threshold) return StyleRank.SSS;
            if (score >= _rankS_Threshold)   return StyleRank.S;
            if (score >= _rankA_Threshold)   return StyleRank.A;
            if (score >= _rankB_Threshold)   return StyleRank.B;
            if (score >= _rankC_Threshold)   return StyleRank.C;
            return StyleRank.D;
        }

        private void SetRank(StyleRank rank)
        {
            _currentRank = rank;
            if (rank > _peakRank) _peakRank = rank;
            OnStyleRankChanged?.Invoke(rank, _totalScore);
        }

        // ─── Boss Integration Helpers ─────────────────────────────────────────

        /// <summary>
        /// Quick subscription helper for AdaptiveBossController3D events.
        /// Wire up from GameManager or scene bootstrap.
        /// </summary>
        public void SubscribeToClashResolved(Action<bool> clashResolvedEvent)
        {
            // Caller passes (playerWon) → we handle internally
            clashResolvedEvent += won => { if (won) RegisterClashWin(); };
        }
    }

    // ─── Enums ────────────────────────────────────────────────────────────────

    public enum StyleRank { D = 0, C = 1, B = 2, A = 3, S = 4, SSS = 5 }

    public enum StyleAction
    {
        LightAttack,
        HeavyAttack,
        AbilityFinisher,
        PerfectDodge,
        PerfectParry,
        ClashWin
    }
}
