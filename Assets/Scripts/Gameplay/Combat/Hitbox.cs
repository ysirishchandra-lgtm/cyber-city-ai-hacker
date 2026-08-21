using System.Collections.Generic;
using UnityEngine;

namespace Scar.Gameplay.Combat
{
    [RequireComponent(typeof(Collider))]
    public class Hitbox : MonoBehaviour
    {
        [SerializeField] private float baseDamage = 25f;
        [SerializeField] private DamageType damageType = DamageType.MELEE;
        [SerializeField] private float knockbackMagnitude = 5f;
        [SerializeField] private LayerMask targetLayers;

        private Collider _collider;
        private readonly HashSet<Hurtbox> _hitTargets = new();
        private GameObject _owner;

        private void Awake()
        {
            _collider = GetComponent<Collider>();
            _collider.isTrigger = true;
            _collider.enabled = false;
            _owner = transform.root.gameObject;
        }

        public void EnableHitbox()
        {
            _hitTargets.Clear();
            _collider.enabled = true;
        }

        public void DisableHitbox()
        {
            _collider.enabled = false;
            _hitTargets.Clear();
        }

        private void OnTriggerEnter(Collider other)
        {
            if (((1 << other.gameObject.layer) & targetLayers) == 0) return;

            var hurtbox = other.GetComponent<Hurtbox>();
            if (hurtbox != null && !_hitTargets.Contains(hurtbox))
            {
                _hitTargets.Add(hurtbox);
                Vector3 knockbackDir = (other.transform.position - transform.position).normalized;
                knockbackDir.y = 0.2f;

                var data = new DamageData(
                    baseDamage,
                    damageType,
                    _owner,
                    knockbackDir * knockbackMagnitude
                );

                hurtbox.ReceiveDamage(data);
            }
        }
    }
}
