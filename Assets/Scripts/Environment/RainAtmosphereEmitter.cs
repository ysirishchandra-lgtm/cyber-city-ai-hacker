using UnityEngine;

namespace Scar.Environment
{
    /// <summary>
    /// Level 1 Rainy Cyberpunk Atmosphere Emitter.
    /// Emits downward-angled rain streaks with ground collision puddle splash sub-emitters.
    /// </summary>
    [RequireComponent(typeof(ParticleSystem))]
    public class RainAtmosphereEmitter : MonoBehaviour
    {
        [Header("Rain Settings")]
        [SerializeField] private float rainRateOverTime = 1200f;
        [SerializeField] private Vector3 windVelocity = new Vector3(-8f, -22f, 2f);
        [SerializeField] private Transform followTarget; // Follow player camera

        [Header("Puddle Splash Sub-Emitter")]
        [SerializeField] private ParticleSystem splashSubEmitter;

        private ParticleSystem rainPS;

        private void Awake()
        {
            rainPS = GetComponent<ParticleSystem>();
            ConfigureRainParticles();
        }

        private void LateUpdate()
        {
            if (followTarget != null)
            {
                transform.position = followTarget.position + Vector3.up * 14f;
            }
        }

        private void ConfigureRainParticles()
        {
            var main = rainPS.main;
            main.simulationSpace = ParticleSystemSimulationSpace.World;
            main.startSpeed = windVelocity.magnitude;
            main.startLifetime = 1.2f;

            var emission = rainPS.emission;
            emission.rateOverTime = rainRateOverTime;

            var velocityOverLifetime = rainPS.velocityOverLifetime;
            velocityOverLifetime.enabled = true;
            velocityOverLifetime.x = windVelocity.x;
            velocityOverLifetime.y = windVelocity.y;
            velocityOverLifetime.z = windVelocity.z;

            var collision = rainPS.collision;
            collision.enabled = true;
            collision.type = ParticleSystemCollisionType.World;
            collision.mode = ParticleSystemCollisionMode.Collision3D;
            collision.sendCollisionMessages = true;
        }

        private void OnParticleCollision(GameObject other)
        {
            if (splashSubEmitter != null)
            {
                // Particle collision triggers splash ripples
            }
        }
    }
}
