using UnityEngine;
using UnityEngine.UI;
using TMPro;
using System.Collections;

namespace Scar.UI_Visuals
{
    public class BossHUDController : MonoBehaviour
    {
        [Header("Boss Health Elements")]
        [SerializeField] private Slider _bossHealthSlider;
        [SerializeField] private TextMeshProUGUI _bossNameText;
        [SerializeField] private CanvasGroup _bossHUDCanvasGroup;

        [Header("Phase Banner Elements")]
        [SerializeField] private TextMeshProUGUI _phaseBannerText;
        [SerializeField] private Animator _phaseBannerAnimator;

        [Header("Behavioral Alert")]
        [SerializeField] private TextMeshProUGUI _alertText;

        private void Start()
        {
            if (_bossHUDCanvasGroup != null) _bossHUDCanvasGroup.alpha = 0f;
            if (_alertText != null) _alertText.gameObject.SetActive(false);
            if (_phaseBannerText != null) _phaseBannerText.gameObject.SetActive(false);
        }

        // To be called by AdaptiveBossController3D or EventBus
        public void ShowBossHUD(string bossName, float maxHealth)
        {
            if (_bossNameText != null) _bossNameText.text = bossName;
            if (_bossHealthSlider != null)
            {
                _bossHealthSlider.maxValue = maxHealth;
                _bossHealthSlider.value = maxHealth;
            }

            StartCoroutine(FadeInHUD());
        }

        public void UpdateHealth(float currentHealth)
        {
            if (_bossHealthSlider != null)
            {
                _bossHealthSlider.value = currentHealth;
            }
        }

        public void TriggerPhaseTransition(int phaseIndex)
        {
            string phaseName = phaseIndex switch
            {
                1 => "PHASE 1: THE HUMAN",
                2 => "PHASE 2: AWAKENED (VOID MANIPULATION)",
                3 => "PHASE 3: POWER CLASH",
                4 => "PHASE 4: EVOLUTION",
                5 => "PHASE 5: THE FINAL STRIKE",
                _ => $"PHASE {phaseIndex}: UNKNOWN"
            };

            StartCoroutine(DisplayPhaseBanner(phaseName));
        }

        public void ShowBehavioralAlert(string alertMessage, float duration = 2f)
        {
            StartCoroutine(FlashAlert(alertMessage, duration));
        }

        private IEnumerator FadeInHUD()
        {
            if (_bossHUDCanvasGroup == null) yield break;
            
            float elapsed = 0f;
            while (elapsed < 1f)
            {
                elapsed += Time.deltaTime;
                _bossHUDCanvasGroup.alpha = elapsed;
                yield return null;
            }
        }

        private IEnumerator DisplayPhaseBanner(string phaseText)
        {
            if (_phaseBannerText == null) yield break;

            _phaseBannerText.text = phaseText;
            _phaseBannerText.gameObject.SetActive(true);

            // Optional: Trigger Unity Animator if assigned
            if (_phaseBannerAnimator != null) _phaseBannerAnimator.SetTrigger("ShowBanner");
            
            // Simple visual juice
            _phaseBannerText.color = new Color(1f, 1f, 1f, 0f);
            float elapsed = 0f;
            while (elapsed < 0.5f) // Fade in
            {
                elapsed += Time.deltaTime;
                _phaseBannerText.color = new Color(1f, 1f, 1f, elapsed / 0.5f);
                yield return null;
            }

            yield return new WaitForSeconds(3f);

            elapsed = 0f;
            while (elapsed < 0.5f) // Fade out
            {
                elapsed += Time.deltaTime;
                _phaseBannerText.color = new Color(1f, 1f, 1f, 1f - (elapsed / 0.5f));
                yield return null;
            }

            _phaseBannerText.gameObject.SetActive(false);
        }

        private IEnumerator FlashAlert(string message, float duration)
        {
            if (_alertText == null) yield break;

            _alertText.text = $"[ ! ] {message} [ ! ]";
            _alertText.color = Color.red;
            _alertText.gameObject.SetActive(true);

            yield return new WaitForSeconds(duration);

            _alertText.gameObject.SetActive(false);
        }
    }
}
