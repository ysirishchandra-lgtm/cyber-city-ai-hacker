using UnityEngine;
using Scar.Gameplay.Health;
using Scar.Gameplay.Combat;
using Scar.Core;

namespace Scar.Gameplay.Player
{
    [RequireComponent(typeof(HealthComponent))]
    public class PlayerHealth : MonoBehaviour
    {
        private HealthComponent _health;

        private void Awake()
        {
            _health = GetComponent<HealthComponent>();
            _health.OnDamage += HandleDamage;
            _health.OnDeath += HandleDeath;
        }

        private void OnDestroy()
        {
            if (_health != null)
            {
                _health.OnDamage -= HandleDamage;
                _health.OnDeath -= HandleDeath;
            }
        }

        private void HandleDamage(DamageData data)
        {
            EventBus.Instance.Publish(GameEvents.PLAYER_DAMAGED, new
            {
                amount = data.amount,
                health = _health.CurrentHealth,
                maxHealth = _health.MaxHealth
            });
        }

        private void HandleDeath()
        {
            EventBus.Instance.Publish(GameEvents.GAME_OVER, new { reason = "PLAYER_DIED" });
        }
    }
}
