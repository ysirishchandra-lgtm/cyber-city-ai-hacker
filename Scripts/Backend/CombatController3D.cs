using System;
using System.Collections.Generic;
using UnityEngine;

namespace GameHack.Backend
{
    /// <summary>
    /// 3D Combat Controller: Input buffering, 3-hit combo state machine, and energy-gated abilities.
    /// Fully logic-driven — fires animation event callbacks instead of calling Animator directly.
    /// </summary>
    public class CombatController3D : MonoBehaviour
    {
        // ─── Events (consumed by AnimationBridge / VFX layers) ────────────────
        public event Action<AttackPhase> OnAttackPhaseChanged;
        public event Action             OnComboCompleted;
        public event Action             OnRecoveryStarted;
        public event Action<string>     OnAbilityUsed;       // abilityID
        public event Action<string>     OnAbilityDenied;     // reason

        // ─── Inspector Config ─────────────────────────────────────────────────
        [Header("Input Buffer")]
        [SerializeField] private float _inputBufferWindow = 0.25f;  // seconds

        [Header("Attack State Durations (seconds)")]
        [SerializeField] private float _attack1Duration  = 0.35f;
        [SerializeField] private float _attack2Duration  = 0.40f;
        [SerializeField] private float _attack3Duration  = 0.50f;
        [SerializeField] private float _recoveryDuration = 0.45f;

        [Header("Cancel Windows (ratio of attack duration)")]
        [SerializeField] [Range(0f,1f)] private float _cancelWindowStart = 0.55f; // 55% through attack
        [SerializeField] [Range(0f,1f)] private float _cancelWindowEnd   = 0.90f; // 90% through attack

        [Header("Energy Costs")]
        [SerializeField] private float _flashDashCost = 25f;
        [SerializeField] private float _specialAbilityCost = 40f;

        // ─── Dependencies ─────────────────────────────────────────────────────
        [SerializeField] private PlayerStatsManager _stats;
        [SerializeField] private AdaptiveCombatTelemetry _telemetry;
        [SerializeField] private GameStateController _gameState;

        // ─── Runtime State ────────────────────────────────────────────────────
        private AttackPhase _currentPhase   = AttackPhase.Idle;
        private float       _phaseTimer     = 0f;
        private float       _phaseDuration  = 0f;
        private bool        _inputBuffered  = false;
        private float       _bufferTimer    = 0f;
        private int         _comboStep      = 0;  // 0=Idle, 1=Atk1, 2=Atk2, 3=Atk3

        // ─────────────────────────────────────────────────────────────────────

        private void Update()
        {
            float dt = Time.deltaTime;
            TickPhaseTimer(dt);
            TickInputBuffer(dt);
        }

        // ─── Public Combat API ────────────────────────────────────────────────

        /// <summary>Called by input handler when Attack button is pressed.</summary>
        public void RequestAttack()
        {
            if (_stats.CurrentState == PlayerState.Dead   ||
                _stats.CurrentState == PlayerState.Stunned) return;

            if (_currentPhase == AttackPhase.Idle || IsInCancelWindow())
            {
                ExecuteNextComboStep();
            }
            else
            {
                // Buffer the input for seamless chain
                _inputBuffered = true;
                _bufferTimer   = _inputBufferWindow;
            }
        }

        /// <summary>Flash Dash — energy-gated dash attack.</summary>
        public bool RequestFlashDash()
        {
            if (!_stats.IsReady("FlashDash"))
            {
                OnAbilityDenied?.Invoke("FlashDash on cooldown");
                return false;
            }
            if (!_stats.TrySpendEnergy(_flashDashCost))
            {
                OnAbilityDenied?.Invoke("Insufficient energy for FlashDash");
                return false;
            }

            _stats.StartCooldown("FlashDash", 3.0f);
            _telemetry?.LogAbility("FlashDash");
            _telemetry?.LogDash();
            OnAbilityUsed?.Invoke("FlashDash");
            return true;
        }

