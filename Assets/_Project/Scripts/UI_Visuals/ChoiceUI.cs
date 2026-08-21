using System;
using UnityEngine;
using UnityEngine.UI;
using TMPro;
using Scar.Core;

namespace Scar.UI
{
    /// <summary>
    /// SCAR — The Last Choice
    /// ChoiceUI: Holographic Moral & Power Awakening Choice Overlay (Unity 6 / TextMeshPro / Unity UI).
    /// Listens to ChoicePresentedEvent. Dispatches selections via EventBus and GameManager.
    /// Strictly adheres to team ownership rules (never mutates GameState directly).
    /// Author: Ashwidha (Visual / UI / Cinematic Lead)
    /// </summary>
    public class ChoiceUI : MonoBehaviour
    {
        [System.Serializable]
        public class ChoiceCard
        {
            public GameObject Container;
            public TextMeshProUGUI NumberKeyText;
            public TextMeshProUGUI TitleText;
            public TextMeshProUGUI DescriptionText;
            public Button ActionButton;
            public Image BorderGlow;
            public Image BackgroundGlow;
        }

        [Header("UI Containers")]
        [SerializeField] private GameObject _choicePanel;
        [SerializeField] private TextMeshProUGUI _promptTitleText;
        [SerializeField] private TextMeshProUGUI _promptSubtext;
        [SerializeField] private ChoiceCard[] _choiceCards = new ChoiceCard[3];

        [Header("Card Color Palettes")]
        [SerializeField] private Color _aggressiveColor = new Color(1f, 0.2f, 0.1f, 1f);  // Destruction Crimson
        [SerializeField] private Color _protectiveColor = new Color(0f, 0.6f, 1f, 1f);   // Protection Azure
        [SerializeField] private Color _strategicColor = new Color(0f, 1f, 0.5f, 1f);    // Control Emerald
        [SerializeField] private Color _neutralColor = new Color(0.8f, 0.8f, 0.9f, 1f);

        private string _activeChoiceId = string.Empty;
        private string[] _activeOptionIds = new string[3];
        private bool _isAwaitingInput = false;

        public bool IsActive => _choicePanel != null && _choicePanel.activeSelf;

        private void OnEnable()
        {
            EventBus.Subscribe<GameEvents.ChoicePresentedEvent>(OnChoicePresented);
            SetupButtonListeners();
        }

        private void OnDisable()
        {
            EventBus.Unsubscribe<GameEvents.ChoicePresentedEvent>(OnChoicePresented);
            RemoveButtonListeners();
        }

        private void Start()
        {
            if (_choicePanel != null) _choicePanel.SetActive(false);
        }

        private void Update()
        {
            if (!_isAwaitingInput) return;

            // Keyboard Number Shortcuts [1], [2], [3]
            if (Input.GetKeyDown(KeyCode.Alpha1) || Input.GetKeyDown(KeyCode.Keypad1))
            {
                SelectOption(0);
            }
            else if (Input.GetKeyDown(KeyCode.Alpha2) || Input.GetKeyDown(KeyCode.Keypad2))
            {
                SelectOption(1);
            }
            else if (Input.GetKeyDown(KeyCode.Alpha3) || Input.GetKeyDown(KeyCode.Keypad3))
            {
                SelectOption(2);
            }
        }

        private void SetupButtonListeners()
        {
            for (int i = 0; i < _choiceCards.Length; i++)
            {
                int index = i;
                if (_choiceCards[i].ActionButton != null)
                {
                    _choiceCards[i].ActionButton.onClick.RemoveAllListeners();
                    _choiceCards[i].ActionButton.onClick.AddListener(() => SelectOption(index));
                }
            }
        }

        private void RemoveButtonListeners()
        {
            for (int i = 0; i < _choiceCards.Length; i++)
            {
                if (_choiceCards[i].ActionButton != null)
                {
                    _choiceCards[i].ActionButton.onClick.RemoveAllListeners();
                }
            }
        }

