using UnityEngine;
using System.Collections;
using Scar.Core;

namespace Scar.UI_Visuals
{
    public class HitstopImpactController : MonoBehaviour
    {
        public static HitstopImpactController Instance { get; private set; }

        private bool _isFrozen = false;
        
        // Optional screen flash integration
        [Header("Effects")]
        [SerializeField] private Material _invertColorPostProcessMaterial; // Assuming custom post-processing blit or similar

        private void Awake()
        {
            if (Instance == null) Instance = this;
            else Destroy(gameObject);
        }

        private void OnEnable()
        {
            if (Hurtbox3D.OnTakeDamage != null)
                Hurtbox3D.OnTakeDamage += HandleHitImpact;
            else
                Hurtbox3D.OnTakeDamage = HandleHitImpact;
        }

        private void OnDisable()
        {
            Hurtbox3D.OnTakeDamage -= HandleHitImpact;
        }

        private void HandleHitImpact(Vector3 position, int damage, bool isCritical)
        {
            if (isCritical || damage >= 50)
            {
                TriggerHeavyHitstop();
            }
            else
            {
                TriggerLightHitstop();
            }
        }

        public void TriggerLightHitstop()
        {
            if (!_isFrozen)
                StartCoroutine(HitstopRoutine(0.05f, 0.06f));
        }

        public void TriggerHeavyHitstop()
        {
            if (!_isFrozen)
            {
                // Optional flash
                if (VisualJuiceManager.Instance != null) 
                {
                    // VisualJuiceManager.Instance.FlashScreen(Color.white, true); // true for invert/high-contrast
                }
                StartCoroutine(HitstopRoutine(0.02f, 0.12f));
            }
        }

        private IEnumerator HitstopRoutine(float targetTimeScale, float unscaledDuration)
        {
            _isFrozen = true;
            float originalTimeScale = Time.timeScale;
            
            Time.timeScale = targetTimeScale;
            // Prevent timescale 0 bugs
            if (Time.timeScale < 0.01f) Time.timeScale = 0.01f;
            
            yield return new WaitForSecondsRealtime(unscaledDuration);
            
            // Smoothly restore
            float restoreDuration = 0.05f;
            float elapsed = 0f;
            while (elapsed < restoreDuration)
            {
                elapsed += Time.unscaledDeltaTime;
                Time.timeScale = Mathf.Lerp(targetTimeScale, 1f, elapsed / restoreDuration);
                yield return null;
            }
            
            Time.timeScale = 1f;
            _isFrozen = false;
        }
    }
}
