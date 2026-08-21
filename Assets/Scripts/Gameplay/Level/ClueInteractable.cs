using UnityEngine;
using Scar.Core;

namespace Scar.Gameplay.Level
{
    public class ClueInteractable : MonoBehaviour
    {
        [Header("Clue Config")]
        [SerializeField] private string clueId = "CLUE_UNKNOWN_SYMBOL";
        [SerializeField] private string clueName = "Unknown Symbol";
        [SerializeField] private string clueDescription = "A strange glowing symbol etched into the alley wall.";

        private bool _isDiscovered = false;

        public bool IsDiscovered => _isDiscovered;

        public bool Interact()
        {
            if (_isDiscovered) return false;

            _isDiscovered = true;
            EventBus.Instance.Publish("CLUE_DISCOVERED", new
            {
                clueId = clueId,
                name = clueName,
                description = clueDescription
            });

            return true;
        }

        private void OnTriggerEnter(Collider other)
        {
            if (other.CompareTag("Player") && !_isDiscovered)
            {
                // Trigger prompt or auto-interact if desired
            }
        }
    }
}
