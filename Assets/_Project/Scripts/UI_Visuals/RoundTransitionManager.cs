using System.Collections;
using UnityEngine;
using UnityEngine.UI;
using TMPro;

namespace Scar.UI_Visuals
{
    public class RoundTransitionManager : MonoBehaviour
    {
        [Header("UI References")]
        [SerializeField] private TextMeshProUGUI _mainText;
        [SerializeField] private TextMeshProUGUI _subText;
        [SerializeField] private CanvasGroup _canvasGroup;
        [SerializeField] private Image _blackFadeImage;

        [Header("Transition Settings")]
        [SerializeField] private float _displayDuration = 3.0f;
        [SerializeField] private float _glitchDuration = 0.5f;
        [SerializeField] private float _fadeDuration = 1.0f;

        private void Start()
        {
            // Initialize text
            if (_mainText != null) _mainText.text = "ROUND 2";
            if (_subText != null) _subText.text = "THE INSTABILITY";
            
            // Ensure black fade is transparent at start
            if (_blackFadeImage != null)
            {
                Color c = _blackFadeImage.color;
                c.a = 0f;
                _blackFadeImage.color = c;
                _blackFadeImage.gameObject.SetActive(false);
            }

            // Start the sequence automatically
            StartCoroutine(TransitionSequence());
        }

        private IEnumerator TransitionSequence()
        {
            // Wait for most of the display duration
            float normalDisplayTime = _displayDuration - _glitchDuration;
            yield return new WaitForSeconds(normalDisplayTime);

            // Trigger the glitch
            if (_subText != null)
            {
                _subText.text = "<color=red><i>FIND YOURSELF</i></color>";
                // Optional: Add jitter or font style changes here for impact
            }

            // Wait for the glitch duration
            yield return new WaitForSeconds(_glitchDuration);

            // Fade to black
            if (_blackFadeImage != null)
            {
                _blackFadeImage.gameObject.SetActive(true);
                float elapsed = 0f;
                Color fadeColor = _blackFadeImage.color;

                while (elapsed < _fadeDuration)
                {
                    elapsed += Time.deltaTime;
                    fadeColor.a = Mathf.Lerp(0f, 1f, elapsed / _fadeDuration);
                    _blackFadeImage.color = fadeColor;
                    yield return null;
                }
            }

            // Handoff to LevelTwoManager
            if (Core.LevelTwoManager.Instance != null)
            {
                Core.LevelTwoManager.Instance.InitializeGameplay();
            }
            else
            {
                Debug.LogError("[RoundTransitionManager] Could not find LevelTwoManager instance to initialize gameplay.");
            }

            // Optionally, fade the black screen back out here, or let LevelTwoManager handle it
            // For now, we will fade out so the player can see the game.
            if (_blackFadeImage != null)
            {
                float elapsed = 0f;
                Color fadeColor = _blackFadeImage.color;

                while (elapsed < _fadeDuration)
                {
                    elapsed += Time.deltaTime;
                    fadeColor.a = Mathf.Lerp(1f, 0f, elapsed / _fadeDuration);
                    _blackFadeImage.color = fadeColor;
                    yield return null;
                }
                _blackFadeImage.gameObject.SetActive(false);
            }

            // Hide the transition canvas
            if (_canvasGroup != null)
            {
                _canvasGroup.alpha = 0f;
            }
        }
    }
}
