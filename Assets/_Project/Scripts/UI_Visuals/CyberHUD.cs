using System;
using System.Collections;
using UnityEngine;
using UnityEngine.UI;
using TMPro;
using Scar.Core;

namespace Scar.UI
{
    /// <summary>
    /// SCAR — The Last Choice
    /// CyberHUD: High-Tech Cyberpunk Tactical Visor HUD (Unity 6 / TextMeshPro / Unity UI).
    /// Subscribes to GameEvents via EventBus and displays real GameState.
    /// Strictly READ-ONLY. Never directly mutates GameState.
    /// Author: Ashwidha (Visual / UI / Cinematic Lead)
    /// </summary>
    public class CyberHUD : MonoBehaviour
    {
        public static CyberHUD Instance { get; private set; }

        private void Awake()
        {
            if (Instance == null) Instance = this;
            else Destroy(gameObject);
        }

        [Header("Player Vital Visor")]
        [SerializeField] private Slider _healthSlider;
        [SerializeField] private Slider _ghostHealthSlider;
        [SerializeField] private TextMeshProUGUI _healthText;
        [SerializeField] private Slider _staminaSlider;
        [SerializeField] private TextMeshProUGUI _staminaText;
        [SerializeField] private TextMeshProUGUI _playerNameText;
        [SerializeField] private TextMeshProUGUI _levelPhaseText;

        [Header("Tactical Mission & Objective Tracker")]
        [SerializeField] private GameObject _objectivePanel;
        [SerializeField] private TextMeshProUGUI _objectiveTitleText;
        [SerializeField] private TextMeshProUGUI _objectiveDescriptionText;

        [Header("Power Core Visor")]
        [SerializeField] private GameObject _powerPanel;
        [SerializeField] private Image _powerIcon;
        [SerializeField] private Image _powerCooldownFill;
        [SerializeField] private TextMeshProUGUI _powerNameText;
        [SerializeField] private TextMeshProUGUI _powerStatusText;
        [SerializeField] private TextMeshProUGUI _powerLevelText;

        [Header("Combat Telemetry & Score Counter")]
        [SerializeField] private TextMeshProUGUI _scoreText;
        [SerializeField] private TextMeshProUGUI _enemiesDefeatedText;
        [SerializeField] private TextMeshProUGUI _threatLevelText;
        [SerializeField] private Image _threatIndicatorImage;

        [Header("Tuning Parameters")]
        [SerializeField] private float _ghostHealthDrainSpeed = 25f;
        [SerializeField] private float _scoreRollupSpeed = 500f;
        [SerializeField] private Color _normalThreatColor = new Color(0f, 0.95f, 1f, 1f); // Cyan
        [SerializeField] private Color _highThreatColor = new Color(1f, 0.7f, 0f, 1f);    // Amber
        [SerializeField] private Color _bossThreatColor = new Color(1f, 0f, 0.2f, 1f);    // Crimson

        [Header("Deadline Timer")]
        [SerializeField] private TextMeshProUGUI _deadlineTimerText;
        [SerializeField] private Color _timerNormalColor = Color.white;
        [SerializeField] private Color _timerWarningColor = Color.red;
        private float _currentDeadline = 480f; // 8 mins default
        private bool _isTimerActive = false;

        private float _targetHealth = 100f;
        private float _currentGhostHealth = 100f;
        private float _maxHealth = 100f;
        private int _displayedScore = 0;
        private int _targetScore = 0;
        private Coroutine _scoreRollupCoroutine;

        private void OnEnable()
        {
            RegisterEventSubscriptions();
            InitializeHUD();
        }

        private void OnDisable()
        {
            UnregisterEventSubscriptions();
        }

        private void Update()
        {
            UpdateGhostHealth(Time.deltaTime);
            UpdateStaminaFromGameplay();
            UpdateDeadlineTimer(Time.deltaTime);
        }

