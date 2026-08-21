using UnityEngine;
using UnityEngine.UI;
using TMPro;
using System.Collections.Generic;
using Scar.Core;

namespace Scar.UI_Visuals
{
    public class LobbyUIManager : MonoBehaviour
    {
        [Header("Character Profiles")]
        [SerializeField] private List<CharacterProfile> _characters;
        private int _currentIndex = 0;

        [Header("UI References - Character Info")]
        [SerializeField] private TextMeshProUGUI _characterNameText;
        [SerializeField] private TextMeshProUGUI _playstyleText;
        [SerializeField] private TextMeshProUGUI _descriptionText;
        [SerializeField] private TextMeshProUGUI _strengthText;
        [SerializeField] private TextMeshProUGUI _weaknessText;
        [SerializeField] private Image _characterArtImage;
        [SerializeField] private Image _themeGlowImage;

        [Header("UI References - Telemetry Panels")]
        [SerializeField] private TextMeshProUGUI _bestScoreText;
        [SerializeField] private TextMeshProUGUI _bestTimeText;
        [SerializeField] private TextMeshProUGUI _previousRunStatusText;

        [Header("Buttons")]
        [SerializeField] private Button _nextCharacterBtn;
        [SerializeField] private Button _prevCharacterBtn;
        [SerializeField] private Button _startRunBtn;

        private void Start()
        {
            if (_characters == null || _characters.Count == 0)
            {
                Debug.LogError("[LobbyUIManager] No characters assigned!");
                return;
            }

            _nextCharacterBtn.onClick.AddListener(NextCharacter);
            _prevCharacterBtn.onClick.AddListener(PreviousCharacter);
            _startRunBtn.onClick.AddListener(StartRun);

            LoadTelemetry();
            UpdateCharacterDisplay();
        }

        private void LoadTelemetry()
        {
            // In a full implementation, this fetches from LocalSaveService or IAWSBackendService.
            // For now, mock data as per UI layout requirement.
            _bestScoreText.text = "BEST SCORE: 12,450";
            _bestTimeText.text = "BEST TIME: 04:25";
            _previousRunStatusText.text = "PREVIOUS: MISSION 3 FAILED";
        }

        private void NextCharacter()
        {
            _currentIndex = (_currentIndex + 1) % _characters.Count;
            UpdateCharacterDisplay();
        }

        private void PreviousCharacter()
        {
            _currentIndex--;
            if (_currentIndex < 0) _currentIndex = _characters.Count - 1;
            UpdateCharacterDisplay();
        }

        private void UpdateCharacterDisplay()
        {
            var profile = _characters[_currentIndex];
            
            _characterNameText.text = profile.characterName;
            _characterNameText.color = profile.themeColor;
            
            _playstyleText.text = $"STYLE: {profile.playstyle}";
            _descriptionText.text = profile.description;
            _strengthText.text = $"[+] {profile.strength}";
            _weaknessText.text = $"[-] {profile.weakness}";

            if (profile.characterArt != null)
            {
                _characterArtImage.sprite = profile.characterArt;
                _characterArtImage.gameObject.SetActive(true);
            }
            else
            {
                _characterArtImage.gameObject.SetActive(false);
            }

            if (_themeGlowImage != null)
            {
                StartCoroutine(ShiftThemeColor(new Color(profile.themeColor.r, profile.themeColor.g, profile.themeColor.b, 0.3f), 0.3f));
            }

            // Play a snappy UI sound and small pop animation here for game feel
            // AudioManager.Play("UI_Hover");
            PlayCharacterSwapAnimation();
        }

        private System.Collections.IEnumerator ShiftThemeColor(Color targetColor, float duration)
        {
            Color startColor = _themeGlowImage.color;
            float elapsed = 0f;
            while (elapsed < duration)
            {
                elapsed += Time.deltaTime;
                _themeGlowImage.color = Color.Lerp(startColor, targetColor, elapsed / duration);
                yield return null;
            }
            _themeGlowImage.color = targetColor;
        }

        private void PlayCharacterSwapAnimation()
        {
            // Simple punch scale effect for visual juice using Coroutines
            StartCoroutine(ScalePunch(_characterArtImage.transform, 1.1f, 0.2f));
        }

        private void StartRun()
        {
            var selectedCharacter = _characters[_currentIndex];
            Debug.Log($"[LobbyUIManager] Starting run with {selectedCharacter.characterName}");
            
            // Visual juice on start
            StartCoroutine(ScalePunch(_startRunBtn.transform, 1.2f, 0.1f));
            StartCoroutine(FadeOutLobby());
        }

        private System.Collections.IEnumerator FadeOutLobby()
        {
            var canvasGroup = GetComponent<CanvasGroup>();
            if (canvasGroup == null) canvasGroup = gameObject.AddComponent<CanvasGroup>();

            float elapsed = 0f;
            float duration = 0.5f;
            while (elapsed < duration)
            {
                elapsed += Time.deltaTime;
                canvasGroup.alpha = Mathf.Lerp(1f, 0f, elapsed / duration);
                yield return null;
            }
            canvasGroup.alpha = 0f;
            
            // Link to GameState
            // GameManager.Instance.GameState.SetPlayerIdentity(..., _characters[_currentIndex].characterId);
            
            // Transition to Level 1
            // EventBus.Publish(new GameEvents.PhaseChangedEvent { NewPhase = GamePhase.GAMEPLAY });
        }

        private System.Collections.IEnumerator ScalePunch(Transform target, float punchScale, float duration)
        {
            Vector3 originalScale = Vector3.one; // Assume base scale is 1
            target.localScale = originalScale * punchScale;
            float elapsed = 0f;

            while (elapsed < duration)
            {
                elapsed += Time.deltaTime;
                float t = elapsed / duration;
                target.localScale = Vector3.Lerp(originalScale * punchScale, originalScale, t);
                yield return null;
            }

            target.localScale = originalScale;
        }
    }
}
