using UnityEngine;
using Scar.Gameplay.Health;

namespace Scar.Gameplay.Combat
{
    [RequireComponent(typeof(Collider))]
    public class Hurtbox : MonoBehaviour
    {
        [SerializeField] private HealthComponent healthComponent;
        [SerializeField] private bool isInvulnerable = false;

        public HealthComponent Health => healthComponent;

        private void Awake()
        {
            if (healthComponent == null)
            {
                healthComponent = GetComponentInParent<HealthComponent>();
            }
        }

        public void SetInvulnerable(bool invulnerable)
        {
            isInvulnerable = invulnerable;
        }

        public bool ReceiveDamage(DamageData damageData)
        {
            if (isInvulnerable || healthComponent == null || !healthComponent.IsAlive)
            {
                return false;
            }

            healthComponent.TakeDamage(damageData);
            return true;
        }
    }
}
