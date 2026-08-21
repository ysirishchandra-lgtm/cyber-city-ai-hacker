using System;
using UnityEngine;

namespace GameHack.Backend
{
    // ─── Shared Data Structures ───────────────────────────────────────────────

    public enum DamageType { Light, Heavy, Piercing, Magic, True }

    /// <summary>
    /// Standardized damage payload passed from Hitbox to Hurtbox on collision.
    /// Fully serializable and decoupled from animation state.
    /// </summary>
    public struct DamagePayload
    {
        public float      damageAmount;
        public float      hitStunDuration;
        public Vector3    knockbackDirection;
        public float      knockbackForce;
        public DamageType damageType;
        public GameObject attacker;
    }

    // ─── Hitbox3D ─────────────────────────────────────────────────────────────

    /// <summary>
    /// Trigger-based 3D hitbox. Attach to sword, fist, projectile, or AoE zone.
    /// Fires OnHitLanded event with a fully-configured DamagePayload.
    /// Enable/disable via CombatController3D animation event callbacks.
    /// </summary>
    [RequireComponent(typeof(Collider))]
    public class Hitbox3D : MonoBehaviour
    {
        // ─── Events ───────────────────────────────────────────────────────────
        public event Action<Hurtbox3D, DamagePayload> OnHitLanded;

        // ─── Inspector Config ─────────────────────────────────────────────────
        [Header("Damage Config")]
        [SerializeField] private float      _baseDamage       = 20f;
        [SerializeField] private float      _hitStunDuration  = 0.3f;
        [SerializeField] private float      _knockbackForce   = 8f;
        [SerializeField] private DamageType _damageType       = DamageType.Light;
        [SerializeField] private LayerMask  _targetLayers;

        [Header("Owner")]
        [SerializeField] private GameObject _owner; // attacker reference

        [Header("Multi-Hit Prevention")]
        [SerializeField] private float      _hitCooldown      = 0.15f; // sec between hits per target

        // ─── Runtime ─────────────────────────────────────────────────────────
        private bool _isActive;
        private readonly System.Collections.Generic.Dictionary<Collider, float> _hitTimestamps
            = new System.Collections.Generic.Dictionary<Collider, float>();

        // ─────────────────────────────────────────────────────────────────────

        private void Awake()
        {
            var col = GetComponent<Collider>();
            col.isTrigger = true;
            SetActive(false);
        }

        public void SetActive(bool active)
        {
            _isActive = active;
            if (!active) _hitTimestamps.Clear();
        }

        /// <summary>Stamp the owner reference (set by CombatController3D).</summary>
        public void SetOwner(GameObject owner) => _owner = owner;

        /// <summary>Override damage for special attacks.</summary>
        public void SetDamageOverride(float damage, DamageType type)
        {
            _baseDamage  = damage;
            _damageType  = type;
        }

        private void OnTriggerEnter(Collider other)
        {
            if (!_isActive) return;
            if ((_targetLayers.value & (1 << other.gameObject.layer)) == 0) return;

            // Multi-hit cooldown check
            float now = Time.time;
            if (_hitTimestamps.TryGetValue(other, out float lastHit))
                if (now - lastHit < _hitCooldown) return;
            _hitTimestamps[other] = now;

            Hurtbox3D hurtbox = other.GetComponent<Hurtbox3D>();
            if (hurtbox == null) return;

            // Calculate knockback direction from this hitbox toward target
            Vector3 dir = (other.transform.position - transform.position).normalized;
            if (dir == Vector3.zero) dir = transform.forward;

            var payload = new DamagePayload
            {
                damageAmount       = _baseDamage,
                hitStunDuration    = _hitStunDuration,
                knockbackDirection = dir,
                knockbackForce     = _knockbackForce,
                damageType         = _damageType,
                attacker           = _owner
            };

            // Let the hurtbox decide if it accepts the hit (I-frame check inside)
            bool accepted = hurtbox.ReceiveHit(payload);
            if (accepted)
                OnHitLanded?.Invoke(hurtbox, payload);
        }
    }
}
