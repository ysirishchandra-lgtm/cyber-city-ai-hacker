using System;
using UnityEngine;
using Scar.Gameplay.Combat;

namespace Scar.Gameplay.Health
{
    public class HealthComponent : MonoBehaviour
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

        public void TakeDamage(DamageData damageData)
        {
            if (_isDead || damageData == null || damageData.amount <= 0f) return;

            CurrentHealth = Mathf.Max(0f, CurrentHealth - damageData.amount);
            OnDamage?.Invoke(damageData);
            OnHealthChanged?.Invoke(CurrentHealth, maxHealth);

            if (CurrentHealth <= 0f && !_isDead)
            {
                Die();
            }
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
