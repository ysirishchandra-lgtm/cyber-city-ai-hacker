using UnityEngine;
using UnityEngine.Rendering;
using UnityEngine.Rendering.Universal;

namespace Scar.Environment
{
    /// <summary>
    /// Anime Post-Processing Volume Controller.
    /// Configures high-intensity Bloom for neon lights, subtle chromatic aberration,
    /// and dark blue/purple color grading with sharp warm highlights.
    /// </summary>
    public class PostProcessVolumeController : MonoBehaviour
    {
        [Header("Volume Reference")]
        [SerializeField] private Volume postProcessVolume;

        [Header("Tuning Values")]
        [SerializeField] private float bloomIntensity = 2.4f;
        [SerializeField] private float bloomThreshold = 0.85f;
        [SerializeField] private float chromaticAberrationIntensity = 0.12f;
        [SerializeField] private float vignetteIntensity = 0.32f;

        private Bloom bloom;
        private ChromaticAberration chromaticAberration;
        private Vignette vignette;
        private ColorAdjustments colorAdjustments;

        private void Awake()
        {
            if (postProcessVolume == null) postProcessVolume = GetComponent<Volume>();
            if (postProcessVolume != null && postProcessVolume.profile != null)
            {
                postProcessVolume.profile.TryGet(out bloom);
                postProcessVolume.profile.TryGet(out chromaticAberration);
                postProcessVolume.profile.TryGet(out vignette);
                postProcessVolume.profile.TryGet(out colorAdjustments);
                ApplyAnimeTuning();
            }
        }

        public void ApplyAnimeTuning()
        {
            if (bloom != null)
            {
                bloom.intensity.Override(bloomIntensity);
                bloom.threshold.Override(bloomThreshold);
            }

            if (chromaticAberration != null)
            {
                chromaticAberration.intensity.Override(chromaticAberrationIntensity);
            }

            if (vignette != null)
            {
                vignette.intensity.Override(vignetteIntensity);
                vignette.color.Override(new Color(0.02f, 0.02f, 0.06f));
            }

            if (colorAdjustments != null)
            {
                colorAdjustments.contrast.Override(25f);
                colorAdjustments.saturation.Override(15f);
                colorAdjustments.colorFilter.Override(new Color(0.92f, 0.94f, 1.05f));
            }
        }

        public void PulseGlitchAberration(float intensity = 0.8f)
        {
            if (chromaticAberration != null)
            {
                chromaticAberration.intensity.Override(intensity);
            }
        }
    }
}
