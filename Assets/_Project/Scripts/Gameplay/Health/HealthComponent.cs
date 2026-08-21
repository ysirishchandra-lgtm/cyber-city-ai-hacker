using System;
using UnityEngine;
using Scar.Core;
using Scar.Gameplay.Combat;

namespace Scar.Gameplay.Health
{
    public class HealthComponent : MonoBehaviour, IDamageable
    {
        [Header("Health Settings")]
        [SerializeField] private float maxHealth = 100f;
        private float _currentHealth = 100f;
        private bool _isDead = false;

        public float MaxHealth { get { return maxHealth; } }
        public float CurrentHealth { get { return _currentHealth; } }
        public bool IsAlive { get { return _currentHealth > 0f && !_isDead; } }

        public event Action<DamageData> OnDamaged;
        public event Action<float, float> OnHealthChanged; // current, max
        public event Action OnDeath;

        private void Awake()
        {
            _currentHealth = maxHealth;
        }

        public void Initialize(float health)
        {
            maxHealth = health;
            _currentHealth = health;
            _isDead = false;
            if (OnHealthChanged != null) OnHealthChanged(_currentHealth, maxHealth);
        }

        public void TakeDamage(float amount, string damageSource)
        {
            if (_isDead || amount <= 0f) return;

            _currentHealth = Mathf.Max(0f, _currentHealth - amount);
            var data = new DamageData(amount, DamageType.MELEE, null, Vector3.zero);
            if (OnDamaged != null) OnDamaged(data);
            if (OnHealthChanged != null) OnHealthChanged(_currentHealth, maxHealth);

            if (_currentHealth <= 0f && !_isDead)
            {
                Die();
            }
        }

        public void TakeDamage(DamageData damageData)
        {
            if (damageData == null) return;
            TakeDamage(damageData.amount, damageData.type.ToString());
        }

        public void Heal(float amount)
        {
            if (_isDead || amount <= 0f) return;

            _currentHealth = Mathf.Min(maxHealth, _currentHealth + amount);
            if (OnHealthChanged != null) OnHealthChanged(_currentHealth, maxHealth);
        }

        public void Die()
        {
            if (_isDead) return;
            _isDead = true;
            _currentHealth = 0f;
            if (OnDeath != null) OnDeath();
        }
    }
}
