using System;
using System.Collections.Generic;
using UnityEngine;

namespace GameHack.Backend
{
    /// <summary>
    /// Lightweight telemetry logger tracking player combat patterns over the run.
    /// Computes a real-time BehaviorProfile that the Level 3 Boss AI reads to adapt
    /// its counter-strategy dynamically.
    /// </summary>
    public class AdaptiveCombatTelemetry : MonoBehaviour
    {
        // ─── Events ───────────────────────────────────────────────────────────
        public event Action<BehaviorProfile> OnProfileUpdated;

        // ─── Inspector Config ─────────────────────────────────────────────────
        [Header("Profile Recalculation")]
        [SerializeField] private float _profileUpdateInterval = 2.0f; // seconds between recalculation

        [Header("Spam Detection")]
        [SerializeField] private int   _spamThreshold    = 5;    // uses of same ability in window
        [SerializeField] private float _spamWindow       = 10f;  // seconds

        // ─── Raw Counters ─────────────────────────────────────────────────────
        private int   _meleeAttackCount;
        private int   _rangedAttackCount;
        private int   _dodgeCount;
        private int   _dashCount;
        private int   _totalActionsCount;

        // Per-ability usage log: abilityID → list of timestamps
        private readonly Dictionary<string, List<float>> _abilityLog
            = new Dictionary<string, List<float>>();

        // Current active profile
        private BehaviorProfile _currentProfile;

        // Internal timer
        private float _profileTimer;
        private float _sessionTime;

        // ─────────────────────────────────────────────────────────────────────

        private void Update()
        {
            float dt = Time.deltaTime;
            _sessionTime   += dt;
            _profileTimer  += dt;

            if (_profileTimer >= _profileUpdateInterval)
            {
                _profileTimer = 0f;
                RecalculateProfile();
                PruneOldAbilityLogs();
            }
        }

        // ─── Logging API ──────────────────────────────────────────────────────

        public void LogMelee()
        {
            _meleeAttackCount++;
            _totalActionsCount++;
        }

        public void LogRanged()
        {
            _rangedAttackCount++;
            _totalActionsCount++;
        }

        public void LogDodge()
        {
            _dodgeCount++;
            _totalActionsCount++;
        }

        public void LogDash()
        {
            _dashCount++;
            _totalActionsCount++;
        }

        public void LogAbility(string abilityID)
        {
            if (!_abilityLog.ContainsKey(abilityID))
                _abilityLog[abilityID] = new List<float>();

            _abilityLog[abilityID].Add(_sessionTime);
            _totalActionsCount++;
        }

        // ─── Profile Query API ────────────────────────────────────────────────

        public BehaviorProfile GetCurrentProfile() => _currentProfile;

        /// <summary>
        /// Returns the dominant combat style based on current data.
        /// Boss AI uses this to pick its counter-strategy.
        /// </summary>
        public CombatStyle GetDominantStyle()
        {
            if (_totalActionsCount == 0) return CombatStyle.Unknown;

            float meleeRatio  = (float)_meleeAttackCount  / _totalActionsCount;
            float rangedRatio = (float)_rangedAttackCount / _totalActionsCount;
            float dodgeRatio  = (float)_dodgeCount        / _totalActionsCount;
            float dashRatio   = (float)_dashCount         / _totalActionsCount;

            if (meleeRatio  > 0.55f) return CombatStyle.MeleeHeavy;
            if (rangedRatio > 0.50f) return CombatStyle.RangedHeavy;
            if (dodgeRatio  > 0.35f) return CombatStyle.Evasive;
            if (dashRatio   > 0.25f) return CombatStyle.Aggressive;
            return CombatStyle.Balanced;
        }

        /// <summary>Returns list of abilities being spammed in the current window.</summary>
        public List<string> GetSpammedAbilities()
        {
            var spammed = new List<string>();
            float cutoff = _sessionTime - _spamWindow;

            foreach (var kvp in _abilityLog)
            {
                int recentCount = 0;
                foreach (var t in kvp.Value)
                    if (t >= cutoff) recentCount++;

                if (recentCount >= _spamThreshold)
                    spammed.Add(kvp.Key);
            }
            return spammed;
        }

        // ─── Private ──────────────────────────────────────────────────────────

        private void RecalculateProfile()
        {
            float safeTotal = Mathf.Max(1f, _totalActionsCount);

            _currentProfile = new BehaviorProfile
            {
                MeleeAttackCount     = _meleeAttackCount,
                RangedAttackCount    = _rangedAttackCount,
                DodgeCount           = _dodgeCount,
                DashCount            = _dashCount,
                TotalActions         = _totalActionsCount,
                MeleeRatio           = _meleeAttackCount  / safeTotal,
                RangedRatio          = _rangedAttackCount / safeTotal,
                DodgeFrequency       = _dodgeCount        / Mathf.Max(1f, _sessionTime),
                DashUsageRatio       = _dashCount         / safeTotal,
                DominantStyle        = GetDominantStyle(),
                SpammedAbilities     = GetSpammedAbilities(),
                SessionDuration      = _sessionTime
            };

            OnProfileUpdated?.Invoke(_currentProfile);
        }

        private void PruneOldAbilityLogs()
        {
            float cutoff = _sessionTime - _spamWindow * 2f;
            foreach (var key in new List<string>(_abilityLog.Keys))
            {
                _abilityLog[key].RemoveAll(t => t < cutoff);
            }
        }
    }

    // ─── Data Structures ──────────────────────────────────────────────────────

    [Serializable]
    public struct BehaviorProfile
    {
        public int    MeleeAttackCount;
        public int    RangedAttackCount;
        public int    DodgeCount;
        public int    DashCount;
        public int    TotalActions;
        public float  MeleeRatio;
        public float  RangedRatio;
        public float  DodgeFrequency;      // dodges per second
        public float  DashUsageRatio;
        public float  SessionDuration;
        public CombatStyle DominantStyle;
        public System.Collections.Generic.List<string> SpammedAbilities;

        /// <summary>Serializable hash string for passing into boss AI decision trees.</summary>
        public string ToHashString() =>
            $"{DominantStyle}|M{MeleeRatio:F2}|R{RangedRatio:F2}|D{DodgeFrequency:F2}|DS{DashUsageRatio:F2}";
    }

    public enum CombatStyle
    {
        Unknown,
        MeleeHeavy,
        RangedHeavy,
        Evasive,
        Aggressive,
        Balanced
    }
}
