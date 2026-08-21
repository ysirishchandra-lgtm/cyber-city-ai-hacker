using UnityEngine;
using Scar.Core;
using Scar.UI_Visuals;
using UnityEngine.SceneManagement;

namespace Scar.Production
{
    public class DemoPresentationController : MonoBehaviour
    {
        public static DemoPresentationController Instance { get; private set; }

        private bool _isPresentationModeActive = false;
        private bool _isGodModeActive = false;

        private void Awake()
        {
            if (Instance == null)
            {
                Instance = this;
                DontDestroyOnLoad(gameObject);
            }
            else
            {
                Destroy(gameObject);
            }
        }

        private void Update()
        {
            // F1 / Ctrl+Shift+D: Toggle Presentation Mode
            if (Input.GetKeyDown(KeyCode.F1) || (Input.GetKey(KeyCode.LeftControl) && Input.GetKey(KeyCode.LeftShift) && Input.GetKeyDown(KeyCode.D)))
            {
                _isPresentationModeActive = !_isPresentationModeActive;
            }

            if (!_isPresentationModeActive) return;

            // F2: God Mode (No Death)
            if (Input.GetKeyDown(KeyCode.F2))
            {
                _isGodModeActive = !_isGodModeActive;
                if (Hurtbox3D.Instance != null)
                {
                    Hurtbox3D.Instance.SetInvulnerability(_isGodModeActive);
                }
            }

            // F3: Jump to Phase 3 Power Clash
            if (Input.GetKeyDown(KeyCode.F3))
            {
                if (AdaptiveBossController3D.Instance != null)
                {
                    AdaptiveBossController3D.Instance.ForcePhaseTransition(3);
                }
            }

            // F4: Jump to Phase 5 & 3-Choice Ending
            if (Input.GetKeyDown(KeyCode.F4))
            {
                if (AdaptiveBossController3D.Instance != null)
                {
                    AdaptiveBossController3D.Instance.ForcePhaseTransition(5);
                    // Force defeat right after transition
                    AdaptiveBossController3D.Instance.TriggerDefeatSequence();
                }
            }

            // F5: Instant Scene Reset
            if (Input.GetKeyDown(KeyCode.F5))
            {
                Time.timeScale = 1f;
                SceneManager.LoadScene(SceneManager.GetActiveScene().buildIndex);
            }
        }
    }
}
