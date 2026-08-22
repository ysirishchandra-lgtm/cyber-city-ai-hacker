using UnityEngine;

namespace Scar.Core
{
    /// <summary>
    /// Manages the emotional pressure (Heat) of the player during Round 2.
    /// Drives psychological mechanics and visual instability based on pressure thresholds.
    /// </summary>
    public class HeatManager : MonoBehaviour
    {
        public static HeatManager Instance { get; private set; }

        [Header("Heat Settings")]
        [Range(0, 100)]
        [SerializeField] private float _currentHeat = 0f;
        [SerializeField] private float _highHeatThreshold = 70f;
        [SerializeField] private float _heatDecayRate = 1f; // Heat lost per second

        [Header("Visual Feedback (Optional Hook)")]
        [Tooltip("Reference to camera shake or post-processing controller")]
        [SerializeField] private Component _cameraShakeController; // Replace with actual type

        public float CurrentHeat => _currentHeat;
        public bool IsUnstable => _currentHeat >= _highHeatThreshold;

        private void Awake()
        {
            if (Instance == null) Instance = this;
            else Destroy(gameObject);
        }

        private void Update()
        {
            // Natural decay over time
            if (_currentHeat > 0)
            {
                _currentHeat -= _heatDecayRate * Time.deltaTime;
                _currentHeat = Mathf.Max(0, _currentHeat);
            }

            // Handle continuous instability effects when above threshold
            if (IsUnstable)
            {
                ApplyInstabilityEffects();
            }
        }

        /// <summary>
        /// Call this when the player takes damage to spike their emotional pressure.
        /// </summary>
        public void AddHeatFromDamage(float damageAmount)
        {
            float heatGained = damageAmount * 0.5f; // Scale factor
            IncreaseHeat(heatGained);
        }

        /// <summary>
        /// Call this via the global timer system when time thresholds are crossed.
        /// </summary>
        public void AddHeatFromTimePressure(float heatAmount)
        {
            IncreaseHeat(heatAmount);
        }

        private void IncreaseHeat(float amount)
        {
            _currentHeat += amount;
            _currentHeat = Mathf.Clamp(_currentHeat, 0f, 100f);

            if (_currentHeat >= _highHeatThreshold)
            {
                Debug.LogWarning("[HeatManager] HEAT CRITICAL! Psychological instability triggered.");
            }
        }

        private void ApplyInstabilityEffects()
        {
            // TODO: Trigger Cinemachine Impulse or Post-Processing distortion here
            // e.g., CameraShake.Impulse(0.5f);
            
            // Power instability is handled inside EvolvePower.cs by checking HeatManager.Instance.IsUnstable
        }
    }
}