        private void UpdateDeadlineTimer(float dt)
        {
            if (!_isTimerActive || _deadlineTimerText == null) return;
            
            _currentDeadline -= dt;
            if (_currentDeadline <= 0)
            {
                _currentDeadline = 0;
                _isTimerActive = false;
                // Trigger time up event
                // EventBus.Publish(new GameEvents.TimeUpEvent());
            }

            int minutes = Mathf.FloorToInt(_currentDeadline / 60F);
            int seconds = Mathf.FloorToInt(_currentDeadline - minutes * 60);
            _deadlineTimerText.text = string.Format("{0:0}:{1:00}", minutes, seconds);

            if (_currentDeadline <= 60f)
            {
                // Pulse red
                _deadlineTimerText.color = Color.Lerp(_timerWarningColor, _timerNormalColor, Mathf.PingPong(Time.time * 2f, 1f));
            }
            else
            {
                _deadlineTimerText.color = _timerNormalColor;
            }
        }

        public void StartDeadlineTimer(float initialTimeInSeconds)
        {
            _currentDeadline = initialTimeInSeconds;
            _isTimerActive = true;
            if (_deadlineTimerText != null)
            {
                int minutes = Mathf.FloorToInt(_currentDeadline / 60F);
                int seconds = Mathf.FloorToInt(_currentDeadline - minutes * 60);
                _deadlineTimerText.text = string.Format("{0:0}:{1:00}", minutes, seconds);
                _deadlineTimerText.color = _timerNormalColor;
            }
        }

        public void ActivateHUD()
        {
            gameObject.SetActive(true);
        }

        // ─── Lifecycle & Subscriptions ────────────────────────────────────────────────────────

        private void RegisterEventSubscriptions()
        {
            EventBus.Subscribe<GameEvents.GameStartedEvent>(OnGameStarted);
            EventBus.Subscribe<GameEvents.PlayerDamagedEvent>(OnPlayerDamaged);
            EventBus.Subscribe<GameEvents.LevelStartedEvent>(OnLevelStarted);
            EventBus.Subscribe<GameEvents.PhaseChangedEvent>(OnPhaseChanged);
            EventBus.Subscribe<GameEvents.PowerUnlockedEvent>(OnPowerUnlocked);
            EventBus.Subscribe<GameEvents.EnemyDefeatedEvent>(OnEnemyDefeated);
            EventBus.Subscribe<GameEvents.BossDefeatedEvent>(OnBossDefeated);
        }

        private void UnregisterEventSubscriptions()
        {
            EventBus.Unsubscribe<GameEvents.GameStartedEvent>(OnGameStarted);
            EventBus.Unsubscribe<GameEvents.PlayerDamagedEvent>(OnPlayerDamaged);
            EventBus.Unsubscribe<GameEvents.LevelStartedEvent>(OnLevelStarted);
            EventBus.Unsubscribe<GameEvents.PhaseChangedEvent>(OnPhaseChanged);
            EventBus.Unsubscribe<GameEvents.PowerUnlockedEvent>(OnPowerUnlocked);
            EventBus.Unsubscribe<GameEvents.EnemyDefeatedEvent>(OnEnemyDefeated);
            EventBus.Unsubscribe<GameEvents.BossDefeatedEvent>(OnBossDefeated);
        }

        public void InitializeHUD()
        {
            if (GameManager.Instance != null && GameManager.Instance.State != null)
            {
                var state = GameManager.Instance.State;
                _maxHealth = state.MaxHealth > 0 ? state.MaxHealth : 100f;
                _targetHealth = state.Health;
                _currentGhostHealth = state.Health;

                if (_playerNameText != null) _playerNameText.text = state.PlayerName.ToUpper();
                if (_levelPhaseText != null) _levelPhaseText.text = "LVL." + state.CurrentLevel + " // " + state.CurrentPhase;
                if (_scoreText != null) _scoreText.text = "SCORE: " + state.Score;
                if (_enemiesDefeatedText != null) _enemiesDefeatedText.text = "ELIMINATIONS: " + state.EnemiesDefeated;

                UpdateHealthUI(_targetHealth, _maxHealth);
                UpdatePowerStatus(state.PowerPath, "READY");
            }
        }

