using System;
using System.Collections;
using UnityEngine;
using UnityEngine.Video;
using UnityEngine.UI;
using TMPro;
using Scar.Core;

namespace Scar.UI_Visuals
{
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
        // Optionally, reference to PlayerController or Scene loader depending on how Unity is structured
        
        private bool _isPlaying = false;
        private bool _isSkipped = false;

        public static Round1CutsceneController Instance { get; private set; }

        private void Awake()
        {
            if (Instance == null) Instance = this;
            else Destroy(gameObject);
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
                if (Input.GetKeyDown(KeyCode.Space) || Input.GetKeyDown(KeyCode.Escape))
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
                yield return StartCoroutine(FadeCanvasGroup(_cutsceneCanvasGroup, 0f, 1f, 0.5f));
            }

            if (_skipPromptOverlay != null)
            {
                _skipPromptOverlay.SetActive(true);
            }

            if (_videoPlayer != null)
            {
                _videoPlayer.loopPointReached += OnVideoFinished;
                // Assuming video clip is assigned in inspector or loaded from 'Assets/_Project/Videos/scar1.mp4'
                _videoPlayer.Play();

                while (_videoPlayer.isPlaying && !_isSkipped)
                {
                    yield return null;
                }
                
                if (_isSkipped)
                {
                    _videoPlayer.Stop();
                }
                
                _videoPlayer.loopPointReached -= OnVideoFinished;
            }

            yield return StartCoroutine(TransitionToGameplay(characterId));
        }

        private void OnVideoFinished(VideoPlayer vp)
        {
            // Allowed to naturally fall through
        }

        private void SkipCutscene()
        {
            _isSkipped = true;
        }

        private IEnumerator TransitionToGameplay(string characterId)
        {
            if (_skipPromptOverlay != null) _skipPromptOverlay.SetActive(false);

            if (_cutsceneCanvasGroup != null)
            {
                yield return StartCoroutine(FadeCanvasGroup(_cutsceneCanvasGroup, 1f, 0f, 0.5f));
                _cutsceneCanvasGroup.gameObject.SetActive(false);
            }

            if (_lobbyCanvas != null) _lobbyCanvas.SetActive(false);
            if (_gameplayCanvas != null) _gameplayCanvas.SetActive(true);

            OnCutsceneFinished(characterId);

            _isPlaying = false;
        }

        private void OnCutsceneFinished(string characterId)
        {
            EventBus.Publish(new GameEvents.PhaseChangedEvent { NewPhase = GamePhase.LEVEL_1 });

            if (CyberHUD.Instance != null)
            {
                CyberHUD.Instance.ActivateHUD();
                CyberHUD.Instance.StartDeadlineTimer(480f);
            }
            else if (_cyberHUD != null)
            {
                // Fallback if singleton is not fully hooked up in scene
                _cyberHUD.ActivateHUD();
                _cyberHUD.StartDeadlineTimer(480f);
            }

            if (LevelManager.Instance != null)
            {
                LevelManager.Instance.SpawnCharacter(characterId);
            }
            else
            {
                Debug.Log($"[Round1CutsceneController] OnCutsceneFinished: LevelManager.Instance.SpawnCharacter({characterId})");
            }
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
