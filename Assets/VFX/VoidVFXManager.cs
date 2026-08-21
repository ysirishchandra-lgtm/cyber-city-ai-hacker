using System.Collections;
using UnityEngine;

namespace Scar.VFX
{
    /// <summary>
    /// Boss & Enemy Void Visuals Manager.
    /// Manages Phase 2 Void Manipulation portal/blink (purple vortex & distortion ripple)
    /// and Phase 3 Power Clash opposing energy beam collision sparks.
    /// </summary>
    public class VoidVFXManager : MonoBehaviour
    {
        public static VoidVFXManager Instance { get; private set; }

        [Header("Phase 2: Void Blink / Portal Prefabs")]
        [SerializeField] private GameObject voidPortalVortexPrefab;
        [SerializeField] private GameObject voidDistortionRipplePrefab;

        [Header("Phase 3: Power Clash Beam Prefabs")]
        [SerializeField] private GameObject clashMidpointSparkPrefab;
        [SerializeField] private LineRenderer playerBeamLine;
        [SerializeField] private LineRenderer bossBeamLine;

        private void Awake()
        {
            if (Instance == null) Instance = this;
            else Destroy(gameObject);
        }

        /// <summary>
        /// Spawns Phase 2 Void Manipulation Portal / Blink effect
        /// </summary>
        public void SpawnVoidPortal(Vector3 position, Quaternion rotation)
        {
            if (voidPortalVortexPrefab != null)
            {
                GameObject vortex = Instantiate(voidPortalVortexPrefab, position, rotation);
                Destroy(vortex, 2.5f);
            }

            if (voidDistortionRipplePrefab != null)
            {
                GameObject ripple = Instantiate(voidDistortionRipplePrefab, position, Quaternion.identity);
                Destroy(ripple, 1.8f);
            }
        }

        /// <summary>
        /// Triggers Phase 3 Opposing Beam Power Clash
        /// </summary>
        public void TriggerPowerClash(Vector3 playerOrigin, Vector3 bossOrigin, float duration = 3.0f)
        {
            StartCoroutine(PowerClashRoutine(playerOrigin, bossOrigin, duration));
        }

        private IEnumerator PowerClashRoutine(Vector3 playerOrigin, Vector3 bossOrigin, float duration)
        {
            Vector3 midpoint = (playerOrigin + bossOrigin) * 0.5f;

            GameObject clashSparks = null;
            if (clashMidpointSparkPrefab != null)
            {
                clashSparks = Instantiate(clashMidpointSparkPrefab, midpoint, Quaternion.identity);
            }

            if (playerBeamLine != null) playerBeamLine.enabled = true;
            if (bossBeamLine != null) bossBeamLine.enabled = true;

            float elapsed = 0f;
            while (elapsed < duration)
            {
                elapsed += Time.deltaTime;
                // Add slight wobble to clash midpoint
                Vector3 jitter = Random.insideUnitSphere * 0.15f;
                Vector3 currentMid = midpoint + jitter;

                if (playerBeamLine != null)
                {
                    playerBeamLine.SetPosition(0, playerOrigin);
                    playerBeamLine.SetPosition(1, currentMid);
                }

                if (bossBeamLine != null)
                {
                    bossBeamLine.SetPosition(0, bossOrigin);
                    bossBeamLine.SetPosition(1, currentMid);
                }

                if (clashSparks != null)
                {
                    clashSparks.transform.position = currentMid;
                }

                yield return null;
            }

            if (playerBeamLine != null) playerBeamLine.enabled = false;
            if (bossBeamLine != null) bossBeamLine.enabled = false;
            if (clashSparks != null) Destroy(clashSparks);
        }
    }
}
