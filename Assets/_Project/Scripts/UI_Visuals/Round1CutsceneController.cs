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

        public void PlayCutscene(string characterId)
        {
            if (_isPlaying) return;
            
            StartCoroutine(CutsceneSequence(characterId));
        }

        private IEnumerator CutsceneSequence(string characterId)
        {
            _isPlaying = true;
            _isSkipped = false;

            // 1. Prepare UI Canvas
            if (_cutsceneCanvasGroup != null)
            {
                _cutsceneCanvasGroup.gameObject.SetActive(true);
                yield return StartCoroutine(FadeCanvasGroup(_cutsceneCanvasGroup, 0f, 1f, 0.5f));
            }

            if (_skipPromptOverlay != null)
            {
                _skipPromptOverlay.SetActive(true);
            }

            // 2. Play Video
            if (_videoPlayer != null)
            {
                _videoPlayer.loopPointReached += OnVideoFinished;
                _videoPlayer.Play();

                // Wait until finished or skipped
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
            else
            {
                // Fallback if no video player assigned
                Debug.LogWarning("[Round1CutsceneController] No VideoPlayer assigned, simulating delay.");
                float timer = 0;
                while (timer < 3f && !_isSkipped)
                {
                    timer += Time.deltaTime;
                    yield return null;
                }
            }

            // 3. Transition to Gameplay
            yield return StartCoroutine(TransitionToGameplay(characterId));
        }

        private void OnVideoFinished(VideoPlayer vp)
        {
            // Video automatically reached the end
            if (!_isSkipped)
            {
                // The coroutine will exit the while loop naturally
            }
        }

        private void SkipCutscene()
        {
            _isSkipped = true;
            Debug.Log("[Round1CutsceneController] Cutscene Skipped.");
        }

        private IEnumerator TransitionToGameplay(string characterId)
        {
            if (_skipPromptOverlay != null) _skipPromptOverlay.SetActive(false);

            // Fade out video canvas
            if (_cutsceneCanvasGroup != null)
            {
                yield return StartCoroutine(FadeCanvasGroup(_cutsceneCanvasGroup, 1f, 0f, 0.5f));
                _cutsceneCanvasGroup.gameObject.SetActive(false);
            }

            // Completely disable Lobby if not already
            if (_lobbyCanvas != null) _lobbyCanvas.SetActive(false);

            // Activate Gameplay Canvas
            if (_gameplayCanvas != null) _gameplayCanvas.SetActive(true);

            // Initialize Gameplay and HUD
            InitializeRound1(characterId);

            _isPlaying = false;
        }

        private void InitializeRound1(string characterId)
        {
            // 1. Fire core events to set phase
            EventBus.Publish(new GameEvents.PhaseChangedEvent { NewPhase = GamePhase.LEVEL_1 });

            // 2. Initialize HUD
            if (_cyberHUD != null)
            {
                // Reset score, start timer (8 mins = 480 seconds)
                _cyberHUD.StartDeadlineTimer(480f);
            }

            // 3. Enable 2D Player Controls (Depends on the character architecture)
            Debug.Log($"[Round1CutsceneController] Round 1 Initialized. Character: {characterId}. Controls enabled.");
            // Example:
            // var player = GameObject.FindGameObjectWithTag("Player");
            // if (player != null) player.GetComponent<PlayerController>().EnableControls(true);
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
