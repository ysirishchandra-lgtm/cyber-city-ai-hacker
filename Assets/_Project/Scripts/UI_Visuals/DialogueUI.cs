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

        public bool IsActive => _dialoguePanel != null && _dialoguePanel.activeSelf;

        private void Awake()
        {
            if (_dialoguePanel != null) _dialoguePanel.SetActive(false);
            if (_continueIndicator != null) _continueIndicator.SetActive(false);
        }

        private void Update()
        {
            if (!IsActive) return;

            if (Input.GetKeyDown(KeyCode.Space) || Input.GetKeyDown(KeyCode.E) || Input.GetMouseButtonDown(0))
            {
                OnUserAdvanceInput();
            }
        }

        public void StartDialogueSequence(List<DialogueLine> lines, Action onComplete = null)
        {
            if (lines == null || lines.Count == 0)
            {
                onComplete?.Invoke();
                return;
            }

            _onSequenceComplete = onComplete;
            _dialogueQueue.Clear();

            foreach (var line in lines)
            {
                _dialogueQueue.Enqueue(line);
            }

            if (_dialoguePanel != null) _dialoguePanel.SetActive(true);
            DisplayNextLine();
        }

        public void DisplaySingleLine(string speaker, string text, Action onComplete = null)
        {
            var line = new DialogueLine
            {
                Speaker = speaker,
                Text = text,
                AccentColor = GetColorForSpeaker(speaker)
            };

            StartDialogueSequence(new List<DialogueLine> { line }, onComplete);
        }

        private void DisplayNextLine()
        {
            if (_dialogueQueue.Count == 0)
            {
                EndDialogue();
                return;
            }

            var line = _dialogueQueue.Dequeue();
            _currentFullText = line.Text;

            if (_speakerNameText != null)
            {
                _speakerNameText.text = line.Speaker.ToUpper();
                _speakerNameText.color = line.AccentColor != default ? line.AccentColor : GetColorForSpeaker(line.Speaker);
            }

            if (_accentGlowImage != null)
            {
                _accentGlowImage.color = line.AccentColor != default ? line.AccentColor : GetColorForSpeaker(line.Speaker);
            }

            if (_continueIndicator != null) _continueIndicator.SetActive(false);

            if (_typingCoroutine != null) StopCoroutine(_typingCoroutine);
            _typingCoroutine = StartCoroutine(TypeText(line.Text));
        }

        private IEnumerator TypeText(string text)
        {
            _isTyping = true;
            if (_dialogueBodyText != null) _dialogueBodyText.text = string.Empty;

            foreach (char c in text)
            {
                if (_dialogueBodyText != null) _dialogueBodyText.text += c;
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

        public void OnUserAdvanceInput()
        {
            if (_isTyping)
            {
                // Fast-forward to complete line
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

        private void EndDialogue()
        {
            if (_dialoguePanel != null) _dialoguePanel.SetActive(false);
            if (_continueIndicator != null) _continueIndicator.SetActive(false);
            _onSequenceComplete?.Invoke();
            _onSequenceComplete = null;
        }

        private Color GetColorForSpeaker(string speaker)
        {
            if (string.IsNullOrEmpty(speaker)) return Color.white;
            string s = speaker.ToUpper();
            if (s.Contains("ATLAS") && s.Contains("TYRANT")) return _atlasDarkColor;
            if (s.Contains("ATLAS")) return _atlasColor;
            if (s.Contains("KIRA")) return _kiraColor;
            if (s.Contains("INNER") || s.Contains("VOICE")) return _innerVoiceColor;
            if (s.Contains("PLAYER")) return _playerColor;
            return Color.white;
        }
    }
}
