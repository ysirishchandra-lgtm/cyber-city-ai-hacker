using UnityEngine;
using Scar.Core;

namespace Scar.UI_Visuals
{
    public class PlayerCombatInputBridge : MonoBehaviour
    {
        [Header("Backend Connections")]
        [SerializeField] private CombatController3D _combatController;
        [SerializeField] private TargetLockSystem _targetLockSystem;
        
        [Header("Effects Hooks")]
        [SerializeField] private GameObject _hitSparksPrefab;
        [SerializeField] private ParticleSystem _speedTrails;

        private void Start()
        {
            if (CharacterArchetypeManager.Instance != null)
            {
                CharacterArchetypeManager.Instance.SelectArchetype(ArchetypeType.Volt);
            }
        }

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

            // Heavy / Special Attack / Flash Dash (Right Click / Triangle / Y)
            if (Input.GetMouseButtonDown(1) || Input.GetKeyDown(KeyCode.JoystickButton3))
            {
                ExecuteHeavyAttack();
            }

            // Target Lock (Tab)
            if (Input.GetKeyDown(KeyCode.Tab) && _targetLockSystem != null)
            {
                // Toggle is handled inside TargetLockSystem, but we could trigger it here if refactored.
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
            if (_combatController != null) _combatController.ExecuteAttack();
            
            TriggerCameraShake(0.1f, 0.2f);
        }

        private void ExecuteHeavyAttack()
        {
            Debug.Log("[PlayerCombatInputBridge] Flash Dash Initiated");
            if (_combatController != null)
            {
                _combatController.ConsumeEnergy(20f);
                _combatController.ExecuteSpecial();
            }
            
            if (_speedTrails != null) _speedTrails.Play();
            TriggerCameraShake(0.3f, 0.4f);
        }

        private void ExecuteJump()
        {
            Debug.Log("[PlayerCombatInputBridge] Jump/Traversal Initiated");
        }

        private void ExecuteDodge()
        {
            Debug.Log("[PlayerCombatInputBridge] Dodge Initiated");
            if (_speedTrails != null) _speedTrails.Play();
        }

        private void TriggerCameraShake(float intensity, float duration)
        {
            if (VisualJuiceManager.Instance != null)
            {
                // VisualJuiceManager.Instance.AddCameraShake(intensity, duration);
            }
        }
    }
}
