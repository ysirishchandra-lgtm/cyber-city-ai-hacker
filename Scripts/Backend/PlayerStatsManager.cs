using System;
using System.Collections.Generic;
using UnityEngine;

namespace GameHack.Backend
{
    /// <summary>
    /// Manages all real-time player stats: Health, Energy/Stamina, Active Multipliers,
    /// and Cooldown timers. Exposes event-driven delegates so UI can subscribe without polling.
    /// Fully decoupled from visual rendering — no Animator references.
    /// </summary>
    public class PlayerStatsManager : MonoBehaviour
    {
        // ─── Events ───────────────────────────────────────────────────────────
        public event Action<float, float> OnHealthChanged;   // (currentHP, maxHP)
        public event Action<float, float> OnEnergyChanged;   // (currentEnergy, maxEnergy)
        public event Action<PlayerState>  OnStateChanged;    // new state

        // ─── Inspector Config ─────────────────────────────────────────────────
        [Header("Health")]
        [SerializeField] private float _maxHealth    = 100f;
        [SerializeField] private float _regenRate    = 0f;   // HP/sec, 0 = no regen

        [Header("Energy / Stamina")]
        [SerializeField] private float _maxEnergy    = 100f;
        [SerializeField] private float _energyRegen  = 15f;  // Energy/sec when not spending

        [Header("Multipliers")]
        [SerializeField] private float _damageMultiplier  = 1f;
        [SerializeField] private float _speedMultiplier   = 1f;
        [SerializeField] private float _defenseMultiplier = 1f;

        // ─── Runtime State ────────────────────────────────────────────────────
        private float _currentHealth;
        private float _currentEnergy;
        private PlayerState _currentState = PlayerState.Idle;

        // Cooldown registry: abilityID → remaining seconds
        private readonly Dictionary<string, float> _cooldowns = new Dictionary<string, float>();

        // Active multiplier timers: multiplierType → (value, timeRemaining)
        private readonly Dictionary<string, (float value, float duration)> _activeMultipliers
            = new Dictionary<string, (float, float)>();

        // ─── Properties ──────────────────────────────────────────────────────
        public float CurrentHealth   => _currentHealth;
        public float MaxHealth       => _maxHealth;
        public float HealthRatio     => _currentHealth / _maxHealth;

        public float CurrentEnergy   => _currentEnergy;
        public float MaxEnergy       => _maxEnergy;
        public float EnergyRatio     => _currentEnergy / _maxEnergy;

        public float DamageMultiplier  => _damageMultiplier;
        public float SpeedMultiplier   => _speedMultiplier;
        public float DefenseMultiplier => _defenseMultiplier;

        public PlayerState CurrentState => _currentState;

        // ─────────────────────────────────────────────────────────────────────
        private void Awake()
        {
            _currentHealth = _maxHealth;
            _currentEnergy = _maxEnergy;
        }

        private void Update()
        {
            float dt = Time.deltaTime;
            TickRegen(dt);
            TickCooldowns(dt);
            TickMultipliers(dt);
        }

        // ─── Health API ───────────────────────────────────────────────────────

        /// <summary>Apply damage after defense multiplier scaling.</summary>
        public void TakeDamage(float rawDamage)
        {
            float mitigated = rawDamage / Mathf.Max(_defenseMultiplier, 0.01f);
            _currentHealth = Mathf.Clamp(_currentHealth - mitigated, 0f, _maxHealth);
            OnHealthChanged?.Invoke(_currentHealth, _maxHealth);

            if (_currentHealth <= 0f)
                TransitionState(PlayerState.Dead);
        }

        /// <summary>Restore HP up to max.</summary>
        public void Heal(float amount)
        {
            _currentHealth = Mathf.Clamp(_currentHealth + amount, 0f, _maxHealth);
            OnHealthChanged?.Invoke(_currentHealth, _maxHealth);
        }

        // ─── Energy API ───────────────────────────────────────────────────────

