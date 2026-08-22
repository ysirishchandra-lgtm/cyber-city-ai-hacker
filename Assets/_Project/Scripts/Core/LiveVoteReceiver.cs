using UnityEngine;

namespace Scar.Core
{
    /// <summary>
    /// Placeholder endpoint for the live hackathon presentation.
    /// Exposes a public hook for an AWS API Gateway webhook to trigger in-game events
    /// based on live audience polling via QR codes.
    /// </summary>
    public class LiveVoteReceiver : MonoBehaviour
    {
        public static LiveVoteReceiver Instance { get; private set; }

        private void Awake()
        {
            if (Instance == null) Instance = this;
            else Destroy(gameObject);
        }

        /// <summary>
        /// This method acts as the receiver hook. During the live demo, a local Node server
        /// or an AWS IoT core socket will call this method when the audience vote concludes.
        /// </summary>
        /// <param name="decision">Expected: "Save Civilian" or "Sacrifice Time"</param>
        public void ApplyAudienceDecision(string decision)
        {
            Debug.Log($"[LiveVoteReceiver] AUDIENCE DECISION RECEIVED: {decision}");

            switch (decision.ToUpper())
            {
                case "SAVE CIVILIAN":
                    HandleSaveCivilian();
                    break;

                case "SACRIFICE TIME":
                    HandleSacrificeTime();
                    break;

                default:
                    Debug.LogWarning($"[LiveVoteReceiver] Unknown audience decision: {decision}");
                    break;
            }
        }

        private void HandleSaveCivilian()
        {
            Debug.Log("[LiveVoteReceiver] The audience chose Mercy! Spawning extraction zone...");
            // TODO: Instantiate extraction waypoint
            // TODO: Reduce player Heat slightly for doing the right thing
            if (HeatManager.Instance != null)
            {
                // Example of cross-script synergy
                // HeatManager.Instance.ReduceHeat(20f);
            }
        }

        private void HandleSacrificeTime()
        {
            Debug.Log("[LiveVoteReceiver] The audience chose Ruthlessness! Subtracting 5 minutes from global timer.");
            // TODO: Hook into LevelManager or CyberHUD to deduct 300 seconds from the timer
            
            // Spike the emotional pressure
            if (HeatManager.Instance != null)
            {
                HeatManager.Instance.AddHeatFromTimePressure(30f);
            }
        }
    }
}
