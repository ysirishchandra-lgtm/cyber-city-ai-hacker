using System;
using System.Collections;
using UnityEngine;
using UnityEngine.Video;
using UnityEngine.UI;
using TMPro;
using Scar.Core;

namespace Scar.UI_Visuals
{
    /// <summary>
    /// Manages the Round 1 Cutscene intro, video player (scar1.mp4), non-looping playback,
    /// transition to the stylized "ROUND 1 — FIND THE FOUR" splash banner, and CyberHUD boot-up.
    /// </summary>
    public class Round1CutsceneController : MonoBehaviour
    {
        [Header("Video Setup")]
        [SerializeField] private VideoPlayer _videoPlayer;
        [SerializeField] private CanvasGroup _cutsceneCanvasGroup;
        [SerializeField] private GameObject _skipPromptOverlay;

        [Header("Scene Transition Dependencies")]
        [SerializeField] private GameObject _lobbyCanvas;
        [SerializeField] private GameObject _gameplayCanvas;
        [SerializeField] private CyberHUD _cyberHUD;
        
        private bool _isPlaying = false;
        private bool _isSkipped = false;

        public static Round1CutsceneController Instance { get; private set; }

        private void Awake()
        {
            if (Instance == null) Instance = this;
            else Destroy(gameObject);

            // Strictly disable video looping
            if (_videoPlayer != null)
            {
                _videoPlayer.isLooping = false;
            }
        }

        private void Start()
        {
            if (_cutsceneCanvasGroup != null)
            {
                _cutsceneCanvasGroup.alpha = 0f;
                _cutsceneCanvasGroup.gameObject.SetActive(false);
            }
            if (_skipPromptOverlay != null)
            {
                _skipPromptOverlay.SetActive(false);
            }
        }

        private void Update()
        {
            if (_isPlaying && !_isSkipped)
            {
                if (Input.GetKeyDown(KeyCode.Space) || Input.GetKeyDown(KeyCode.Escape) || Input.GetMouseButtonDown(0))
                {
                    SkipCutscene();
                }
            }
        }

        public void StartIntro(string characterId)
        {
            if (_isPlaying) return;
            
            StartCoroutine(CutsceneSequence(characterId));
        }

        private IEnumerator CutsceneSequence(string characterId)
        {
            _isPlaying = true;
            _isSkipped = false;

            if (_cutsceneCanvasGroup != null)
            {
                _cutsceneCanvasGroup.gameObject.SetActive(true);
                yield return StartCoroutine(FadeCanvasGroup(_cutsceneCanvasGroup, 0f, 1f, 0.4f));
            }

            if (_skipPromptOverlay != null)
            {
                _skipPromptOverlay.SetActive(true);
            }

            if (_videoPlayer != null)
            {
                _videoPlayer.isLooping = false;
                _videoPlayer.loopPointReached += OnVideoFinished;
                _videoPlayer.Play();

                while (_videoPlayer.isPlaying && !_isSkipped)
                {
                    yield return null;
                }
                
                if (_isSkipped || _videoPlayer.isPlaying)
                {
                    _videoPlayer.Stop();
                }
                
                _videoPlayer.loopPointReached -= OnVideoFinished;
            }

            yield return StartCoroutine(TransitionToGameplay(characterId));
        }

        private void OnVideoFinished(VideoPlayer vp)
        {
            _isSkipped = true; // Natural completion moves forward
        }

        public void OnCutsceneFinished(VideoPlayer vp)
        {
            _isSkipped = true;
        }

        private void SkipCutscene()
        {
            _isSkipped = true;
        }

        private IEnumerator TransitionToGameplay(string characterId)
        {
            if (_skipPromptOverlay != null) _skipPromptOverlay.SetActive(false);

            // 1. Hide & Fade out video canvas
            if (_cutsceneCanvasGroup != null)
            {
                yield return StartCoroutine(FadeCanvasGroup(_cutsceneCanvasGroup, 1f, 0f, 0.35f));
                _cutsceneCanvasGroup.alpha = 0f;
                _cutsceneCanvasGroup.gameObject.SetActive(false);
            }

            if (_lobbyCanvas != null) _lobbyCanvas.SetActive(false);
            if (_gameplayCanvas != null) _gameplayCanvas.SetActive(true);

            // 2. Fade to 3D Scene / Spawn Character so camera can align
            if (LevelManager.Instance != null)
            {
                LevelManager.Instance.SpawnCharacter(characterId);
            }
            else
            {
                Debug.Log($"[Round1CutsceneController] TransitionToGameplay: LevelManager.Instance.SpawnCharacter({characterId})");
            }

            // 3. "ROUND 1 — FIND THE FOUR" Announcement Splash Sequence
            yield return StartCoroutine(PlayRound1Announcement());

            // 4. Game Start / HUD Boot
            OnCutsceneFinished(characterId);

            _isPlaying = false;
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

            // Title Text: ROUND 1 (Cyan & Orange)
            GameObject titleObj = new GameObject("TitleText", typeof(RectTransform), typeof(TextMeshProUGUI));
            titleObj.transform.SetParent(bannerObj.transform, false);
            TextMeshProUGUI titleText = titleObj.GetComponent<TextMeshProUGUI>();
            titleText.text = "<color=#00f3ff>ROUND</color> <color=#ff8800>1</color>";
            titleText.fontSize = 115;
            titleText.fontStyle = FontStyles.Bold | FontStyles.Italic;
            titleText.alignment = TextAlignmentOptions.Center;

            // Subtitle Text: FIND THE FOUR
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

        private void OnCutsceneFinished(string characterId)
        {
            // Boot HUD
            if (CyberHUD.Instance != null)
            {
                CyberHUD.Instance.ActivateHUD();
                CyberHUD.Instance.StartDeadlineTimer(480f);
            }
            else if (_cyberHUD != null)
            {
                _cyberHUD.ActivateHUD();
                _cyberHUD.StartDeadlineTimer(480f);
            }

            // Unlock Character Input / Phase 1
            EventBus.Publish(new GameEvents.PhaseChangedEvent { NewPhase = GamePhase.LEVEL_1 });
            Debug.Log("[Round1CutsceneController] Character input officially unlocked!");
        }

        private IEnumerator FadeCanvasGroup(CanvasGroup cg, float startAlpha, float endAlpha, float duration)
        {
            float elapsed = 0f;
            cg.alpha = startAlpha;
            while (elapsed < duration)
            {
                elapsed += Time.deltaTime;
                cg.alpha = Mathf.Lerp(startAlpha, endAlpha, elapsed / duration);
                yield return null;
            }
            cg.alpha = endAlpha;
        }
    }
}