        // ─── Event Handlers ─────────────────────────────────────────────────────────

        private void OnGameStarted(GameEvents.GameStartedEvent e)
        {
            if (_playerNameText != null) _playerNameText.text = e.PlayerName.ToUpper();
            _targetScore = 0;
            _displayedScore = 0;
            if (_scoreText != null) _scoreText.text = "SCORE: 0";
            if (_enemiesDefeatedText != null) _enemiesDefeatedText.text = "ELIMINATIONS: 0";
            UpdateThreatLevel(GamePhase.LEVEL_1);
        }

        private void OnPlayerDamaged(GameEvents.PlayerDamagedEvent e)
        {
            _targetHealth = Mathf.Max(0f, e.RemainingHealth);
            UpdateHealthUI(_targetHealth, _maxHealth);
        }

        private void OnLevelStarted(GameEvents.LevelStartedEvent e)
        {
            if (_objectiveTitleText != null) _objectiveTitleText.text = "▶ MISSION: " + e.LevelName.ToUpper();
            if (_objectiveDescriptionText != null) _objectiveDescriptionText.text = "Infiltrate sector " + e.LevelIndex + " and locate the source.";
            if (_levelPhaseText != null) _levelPhaseText.text = "LVL." + e.LevelIndex + " // ACTIVE";
        }

        private void OnPhaseChanged(GameEvents.PhaseChangedEvent e)
        {
            if (_levelPhaseText != null) _levelPhaseText.text = "PHASE: " + e.NewPhase.ToString().Replace('_', ' ');
            UpdateThreatLevel(e.NewPhase);

            if (e.NewPhase == GamePhase.FINAL_ENCOUNTER)
            {
                if (_objectiveTitleText != null) _objectiveTitleText.text = "▶ CONFRONT ATLAS";
                if (_objectiveDescriptionText != null) _objectiveDescriptionText.text = "The Prodigy must answer for the city's fate.";
            }
        }

        private void OnPowerUnlocked(GameEvents.PowerUnlockedEvent e)
        {
            UpdatePowerStatus(e.PowerPath, "ONLINE");
        }

        private void OnEnemyDefeated(GameEvents.EnemyDefeatedEvent e)
        {
            if (_enemiesDefeatedText != null) _enemiesDefeatedText.text = "ELIMINATIONS: " + e.TotalDefeated;
            if (GameManager.Instance != null && GameManager.Instance.State != null)
            {
                _targetScore = GameManager.Instance.State.Score;
                if (_scoreRollupCoroutine != null) StopCoroutine(_scoreRollupCoroutine);
                _scoreRollupCoroutine = StartCoroutine(AnimateScoreRollup());
            }
        }

        private void OnBossDefeated(GameEvents.BossDefeatedEvent e)
        {
            if (_threatLevelText != null) _threatLevelText.text = "SECTOR SECURED";
            if (_threatIndicatorImage != null) _threatIndicatorImage.color = _normalThreatColor;
        }

        // ─── UI Updaters ───────────────────────────────────────────────────────────

        private void UpdateHealthUI(float currentHp, float maxHp)
        {
            float pct = Mathf.Clamp01(currentHp / maxHp);
            if (_healthSlider != null) _healthSlider.value = pct;
            if (_healthText != null) _healthText.text = "HP: " + Mathf.CeilToInt(currentHp) + "/" + Mathf.CeilToInt(maxHp);
        }

