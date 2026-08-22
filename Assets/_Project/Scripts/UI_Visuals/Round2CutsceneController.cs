using System.Collections;
using UnityEngine;
using UnityEngine.Video;
using Scar.Core;
using TMPro;

namespace Scar.UI_Visuals
{
    public class Round2CutsceneController : MonoBehaviour
    {
        public static Round2CutsceneController Instance { get; private set; }

        [SerializeField] private VideoPlayer _videoPlayer;
        [SerializeField] private CanvasGroup _cutsceneCanvasGroup;
        [SerializeField] private GameObject _skipPromptOverlay;

        private bool _isPlaying = false;
        private bool _isSkipped = false;

        private void Awake()
        {
            if (Instance == null) Instance = this;
            else Destroy(gameObject);

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

        public void StartRound2Cutscene()
        {
            if (_isPlaying) return;
            StartCoroutine(CutsceneSequence());
        }

        private IEnumerator CutsceneSequence()
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

            yield return StartCoroutine(TransitionToGameplay());
        }

        private void OnVideoFinished(VideoPlayer vp)
        {
            _isSkipped = true;
        }

        private void SkipCutscene()
        {
            _isSkipped = true;
        }

        private IEnumerator TransitionToGameplay()
        {
            if (_skipPromptOverlay != null) _skipPromptOverlay.SetActive(false);

            if (_cutsceneCanvasGroup != null)
            {
                yield return StartCoroutine(FadeCanvasGroup(_cutsceneCanvasGroup, 1f, 0f, 0.35f));
                _cutsceneCanvasGroup.alpha = 0f;
                _cutsceneCanvasGroup.gameObject.SetActive(false);
            }

            EventBus.Publish(new GameEvents.PhaseChangedEvent { NewPhase = GamePhase.LEVEL_2 });
            Debug.Log("[Round2CutsceneController] Transitioned to GamePhase LEVEL_2");

            _isPlaying = false;
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
