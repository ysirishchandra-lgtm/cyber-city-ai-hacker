using System;
using System.Collections.Generic;
using UnityEngine;

namespace GameHack.Backend.Characters
{
    /// <summary>
    /// Manages the 5 playable character archetypes for SCAR — BECOME.
    /// Each archetype defines a StatProfile applied to PlayerStatsManager,
    /// CombatController3D, and special ability overrides at runtime.
    /// Switching archetypes fires OnArchetypeChanged for UI / VFX subscribers.
    /// Zero Animator references — all triggers are event-driven.
    /// </summary>
    public class CharacterArchetypeManager : MonoBehaviour
    {
        // ─── Events ───────────────────────────────────────────────────────────
        public event Action<CharacterArchetype, ArchetypeProfile> OnArchetypeChanged;
        public event Action<string>  OnSpecialAbilityUnlocked;   // abilityID
        public event Action<float>   OnCounterMeterChanged;      // SCAR-specific (0–1)
        public event Action<int>     OnCloneDeployed;            // PHASE clone count

        // ─── Inspector ────────────────────────────────────────────────────────
        [Header("Starting Archetype")]
        [SerializeField] private CharacterArchetype _startArchetype = CharacterArchetype.SCAR;

        [Header("Dependencies")]
        [SerializeField] private PlayerStatsManager  _stats;
        [SerializeField] private CombatController3D  _combat;

        // ─── Runtime State ────────────────────────────────────────────────────
        private CharacterArchetype _currentArchetype;
        private ArchetypeProfile   _activeProfile;

        // SCAR — counter meter (0-1), fills on taking hits
        private float _scarCounterMeter;
        private const float SCAR_METER_PER_HIT = 0.15f;

        // PHASE — active clones
        private int   _phaseCloneCount;
        private const int PHASE_MAX_CLONES = 2;

        // VOLT — air dash charges
        private int   _voltAirDashCharges;
        private const int VOLT_MAX_AIR_DASHES = 3;

        // NOVA — cooldown acceleration stacks
        private int   _novaCooldownStacks;

