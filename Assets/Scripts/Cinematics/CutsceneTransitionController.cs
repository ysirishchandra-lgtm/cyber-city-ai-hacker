using System;
using System.Collections;
using UnityEngine;
using UnityEngine.Video;

namespace Scar.Cinematics
{
    /// <summary>
    /// Manages seamless transition from video intro cutscene (scar1.mp4) to live 3D gameplay.
    /// Blends cinematic camera to 3rd-person follow cam, triggers spawn VFX, and dispatches boot events.
    /// </summary>
    public class CutsceneTransitionController : MonoBehaviour
    {
        public static CutsceneTransitionController Instance { get; private set; }

        public static event Action OnIntroSequenceComplete;

        [Header("Video Player")]
        [SerializeField] private VideoPlayer videoPlayer;
        [SerializeField] private CanvasGroup videoCanvasGroup;

        [Header("Cameras")]
        [SerializeField] private Camera cinematicCamera;
        [SerializeField] private Camera gameplayCamera;
        [SerializeField] private float cameraBlendDuration = 1.2f;

        [Header("Player Spawn VFX")]
        [SerializeField] private GameObject playerSpawnElectricVFX;
        [SerializeField] private GameObject playerEyeGlintVFX;
        [SerializeField] private Transform playerSpawnPoint;

        [Header("HUD & UI")]
        [SerializeField] private GameObject cyberHUDObject;
        [SerializeField] private GameObject objectiveBannerObject;

        private bool hasTransitioned = false;

        private void Awake()
        {
            if (Instance == null) Instance = this;
            else Destroy(gameObject);
        }

        private void Start()
        {
            if (videoPlayer != null)
            {
                videoPlayer.loopPointReached += OnVideoEndReached;
                videoPlayer.Play();
            }

            if (cyberHUDObject != null) cyberHUDObject.SetActive(false);
            if (objectiveBannerObject != null) objectiveBannerObject.SetActive(false);
        }

        private void Update()
        {
            // Allow skip with Spacebar or Escape
            if (!hasTransitioned && (Input.GetKeyDown(KeyCode.Space) || Input.GetKeyDown(KeyCode.Escape) || Input.GetMouseButtonDown(0)))
            {
                TriggerGameplayHandoff();
            }
        }

        private void OnVideoEndReached(VideoPlayer vp)
        {
            TriggerGameplayHandoff();
        }

        public void TriggerGameplayHandoff()
        {
            if (hasTransitioned) return;
            hasTransitioned = true;
            StartCoroutine(PerformTransitionRoutine());
        }

        private IEnumerator PerformTransitionRoutine()
        {
            // 1. Fade out video canvas
            if (videoCanvasGroup != null)
            {
                float elapsed = 0f;
                while (elapsed < 0.4f)
                {
                    elapsed += Time.deltaTime;
                    videoCanvasGroup.alpha = Mathf.Lerp(1f, 0f, elapsed / 0.4f);
                    yield return null;
                }
                videoCanvasGroup.gameObject.SetActive(false);
            }

            if (videoPlayer != null && videoPlayer.isPlaying)
            {
                videoPlayer.Stop();
            }

            // 2. Camera blend to 3rd-person follow cam
            if (cinematicCamera != null && gameplayCamera != null)
            {
                Vector3 startPos = cinematicCamera.transform.position;
                Quaternion startRot = cinematicCamera.transform.rotation;
                Vector3 targetPos = gameplayCamera.transform.position;
                Quaternion targetRot = gameplayCamera.transform.rotation;

                cinematicCamera.gameObject.SetActive(true);
                gameplayCamera.gameObject.SetActive(false);

                float elapsed = 0f;
                while (elapsed < cameraBlendDuration)
                {
                    elapsed += Time.deltaTime;
                    float t = Mathf.SmoothStep(0f, 1f, elapsed / cameraBlendDuration);
                    cinematicCamera.transform.position = Vector3.Lerp(startPos, targetPos, t);
                    cinematicCamera.transform.rotation = Quaternion.Slerp(startRot, targetRot, t);
                    yield return null;
                }

                cinematicCamera.gameObject.SetActive(false);
                gameplayCamera.gameObject.SetActive(true);
            }

            // 3. Spawn Electric Discharge & Eye Glint VFX
            Vector3 spawnPos = playerSpawnPoint != null ? playerSpawnPoint.position : Vector3.zero;
            if (playerSpawnElectricVFX != null)
            {
                GameObject elec = Instantiate(playerSpawnElectricVFX, spawnPos, Quaternion.identity);
                Destroy(elec, 2.0f);
            }

            if (playerEyeGlintVFX != null)
            {
                GameObject glint = Instantiate(playerEyeGlintVFX, spawnPos + Vector3.up * 1.6f, Quaternion.identity);
                Destroy(glint, 1.5f);
            }

            // 4. Boot up CyberHUD and objective banner ("FIND THE FOUR")
            if (cyberHUDObject != null) cyberHUDObject.SetActive(true);
            if (objectiveBannerObject != null) objectiveBannerObject.SetActive(true);

            // 5. Dispatch completion event
            OnIntroSequenceComplete?.Invoke();
        }
    }
}
