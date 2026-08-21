using System;
using System.Collections;
using UnityEngine;

namespace GameHack.Backend.Events
{
    /// <summary>
    /// Centralized high-performance Combat & Impact Event Bus.
    /// Decouples backend combat math/logic from frontend camera shake,
    /// micro-hitstop freeze frames, impact flashes, and VFX sparks.
    /// </summary>
    public class CombatEventBus : MonoBehaviour
    {
        public static CombatEventBus Instance { get; private set; }

        // ─── Events ───────────────────────────────────────────────────────────
        public static event Action<float, float>               OnHitstopTriggered;       // duration, timeScale
        public static event Action<float, float>               OnCameraShakeTriggered;   // intensity, duration
        public static event Action<Vector3, DamageType>        OnImpactFlashTriggered;   // worldPos, type
        public static event Action<DamagePayload, Vector3>     OnDamageImpactLanded;     // payload, impactPoint
        public static event Action<Vector3, float>             OnRadialShockwave;        // origin, radius

        // ─── Hitstop Manager State ────────────────────────────────────────────
        private Coroutine _activeHitstopRoutine;
        private float     _originalTimeScale = 1.0f;

        // ─────────────────────────────────────────────────────────────────────

        private void Awake()
        {
            if (Instance == null)
            {
                Instance = this;
                DontDestroyOnLoad(gameObject);
                _originalTimeScale = Time.timeScale > 0 ? Time.timeScale : 1.0f;
            }
            else if (Instance != this)
            {
                Destroy(gameObject);
            }
        }

        // ─── Static Dispatch API ──────────────────────────────────────────────

        /// <summary>
        /// Dispatches a micro-freeze hitstop frame on heavy or critical hits.
        /// </summary>
        public static void TriggerHitstop(float duration = 0.08f, float timeScale = 0.05f)
        {
            OnHitstopTriggered?.Invoke(duration, timeScale);
            if (Instance != null)
            {
                Instance.ExecuteHitstop(duration, timeScale);
            }
        }

        /// <summary>
        /// Triggers screen/camera shake scaled by impact strength.
        /// </summary>
        public static void TriggerCameraShake(float intensity = 0.5f, float duration = 0.2f)
        {
            OnCameraShakeTriggered?.Invoke(intensity, duration);
        }

        /// <summary>
        /// Dispatches impact flash data for VFX / shader flashes at target location.
        /// </summary>
        public static void TriggerImpactFlash(Vector3 hitPosition, DamageType damageType)
        {
            OnImpactFlashTriggered?.Invoke(hitPosition, damageType);
        }

        /// <summary>
        /// Emits a full damage impact event with payload and world hit point.
        /// </summary>
        public static void TriggerDamageImpact(DamagePayload payload, Vector3 hitPoint)
        {
            OnDamageImpactLanded?.Invoke(payload, hitPoint);

            // Automatically compute proportionate hitstop & camera shake
            float shakeIntensity = Mathf.Clamp(payload.knockbackForce * 0.08f, 0.2f, 2.5f);
            float shakeDuration = Mathf.Clamp(payload.hitStunDuration * 0.6f, 0.1f, 0.5f);
            TriggerCameraShake(shakeIntensity, shakeDuration);

            // Heavy / True / Piercing damage triggers noticeable hitstop
            if (payload.damageType == DamageType.Heavy || payload.damageType == DamageType.True)
            {
                TriggerHitstop(0.09f, 0.03f);
            }
            else if (payload.damageType == DamageType.Light)
            {
                TriggerHitstop(0.04f, 0.15f);
            }

            TriggerImpactFlash(hitPoint, payload.damageType);
        }

        public static void TriggerShockwave(Vector3 origin, float radius)
        {
            OnRadialShockwave?.Invoke(origin, radius);
            TriggerCameraShake(1.2f, 0.35f);
        }

        // ─── Internal Hitstop Coroutine ───────────────────────────────────────

        private void ExecuteHitstop(float duration, float timeScale)
        {
            if (_activeHitstopRoutine != null)
            {
                StopCoroutine(_activeHitstopRoutine);
            }
            _activeHitstopRoutine = StartCoroutine(HitstopRoutine(duration, timeScale));
        }

        private IEnumerator HitstopRoutine(float duration, float targetScale)
        {
            Time.timeScale = targetScale;
            yield return new WaitForSecondsRealtime(duration);
            Time.timeScale = _originalTimeScale;
            _activeHitstopRoutine = null;
        }
    }
}
