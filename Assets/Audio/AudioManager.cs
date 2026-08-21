using System.Collections;
using UnityEngine;

namespace Scar.Audio
{
    /// <summary>
    /// Interactive Audio Controller with dynamic BGM stem crossfading between
    /// Exploration/Neutral and High-Intensity Combat, plus anime combat SFX pool.
    /// </summary>
    public class AudioManager : MonoBehaviour
    {
        public static AudioManager Instance { get; private set; }

        public enum AudioState { Exploration, Combat, Boss }

        [Header("BGM Audio Sources (Stems)")]
        [SerializeField] private AudioSource explorationSource;
        [SerializeField] private AudioSource combatSource;
        [SerializeField] private float crossfadeDuration = 1.2f;

        [Header("SFX Audio Source Pool")]
        [SerializeField] private AudioSource sfxSource;

        [Header("Anime Combat SFX Clips")]
        [SerializeField] private AudioClip[] lightSlashClips;
        [SerializeField] private AudioClip[] heavyImpactClips;
        [SerializeField] private AudioClip[] dashSwooshClips;
        [SerializeField] private AudioClip[] energyClashClips;
        [SerializeField] private AudioClip[] footstepClips;

        private AudioState currentState = AudioState.Exploration;
        private Coroutine fadeCoroutine;

        private void Awake()
        {
            if (Instance == null)
            {
                Instance = this;
                DontDestroyOnLoad(gameObject);
            }
            else Destroy(gameObject);
        }

        private void Start()
        {
            SetAudioState(AudioState.Exploration);
        }

        public void SetAudioState(AudioState newState)
        {
            if (fadeCoroutine != null) StopCoroutine(fadeCoroutine);
            currentState = newState;
            fadeCoroutine = StartCoroutine(CrossfadeBGM(newState));
        }

        private IEnumerator CrossfadeBGM(AudioState targetState)
        {
            float targetExploreVol = targetState == AudioState.Exploration ? 0.8f : 0.15f;
            float targetCombatVol = (targetState == AudioState.Combat || targetState == AudioState.Boss) ? 0.85f : 0.0f;

            if (explorationSource != null && !explorationSource.isPlaying) explorationSource.Play();
            if (combatSource != null && !combatSource.isPlaying) combatSource.Play();

            float elapsed = 0f;
            float startExp = explorationSource != null ? explorationSource.volume : 0;
            float startCom = combatSource != null ? combatSource.volume : 0;

            while (elapsed < crossfadeDuration)
            {
                elapsed += Time.deltaTime;
                float t = elapsed / crossfadeDuration;

                if (explorationSource != null) explorationSource.volume = Mathf.Lerp(startExp, targetExploreVol, t);
                if (combatSource != null) combatSource.volume = Mathf.Lerp(startCom, targetCombatVol, t);

                yield return null;
            }
        }

        // ─── SFX Playback Hooks ───────────────────────────────────────────────

        public void PlayLightSlash() => PlayRandomSFX(lightSlashClips, 0.8f, 1.2f);
        public void PlayHeavyImpact() => PlayRandomSFX(heavyImpactClips, 0.9f, 1.1f);
        public void PlayDashSwoosh() => PlayRandomSFX(dashSwooshClips, 0.95f, 1.05f);
        public void PlayEnergyClash() => PlayRandomSFX(energyClashClips, 0.85f, 1.15f);
        public void PlayFootstep() => PlayRandomSFX(footstepClips, 0.9f, 1.1f, 0.4f);

        private void PlayRandomSFX(AudioClip[] clips, float minPitch = 0.9f, float maxPitch = 1.1f, float volume = 1f)
        {
            if (sfxSource == null || clips == null || clips.Length == 0) return;
            AudioClip clip = clips[Random.Range(0, clips.Length)];
            if (clip != null)
            {
                sfxSource.pitch = Random.Range(minPitch, maxPitch);
                sfxSource.PlayOneShot(clip, volume);
            }
        }
    }
}
