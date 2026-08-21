using UnityEngine;

namespace Scar.VFX
{
    /// <summary>
    /// Spawns ground cracking particle bursts and shockwave decals for heavy slams and finishers.
    /// </summary>
    public class GroundDecalManager : MonoBehaviour
    {
        public static GroundDecalManager Instance { get; private set; }

        [Header("Ground VFX Prefabs")]
        [SerializeField] private GameObject groundCrackDecalPrefab;
        [SerializeField] private GameObject shockwaveParticlePrefab;
        [SerializeField] private GameObject groundDustBurstPrefab;

        private void Awake()
        {
            if (Instance == null) Instance = this;
            else Destroy(gameObject);
        }

        public void SpawnGroundSlam(Vector3 hitPoint, Vector3 normal, float radius = 3.5f)
        {
            // Decal
            if (groundCrackDecalPrefab != null)
            {
                Quaternion rot = Quaternion.LookRotation(normal) * Quaternion.Euler(90, 0, 0);
                GameObject decal = Instantiate(groundCrackDecalPrefab, hitPoint + normal * 0.02f, rot);
                decal.transform.localScale = Vector3.one * radius;
                Destroy(decal, 6.0f);
            }

            // Radial Shockwave Ring
            if (shockwaveParticlePrefab != null)
            {
                GameObject shock = Instantiate(shockwaveParticlePrefab, hitPoint, Quaternion.identity);
                Destroy(shock, 1.5f);
            }

            // Dust / Rubble Burst
            if (groundDustBurstPrefab != null)
            {
                GameObject dust = Instantiate(groundDustBurstPrefab, hitPoint, Quaternion.identity);
                Destroy(dust, 2.0f);
            }
        }
    }
}
