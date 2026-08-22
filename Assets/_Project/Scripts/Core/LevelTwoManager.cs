using UnityEngine;

namespace Scar.Core
{
    public class LevelTwoManager : MonoBehaviour
    {
        public static LevelTwoManager Instance { get; private set; }

        private void Awake()
        {
            if (Instance == null) Instance = this;
            else Destroy(gameObject);
        }

        public void InitializeGameplay()
        {
            Debug.Log("[LevelTwoManager] Initializing Round 2 Gameplay Loop...");

            // 1. Enable Player Movement Controls
            // Assuming there's a global EventBus or direct player reference
            EventBus.Publish(new GameEvents.PhaseChangedEvent { NewPhase = GamePhase.LEVEL_2 });
            
            // Example direct controller unlock (replace with actual controller class):
            // if (PlayerController.Instance != null) PlayerController.Instance.SetMovementEnabled(true);

            // 2. Call HeatManager to start tracking emotional pressure
            if (HeatManager.Instance != null)
            {
                // Ensure the script is enabled and ready
                HeatManager.Instance.enabled = true;
                Debug.Log("[LevelTwoManager] HeatManager activated. Emotional pressure tracking started.");
            }
            else
            {
                Debug.LogWarning("[LevelTwoManager] HeatManager is missing from the scene!");
            }

            // 3. Trigger AWS Profile Fetch
            if (GameStateManager.Instance != null)
            {
                // The GameStateManager handles the API call and sets the profile internally
                // We re-trigger it here to ensure it fetches right as the level starts
                GameStateManager.Instance.StartCoroutine("FetchPlayerProfileRoutine");
            }
            else
            {
                Debug.LogWarning("[LevelTwoManager] GameStateManager is missing. Cannot fetch AWS Profile.");
            }

            Debug.Log("[LevelTwoManager] Round 2 successfully initialized. Player has control.");
        }
    }
}