        /// <summary>Returns true and deducts cost if energy is sufficient.</summary>
        public bool TrySpendEnergy(float cost)
        {
            if (_currentEnergy < cost) return false;
            _currentEnergy = Mathf.Max(0f, _currentEnergy - cost);
            OnEnergyChanged?.Invoke(_currentEnergy, _maxEnergy);
            return true;
        }

        public void RestoreEnergy(float amount)
        {
            _currentEnergy = Mathf.Clamp(_currentEnergy + amount, 0f, _maxEnergy);
            OnEnergyChanged?.Invoke(_currentEnergy, _maxEnergy);
        }

        // ─── Cooldown API ─────────────────────────────────────────────────────

        /// <summary>Start cooldown for an ability.</summary>
        public void StartCooldown(string abilityID, float duration)
        {
            _cooldowns[abilityID] = duration;
        }

        /// <summary>Returns true when the ability is off cooldown.</summary>
        public bool IsReady(string abilityID)
        {
            return !_cooldowns.ContainsKey(abilityID) || _cooldowns[abilityID] <= 0f;
        }

        public float GetCooldownRemaining(string abilityID)
        {
            return _cooldowns.TryGetValue(abilityID, out float t) ? Mathf.Max(0f, t) : 0f;
        }

        // ─── Multiplier API ───────────────────────────────────────────────────

        /// <summary>Apply a timed stat multiplier (stacks multiplicatively).</summary>
        public void ApplyMultiplier(string type, float value, float duration)
        {
            _activeMultipliers[type] = (value, duration);
            RecalculateMultipliers();
        }

        // ─── State Machine ────────────────────────────────────────────────────

        public void TransitionState(PlayerState newState)
        {
            if (_currentState == newState) return;
            _currentState = newState;
            OnStateChanged?.Invoke(newState);
        }

        // ─── Private Ticks ────────────────────────────────────────────────────

        private void TickRegen(float dt)
        {
            if (_currentState == PlayerState.Dead) return;

            if (_regenRate > 0f)
                Heal(_regenRate * dt);

            if (_currentState != PlayerState.Attacking)
            {
                float regen = _energyRegen * dt;
                if (_currentEnergy < _maxEnergy)
                {
                    _currentEnergy = Mathf.Clamp(_currentEnergy + regen, 0f, _maxEnergy);
                    OnEnergyChanged?.Invoke(_currentEnergy, _maxEnergy);
                }
            }
        }

        private void TickCooldowns(float dt)
        {
            var keys = new List<string>(_cooldowns.Keys);
            foreach (var key in keys)
            {
                _cooldowns[key] -= dt;
                if (_cooldowns[key] <= 0f)
                    _cooldowns.Remove(key);
            }
        }

        private void TickMultipliers(float dt)
        {
            bool dirty = false;
            var keys = new List<string>(_activeMultipliers.Keys);
            foreach (var key in keys)
            {
                var (val, dur) = _activeMultipliers[key];
                dur -= dt;
                if (dur <= 0f)
                {
                    _activeMultipliers.Remove(key);
                    dirty = true;
                }
                else
                {
                    _activeMultipliers[key] = (val, dur);
                }
            }
            if (dirty) RecalculateMultipliers();
        }

        private void RecalculateMultipliers()
        {
            _damageMultiplier  = 1f;
            _speedMultiplier   = 1f;
            _defenseMultiplier = 1f;

            foreach (var kvp in _activeMultipliers)
            {
                if (kvp.Key.StartsWith("DMG"))  _damageMultiplier  *= kvp.Value.value;
                if (kvp.Key.StartsWith("SPD"))  _speedMultiplier   *= kvp.Value.value;
                if (kvp.Key.StartsWith("DEF"))  _defenseMultiplier *= kvp.Value.value;
            }
        }
    }

    public enum PlayerState
    {
        Idle,
        Moving,
        Attacking,
        Dodging,
        Stunned,
        Dead
    }
}
