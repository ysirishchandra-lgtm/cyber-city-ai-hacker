using System;
using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using UnityEngine.UI;
using TMPro;
using Scar.Core;

namespace Scar.UI
{
    /// <summary>
    /// SCAR — The Last Choice
    /// DialogueUI: Cyberpunk In-Game Comms Window (Unity 6 / TextMeshPro / Unity UI).
    /// Features character portraits, typewriter text progression, and skip handling.
    /// Author: Ashwidha (Visual / UI / Cinematic Lead)
    /// </summary>
    public class DialogueUI : MonoBehaviour
    {
        [System.Serializable]
        public struct DialogueLine
        {
            public string Speaker;
            [TextArea(2, 5)] public string Text;
            public Color AccentColor;
        }

        [Header("UI Containers")]
        [SerializeField] private GameObject _dialoguePanel;
        [SerializeField] private TextMeshProUGUI _speakerNameText;
        [SerializeField] private TextMeshProUGUI _dialogueBodyText;
        [SerializeField] private Image _portraitImage;
        [SerializeField] private Image _accentGlowImage;
        [SerializeField] private GameObject _continueIndicator;

        [Header("Tuning")]
        [SerializeField] private float _typingSpeed = 0.025f;
        [SerializeField] private bool _autoAdvance = false;
        [SerializeField] private float _autoAdvanceDelay = 2.5f;

        [Header("Character Color Palette")]
        [SerializeField] private Color _atlasColor = new Color(1f, 0.85f, 0.2f, 1f);      // Gold
        [SerializeField] private Color _atlasDarkColor = new Color(0.9f, 0.1f, 0.2f, 1f);  // Tyrant Crimson
        [SerializeField] private Color _kiraColor = new Color(0f, 0.95f, 1f, 1f);         // Cyber Cyan
        [SerializeField] private Color _innerVoiceColor = new Color(0.7f, 0.3f, 1f, 1f);  // Deep Violet
        [SerializeField] private Color _playerColor = new Color(1f, 0.3f, 0.3f, 1f);      // Scar Red

        private Queue<DialogueLine> _dialogueQueue = new Queue<DialogueLine>();
        private Coroutine _typingCoroutine;
        private bool _isTyping = false;
        private string _currentFullText = string.Empty;
        private Action _onSequenceComplete;

        public bool IsActive { get { return _dialoguePanel != null && _dialoguePanel.activeSelf; } }

        private void Awake()
        {
            if (_dialoguePanel != null) _dialoguePanel.SetActive(false);
            if (_continueIndicator != null) _continueIndicator.SetActive(false);
        }

        private void Update()
        {
            if (!IsActive) return;

            if (Input.GetKeyDown(KeyCode.Space) || Input.GetMouseButtonDown(0))
            {
                OnAdvanceInput();
            }
        }

        public void StartDialogueSequence(IEnumerable<DialogueLine> lines, Action onComplete = null)
        {
            if (lines == null) return;

            _dialogueQueue.Clear();
            foreach (var line in lines)
            {
                _dialogueQueue.Enqueue(line);
            }

            _onSequenceComplete = onComplete;

            if (_dialoguePanel != null) _dialoguePanel.SetActive(true);
            DisplayNextLine();
        }

        public void DisplayNextLine()
        {
            if (_dialogueQueue.Count == 0)
            {
                EndDialogueSequence();
                return;
            }

            var nextLine = _dialogueQueue.Dequeue();

            if (_speakerNameText != null) _speakerNameText.text = nextLine.Speaker.ToUpper();
            if (_accentGlowImage != null) _accentGlowImage.color = nextLine.AccentColor != default(Color) ? nextLine.AccentColor : GetCharacterColor(nextLine.Speaker);
            if (_speakerNameText != null) _speakerNameText.color = _accentGlowImage != null ? _accentGlowImage.color : Color.white;

            if (_typingCoroutine != null) StopCoroutine(_typingCoroutine);
            _typingCoroutine = StartCoroutine(TypeText(nextLine.Text));
        }

        public void OnAdvanceInput()
        {
            if (_isTyping)
            {
                // Instant skip typing
                if (_typingCoroutine != null) StopCoroutine(_typingCoroutine);
                if (_dialogueBodyText != null) _dialogueBodyText.text = _currentFullText;
                _isTyping = false;
                if (_continueIndicator != null) _continueIndicator.SetActive(true);
            }
            else
            {
                DisplayNextLine();
            }
        }

        private IEnumerator TypeText(string fullText)
        {
            _isTyping = true;
            _currentFullText = fullText;
            if (_dialogueBodyText != null) _dialogueBodyText.text = string.Empty;
            if (_continueIndicator != null) _continueIndicator.SetActive(false);

            for (int i = 0; i <= fullText.Length; i++)
            {
                if (_dialogueBodyText != null) _dialogueBodyText.text = fullText.Substring(0, i);
                yield return new WaitForSeconds(_typingSpeed);
            }

            _isTyping = false;
            if (_continueIndicator != null) _continueIndicator.SetActive(true);

            if (_autoAdvance)
            {
                yield return new WaitForSeconds(_autoAdvanceDelay);
                DisplayNextLine();
            }
        }

        private void EndDialogueSequence()
        {
            if (_dialoguePanel != null) _dialoguePanel.SetActive(false);
            if (_onSequenceComplete != null)
            {
                _onSequenceComplete.Invoke();
                _onSequenceComplete = null;
            }
        }

        private Color GetCharacterColor(string speaker)
        {
            if (string.IsNullOrEmpty(speaker)) return Color.white;
            switch (speaker.ToUpper())
            {
                case "ATLAS": return _atlasColor;
                case "ATLAS (TYRANT)": return _atlasDarkColor;
                case "KIRA": return _kiraColor;
                case "INNER VOICE": return _innerVoiceColor;
                case "PLAYER": return _playerColor;
                default: return Color.white;
            }
        }
    }
}