        private void UpdateGhostHealth(float dt)
        {
            if (_currentGhostHealth > _targetHealth)
            {
                _currentGhostHealth = Mathf.MoveTowards(_currentGhostHealth, _targetHealth, _ghostHealthDrainSpeed * dt);
                if (_ghostHealthSlider != null) _ghostHealthSlider.value = Mathf.Clamp01(_currentGhostHealth / _maxHealth);
            }
            else
            {
                _currentGhostHealth = _targetHealth;
                if (_ghostHealthSlider != null) _ghostHealthSlider.value = Mathf.Clamp01(_currentGhostHealth / _maxHealth);
            }
        }

        private void UpdateStaminaFromGameplay()
        {
            if (_staminaSlider != null && _staminaSlider.value < 1f)
            {
                _staminaSlider.value = Mathf.MoveTowards(_staminaSlider.value, 1f, Time.deltaTime * 0.35f);
                if (_staminaText != null) _staminaText.text = "STAMINA: " + Mathf.CeilToInt(_staminaSlider.value * 100) + "%";
            }
        }

        public void SetStamina(float current, float max)
        {
            float pct = Mathf.Clamp01(current / max);
            if (_staminaSlider != null) _staminaSlider.value = pct;
            if (_staminaText != null) _staminaText.text = "STAMINA: " + Mathf.CeilToInt(pct * 100) + "%";
        }

        public void SetPowerCooldown(float remaining, float duration)
        {
            if (_powerCooldownFill != null && duration > 0f)
            {
                _powerCooldownFill.fillAmount = Mathf.Clamp01(remaining / duration);
            }
        }

        public void SetPowerLevel(int level)
        {
            if (_powerLevelText != null) _powerLevelText.text = $"LVL {level}";
        }

        private void UpdatePowerStatus(string powerPath, string status)
        {
            if (_powerNameText == null) return;

            switch (powerPath)
            {
                case "AGGRESSIVE":
                    _powerNameText.text = "s DESTRUCTION NOVA";
                    _powerNameText.color = new Color(1f, 0.2f, 0.1f, 1f);
                    break;
                case "PROTECTIVE":
                    _powerNameText.text = "s KINETIC BARRIER";
                    _powerNameText.color = new Color(0f, 0.6f, 1f, 1f);
                    break;
                case "STRATEGIC":
                    _powerNameText.text = "s CHRONO STASIS";
                    _powerNameText.color = new Color(0f, 1f, 0.5f, 1f);
                    break;
                default:
                    _powerNameText.text = "s DORMANT [NO POWER]";
                    _powerNameText.color = new Color(0.6f, 0.6f, 0.7f, 1f);
                    break;
            }

            if (_powerStatusText != null) _powerStatusText.text = status;
        }

        private void UpdateThreatLevel(GamePhase phase)
        {
            if (_threatLevelText == null || _threatIndicatorImage == null) return;

            switch (phase)
            {
                case GamePhase.LEVEL_1:
                    _threatLevelText.text = "THREAT: LOW [DRONES]";
                    _threatIndicatorImage.color = _normalThreatColor;
                    break;
                case GamePhase.LEVEL_2:
                    _threatLevelText.text = "THREAT: ELEVATED [ENFORCERS]";
                    _threatIndicatorImage.color = _highThreatColor;
                    break;
                case GamePhase.FINAL_ENCOUNTER:
                    _threatLevelText.text = "THREAT: CRITICAL [ATLAS]";
                    _threatIndicatorImage.color = _bossThreatColor;
                    break;
                default:
                    _threatLevelText.text = "THREAT: MONITORED";
                    _threatIndicatorImage.color = _normalThreatColor;
                    break;
            }
        }

        private IEnumerator AnimateScoreRollup()
        {
            while (_displayedScore < _targetScore)
            {
                _displayedScore = (int)Mathf.MoveTowards(_displayedScore, _targetScore, _scoreRollupSpeed * Time.deltaTime);
                if (_scoreText != null) _scoreText.text = "SCORE: " + _displayedScore;
                yield return null;
            }
            _displayedScore = _targetScore;
            if (_scoreText != null) _scoreText.text = "SCORE: " + _displayedScore;
        }
    }
}
