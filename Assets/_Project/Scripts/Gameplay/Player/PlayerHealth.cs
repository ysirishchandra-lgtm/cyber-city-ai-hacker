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
            if (_health != null)
            {
                _health.OnDamaged += HandleDamage;
                _health.OnDeath += HandleDeath;
            }
        }

        private void OnDestroy()
        {
            if (_health != null)
            {
                _health.OnDamaged -= HandleDamage;
                _health.OnDeath -= HandleDeath;
            }
        }

        private void HandleDamage(DamageData data)
        {
            float amount = data != null ? data.amount : 0f;
            string source = data != null && data.attacker != null ? data.attacker.name : "Unknown";

            var damagedEvent = new GameEvents.PlayerDamagedEvent();
            damagedEvent.DamageAmount = amount;
            damagedEvent.RemainingHealth = _health != null ? _health.CurrentHealth : 0f;
            damagedEvent.DamageSource = source;
            EventBus.Publish(damagedEvent);

            if (GameManager.Instance != null && GameManager.Instance.State != null)
            {
                GameManager.Instance.State.ApplyDamage(amount, source);
            }
        }

        private void HandleDeath()
        {
            var gameOverEvent = new GameEvents.GameOverEvent();
            gameOverEvent.CauseOfDeath = "PLAYER_DIED";
            gameOverEvent.FinalScore = GameManager.Instance != null && GameManager.Instance.State != null ? GameManager.Instance.State.Score : 0;
            EventBus.Publish(gameOverEvent);
        }
    }
}
