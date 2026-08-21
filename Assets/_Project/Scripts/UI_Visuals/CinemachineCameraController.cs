using System;
using UnityEngine;
using Unity.Cinemachine;
using Scar.Core;

namespace Scar.UI
{
    /// <summary>
    /// SCAR — The Last Choice
    /// CinemachineCameraController: Handles 3rd-person exploration, combat, boss framing,
    /// and trauma-based procedural camera screen shake (Unity 6 / Cinemachine 3.x).
    /// Subscribes to GameEvents without altering gameplay logic.
    /// Author: Ashwidha (Visual / UI / Cinematic Lead)
    /// </summary>
    public class CinemachineCameraController : MonoBehaviour
    {
        public static CinemachineCameraController Instance { get; private set; }

        public enum CameraMode
        {
            EXPLORATION,
            COMBAT,
            BOSS_FRAMING,
            CINEMATIC_OVERRIDE
        }

        [Header("Cinemachine Cameras")]
        [SerializeField] private CinemachineCamera _explorationCamera;
        [SerializeField] private CinemachineCamera _combatCamera;
        [SerializeField] private CinemachineCamera _bossCamera;
        [SerializeField] private CinemachineCamera _cinematicCamera;

        [Header("Cinemachine Impulse / Screen Shake")]
        [SerializeField] private CinemachineImpulseSource _impulseSource;

        [Header("Procedural Shake Tuning")]
        [SerializeField] private float _traumaDecaySpeed = 1.6f;
        [SerializeField] private float _maxShakeOffset = 0.45f;
        [SerializeField] private float _maxShakeRotation = 2.5f;

        private float _currentTrauma = 0f;
        private CameraMode _currentMode = CameraMode.EXPLORATION;
        private Transform _targetTransform;
        private Vector3 _originalCameraLocalPos;

        public CameraMode CurrentMode => _currentMode;

        private void Awake()
        {
            if (Instance != null && Instance != this)
            {
                Destroy(gameObject);
                return;
            }
            Instance = this;
        }

        private void OnEnable()
        {
            EventBus.Subscribe<GameEvents.PlayerDamagedEvent>(OnPlayerDamaged);
            EventBus.Subscribe<GameEvents.PhaseChangedEvent>(OnPhaseChanged);
            EventBus.Subscribe<GameEvents.PowerUnlockedEvent>(OnPowerUnlocked);
            EventBus.Subscribe<GameEvents.BossDefeatedEvent>(OnBossDefeated);
        }

        private void OnDisable()
        {
            EventBus.Unsubscribe<GameEvents.PlayerDamagedEvent>(OnPlayerDamaged);
            EventBus.Unsubscribe<GameEvents.PhaseChangedEvent>(OnPhaseChanged);
            EventBus.Unsubscribe<GameEvents.PowerUnlockedEvent>(OnPowerUnlocked);
            EventBus.Unsubscribe<GameEvents.BossDefeatedEvent>(OnBossDefeated);
        }

        private void Start()
        {
            SetCameraMode(CameraMode.EXPLORATION);
        }

        private void Update()
        {
            UpdateTrauma(Time.deltaTime);
        }

        // ─── Camera Modes ──────────────────────────────────────────────────────────

        public void SetCameraMode(CameraMode mode)
        {
            _currentMode = mode;

            SetCamPriority(_explorationCamera, mode == CameraMode.EXPLORATION ? 20 : 10);
            SetCamPriority(_combatCamera, mode == CameraMode.COMBAT ? 20 : 10);
            SetCamPriority(_bossCamera, mode == CameraMode.BOSS_FRAMING ? 20 : 10);
            SetCamPriority(_cinematicCamera, mode == CameraMode.CINEMATIC_OVERRIDE ? 30 : 5);
        }

        private void SetCamPriority(CinemachineCamera cam, int priority)
        {
            if (cam != null)
            {
                cam.Priority = priority;
            }
        }

        // ─── Trauma & Screen Shake ─────────────────────────────────────────────────

        public void AddTrauma(float amount)
        {
            _currentTrauma = Mathf.Clamp01(_currentTrauma + amount);

            // Trigger Cinemachine Impulse if available
            if (_impulseSource != null)
            {
                _impulseSource.GenerateImpulse(amount);
            }
        }

        private void UpdateTrauma(float dt)
        {
            if (_currentTrauma > 0f)
            {
                _currentTrauma = Mathf.Max(0f, _currentTrauma - _traumaDecaySpeed * dt);
                ApplyProceduralShake();
            }
        }

        private void ApplyProceduralShake()
        {
            if (_currentTrauma <= 0f) return;

            // Non-linear shake power for natural feel
            float shakePower = _currentTrauma * _currentTrauma;

            float offsetX = (Mathf.PerlinNoise(Time.time * 25f, 0f) * 2f - 1f) * _maxShakeOffset * shakePower;
            float offsetY = (Mathf.PerlinNoise(0f, Time.time * 25f) * 2f - 1f) * _maxShakeOffset * shakePower;
            float rotZ = (Mathf.PerlinNoise(Time.time * 20f, Time.time * 20f) * 2f - 1f) * _maxShakeRotation * shakePower;

            Camera mainCam = Camera.main;
            if (mainCam != null)
            {
                mainCam.transform.localPosition += new Vector3(offsetX, offsetY, 0f) * Time.deltaTime;
                mainCam.transform.localRotation *= Quaternion.Euler(0f, 0f, rotZ * Time.deltaTime);
            }
        }

        // ─── Event Handlers ─────────────────────────────────────────────────────────

        private void OnPlayerDamaged(GameEvents.PlayerDamagedEvent e)
        {
            float traumaAmount = Mathf.Clamp01(e.DamageAmount / 40f) * 0.6f + 0.2f;
            AddTrauma(traumaAmount);
        }

        private void OnPhaseChanged(GameEvents.PhaseChangedEvent e)
        {
            switch (e.NewPhase)
            {
                case GamePhase.LEVEL_1:
                case GamePhase.LEVEL_2:
                    SetCameraMode(CameraMode.EXPLORATION);
                    break;
                case GamePhase.FINAL_BATTLE:
                    SetCameraMode(CameraMode.BOSS_FRAMING);
                    AddTrauma(0.5f);
                    break;
                case GamePhase.PROLOGUE:
                case GamePhase.ENDING:
                    SetCameraMode(CameraMode.CINEMATIC_OVERRIDE);
                    break;
            }
        }

        private void OnPowerUnlocked(GameEvents.PowerUnlockedEvent e)
        {
            AddTrauma(0.8f);
        }

        private void OnBossDefeated(GameEvents.BossDefeatedEvent e)
        {
            AddTrauma(0.6f);
        }
    }
}
