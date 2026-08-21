using UnityEngine;

namespace Scar.Core
{
    public class EndingNarrativeController : MonoBehaviour
    {
        public static EndingNarrativeController Instance { get; private set; }

        private void Awake()
        {
            if (Instance == null) Instance = this;
            else Destroy(gameObject);
        }

        public void ProcessEndingChoice(string choiceID)
        {
            Debug.Log($"[EndingNarrativeController] Processing Ending Route: {choiceID}");
            // Hand off to backend database save and video player for ending cinematic
        }
    }
}