        /// <summary>Generic special ability with energy validation.</summary>
        public bool RequestSpecialAbility(string abilityID, float customCost = -1f)
        {
            float cost = customCost > 0 ? customCost : _specialAbilityCost;

            if (!_stats.IsReady(abilityID))
            {
                OnAbilityDenied?.Invoke($"{abilityID} on cooldown");
                return false;
            }
            if (!_stats.TrySpendEnergy(cost))
            {
                OnAbilityDenied?.Invoke($"Insufficient energy for {abilityID}");
                return false;
            }

            _stats.StartCooldown(abilityID, 5.0f);
            _telemetry?.LogAbility(abilityID);
            OnAbilityUsed?.Invoke(abilityID);
            return true;
        }

        /// <summary>Interrupt combo on stun or hit-received.</summary>
        public void InterruptCombo()
        {
            _comboStep      = 0;
            _inputBuffered  = false;
            _bufferTimer    = 0f;
            SetPhase(AttackPhase.Idle, 0f);
        }

        // ─── Combo State Machine ──────────────────────────────────────────────

        private void ExecuteNextComboStep()
        {
            _comboStep++;
            if (_comboStep > 3) _comboStep = 1; // wrap after combo3

            switch (_comboStep)
            {
                case 1:
                    SetPhase(AttackPhase.Attack1, _attack1Duration);
                    _telemetry?.LogMelee();
                    break;
                case 2:
                    SetPhase(AttackPhase.Attack2, _attack2Duration);
                    _telemetry?.LogMelee();
                    break;
                case 3:
                    SetPhase(AttackPhase.Attack3, _attack3Duration);
                    _telemetry?.LogMelee();
                    break;
            }
            _stats.TransitionState(PlayerState.Attacking);
            _gameState?.RegisterHit();
            _inputBuffered = false;
            _bufferTimer   = 0f;
        }

        private void OnPhaseComplete()
        {
            if (_currentPhase == AttackPhase.Recovery)
            {
                _comboStep = 0;
                SetPhase(AttackPhase.Idle, 0f);
                _stats.TransitionState(PlayerState.Idle);
                return;
            }

            if (_currentPhase == AttackPhase.Attack3)
            {
                OnComboCompleted?.Invoke();
                EnterRecovery();
                return;
            }

            // Auto-advance if input was buffered
            if (_inputBuffered)
            {
                _inputBuffered = false;
                ExecuteNextComboStep();
            }
            else
            {
                // Wait in idle-ish state; combo resets after a short grace
                SetPhase(AttackPhase.Idle, 0f);
                _stats.TransitionState(PlayerState.Idle);
                _comboStep = 0;
            }
        }

        private void EnterRecovery()
        {
            SetPhase(AttackPhase.Recovery, _recoveryDuration);
            OnRecoveryStarted?.Invoke();
        }

        private void SetPhase(AttackPhase phase, float duration)
        {
            _currentPhase  = phase;
            _phaseTimer    = 0f;
            _phaseDuration = duration;
            OnAttackPhaseChanged?.Invoke(phase);
        }

        // ─── Helpers ──────────────────────────────────────────────────────────

        private bool IsInCancelWindow()
        {
            if (_phaseDuration <= 0f) return false;
            float ratio = _phaseTimer / _phaseDuration;
            return ratio >= _cancelWindowStart && ratio <= _cancelWindowEnd;
        }

        private void TickPhaseTimer(float dt)
        {
            if (_currentPhase == AttackPhase.Idle) return;

            _phaseTimer += dt;
            if (_phaseTimer >= _phaseDuration)
                OnPhaseComplete();
        }

        private void TickInputBuffer(float dt)
        {
            if (!_inputBuffered) return;
            _bufferTimer -= dt;
            if (_bufferTimer <= 0f)
            {
                _inputBuffered = false;
                _bufferTimer   = 0f;
            }
        }
    }

    public enum AttackPhase
    {
        Idle,
        Attack1,
        Attack2,
        Attack3,
        Recovery
    }
}
