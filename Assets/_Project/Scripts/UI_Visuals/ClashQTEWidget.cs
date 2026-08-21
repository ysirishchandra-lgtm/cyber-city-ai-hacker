using UnityEngine;
using UnityEngine.UI;
using TMPro;
using System.Collections;

namespace Scar.UI_Visuals
{
    public class ClashQTEWidget : MonoBehaviour
    {
        [Header("QTE UI Elements")]
        [SerializeField] private CanvasGroup _qteCanvasGroup;
        [SerializeField] private Slider _clashGauge; // 0 (Loss) to 100 (Win), starts at 50
        [SerializeField] private TextMeshProUGUI _promptText;
        [SerializeField] private GameObject _speedLinesOverlay;

        private bool _isClashActive = false;

        private void Start()
        {
            if (_qteCanvasGroup != null)
            {
                _qteCanvasGroup.alpha = 0f;
                _qteCanvasGroup.gameObject.SetActive(false);
            }
            if (_speedLinesOverlay != null) _speedLinesOverlay.SetActive(false);
        }

        private void Update()
        {
            if (_isClashActive)
            {
                // Mash input check
                if (Input.GetMouseButtonDown(0) || Input.GetKeyDown(KeyCode.Space) || Input.GetKeyDown(KeyCode.JoystickButton2))
                {
                    // Usually this would call AdaptiveBossController3D.RegisterClashInput()
                    // But we simulate visual feedback directly here for integration
                    UpdateClashGauge(5f); // Example mash bump
                }

                // Simulate enemy pushing back (Tug-of-War decay)
                UpdateClashGauge(-10f * Time.deltaTime);

                // Resolution check
                if (_clashGauge.value >= 100f)
                {
                    ResolveClash(true);
                }
                else if (_clashGauge.value <= 0f)
                {
                    ResolveClash(false);
                }
            }
        }

        public void StartClashQTE()
        {
            _isClashActive = true;
            if (_clashGauge != null) _clashGauge.value = 50f;
            
            if (_qteCanvasGroup != null)
            {
                _qteCanvasGroup.gameObject.SetActive(true);
                StartCoroutine(FadeCanvas(_qteCanvasGroup, 0f, 1f, 0.2f));
            }

            if (_promptText != null) _promptText.text = "MASH [ATTACK] TO OVERPOWER!";
            if (_speedLinesOverlay != null) _speedLinesOverlay.SetActive(true);

            // Optional: slow time slightly for dramatic effect
            Time.timeScale = 0.5f;
        }

        public void UpdateClashGauge(float amount)
        {
            if (_clashGauge != null && _isClashActive)
            {
                _clashGauge.value = Mathf.Clamp(_clashGauge.value + amount, 0f, 100f);
            }
        }

        private void ResolveClash(bool playerWon)
        {
            _isClashActive = false;
            Time.timeScale = 1f;

            if (_speedLinesOverlay != null) _speedLinesOverlay.SetActive(false);

            if (_promptText != null)
            {
                _promptText.text = playerWon ? "CLASH WON!" : "CLASH LOST!";
                _promptText.color = playerWon ? Color.cyan : Color.red;
            }

            // Anime screen flash
            if (VisualJuiceManager.Instance != null)
            {
                // Example screen flash color based on result
                // VisualJuiceManager.Instance.FlashScreen(playerWon ? Color.white : Color.red);
            }

            StartCoroutine(EndClashRoutine());
        }

        private IEnumerator EndClashRoutine()
        {
            yield return new WaitForSeconds(1.5f);
            if (_qteCanvasGroup != null)
            {
                yield return StartCoroutine(FadeCanvas(_qteCanvasGroup, 1f, 0f, 0.3f));
                _qteCanvasGroup.gameObject.SetActive(false);
            }
        }

        private IEnumerator FadeCanvas(CanvasGroup cg, float start, float end, float duration)
        {
            float elapsed = 0f;
            while (elapsed < duration)
            {
                elapsed += Time.unscaledDeltaTime;
                cg.alpha = Mathf.Lerp(start, end, elapsed / duration);
                yield return null;
            }
            cg.alpha = end;
        }
    }
}
