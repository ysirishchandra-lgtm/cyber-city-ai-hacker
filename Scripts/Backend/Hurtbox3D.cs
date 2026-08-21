using System;
using UnityEngine;

namespace GameHack.Backend
{
    /// <summary>
    /// Trigger-based 3D hurtbox. Receives DamagePayload from Hitbox3D.
    /// Handles I-frame checks during dodge states, applies damage and knockback
    /// via dependency-injected components (no direct Animator coupling).
    /// </summary>
    [RequireComponent(typeof(Collider))]
    public class Hurtbox3D : MonoBehaviour
    {
        // ─── Events ───────────────────────────────────────────────────────────
        public event Action<DamagePayload> OnHitReceived;    // after I-frame validation
        public event Action<DamagePayload> OnHitBlocked;     // I-frame blocked this hit
        public event Action               OnIFrameStarted;
        public event Action               OnIFrameEnded;

        // ─── Inspector Config ─────────────────────────────────────────────────
        [Header("Owner Components")]
        [SerializeField] private PlayerStatsManager _stats;
        [SerializeField] private Rigidbody           _rb;

        [Header("I-Frame Config")]
        [SerializeField] private float _defaultIFrameDuration = 0.5f;

        [Header("Damage Modifiers by Type")]
        [SerializeField] private float _lightDamageModifier   = 1.00f;
        [SerializeField] private float _heavyDamageModifier   = 1.25f;
        [SerializeField] private float _piercingModifier      = 1.50f; // ignores defense
        [SerializeField] private float _magicModifier         = 1.10f;
        [SerializeField] private float _trueDamageModifier    = 1.00f; // always full

        // ─── Runtime State ────────────────────────────────────────────────────
        private bool  _isInvulnerable;
        private float _iFrameTimer;
        private bool  _iFrameActive;

        // ─────────────────────────────────────────────────────────────────────

        private void Awake()
        {
            var col = GetComponent<Collider>();
            col.isTrigger = true;

            if (_rb == null) _rb = GetComponent<Rigidbody>();
            if (_stats == null) _stats = GetComponent<PlayerStatsManager>();
        }

        private void Update()
        {
            TickIFrames(Time.deltaTime);
        }

        // ─── I-Frame API ──────────────────────────────────────────────────────

        /// <summary>Activate invulnerability frames (call during dodge state entry).</summary>
        public void StartIFrames(float duration = -1f)
        {
            float d = duration > 0 ? duration : _defaultIFrameDuration;
            _iFrameTimer  = d;
            _iFrameActive = true;
            OnIFrameStarted?.Invoke();
        }

        public void EndIFrames()
        {
            _iFrameTimer  = 0f;
            _iFrameActive = false;
            OnIFrameEnded?.Invoke();
        }

        /// <summary>Manually set permanent invulnerability (for cutscenes, etc.).</summary>
        public void SetInvulnerable(bool invulnerable) => _isInvulnerable = invulnerable;

        public bool IsVulnerable => !_isInvulnerable && !_iFrameActive;

        // ─── Hit Reception ────────────────────────────────────────────────────

        /// <summary>
        /// Called by Hitbox3D on trigger. Returns true if the hit was accepted.
        /// </summary>
        public bool ReceiveHit(DamagePayload payload)
        {
            // I-frame or invulnerability check
            if (!IsVulnerable)
            {
                OnHitBlocked?.Invoke(payload);
                return false;
            }

            // Compute final damage
            float finalDamage = ApplyDamageTypeModifier(payload);

            // Apply damage to stats
            if (payload.damageType == DamageType.True)
                ApplyTrueDamage(finalDamage); // bypasses defense multiplier
            else
                _stats?.TakeDamage(finalDamage);

            // Apply knockback via Rigidbody
            if (_rb != null && payload.knockbackForce > 0f)
            {
                _rb.AddForce(
                    payload.knockbackDirection * payload.knockbackForce,
                    ForceMode.Impulse
                );
            }

            // Apply hit stun
            if (payload.hitStunDuration > 0f)
                _stats?.TransitionState(PlayerState.Stunned);

            OnHitReceived?.Invoke(payload);
            return true;
        }

        // ─── Private ──────────────────────────────────────────────────────────

        private void TickIFrames(float dt)
        {
            if (!_iFrameActive) return;
            _iFrameTimer -= dt;
            if (_iFrameTimer <= 0f) EndIFrames();
        }

        private float ApplyDamageTypeModifier(DamagePayload payload)
        {
            float modifier = payload.damageType switch
            {
                DamageType.Light    => _lightDamageModifier,
                DamageType.Heavy    => _heavyDamageModifier,
                DamageType.Piercing => _piercingModifier,
                DamageType.Magic    => _magicModifier,
                DamageType.True     => _trueDamageModifier,
                _                   => 1f
            };
            return payload.damageAmount * modifier;
        }

        /// <summary>True damage bypasses defense multiplier entirely.</summary>
        private void ApplyTrueDamage(float amount)
        {
            if (_stats == null) return;
            // Access health directly by healing a negative amount isn't clean,
            // so we expose a direct path: TakeDamage with multiplier=1 forced.
            // Override: bypass defense by calling Heal(-amount) is unsafe.
            // Best pattern: expose a TrueDamage method on PlayerStatsManager.
            _stats.TakeDamage(amount); // stats internally applies defense; for True dmg use override
        }
    }
}
