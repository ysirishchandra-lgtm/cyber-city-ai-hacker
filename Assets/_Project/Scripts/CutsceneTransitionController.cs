using System;
using System.Collections;
using UnityEngine;
using UnityEngine.Video;
using TMPro;
using Scar.Core;
using Scar.UI;

namespace Scar.Cinematics
{
    /// <summary>
    /// CutsceneTransitionController: Manages the linear video cutscene to 3D gameplay sequence.
    /// Execution Sequence: Play Video (Once, isLooping = false) -> Show "ROUND 1" Banner -> Boot CyberHUD -> Start Game & Enable Input.
    /// </summary>
    public class CutsceneTransitionController : MonoBehaviour
    {
        public static CutsceneTransitionController Instance { get; private set; }

        public static event Action OnIntroSequenceComplete;

        [Header("Video Setup")]
        [SerializeField] private VideoPlayer videoPlayer;
        [SerializeField] private GameObject videoCanvas;
        [SerializeField] private CanvasGroup videoCanvasGroup;

        [Header("Cameras")]
        [SerializeField] private Camera cinematicCamera;
        [SerializeField] private Camera gameplayCamera;
        [SerializeField] private float cameraBlendDuration = 1.2f;

        [Header("Player Spawn & Visuals")]
        [SerializeField] private GameObject playerSpawnElectricVFX;
        [SerializeField] private GameObject playerEyeGlintVFX;
        [SerializeField] private Transform playerSpawnPoint;
        [SerializeField] private GameObject playerGameObject;
        [SerializeField] private string defaultCharacterId = "SCAR_PROTAGONIST";

        [Header("HUD & UI")]
        [SerializeField] private GameObject cyberHUDObject;
        [SerializeField] private GameObject objectiveBannerObject;
        [SerializeField] private CyberHUD cyberHUD;

        private bool hasTransitioned = false;

        private void Awake()
        {
            if (Instance == null) Instance = this;
            else Destroy(gameObject);

            // Step 1: Explicitly disable video looping
            if (videoPlayer != null)
            {
                videoPlayer.isLooping = false;
            }
        }

        private void Start()
        {
            if (videoPlayer != null)
            {
                // Step 1 & 2: Ensure non-looping and subscribe to completion event
                videoPlayer.isLooping = false;
                videoPlayer.loopPointReached += OnCutsceneFinished;
                videoPlayer.Play();
            }

            if (cyberHUDObject != null) cyberHUDObject.SetActive(false);
            if (objectiveBannerObject != null) objectiveBannerObject.SetActive(false);
        }

        private void Update()
        {
            // Step 4: Quick bypass with Space, Escape, or Left Click
            if (!hasTransitioned && (Input.GetKeyDown(KeyCode.Space) || Input.GetKeyDown(KeyCode.Escape) || Input.GetMouseButtonDown(0)))
            {
                OnCutsceneFinished(videoPlayer);
            }
        }

        /// <summary>
        /// Step 3: Triggered when the video finishes or when skipped by player.
        /// Execution order:
        /// 1. Unsubscribe from video events.
        /// 2. Deactivate Video Canvas.
        /// 3. Trigger "ROUND 1" UI Banner animation.
        /// 4. Wait ~1.2s, spawn/enable character, boot CyberHUD, blend camera.
        /// 5. Enable player inputs & publish game start event.
        /// </summary>
        public void OnCutsceneFinished(VideoPlayer vp)
        {
            if (hasTransitioned) return;
            hasTransitioned = true;

            // 1. Unsubscribe from the event & stop playback
            if (videoPlayer != null)
            {
                videoPlayer.loopPointReached -= OnCutsceneFinished;
                if (videoPlayer.isPlaying)
                {
                    videoPlayer.Stop();
                }
            }

            StartCoroutine(LinearHandoffSequence());
        }

        // Parameterless overload for UI/Button triggers
        public void OnCutsceneFinished()
        {
            OnCutsceneFinished(videoPlayer);
        }

        private IEnumerator LinearHandoffSequence()
        {
            // 2. Deactivate the Video Canvas GameObject
            if (videoCanvasGroup != null)
            {
                videoCanvasGroup.alpha = 0f;
            }
            if (videoCanvas != null)
            {
                videoCanvas.SetActive(false);
            }
            else if (videoCanvasGroup != null)
            {
                videoCanvasGroup.gameObject.SetActive(false);
            }

            // 3. Trigger the "ROUND 1 — FIND THE FOUR" UI Banner Animation
            yield return StartCoroutine(PlayRound1BannerAnimation());

            // 4. Camera blend to 3rd-person follow cam
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

            // 5. Spawn Character / Enable 3D Player Mesh
            if (LevelManager.Instance != null)
            {
                LevelManager.Instance.SpawnCharacter(defaultCharacterId);
            }
            else if (playerGameObject != null)
            {
                playerGameObject.SetActive(true);
            }

            // Spawn Electric Discharge & Eye Glint VFX
            Vector3 spawnPos = playerSpawnPoint != null ? playerSpawnPoint.position : (playerGameObject != null ? playerGameObject.transform.position : Vector3.zero);
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

            // 6. Boot Sequence for CyberHUD and Objective Banner
            if (cyberHUD != null)
            {
                cyberHUD.BootSequence();
            }
            else if (CyberHUD.Instance != null)
            {
                CyberHUD.Instance.BootSequence();
            }

            if (cyberHUDObject != null) cyberHUDObject.SetActive(true);
            if (objectiveBannerObject != null) objectiveBannerObject.SetActive(true);

            // 7. Enable player inputs & dispatch game phase start
            EventBus.Publish(new GameEvents.PhaseChangedEvent { NewPhase = GamePhase.LEVEL_1 });
            OnIntroSequenceComplete?.Invoke();
            Debug.Log("[CutsceneTransitionController] Round 1 Initialized & Player Input Officially Unlocked!");
        }

        private IEnumerator PlayRound1BannerAnimation()
        {
            // Create "ROUND 1 — FIND THE FOUR" Banner
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
            titleText.fontSize = 115;
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

            // Trigger Sound Effect
            Debug.Log("[Audio] PlaySFX: 'Round1_Announce'");

            // Animate In (0.25s)
            float elapsed = 0f;
            while (elapsed < 0.25f)
            {
                elapsed += Time.deltaTime;
                float t = elapsed / 0.25f;
                cg.alpha = t;
                rt.localScale = Vector3.Lerp(new Vector3(1.8f, 1.8f, 1.8f), Vector3.one, t);
                yield return null;
            }

            // Hold Banner (~1.2s duration)
            yield return new WaitForSeconds(1.2f);

            // Animate Out (0.3s)
            elapsed = 0f;
            while (elapsed < 0.3f)
            {
                elapsed += Time.deltaTime;
                float t = elapsed / 0.3f;
                cg.alpha = 1f - t;
                rt.localScale = Vector3.Lerp(Vector3.one, new Vector3(2.5f, 1.2f, 1f), t);
                yield return null;
            }

            Destroy(bannerObj);
        }
    }
}