        // Archetype profile table
        private static readonly Dictionary<CharacterArchetype, ArchetypeProfile> Profiles
            = new Dictionary<CharacterArchetype, ArchetypeProfile>
        {
            [CharacterArchetype.SCAR] = new ArchetypeProfile
            {
                DisplayName           = "SCAR — Adaptive",
                MaxHealth             = 100f,
                MaxEnergy             = 100f,
                EnergyRegen           = 15f,
                DamageMultiplier      = 1.00f,
                SpeedMultiplier       = 1.00f,
                DefenseMultiplier     = 1.00f,
                DashRecoveryScale     = 1.00f,
                HyperArmorStartFrames = 0,
                HasInvisibilityDash   = false,
                HasRearCritical       = false,
                HasCloneDecoy         = false,
                HasEnergyTraps        = false,
                AirDashCharges        = 1,
                CooldownAcceleration  = 1.00f,
                UniqueAbility         = "CounterStrike",
                Description           = "Balanced adaptive fighter. Fills counter meter from receiving damage, then unleashes a devastating counter burst."
            },

            [CharacterArchetype.TITAN] = new ArchetypeProfile
            {
                DisplayName           = "TITAN — Brute Force",
                MaxHealth             = 150f,     // +50% HP
                MaxEnergy             = 80f,
                EnergyRegen           = 10f,
                DamageMultiplier      = 1.40f,
                SpeedMultiplier       = 0.80f,
                DefenseMultiplier     = 1.50f,
                DashRecoveryScale     = 1.60f,    // slower dash recovery
                HyperArmorStartFrames = 8,        // 8 armor frames on attack startup
                HasInvisibilityDash   = false,
                HasRearCritical       = false,
                HasCloneDecoy         = false,
                HasEnergyTraps        = false,
                AirDashCharges        = 1,
                CooldownAcceleration  = 1.00f,
                UniqueAbility         = "TitanSlam",
                Description           = "Unstoppable brute. Hyper-armor on all attacks, +50% HP, massive stagger damage."
            },

            [CharacterArchetype.VOLT] = new ArchetypeProfile
            {
                DisplayName           = "VOLT — Extreme Speed",
                MaxHealth             = 80f,
                MaxEnergy             = 120f,
                EnergyRegen           = 25f,
                DamageMultiplier      = 0.70f,    // lower base damage
                SpeedMultiplier       = 1.70f,    // high movement
                DefenseMultiplier     = 0.85f,
                DashRecoveryScale     = 0.50f,    // very fast dash recovery
                HyperArmorStartFrames = 0,
                HasInvisibilityDash   = false,
                HasRearCritical       = false,
                HasCloneDecoy         = false,
                HasEnergyTraps        = false,
                AirDashCharges        = 3,        // triple air-dash
                CooldownAcceleration  = 1.30f,
                UniqueAbility         = "FlashDash",
                Description           = "Extreme speed fighter. Triple air-dash, rapid multi-hit strings, fast style meter generation."
            },

            [CharacterArchetype.PHASE] = new ArchetypeProfile
            {
                DisplayName           = "PHASE — Stealth Blink",
                MaxHealth             = 85f,
                MaxEnergy             = 110f,
                EnergyRegen           = 18f,
                DamageMultiplier      = 1.20f,
                SpeedMultiplier       = 1.20f,
                DefenseMultiplier     = 0.90f,
                DashRecoveryScale     = 0.70f,
                HyperArmorStartFrames = 0,
                HasInvisibilityDash   = true,     // I-frame invisibility dash
                HasRearCritical       = true,      // 2× damage from behind
                HasCloneDecoy         = true,      // deploy clone decoys
                HasEnergyTraps        = false,
                AirDashCharges        = 2,
                CooldownAcceleration  = 1.10f,
                UniqueAbility         = "ShadowBlink",
                Description           = "Stealth assassin. Invisible I-frame dash, rear critical strikes (2×), deployable clone decoys."
            },

            [CharacterArchetype.NOVA] = new ArchetypeProfile
            {
                DisplayName           = "NOVA — Tactical Zone",
                MaxHealth             = 90f,
                MaxEnergy             = 150f,
                EnergyRegen           = 30f,
                DamageMultiplier      = 0.90f,
                SpeedMultiplier       = 1.00f,
                DefenseMultiplier     = 1.10f,
                DashRecoveryScale     = 1.00f,
                HyperArmorStartFrames = 0,
                HasInvisibilityDash   = false,
                HasRearCritical       = false,
                HasCloneDecoy         = false,
                HasEnergyTraps        = true,      // deployable energy traps
                AirDashCharges        = 1,
                CooldownAcceleration  = 1.60f,     // rapid ability cycling
                UniqueAbility         = "EnergyTrap",
                Description           = "Tactical zone controller. Energy traps, area crowd-control, rapid ability cooldowns."
            }
        };

        // ─────────────────────────────────────────────────────────────────────
        private void Start() => ApplyArchetype(_startArchetype);

        // ─── Public API ───────────────────────────────────────────────────────

        /// <summary>Switch to a new archetype at runtime (character select, NG+).</summary>
        public void ApplyArchetype(CharacterArchetype archetype)
        {
            if (!Profiles.TryGetValue(archetype, out ArchetypeProfile profile))
            {
                Debug.LogError($"[Archetype] Unknown archetype: {archetype}");
                return;
            }

            _currentArchetype = archetype;
            _activeProfile    = profile;

            // Reset archetype-specific meters
            _scarCounterMeter  = 0f;
            _phaseCloneCount   = 0;
            _voltAirDashCharges = profile.AirDashCharges;
            _novaCooldownStacks = 0;

            // Push stat overrides to PlayerStatsManager via multiplier system
            ApplyStatOverrides(profile);

            OnArchetypeChanged?.Invoke(archetype, profile);
            OnSpecialAbilityUnlocked?.Invoke(profile.UniqueAbility);

            Debug.Log($"[Archetype] Activated: {profile.DisplayName}");
        }

        public CharacterArchetype CurrentArchetype => _currentArchetype;
        public ArchetypeProfile   ActiveProfile    => _activeProfile;

        // ─── SCAR — Counter Meter ─────────────────────────────────────────────

        /// <summary>Call when SCAR receives a hit to fill the counter meter.</summary>
        public void SCAR_OnHitReceived()
        {
            if (_currentArchetype != CharacterArchetype.SCAR) return;
            _scarCounterMeter = Mathf.Clamp01(_scarCounterMeter + SCAR_METER_PER_HIT);
            OnCounterMeterChanged?.Invoke(_scarCounterMeter);
        }

