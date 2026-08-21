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
        private static CinemachineCameraController _instance;
        public static CinemachineCameraController Instance 
        { 
            get { return _instance; } 
            private set { _instance = value; } 
        }

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

        public CameraMode CurrentMode { get { return _currentMode; } }

        private void Awake()
        {
            if (_instance != null && _instance != this)
            {
                Destroy(gameObject);
                return;
            }
            _instance = this;
        }

        private void OnEnable()
        {
            EventBus.Subscribe<GameEvents.PlayerDamagedEvent>(OnPlayerDamaged);
            EventBus.Subscribe<GameEvents.PhaseChangedEvent>(OnPhaseChanged);
            EventBus.Subscribe<GameEvents.BossDefeatedEvent>(OnBossDefeated);
        }

        private void OnDisable()
        {
            EventBus.Unsubscribe<GameEvents.PlayerDamagedEvent>(OnPlayerDamaged);
            EventBus.Unsubscribe<GameEvents.PhaseChangedEvent>(OnPhaseChanged);
            EventBus.Unsubscribe<GameEvents.BossDefeatedEvent>(OnBossDefeated);
        }

        private void Update()
        {
            DecayTrauma(Time.deltaTime);
        }

        // ─── Camera Mode Switching ──────────────────────────────────────────────────

        public void SwitchCameraMode(CameraMode mode)
        {
            _currentMode = mode;

            SetCameraPriority(_explorationCamera, mode == CameraMode.EXPLORATION ? 20 : 10);
            SetCameraPriority(_combatCamera, mode == CameraMode.COMBAT ? 20 : 10);
            SetCameraPriority(_bossCamera, mode == CameraMode.BOSS_FRAMING ? 20 : 10);
            SetCameraPriority(_cinematicCamera, mode == CameraMode.CINEMATIC_OVERRIDE ? 30 : 5);
        }

        private void SetCameraPriority(CinemachineCamera cam, int priority)
        {
            if (cam != null)
            {
                cam.Priority = priority;
            }
        }

        public void FollowTarget(Transform target)
        {
            _targetTransform = target;
            if (_explorationCamera != null) _explorationCamera.Target.TrackingTarget = target;
            if (_combatCamera != null) _combatCamera.Target.TrackingTarget = target;
            if (_bossCamera != null) _bossCamera.Target.TrackingTarget = target;
        }

        // ─── Procedural Screen Shake & Trauma ───────────────────────────────────────

        public void AddTrauma(float amount)
        {
            _currentTrauma = Mathf.Clamp01(_currentTrauma + amount);

            if (_impulseSource != null)
            {
                _impulseSource.GenerateImpulse(amount);
            }
        }

        private void DecayTrauma(float dt)
        {
            if (_currentTrauma > 0f)
            {
                _currentTrauma = Mathf.MoveTowards(_currentTrauma, 0f, _traumaDecaySpeed * dt);
            }
        }

        public float GetShakeMagnitude()
        {
            return _currentTrauma * _currentTrauma; // Quadratic falloff
        }

        // ─── Event Callbacks ────────────────────────────────────────────────────────

        private void OnPlayerDamaged(GameEvents.PlayerDamagedEvent e)
        {
            float traumaAmount = Mathf.Clamp(e.DamageAmount / 40f, 0.25f, 0.85f);
            AddTrauma(traumaAmount);
        }

        private void OnPhaseChanged(GameEvents.PhaseChangedEvent e)
        {
            switch (e.NewPhase)
            {
                case GamePhase.LEVEL_1:
                    SwitchCameraMode(CameraMode.EXPLORATION);
                    break;
                case GamePhase.LEVEL_2:
                    SwitchCameraMode(CameraMode.COMBAT);
                    break;
                case GamePhase.FINAL_ENCOUNTER:
                    SwitchCameraMode(CameraMode.BOSS_FRAMING);
                    AddTrauma(0.5f);
                    break;
                case GamePhase.PROLOGUE:
                case GamePhase.ENDING:
                    SwitchCameraMode(CameraMode.CINEMATIC_OVERRIDE);
                    break;
            }
        }

        private void OnBossDefeated(GameEvents.BossDefeatedEvent e)
        {
            AddTrauma(0.9f);
        }
    }
}
