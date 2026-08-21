using UnityEngine;
using TMPro;
using System.Collections;
using Scar.Core;

namespace Scar.UI_Visuals
{
    public class ComboManager : MonoBehaviour
    {
        public static ComboManager Instance { get; private set; }

        [Header("UI References")]
        [SerializeField] private TextMeshProUGUI _comboCountText;
        [SerializeField] private TextMeshProUGUI _comboGradeText;
        [SerializeField] private RectTransform _comboContainer;

        [Header("Combo Settings")]
        [SerializeField] private float _comboDecayTime = 3f;
        
        private int _currentHits = 0;
        private float _timeSinceLastHit = 0f;
        private bool _isComboActive = false;

        private void Awake()
        {
            if (Instance == null) Instance = this;
            else Destroy(gameObject);

            if (_comboContainer != null) _comboContainer.gameObject.SetActive(false);
        }

        private void OnEnable()
        {
            if (StyleRatingSystem.OnStyleRankChanged != null)
                StyleRatingSystem.OnStyleRankChanged += OnStyleRankUpdated;
            else
                StyleRatingSystem.OnStyleRankChanged = OnStyleRankUpdated;

            if (Hurtbox3D.OnTakeDamage != null)
                Hurtbox3D.OnTakeDamage += OnEnemyDamaged;
            else
                Hurtbox3D.OnTakeDamage = OnEnemyDamaged;
        }

        private void OnDisable()
        {
            StyleRatingSystem.OnStyleRankChanged -= OnStyleRankUpdated;
            Hurtbox3D.OnTakeDamage -= OnEnemyDamaged;
        }

        private void OnStyleRankUpdated(string rank, float multiplier)
        {
            if (_comboGradeText != null)
            {
                _comboGradeText.text = rank;
                // Add color pop depending on rank...
            }
        }

        private void OnEnemyDamaged(Vector3 position, int damage, bool isCritical)
        {
            RegisterHit(1);
            if (FloatingTextManager.Instance != null)
            {
                FloatingTextManager.Instance.SpawnDamageNumber(position, damage, isCritical);
            }
        }

        private void Update()
        {
            if (_isComboActive)
            {
                _timeSinceLastHit += Time.deltaTime;
                if (_timeSinceLastHit >= _comboDecayTime)
                {
                    ResetCombo();
                }
            }
        }

        public void RegisterHit(int hitValue = 1)
        {
            _currentHits += hitValue;
            _timeSinceLastHit = 0f;

            if (!_isComboActive)
            {
                _isComboActive = true;
                if (_comboContainer != null) _comboContainer.gameObject.SetActive(true);
            }

            UpdateComboUI();
            StartCoroutine(ScalePunch(_comboContainer, 1.3f, 0.15f));
        }

        private void UpdateComboUI()
        {
            if (_comboCountText != null) _comboCountText.text = $"{_currentHits} HITS";
            
            if (_comboGradeText != null)
            {
                string grade = "D";
                Color gradeColor = Color.gray;

                if (_currentHits > 30) { grade = "S"; gradeColor = new Color(1f, 0.8f, 0f); }
                else if (_currentHits > 20) { grade = "A"; gradeColor = new Color(1f, 0.2f, 0.2f); }
                else if (_currentHits > 10) { grade = "B"; gradeColor = new Color(0.2f, 0.6f, 1f); }
                else if (_currentHits > 5) { grade = "C"; gradeColor = new Color(0.2f, 1f, 0.2f); }

                _comboGradeText.text = grade;
                _comboGradeText.color = gradeColor;
            }
        }

        private void ResetCombo()
        {
            _isComboActive = false;
            _currentHits = 0;
            if (_comboContainer != null) _comboContainer.gameObject.SetActive(false);
        }

        private IEnumerator ScalePunch(Transform target, float punchScale, float duration)
        {
            if (target == null) yield break;
            Vector3 originalScale = Vector3.one;
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
