using UnityEngine;

namespace Scar.Environment
{
    /// <summary>
    /// Cyberpunk Dynamic Neon Lighting Controller.
    /// Controls flickering streetlights and emissive pulsing neon materials on billboards.
    /// </summary>
    public class NeonLightFlicker : MonoBehaviour
    {
        [Header("Light Target")]
        [SerializeField] private Light targetLight;
        [SerializeField] private float baseIntensity = 3.5f;

        [Header("Emissive Mesh Target")]
        [SerializeField] private Renderer targetMeshRenderer;
        [SerializeField] private string emissiveColorProp = "_EmissionColor";
        [SerializeField] private Color neonColor = new Color(0f, 0.95f, 1f);

        [Header("Flicker Profile")]
        [SerializeField] private bool isDamagedFlicker = true;
        [SerializeField] private float flickerSpeed = 16f;
        [SerializeField] private float pulseSpeed = 2f;

        private Material materialInstance;

        private void Awake()
        {
            if (targetLight == null) targetLight = GetComponent<Light>();
            if (targetMeshRenderer != null) materialInstance = targetMeshRenderer.material;
        }

        private void Update()
        {
            float noise;
            if (isDamagedFlicker)
            {
                // Rapid noise flicker with sudden dropouts
                noise = Mathf.PerlinNoise(Time.time * flickerSpeed, 0f);
                if (Random.value < 0.05f) noise *= 0.1f;
            }
            else
            {
                // Smooth sine wave pulse
                noise = 0.7f + 0.3f * Mathf.Sin(Time.time * pulseSpeed);
            }

            float currentIntensity = baseIntensity * noise;

            if (targetLight != null)
            {
                targetLight.intensity = currentIntensity;
            }

            if (materialInstance != null)
            {
                Color emission = neonColor * currentIntensity;
                materialInstance.SetColor(emissiveColorProp, emission);
            }
        }
    }
}
