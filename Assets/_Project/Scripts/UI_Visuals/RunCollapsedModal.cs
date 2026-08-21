using UnityEngine;
using UnityEngine.UI;
using TMPro;
using Scar.Core;

namespace Scar.UI_Visuals
{
    public class RunCollapsedModal : MonoBehaviour
    {
        [Header("UI Elements")]
        [SerializeField] private GameObject _modalContainer;
        [SerializeField] private TextMeshProUGUI _titleText;
        [SerializeField] private TextMeshProUGUI _scoreText;
        
        [Header("Buttons")]
        [SerializeField] private Button _continueBtn;
        [SerializeField] private Button _restartBtn;

        private void OnEnable()
        {
            EventBus.Subscribe<GameEvents.GameOverEvent>(OnGameOver);
        }

        private void OnDisable()
        {
            EventBus.Unsubscribe<GameEvents.GameOverEvent>(OnGameOver);
        }

        private void Start()
        {
            if (_modalContainer != null) _modalContainer.SetActive(false);

            if (_continueBtn != null) _continueBtn.onClick.AddListener(OnContinueClicked);
            if (_restartBtn != null) _restartBtn.onClick.AddListener(OnRestartClicked);
        }

        private void OnGameOver(GameEvents.GameOverEvent e)
        {
            // Show the modal
            if (_modalContainer != null) _modalContainer.SetActive(true);
            if (_titleText != null) _titleText.text = "RUN COLLAPSED\nMISSION FAILED";
            if (_scoreText != null) _scoreText.text = $"Your current score: {e.FinalScore:N0}";
            
            // Visual Juice (Simulate animation if no LeanTween)
            StartCoroutine(FadeInModal());
        }

        private void OnContinueClicked()
        {
            Debug.Log("[RunCollapsedModal] Continue selected. Applying -20% score penalty.");
            // Logically reduce score and restart from checkpoint/mission
            // GameManager.Instance.GameState.AddScore(-(int)(GameManager.Instance.GameState.Score * 0.2f));
            HideModal();
        }

        private void OnRestartClicked()
        {
            Debug.Log("[RunCollapsedModal] Restart selected. Returning to Mission 1.");
            // Logically restart the run
            // GameManager.Instance.GameState.ResetForNewGame();
            HideModal();
        }

        private void HideModal()
        {
            if (_modalContainer != null) _modalContainer.SetActive(false);
        }

        private System.Collections.IEnumerator FadeInModal()
        {
            var canvasGroup = _modalContainer.GetComponent<CanvasGroup>();
            if (canvasGroup == null) canvasGroup = _modalContainer.AddComponent<CanvasGroup>();
            
            canvasGroup.alpha = 0f;
            float elapsed = 0f;
            float duration = 0.5f;

            while (elapsed < duration)
            {
                elapsed += Time.deltaTime;
                canvasGroup.alpha = Mathf.Lerp(0f, 1f, elapsed / duration);
                yield return null;
            }
            canvasGroup.alpha = 1f;
        }
    }
}
