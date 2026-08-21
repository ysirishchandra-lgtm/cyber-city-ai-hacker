using System;
using UnityEngine;

namespace GameHack.Backend.Boss
{
    /// <summary>
    /// Reads the player's BehaviorProfile from AdaptiveCombatTelemetry and
    /// outputs a live BossStrategy struct. Boss phases and combat managers
    /// query this service every tick to adjust aggression, parry frequency,
    /// armor frames, and ability selection.
    /// </summary>
    public class BossAdaptiveStrategy : MonoBehaviour
    {
        // ─── Events ───────────────────────────────────────────────────────────
        public event Action<BossStrategy> OnStrategyChanged;

        // ─── Inspector Config ─────────────────────────────────────────────────
        [Header("Telemetry Source")]
        [SerializeField] private AdaptiveCombatTelemetry _telemetry;

        [Header("Adaptation Thresholds")]
        [SerializeField] private float _meleeHeavyThreshold  = 0.55f;
        [SerializeField] private float _rangedHeavyThreshold = 0.50f;
        [SerializeField] private float _dashHeavyThreshold   = 0.25f;
        [SerializeField] private float _evasiveThreshold     = 0.35f;

        [Header("Update Rate")]
        [SerializeField] private float _strategyUpdateRate   = 1.5f; // seconds

        // ─── Runtime ─────────────────────────────────────────────────────────
        private BossStrategy _currentStrategy;
        private float        _updateTimer;

        // ─────────────────────────────────────────────────────────────────────

        private void Update()
        {
            _updateTimer += Time.deltaTime;
            if (_updateTimer >= _strategyUpdateRate)
            {
                _updateTimer = 0f;
                RecalculateStrategy();
            }
        }

        public BossStrategy GetCurrentStrategy() => _currentStrategy;

        // ─── Core Strategy Engine ─────────────────────────────────────────────

        private void RecalculateStrategy()
        {
            if (_telemetry == null) return;

            BehaviorProfile profile = _telemetry.GetCurrentProfile();
            BossStrategy    next    = BuildStrategy(profile);

            bool changed = !next.Equals(_currentStrategy);
            _currentStrategy = next;

            if (changed)
                OnStrategyChanged?.Invoke(_currentStrategy);
        }

        private BossStrategy BuildStrategy(BehaviorProfile p)
        {
            var strategy = new BossStrategy
            {
                // ── Baseline values ──────────────────────────────────────────
                ParryFrequency        = 0.20f,
                ArmorStartupFrames    = 0,
                UsesVoidShield        = false,
                GapCloserPriority     = 0.20f,
                AoEDenialWeight       = 0.10f,
                AggressionMultiplier  = 1.0f,
                ActiveCounterAbility  = null,
                SpamBreakerActive     = false,
                CounteredAbilityID    = null
            };

            // ── Rule 1: High Melee Ratio → Parry/Counter + Armor ────────────
            if (p.MeleeRatio >= _meleeHeavyThreshold)
            {
                strategy.ParryFrequency       = Mathf.Lerp(0.20f, 0.75f,
                                                    (p.MeleeRatio - _meleeHeavyThreshold) / (1f - _meleeHeavyThreshold));
                strategy.ArmorStartupFrames   = Mathf.RoundToInt(Mathf.Lerp(0, 8,
                                                    p.MeleeRatio));
                strategy.ActiveCounterAbility = "MartialCounter";
                strategy.AggressionMultiplier *= 0.85f; // be defensive, bait the player
            }

            // ── Rule 2: High Ranged Ratio → Void Shield + Gap Closer ────────
            if (p.RangedRatio >= _rangedHeavyThreshold)
            {
                strategy.UsesVoidShield       = true;
                strategy.GapCloserPriority    = Mathf.Lerp(0.20f, 0.90f,
                                                    (p.RangedRatio - _rangedHeavyThreshold) / (1f - _rangedHeavyThreshold));
                strategy.ActiveCounterAbility = "VoidTeleportStrike";
                strategy.AggressionMultiplier *= 1.15f;
            }

            // ── Rule 3: High Dash/Speed Ratio → Wide AoE Denial ─────────────
            if (p.DashUsageRatio >= _dashHeavyThreshold || p.DodgeFrequency >= _evasiveThreshold)
            {
                float ratio = Mathf.Max(p.DashUsageRatio / _dashHeavyThreshold,
                                        p.DodgeFrequency  / _evasiveThreshold);
                strategy.AoEDenialWeight      = Mathf.Lerp(0.10f, 0.80f, Mathf.Clamp01(ratio - 1f));
                strategy.ActiveCounterAbility = "ShockwaveAoEBurst";
                strategy.AggressionMultiplier *= 1.10f;
            }

            // ── Rule 4: Spam Detection → Hard Counter Breaker ────────────────
            var spammed = _telemetry.GetSpammedAbilities();
            if (spammed != null && spammed.Count > 0)
            {
                strategy.SpamBreakerActive  = true;
                strategy.CounteredAbilityID = spammed[0]; // counter the most-spammed
                strategy.AggressionMultiplier *= 1.25f;
                Debug.Log($"[BossStrategy] Spam detected: {spammed[0]} — deploying breaker.");
            }

            // ── Clamp aggression ─────────────────────────────────────────────
            strategy.AggressionMultiplier = Mathf.Clamp(strategy.AggressionMultiplier, 0.5f, 2.0f);

            return strategy;
        }
    }

    // ─── Data Structures ──────────────────────────────────────────────────────

    [Serializable]
    public struct BossStrategy : IEquatable<BossStrategy>
    {
        /// <summary>0–1 probability the boss attempts a parry on player melee.</summary>
        public float  ParryFrequency;

        /// <summary>Number of startup armor frames added to boss attacks.</summary>
        public int    ArmorStartupFrames;

        /// <summary>True → activate Void Shield against ranged projectiles.</summary>
        public bool   UsesVoidShield;

        /// <summary>0–1 weight to prioritize gap-close teleport over ranged attacks.</summary>
        public float  GapCloserPriority;

        /// <summary>0–1 weight to trigger area-denial shockwaves when player dashes.</summary>
        public float  AoEDenialWeight;

        /// <summary>Scales all boss attack output and cooldown speeds.</summary>
        public float  AggressionMultiplier;

        /// <summary>The ability ID the boss will prioritize as counter play.</summary>
        public string ActiveCounterAbility;

        /// <summary>True when a specific ability spam has been detected.</summary>
        public bool   SpamBreakerActive;

        /// <summary>The spammed ability ID to hard-counter.</summary>
        public string CounteredAbilityID;

        public bool Equals(BossStrategy other) =>
            Mathf.Approximately(ParryFrequency, other.ParryFrequency)         &&
            ArmorStartupFrames == other.ArmorStartupFrames                    &&
            UsesVoidShield     == other.UsesVoidShield                        &&
            Mathf.Approximately(GapCloserPriority, other.GapCloserPriority)  &&
            SpamBreakerActive  == other.SpamBreakerActive                     &&
            CounteredAbilityID == other.CounteredAbilityID;
    }
}
