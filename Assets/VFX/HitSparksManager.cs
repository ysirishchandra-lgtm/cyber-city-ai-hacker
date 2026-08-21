using System.Collections;
using UnityEngine;

namespace Scar.VFX
{
    /// <summary>
    /// Manages anime-style 3D hit sparks, directional slash arcs for Volt's 3-hit combo,
    /// and micro-freeze (hitstop) flash layer on impact.
    /// </summary>
    public class HitSparksManager : MonoBehaviour
    {
        public static HitSparksManager Instance { get; private set; }

        [Header("VFX Prefabs")]
        [SerializeField] private GameObject hitSparkPrefab;
        [SerializeField] private GameObject critSparkPrefab;
        [SerializeField] private GameObject[] comboSlashArcPrefabs; // 3-hit combo arcs
        [SerializeField] private GameObject hitstopFlashOverlay;

        [Header("Hitstop Settings")]
        [SerializeField] private float lightHitstopDuration = 0.04f;
        [SerializeField] private float heavyHitstopDuration = 0.09f;

        private void Awake()
        {
            if (Instance == null) Instance = this;
            else Destroy(gameObject);
        }

        /// <summary>
        /// Spawns directional 3-hit combo slash arc ribbon
        /// </summary>
        public void SpawnComboSlash(int comboStep, Vector3 position, Quaternion rotation)
        {
            if (comboSlashArcPrefabs == null || comboSlashArcPrefabs.Length == 0) return;
            int idx = Mathf.Clamp(comboStep % comboSlashArcPrefabs.Length, 0, comboSlashArcPrefabs.Length - 1);
            if (comboSlashArcPrefabs[idx] != null)
            {
                GameObject slash = Instantiate(comboSlashArcPrefabs[idx], position, rotation);
                Destroy(slash, 0.4f);
            }
        }

        /// <summary>
        /// Spawns anime hit sparks and triggers hitstop freeze
        /// </summary>
        public void SpawnHitImpact(Vector3 position, Vector3 hitNormal, bool isHeavy = false, bool isCrit = false)
        {
            GameObject prefab = isCrit ? critSparkPrefab : hitSparkPrefab;
            if (prefab != null)
            {
                Quaternion rot = Quaternion.LookRotation(hitNormal);
                GameObject spark = Instantiate(prefab, position, rot);
                Destroy(spark, 0.8f);
            }

            // Trigger Hitstop Micro-freeze
            StartCoroutine(HitstopCoroutine(isHeavy ? heavyHitstopDuration : lightHitstopDuration));
        }

        private IEnumerator HitstopCoroutine(float duration)
        {
            float originalTimeScale = Time.timeScale;
            Time.timeScale = 0.05f;

            if (hitstopFlashOverlay != null) hitstopFlashOverlay.SetActive(true);

            yield return new WaitForSecondsRealtime(duration);

            if (hitstopFlashOverlay != null) hitstopFlashOverlay.SetActive(false);
            Time.timeScale = originalTimeScale;
        }
    }
}