        /// <summary>Consume the full counter meter for a counter burst.</summary>
        public bool SCAR_TryActivateCounter()
        {
            if (_currentArchetype != CharacterArchetype.SCAR) return false;
            if (_scarCounterMeter < 0.99f) return false;
            _scarCounterMeter = 0f;
            OnCounterMeterChanged?.Invoke(0f);
            return true;
        }

        public float SCAR_CounterMeter => _scarCounterMeter;

        // ─── VOLT — Air Dash Charges ──────────────────────────────────────────

        public bool VOLT_TryConsumeAirDash()
        {
            if (_currentArchetype != CharacterArchetype.VOLT) return false;
            if (_voltAirDashCharges <= 0) return false;
            _voltAirDashCharges--;
            return true;
        }

        public void VOLT_RefillAirDashes()
        {
            // Called on landing
            _voltAirDashCharges = _activeProfile.AirDashCharges;
        }

        public int VOLT_AirDashCharges => _voltAirDashCharges;

        // ─── PHASE — Clone & Rear Critical ────────────────────────────────────

        public bool PHASE_TryDeployClone()
        {
            if (_currentArchetype != CharacterArchetype.PHASE) return false;
            if (!_activeProfile.HasCloneDecoy) return false;
            if (_phaseCloneCount >= PHASE_MAX_CLONES) return false;
            _phaseCloneCount++;
            OnCloneDeployed?.Invoke(_phaseCloneCount);
            return true;
        }

        public void PHASE_OnCloneDestroyed() =>
            _phaseCloneCount = Mathf.Max(0, _phaseCloneCount - 1);

        /// <summary>Returns the damage multiplier based on attack angle.</summary>
        public float PHASE_GetDamageMultiplier(Vector3 attackDirection, Vector3 targetForward)
        {
            if (!_activeProfile.HasRearCritical) return _activeProfile.DamageMultiplier;
            float dot = Vector3.Dot(attackDirection.normalized, targetForward.normalized);
            // dot < -0.5 means attacking from behind
            return dot < -0.5f
                ? _activeProfile.DamageMultiplier * 2.0f
                : _activeProfile.DamageMultiplier;
        }

        // ─── NOVA — Cooldown Acceleration ─────────────────────────────────────

        /// <summary>Get reduced cooldown duration for NOVA's acceleration.</summary>
        public float NOVA_ScaleCooldown(float baseCooldown)
        {
            if (_currentArchetype != CharacterArchetype.NOVA) return baseCooldown;
            return baseCooldown / _activeProfile.CooldownAcceleration;
        }

        // ─── Private ──────────────────────────────────────────────────────────

        private void ApplyStatOverrides(ArchetypeProfile p)
        {
            if (_stats == null) return;

            // Apply multipliers via the timed multiplier API (permanent = very long duration)
            const float PERM = 99999f;
            _stats.ApplyMultiplier("DMG_ARCHETYPE",  p.DamageMultiplier,  PERM);
            _stats.ApplyMultiplier("SPD_ARCHETYPE",  p.SpeedMultiplier,   PERM);
            _stats.ApplyMultiplier("DEF_ARCHETYPE",  p.DefenseMultiplier, PERM);
        }
    }

    // ─── Enums & Data ─────────────────────────────────────────────────────────

    public enum CharacterArchetype { SCAR, TITAN, VOLT, PHASE, NOVA }

    [Serializable]
    public class ArchetypeProfile
    {
        public string DisplayName;
        public string Description;
        public string UniqueAbility;

        [Header("Stats")]
        public float MaxHealth;
        public float MaxEnergy;
        public float EnergyRegen;
        public float DamageMultiplier;
        public float SpeedMultiplier;
        public float DefenseMultiplier;
        public float DashRecoveryScale;

        [Header("Combat Properties")]
        public int   HyperArmorStartFrames;
        public bool  HasInvisibilityDash;
        public bool  HasRearCritical;
        public bool  HasCloneDecoy;
        public bool  HasEnergyTraps;
        public int   AirDashCharges;
        public float CooldownAcceleration;
    }
}
