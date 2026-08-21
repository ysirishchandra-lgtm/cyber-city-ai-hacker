using System;
using UnityEngine;
using GameHack.Backend.Scoring;
using Scar.Audio;

namespace GameHack.Backend.Events
{
    /// <summary>
    /// Routes backend combat and ability events directly into the audio pipeline (AudioManager).
    /// Dynamically scales playback pitch based on the current anime StyleRank from StyleRatingSystem.
    /// Fully robust against missing AudioManager or missing components.
    /// </summary>
    public class CombatAudioDispatcher : MonoBehaviour
    {
        // ─── Events ───────────────────────────────────────────────────────────
        public static event Action<string, float> OnAudioCueDispatched; // cueKey, dynamicPitch

        // ─── Inspector Dependencies ───────────────────────────────────────────
        [Header("Dependencies")]
        [SerializeField] private CombatController3D _combatController;
        [SerializeField] private StyleRatingSystem  _styleRatingSystem;

        [Header("Pitch Scaling per Style Rank")]
        [SerializeField] private float _pitchRankD   = 1.00f;
        [SerializeField] private float _pitchRankC   = 1.05f;
        [SerializeField] private float _pitchRankB   = 1.10f;
        [SerializeField] private float _pitchRankA   = 1.15f;
        [SerializeField] private float _pitchRankS   = 1.22f;
        [SerializeField] private float _pitchRankSSS = 1.30f;

        // ─────────────────────────────────────────────────────────────────────

        private void OnEnable()
        {
            CombatEventBus.OnDamageImpactLanded += HandleDamageImpact;

            if (_combatController != null)
            {
                _combatController.OnAttackPhaseChanged += HandleAttackPhase;
                _combatController.OnAbilityUsed += HandleAbilityUsed;
            }
        }

        private void OnDisable()
        {
            CombatEventBus.OnDamageImpactLanded -= HandleDamageImpact;

            if (_combatController != null)
            {
                _combatController.OnAttackPhaseChanged -= HandleAttackPhase;
                _combatController.OnAbilityUsed -= HandleAbilityUsed;
            }
        }

        // ─── Event Handlers ───────────────────────────────────────────────────

        private void HandleDamageImpact(DamagePayload payload, Vector3 hitPoint)
        {
            float pitch = GetCurrentPitchMultiplier();

            if (payload.damageType == DamageType.Light)
            {
                DispatchCue("Hit_Light", pitch, () => AudioManager.Instance?.PlayLightSlash());
            }
            else if (payload.damageType == DamageType.Heavy || payload.damageType == DamageType.True)
            {
                DispatchCue("Hit_Heavy", pitch, () => AudioManager.Instance?.PlayHeavyImpact());
            }
            else if (payload.damageType == DamageType.Magic || payload.damageType == DamageType.Piercing)
            {
                DispatchCue("Energy_Clash", pitch, () => AudioManager.Instance?.PlayEnergyClash());
            }
        }

        private void HandleAttackPhase(AttackPhase phase)
        {
            if (phase == AttackPhase.Attack1 || phase == AttackPhase.Attack2 || phase == AttackPhase.Attack3)
            {
                DispatchCue("Dash_Whoosh", GetCurrentPitchMultiplier(), () => AudioManager.Instance?.PlayDashSwoosh());
            }
        }

        private void HandleAbilityUsed(string abilityID)
        {
            float pitch = GetCurrentPitchMultiplier();
            switch (abilityID)
            {
                case "FlashDash":
                case "ShadowBlink":
                case "VoidBlink":
                    DispatchCue("Void_Teleport", pitch, () => AudioManager.Instance?.PlayDashSwoosh());
                    break;
                case "TitanSlam":
                case "ShockwaveAoEBurst":
                    DispatchCue("Hit_Heavy", pitch, () => AudioManager.Instance?.PlayHeavyImpact());
                    break;
                default:
                    DispatchCue("Energy_Clash", pitch, () => AudioManager.Instance?.PlayEnergyClash());
                    break;
            }
        }

        public void DispatchParrySuccess()
        {
            DispatchCue("Parry_Success", 1.25f, () => AudioManager.Instance?.PlayEnergyClash());
        }

        public void DispatchClashImpact()
        {
            DispatchCue("Clash_Impact", 1.15f, () => AudioManager.Instance?.PlayEnergyClash());
        }

        // ─── Dispatch Core ────────────────────────────────────────────────────

        private void DispatchCue(string cueKey, float pitch, Action directAudioCall)
        {
            OnAudioCueDispatched?.Invoke(cueKey, pitch);
            directAudioCall?.Invoke();
        }

        private float GetCurrentPitchMultiplier()
        {
            if (_styleRatingSystem == null) return 1.0f;

            return _styleRatingSystem.CurrentRank switch
            {
                StyleRank.D   => _pitchRankD,
                StyleRank.C   => _pitchRankC,
                StyleRank.B   => _pitchRankB,
                StyleRank.A   => _pitchRankA,
                StyleRank.S   => _pitchRankS,
                StyleRank.SSS => _pitchRankSSS,
                _             => 1.0f
            };
        }
    }
}
