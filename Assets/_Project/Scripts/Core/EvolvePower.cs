using UnityEngine;

namespace Scar.Core
{
    /// <summary>
    /// Manages the EVOLVE ability in Round 2. 
    /// Behavior completely shifts based on the AWS memory profile (Revenge vs Mercy)
    /// and is influenced by the current psychological pressure (Heat).
    /// </summary>
    public class EvolvePower : MonoBehaviour
    {
        [Header("Power Parameters")]
        [SerializeField] private float _baseCooldown = 5f;
        [SerializeField] private float _unstableCooldownMultiplier = 2f;
        [SerializeField] private float _unstableDamageMultiplier = 1.5f;

        private float _lastUsedTime = -10f;

        private void Update()
        {
            // Trigger EVOLVE power input
            if (Input.GetKeyDown(KeyCode.E))
            {
                TryActivatePower();
            }
        }

        private void TryActivatePower()
        {
            float currentCooldown = _baseCooldown;

            // Heat System Integration: High heat means longer cooldowns (loss of control)
            if (HeatManager.Instance != null && HeatManager.Instance.IsUnstable)
            {
                currentCooldown *= _unstableCooldownMultiplier;
            }

            if (Time.time - _lastUsedTime < currentCooldown)
            {
                Debug.Log("[EvolvePower] Power is cooling down...");
                return;
            }

            _lastUsedTime = Time.time;
            ExecutePower();
        }

        private void ExecutePower()
        {
            PlayerProfile profile = GameStateManager.Instance != null 
                ? GameStateManager.Instance.CurrentProfile 
                : PlayerProfile.Revenge; // Default to revenge if state manager is missing

            bool isUnstable = HeatManager.Instance != null && HeatManager.Instance.IsUnstable;

            Debug.Log($"[EvolvePower] Activating EVOLVE! Profile: {profile} | Unstable: {isUnstable}");

            if (profile == PlayerProfile.Revenge)
            {
                ExecuteRevengePower(isUnstable);
            }
            else
            {
                ExecuteMercyPower(isUnstable);
            }
        }

        private void ExecuteRevengePower(bool isUnstable)
        {
            // Highly aggressive AoE that costs player health
            float damageOutput = 50f;
            if (isUnstable) damageOutput *= _unstableDamageMultiplier;

            Debug.Log($"[EvolvePower] REVENGE MODE: Triggering massive AoE burst for {damageOutput} damage!");
            
            // TODO: Apply damage to player health (e.g., PlayerHealth.TakeDamage(10))
            // TODO: Physics.OverlapSphere to hit enemies
        }

        private void ExecuteMercyPower(bool isUnstable)
        {
            // Defensive tactical play
            float shieldDuration = 3f;
            if (isUnstable) shieldDuration *= 0.5f; // Unstable mind reduces defensive capability

            Debug.Log($"[EvolvePower] MERCY MODE: Deploying tactical shield for {shieldDuration} seconds and stunning target.");
            
            // TODO: Apply invulnerability layer
            // TODO: Raycast to apply stun status to targeted enemy
        }
    }
}
