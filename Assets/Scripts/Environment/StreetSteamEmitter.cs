using UnityEngine;

namespace Scar.Environment
{
    /// <summary>
    /// Emits low-lying volumetric alleyway fog and sewer steam vent particles with turbulence.
    /// </summary>
    [RequireComponent(typeof(ParticleSystem))]
    public class StreetSteamEmitter : MonoBehaviour
    {
        [Header("Steam Vent Settings")]
        [SerializeField] private bool isPeriodicBurst = false;
        [SerializeField] private float burstInterval = 4.0f;
        [SerializeField] private float burstDuration = 1.5f;

        private ParticleSystem steamPS;
        private float timer = 0f;
        private bool isBursting = false;

        private void Awake()
        {
            steamPS = GetComponent<ParticleSystem>();
        }

        private void Update()
        {
            if (!isPeriodicBurst) return;

            timer += Time.deltaTime;
            if (!isBursting && timer >= burstInterval)
            {
                isBursting = true;
                timer = 0f;
                steamPS.Play();
            }
            else if (isBursting && timer >= burstDuration)
            {
                isBursting = false;
                timer = 0f;
                steamPS.Stop();
            }
        }
    }
}
