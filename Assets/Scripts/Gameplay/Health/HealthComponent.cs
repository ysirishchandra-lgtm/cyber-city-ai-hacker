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
        
        public float MaxHealth => maxHealth;
        public float CurrentHealth { get; private set; }
        public bool IsAlive => CurrentHealth > 0f;

        public event Action<DamageData> OnDamage;
        public event Action<float, float> OnHealthChanged; // current, max
        public event Action OnDeath;

        private bool _isDead = false;

        private void Awake()
        {
            CurrentHealth = maxHealth;
        }

        public void Initialize(float health)
        {
            maxHealth = health;
            CurrentHealth = health;
            _isDead = false;
            OnHealthChanged?.Invoke(CurrentHealth, maxHealth);
        }

        public void TakeDamage(float amount, string damageSource = "Unknown")
        {
            if (_isDead || amount <= 0f) return;

            CurrentHealth = Mathf.Max(0f, CurrentHealth - amount);
            var data = new DamageData(amount, DamageType.MELEE, null);
            OnDamage?.Invoke(data);
            OnHealthChanged?.Invoke(CurrentHealth, maxHealth);

            if (CurrentHealth <= 0f && !_isDead)
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

            CurrentHealth = Mathf.Min(maxHealth, CurrentHealth + amount);
            OnHealthChanged?.Invoke(CurrentHealth, maxHealth);
        }

        public void Die()
        {
            if (_isDead) return;
            _isDead = true;
            CurrentHealth = 0f;
            OnDeath?.Invoke();
        }
    }
}
