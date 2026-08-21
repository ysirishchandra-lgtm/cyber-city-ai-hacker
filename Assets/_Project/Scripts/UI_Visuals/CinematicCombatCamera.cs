using UnityEngine;
using Unity.Cinemachine;
using System.Collections;

namespace Scar.UI_Visuals
{
    public class CinematicCombatCamera : MonoBehaviour
    {
        public static CinematicCombatCamera Instance { get; private set; }

        [Header("Cinemachine References")]
        [SerializeField] private CinemachineCamera _virtualCamera;
        [SerializeField] private CinemachineImpulseSource _impulseSource;

        private float _baseFOV = 60f;
        private Coroutine _fovCoroutine;

        private void Awake()
        {
            if (Instance == null) Instance = this;
            else Destroy(gameObject);

            if (_virtualCamera != null)
            {
                _baseFOV = _virtualCamera.Lens.FieldOfView;
            }
            if (_impulseSource == null)
            {
                _impulseSource = GetComponent<CinemachineImpulseSource>();
            }
        }

        public void TriggerFinisherZoom()
        {
            if (_fovCoroutine != null) StopCoroutine(_fovCoroutine);
            _fovCoroutine = StartCoroutine(AnimateFOV(48f, 0.05f, 0.2f));
        }

        public void TriggerDashFOV()
        {
            if (_fovCoroutine != null) StopCoroutine(_fovCoroutine);
            _fovCoroutine = StartCoroutine(AnimateFOV(72f, 0.1f, 0.3f));
        }
        
        public void ResetFOV()
        {
            if (_fovCoroutine != null) StopCoroutine(_fovCoroutine);
            _fovCoroutine = StartCoroutine(AnimateFOV(_baseFOV, 0.15f, 0f));
        }

        public void TriggerCombatShake(float forceMultiplier = 1f)
        {
            if (_impulseSource != null)
            {
                _impulseSource.GenerateImpulse(Vector3.down * forceMultiplier);
            }
            else
            {
                // Fallback shake
                Debug.Log($"[CinematicCombatCamera] Shake triggered (Multiplier: {forceMultiplier})");
            }
        }

        private IEnumerator AnimateFOV(float targetFOV, float attackDuration, float holdDuration)
        {
            if (_virtualCamera == null) yield break;

            float startFOV = _virtualCamera.Lens.FieldOfView;
            float elapsed = 0f;

            // Attack Phase
            while (elapsed < attackDuration)
            {
                elapsed += Time.unscaledDeltaTime;
                _virtualCamera.Lens.FieldOfView = Mathf.Lerp(startFOV, targetFOV, elapsed / attackDuration);
                yield return null;
            }
            
            _virtualCamera.Lens.FieldOfView = targetFOV;

            // Hold Phase
            if (holdDuration > 0f)
            {
                yield return new WaitForSecondsRealtime(holdDuration);
                
                // Release back to base
                elapsed = 0f;
                float releaseDuration = 0.2f;
                while (elapsed < releaseDuration)
                {
                    elapsed += Time.unscaledDeltaTime;
                    _virtualCamera.Lens.FieldOfView = Mathf.Lerp(targetFOV, _baseFOV, elapsed / releaseDuration);
                    yield return null;
                }
                
                _virtualCamera.Lens.FieldOfView = _baseFOV;
            }
        }
    }
}
