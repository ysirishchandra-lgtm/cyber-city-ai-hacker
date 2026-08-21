using UnityEngine;
using Scar.Gameplay.Combat;
using Scar.Core;

namespace Scar.Gameplay.Player
{
    public class PlayerCombat : MonoBehaviour
    {
        [Header("Combat Config")]
        [SerializeField] private PlayerStats stats;
        [SerializeField] private Hitbox meleeHitbox;

        private float _attackCooldownTimer;
        private bool _isAttacking;

        public bool IsAttacking => _isAttacking;

        private void Awake()
        {
            if (stats == null)
            {
                stats = ScriptableObject.CreateInstance<PlayerStats>();
            }
        }

        private void Update()
        {
            if (_attackCooldownTimer > 0f)
            {
                _attackCooldownTimer -= Time.deltaTime;
                if (_attackCooldownTimer <= 0f)
                {
                    _isAttacking = false;
                    if (meleeHitbox != null) meleeHitbox.DisableHitbox();
                }
            }
        }

        public bool TryLightAttack()
        {
            if (_attackCooldownTimer > 0f) return false;

            _isAttacking = true;
            _attackCooldownTimer = stats.attackCooldown;

            if (meleeHitbox != null)
            {
                meleeHitbox.EnableHitbox();
            }

            EventBus.Instance.Publish(GameEvents.COMBAT_STARTED, new { attacker = gameObject, type = "LIGHT_ATTACK" });
            return true;
        }
    }
}
