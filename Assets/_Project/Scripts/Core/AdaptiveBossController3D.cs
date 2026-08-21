using UnityEngine;
using Scar.UI_Visuals;
using Scar.Core;

namespace Scar.Core
{
    /// <summary>
    /// Mock Backend Controller to allow playtesters to quickly verify the entire
    /// multi-phase boss fight UI and ending modal flow without needing full AI integration.
    /// Press number keys [1]-[6] in the Editor to advance phases and test defeat logic.
    /// </summary>
    public class AdaptiveBossController3D : MonoBehaviour
    {
        private BossHUDController _bossHUD;
        private ClashQTEWidget _clashWidget;
        private EndingChoiceModal _endingModal;
        private float _currentHealth = 1000f;

        private void Start()
        {
            _bossHUD = FindObjectOfType<BossHUDController>();
            _clashWidget = FindObjectOfType<ClashQTEWidget>();
            _endingModal = FindObjectOfType<EndingChoiceModal>();
        }

        private void Update()
        {
            // Debug Phase Advance
            if (Input.GetKeyDown(KeyCode.Alpha1)) TriggerPhase(1);
            if (Input.GetKeyDown(KeyCode.Alpha2)) TriggerPhase(2);
            if (Input.GetKeyDown(KeyCode.Alpha3)) TriggerPhase(3);
            if (Input.GetKeyDown(KeyCode.Alpha4)) TriggerPhase(4);
            if (Input.GetKeyDown(KeyCode.Alpha5)) TriggerPhase(5);
            if (Input.GetKeyDown(KeyCode.Alpha6)) TriggerDefeat();

            // Debug Damage
            if (Input.GetKeyDown(KeyCode.Backspace))
            {
                TakeDamage(100f);
            }
        }

        private void TakeDamage(float amount)
        {
            _currentHealth -= amount;
            if (_bossHUD != null) _bossHUD.UpdateHealth(_currentHealth);
            
            // Randomly flash a behavior alert
            if (Random.value > 0.5f && _bossHUD != null)
            {
                _bossHUD.ShowBehavioralAlert("VOID SHIELD ACTIVE");
            }
        }

        private void TriggerPhase(int phaseIndex)
        {
            Debug.Log($"[AdaptiveBossController3D] Forcing Boss Phase {phaseIndex}");
            if (_bossHUD != null)
            {
                _bossHUD.TriggerPhaseTransition(phaseIndex);
            }

            if (phaseIndex == 3 && _clashWidget != null)
            {
                _clashWidget.StartClashQTE();
            }
        }

        private void TriggerDefeat()
        {
            Debug.Log("[AdaptiveBossController3D] Boss Defeated! Triggering Ending Modal.");
            
            // Pass mock run summary data
            if (_endingModal != null)
            {
                _endingModal.ShowEndingModal(452f, 250, "SS");
            }
        }
    }
}
