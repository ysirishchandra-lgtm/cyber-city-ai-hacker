using System;
using UnityEngine;
using UnityEngine.UI;
using TMPro;
using Scar.Core;

namespace Scar.UI
{
    /// <summary>
    /// SCAR — The Last Choice
    /// EndingScreenUI: "WHO DID YOU BECOME?" Monolithic Resolution Screen (Unity 6 / TextMeshPro).
    /// Subscribes to EndingReachedEvent. Displays authoritative score & statistics from GameState.
    /// Strictly ZERO fake data / ZERO fabricated leaderboard entries.
    /// Author: Ashwidha (Visual / UI / Cinematic Lead)
    /// </summary>
    public class EndingScreenUI : MonoBehaviour
    {
        [Header("UI Panels")]
        [SerializeField] private GameObject _endingPanel;
        [SerializeField] private CanvasGroup _canvasGroup;

        [Header("Narrative Resolution Display")]
        [SerializeField] private TextMeshProUGUI _endingTitleText;
        [SerializeField] private TextMeshProUGUI _endingSubtitleText;
        [SerializeField] private TextMeshProUGUI _narrativeEpilogueText;
        [SerializeField] private Image _backgroundAuraImage;

        [Header("Authoritative Gameplay Telemetry")]
        [SerializeField] private TextMeshProUGUI _playerNameText;
        [SerializeField] private TextMeshProUGUI _finalScoreText;
        [SerializeField] private TextMeshProUGUI _enemiesDefeatedText;
        [SerializeField] private TextMeshProUGUI _missionsCompletedText;
        [SerializeField] private TextMeshProUGUI _choicesMadeText;
        [SerializeField] private TextMeshProUGUI _powerPathText;

        [Header("Action Buttons")]
        [SerializeField] private Button _mainMenuButton;
        [SerializeField] private Button _restartButton;

        [Header("Ending Color Palettes")]
        [SerializeField] private Color _villainColor = new Color(0.85f, 0.05f, 0.15f, 1f); // Dark Crimson
        [SerializeField] private Color _heroColor = new Color(0.1f, 0.8f, 0.4f, 1f);      // Emerald Dawn
        [SerializeField] private Color _saviorColor = new Color(0f, 0.85f, 1f, 1f);       // Celestial Cyan
        [SerializeField] private Color _humanColor = new Color(1f, 0.7f, 0.2f, 1f);       // Warm Amber

        private void Awake()
        {
            if (_endingPanel != null) _endingPanel.SetActive(false);

            if (_mainMenuButton != null)
            {
                _mainMenuButton.onClick.AddListener(OnMainMenuClicked);
            }

            if (_restartButton != null)
            {
                _restartButton.onClick.AddListener(OnRestartClicked);
            }
        }

        private void OnEnable()
        {
            EventBus.Subscribe<GameEvents.EndingReachedEvent>(OnEndingReached);
        }

        private void OnDisable()
        {
            EventBus.Unsubscribe<GameEvents.EndingReachedEvent>(OnEndingReached);
        }

        private void OnEndingReached(GameEvents.EndingReachedEvent e)
        {
            DisplayEnding(e.EndingId, e.FinalScore);
        }

        public void DisplayEnding(string endingId, int finalScore)
        {
            if (_endingPanel != null) _endingPanel.SetActive(true);

            string endingUpper = endingId.ToUpper();
            Color themeColor = GetEndingColor(endingUpper);

            if (_endingTitleText != null)
            {
                _endingTitleText.text = $"WHO DID YOU BECOME? // THE {endingUpper}";
                _endingTitleText.color = themeColor;
            }

            if (_endingSubtitleText != null)
            {
                _endingSubtitleText.text = GetEndingTagline(endingUpper);
            }

            if (_narrativeEpilogueText != null)
            {
                _narrativeEpilogueText.text = GetEndingEpilogue(endingUpper);
            }

            if (_backgroundAuraImage != null)
            {
                _backgroundAuraImage.color = new Color(themeColor.r, themeColor.g, themeColor.b, 0.35f);
            }

            // Real stats from authoritative GameState
            if (GameManager.Instance != null && GameManager.Instance.State != null)
            {
                var state = GameManager.Instance.State;
                if (_playerNameText != null) _playerNameText.text = $"OPERATIVE: {state.PlayerName.ToUpper()}";
                if (_finalScoreText != null) _finalScoreText.text = $"FINAL SCORE: {finalScore:N0}";
                if (_enemiesDefeatedText != null) _enemiesDefeatedText.text = $"ELIMINATIONS: {state.EnemiesDefeated}";
                if (_missionsCompletedText != null) _missionsCompletedText.text = $"SECTORS CLEARED: {state.MissionsCompleted}";
                if (_choicesMadeText != null) _choicesMadeText.text = $"CRITICAL CHOICES: {state.ChoicesMade}";
                if (_powerPathText != null) _powerPathText.text = $"POWER PATH: {state.PowerPath}";
            }
            else
            {
                if (_finalScoreText != null) _finalScoreText.text = $"FINAL SCORE: {finalScore:N0}";
            }
        }

        private void OnMainMenuClicked()
        {
            if (GameManager.Instance != null && GameManager.Instance.SceneFlow != null)
            {
                GameManager.Instance.SceneFlow.LoadMainMenu();
            }
        }

        private void OnRestartClicked()
        {
            if (GameManager.Instance != null)
            {
                GameManager.Instance.StartNewGame("LOCAL_USER", "Player");
            }
        }

        private Color GetEndingColor(string ending)
        {
            switch (ending)
            {
                case "VILLAIN": return _villainColor;
                case "HERO": return _heroColor;
                case "SAVIOR": return _saviorColor;
                case "HUMAN": return _humanColor;
                default: return Color.white;
            }
        }

        private string GetEndingTagline(string ending)
        {
            switch (ending)
            {
                case "VILLAIN": return "ORDER DESTROYED. FEAR IS THE NEW LAW.";
                case "HERO": return "THE BURDEN OF THE CITY RESTS ON YOUR SHOULDERS.";
                case "SAVIOR": return "POWER RETURNED TO THE PEOPLE. A NEW ERA BEGINS.";
                case "HUMAN": return "NO SPARK. NO CROWN. PROOF THAT HUMANITY IS ENOUGH.";
                default: return "THE LAST CHOICE HAS BEEN MADE.";
            }
        }

        private string GetEndingEpilogue(string ending)
        {
            switch (ending)
            {
                case "VILLAIN":
                    return "You took their power and turned it against them. The Atlas Corporation is reduced to ash. The city fears you, and no one dares stand in your way.";
                case "HERO":
                    return "You refused Atlas's corruption but preserved the city's structure. You stand vigil alone on the rooftops of Neo-Veridia, a solitary guardian.";
                case "SAVIOR":
                    return "By breaking the power monopoly, you gave every civilian a voice. The hierarchy is dissolved, and the people begin rebuilding together.";
                case "HUMAN":
                    return "You conquered the most powerful being in Neo-Veridia without using superpowers. The myth of ascension is shattered forever.";
                default:
                    return "Your journey through the neon ruins of Sector 4 has reached its conclusion.";
            }
        }
    }
}
