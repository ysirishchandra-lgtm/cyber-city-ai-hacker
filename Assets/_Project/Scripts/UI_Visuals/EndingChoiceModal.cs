using UnityEngine;
using UnityEngine.UI;
using TMPro;
using System.Collections;
using UnityEngine.EventSystems;

namespace Scar.UI_Visuals
{
    public class EndingChoiceModal : MonoBehaviour
    {
        [Header("Modal Panels")]
        [SerializeField] private CanvasGroup _modalCanvasGroup;
        [SerializeField] private Image _blurBackground;
        
        [Header("Narrative Text")]
        [SerializeField] private TextMeshProUGUI _finalQuestionText;
        
        [Header("Choice Buttons")]
        [SerializeField] private Button _btnDestroy;
        [SerializeField] private Button _btnTakeControl;
        [SerializeField] private Button _btnBecome;

        [Header("Run Summary Panel")]
        [SerializeField] private TextMeshProUGUI _timeText;
        [SerializeField] private TextMeshProUGUI _damageTakenText;
        [SerializeField] private TextMeshProUGUI _styleRankText;

        private void Start()
        {
            if (_modalCanvasGroup != null)
            {
                _modalCanvasGroup.alpha = 0f;
                _modalCanvasGroup.gameObject.SetActive(false);
            }

            _btnDestroy.onClick.AddListener(() => OnChoiceSelected("DESTROY"));
            _btnTakeControl.onClick.AddListener(() => OnChoiceSelected("TAKE_CONTROL"));
            _btnBecome.onClick.AddListener(() => OnChoiceSelected("BECOME"));
        }

        // Triggered by OnBossDefeated / EndingNarrativeController
        public void ShowEndingModal(float totalTime, int damageTaken, string styleRank)
        {
            if (_modalCanvasGroup == null) return;
            
            _modalCanvasGroup.gameObject.SetActive(true);
            
            if (_finalQuestionText != null)
            {
                _finalQuestionText.text = "\"Now that you've defeated the person you hated... who are you?\"";
            }

            // Populate Run Summary
            if (_timeText != null) _timeText.text = $"TIME: {Mathf.FloorToInt(totalTime / 60):00}:{Mathf.FloorToInt(totalTime % 60):00}";
            if (_damageTakenText != null) _damageTakenText.text = $"DMG TAKEN: {damageTaken}";
            if (_styleRankText != null) _styleRankText.text = $"STYLE: {styleRank}";

            StartCoroutine(FadeInModal());
        }

        private IEnumerator FadeInModal()
        {
            float duration = 1.5f;
            float elapsed = 0f;

            // Optional: slow time to freeze frame the defeated boss in background
            Time.timeScale = 0.05f;

            while (elapsed < duration)
            {
                elapsed += Time.unscaledDeltaTime;
                _modalCanvasGroup.alpha = Mathf.Lerp(0f, 1f, elapsed / duration);
                
                if (_blurBackground != null)
                {
                    // If using a material that supports blur radius, you could lerp it here
                    _blurBackground.color = new Color(0, 0, 0, Mathf.Lerp(0f, 0.8f, elapsed / duration));
                }
                
                yield return null;
            }
            
            _modalCanvasGroup.alpha = 1f;
        }

        private void OnChoiceSelected(string choiceID)
        {
            Debug.Log($"[EndingChoiceModal] Player Selected Ending: {choiceID}");
            
            // Disable all buttons to prevent double clicking
            _btnDestroy.interactable = false;
            _btnTakeControl.interactable = false;
            _btnBecome.interactable = false;

            // Trigger the respective ending cinematic or backend save
            // GameManager.Instance.TriggerEnding(choiceID);
            
            StartCoroutine(FadeOutToBlack());
        }

        private IEnumerator FadeOutToBlack()
        {
            // Simple fade to black logic before loading credits scene
            float duration = 2.0f;
            float elapsed = 0f;
            
            while (elapsed < duration)
            {
                elapsed += Time.unscaledDeltaTime;
                if (_blurBackground != null)
                {
                    _blurBackground.color = new Color(0, 0, 0, Mathf.Lerp(0.8f, 1f, elapsed / duration));
                }
                yield return null;
            }
            
            Debug.Log("[EndingChoiceModal] Transitioning to Credits...");
            // SceneManager.LoadScene("CreditsScene");
        }
    }
}
