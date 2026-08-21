using System;
using System.Collections;
using UnityEngine;
using UnityEngine.Video;
using TMPro;

namespace Scar.Cinematics
{
    /// <summary>
    /// Manages seamless transition from video intro cutscene (scar1.mp4) to live 3D gameplay.
    /// Disables video looping, listens for completion loopPointReached, hides video canvas,
    /// and immediately triggers the "ROUND 1 — FIND THE FOUR" sequence & CyberHUD boot-up.
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

            // Ensure video looping is strictly disabled
            if (videoPlayer != null)
            {
                videoPlayer.isLooping = false;
            }
        }

        private void Start()
        {
            if (videoPlayer != null)
            {
                videoPlayer.isLooping = false;
                videoPlayer.loopPointReached += OnCutsceneFinished;
                videoPlayer.Play();
            }

            if (cyberHUDObject != null) cyberHUDObject.SetActive(false);
            if (objectiveBannerObject != null) objectiveBannerObject.SetActive(false);
        }

        private void Update()
        {
            // Allow skip with Spacebar, Escape, or Left Click
            if (!hasTransitioned && (Input.GetKeyDown(KeyCode.Space) || Input.GetKeyDown(KeyCode.Escape) || Input.GetMouseButtonDown(0)))
            {
                TriggerGameplayHandoff();
            }
        }

        public void OnCutsceneFinished(VideoPlayer vp)
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
            // 1. Unhook video events and stop video
            if (videoPlayer != null)
            {
                videoPlayer.loopPointReached -= OnCutsceneFinished;
                if (videoPlayer.isPlaying)
                {
                    videoPlayer.Stop();
                }
            }

            // 2. Hide & Fade out video canvas
            if (videoCanvasGroup != null)
            {
                float elapsed = 0f;
                while (elapsed < 0.35f)
                {
                    elapsed += Time.deltaTime;
                    videoCanvasGroup.alpha = Mathf.Lerp(1f, 0f, elapsed / 0.35f);
                    yield return null;
                }
                videoCanvasGroup.alpha = 0f;
                videoCanvasGroup.gameObject.SetActive(false);
            }

            // 3. Camera blend to 3rd-person follow cam
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

            // 4. Spawn Electric Discharge & Eye Glint VFX
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

            // 5. Trigger "ROUND 1 — FIND THE FOUR" Announcement
            yield return StartCoroutine(PlayRound1Announcement());

            // 6. Boot up CyberHUD and objective banner ("REACH THE WAREHOUSE [128m]")
            if (cyberHUDObject != null) cyberHUDObject.SetActive(true);
            if (objectiveBannerObject != null) objectiveBannerObject.SetActive(true);

            // 7. Dispatch completion event
            OnIntroSequenceComplete?.Invoke();
        }

        private IEnumerator PlayRound1Announcement()
        {
            // Dynamically create the stylized "ROUND 1 — FIND THE FOUR" banner matching reference art
            GameObject bannerObj = new GameObject("Round1_Banner", typeof(RectTransform), typeof(CanvasGroup));
            bannerObj.transform.SetParent(this.transform, false);

            RectTransform rt = bannerObj.GetComponent<RectTransform>();
            rt.anchorMin = new Vector2(0.5f, 0.5f);
            rt.anchorMax = new Vector2(0.5f, 0.5f);
            rt.sizeDelta = new Vector2(900, 260);

            CanvasGroup cg = bannerObj.GetComponent<CanvasGroup>();
            cg.alpha = 0f;

            // Title: ROUND 1 (Cyan & Orange)
            GameObject titleObj = new GameObject("TitleText", typeof(RectTransform), typeof(TextMeshProUGUI));
            titleObj.transform.SetParent(bannerObj.transform, false);
            TextMeshProUGUI titleText = titleObj.GetComponent<TextMeshProUGUI>();
            titleText.text = "<color=#00f3ff>ROUND</color> <color=#ff8800>1</color>";
            titleText.fontSize = 110;
            titleText.fontStyle = FontStyles.Bold | FontStyles.Italic;
            titleText.alignment = TextAlignmentOptions.Center;

            // Subtitle: FIND THE FOUR
            GameObject subObj = new GameObject("SubText", typeof(RectTransform), typeof(TextMeshProUGUI));
            subObj.transform.SetParent(bannerObj.transform, false);
            RectTransform subRt = subObj.GetComponent<RectTransform>();
            subRt.anchoredPosition = new Vector2(0, -65);
            TextMeshProUGUI subText = subObj.GetComponent<TextMeshProUGUI>();
            subText.text = "FIND THE FOUR";
            subText.fontSize = 36;
            subText.fontStyle = FontStyles.Bold;
            subText.alignment = TextAlignmentOptions.Center;
            subText.color = Color.white;

            // Sound Effect Trigger
            Debug.Log("[Audio] PlaySFX: 'Round1_Announce'");

            // Animate In (Scale & Fade)
            float elapsed = 0f;
            while (elapsed < 0.25f)
            {
                elapsed += Time.deltaTime;
                float t = elapsed / 0.25f;
                cg.alpha = t;
                rt.localScale = Vector3.Lerp(new Vector3(1.8f, 1.8f, 1.8f), Vector3.one, t);
                yield return null;
            }

            // Hold for 1.1s
            yield return new WaitForSeconds(1.1f);

            // Animate Out (Flash & Dissolve)
            elapsed = 0f;
            while (elapsed < 0.35f)
            {
                elapsed += Time.deltaTime;
                float t = elapsed / 0.35f;
                cg.alpha = 1f - t;
                rt.localScale = Vector3.Lerp(Vector3.one, new Vector3(2.5f, 1.2f, 1f), t);
                yield return null;
            }

            Destroy(bannerObj);
        }
    }
}