        public void OnChoicePresented(GameEvents.ChoicePresentedEvent e)
        {
            _activeChoiceId = e.ChoiceId;

            if (_promptTitleText != null) _promptTitleText.text = e.Title.ToUpper();
            if (_promptSubtext != null) _promptSubtext.text = "YOUR DECISION WILL SHAPE YOUR POWERS AND NARRATIVE TRAJECTORY.";

            _activeOptionIds = new string[3];

            for (int i = 0; i < _choiceCards.Length; i++)
            {
                if (i < e.OptionDescriptions.Length && !string.IsNullOrEmpty(e.OptionDescriptions[i]))
                {
                    _choiceCards[i].Container.SetActive(true);
                    if (_choiceCards[i].NumberKeyText != null) _choiceCards[i].NumberKeyText.text = $"[{i + 1}]";
                    if (_choiceCards[i].TitleText != null) _choiceCards[i].TitleText.text = GetOptionHeading(i, e.ChoiceId);
                    if (_choiceCards[i].DescriptionText != null) _choiceCards[i].DescriptionText.text = e.OptionDescriptions[i];

                    Color cardColor = GetOptionColor(i, e.ChoiceId);
                    if (_choiceCards[i].BorderGlow != null) _choiceCards[i].BorderGlow.color = cardColor;
                    if (_choiceCards[i].TitleText != null) _choiceCards[i].TitleText.color = cardColor;

                    _activeOptionIds[i] = $"OPT_{e.ChoiceId}_{i + 1}";
                }
                else
                {
                    _choiceCards[i].Container.SetActive(false);
                }
            }

            if (_choicePanel != null) _choicePanel.SetActive(true);
            _isAwaitingInput = true;
        }

        public void PresentPowerAwakening()
        {
            var powerEvent = new GameEvents.ChoicePresentedEvent
            {
                ChoiceId = "CHOICE_POWER_AWAKENING",
                Title = "SURGE DETECTED // AWAKEN YOUR POWER",
                OptionDescriptions = new string[]
                {
                    "DESTRUCTION — Unleash raw offensive kinetic shockwaves. Obliterate hostiles without hesitation.",
                    "PROTECTION — Manifest impenetrable kinetic barriers. Shield yourself and innocent lives.",
                    "CONTROL — Harness quantum stasis fields. Hack enemy systems and manipulate the battlefield."
                }
            };

            OnChoicePresented(powerEvent);
        }

        public void SelectOption(int optionIndex)
        {
            if (!_isAwaitingInput || optionIndex < 0 || optionIndex >= _choiceCards.Length) return;

            _isAwaitingInput = false;
            string selectedOpt = _activeOptionIds[optionIndex] ?? $"OPT_{_activeChoiceId}_{optionIndex + 1}";

            // Determine power/moral alignment impacts
            float revenge = 0f;
            float humanity = 0f;
            float freedom = 0f;
            float control = 0f;

            if (_activeChoiceId == "CHOICE_POWER_AWAKENING")
            {
                if (optionIndex == 0)
                {
                    GameManager.Instance?.State?.UnlockPower("AGGRESSIVE", "DESTRUCTION NOVA");
                    revenge += 25f;
                }
                else if (optionIndex == 1)
                {
                    GameManager.Instance?.State?.UnlockPower("PROTECTIVE", "KINETIC BARRIER");
                    humanity += 25f;
                }
                else
                {
                    GameManager.Instance?.State?.UnlockPower("STRATEGIC", "CHRONO STASIS");
                    control += 25f;
                }
            }

            // Authoritative state update through GameManager
            if (GameManager.Instance != null && GameManager.Instance.State != null)
            {
                GameManager.Instance.State.RecordChoice(_activeChoiceId, selectedOpt, optionIndex, revenge, humanity, freedom, control);
            }
            else
            {
                var choiceEvent = new GameEvents.ChoiceSelectedEvent
                {
                    ChoiceId = _activeChoiceId,
                    SelectedOptionId = selectedOpt,
                    ChoiceIndex = optionIndex
                };
                EventBus.Publish(choiceEvent);
            }

            if (_choicePanel != null) _choicePanel.SetActive(false);
        }

        private string GetOptionHeading(int index, string choiceId)
        {
            if (choiceId.Contains("POWER"))
            {
                switch (index)
                {
                    case 0: return "DESTRUCTION";
                    case 1: return "PROTECTION";
                    case 2: return "CONTROL";
                }
            }
            return $"OPTION 0{index + 1}";
        }

        private Color GetOptionColor(int index, string choiceId)
        {
            switch (index)
            {
                case 0: return _aggressiveColor;
                case 1: return _protectiveColor;
                case 2: return _strategicColor;
                default: return _neutralColor;
            }
        }
    }
}
