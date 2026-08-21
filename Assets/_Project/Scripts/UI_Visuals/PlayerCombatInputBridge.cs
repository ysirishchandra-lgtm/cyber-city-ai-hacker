using UnityEngine;
using Scar.Core;

namespace Scar.UI_Visuals
{
    public class PlayerCombatInputBridge : MonoBehaviour
    {
        [Header("Components")]
        // Assume these components exist or will be injected by backend engine
        // [SerializeField] private CombatController3D _combatController;
        
        [Header("Effects Hooks")]
        [SerializeField] private GameObject _hitSparksPrefab;
        [SerializeField] private ParticleSystem _speedTrails;

        private void Update()
        {
            HandleCombatInputs();
            HandleMovementInputs();
        }

        private void HandleCombatInputs()
        {
            // Light Melee Attack (Left Click / Square / X)
            if (Input.GetMouseButtonDown(0) || Input.GetKeyDown(KeyCode.JoystickButton2))
            {
                ExecuteLightAttack();
            }

            // Heavy / Special Attack (Right Click / Triangle / Y)
            if (Input.GetMouseButtonDown(1) || Input.GetKeyDown(KeyCode.JoystickButton3))
            {
                ExecuteHeavyAttack();
            }
        }

        private void HandleMovementInputs()
        {
            // Jump / Air-Dash / Wall-Jump (Space / Cross / A)
            if (Input.GetKeyDown(KeyCode.Space) || Input.GetKeyDown(KeyCode.JoystickButton0))
            {
                ExecuteJump();
            }

            // Dodge / I-frame roll (Left Shift / Circle / B)
            if (Input.GetKeyDown(KeyCode.LeftShift) || Input.GetKeyDown(KeyCode.JoystickButton1))
            {
                ExecuteDodge();
            }
        }

        private void ExecuteLightAttack()
        {
            Debug.Log("[PlayerCombatInputBridge] Light Attack Initiated");
            // _combatController?.ExecuteAttack();
            
            // Visual Feedback
            TriggerCameraShake(0.1f, 0.2f);
        }

        private void ExecuteHeavyAttack()
        {
            Debug.Log("[PlayerCombatInputBridge] Heavy/Special Attack Initiated");
            // Validate energy here if _combatController exists
            
            // Visual Feedback
            TriggerCameraShake(0.3f, 0.4f);
        }

        private void ExecuteJump()
        {
            Debug.Log("[PlayerCombatInputBridge] Jump/Traversal Initiated");
            // Add environment check for TraversableLedge
        }

        private void ExecuteDodge()
        {
            Debug.Log("[PlayerCombatInputBridge] Dodge Initiated");
            if (_speedTrails != null)
            {
                _speedTrails.Play();
            }
        }

        private void TriggerCameraShake(float intensity, float duration)
        {
            // Assuming visual juice manager handles trauma/shake
            if (VisualJuiceManager.Instance != null)
            {
                // VisualJuiceManager.Instance.AddCameraShake(intensity, duration);
            }
        }
    }
}
