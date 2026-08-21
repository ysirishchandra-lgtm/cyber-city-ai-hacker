using UnityEngine;
using Scar.Core;

namespace Scar.Gameplay.Player
{
    public class PlayerInteraction : MonoBehaviour
    {
        [SerializeField] private float interactRange = 3.0f;
        [SerializeField] private LayerMask interactableLayers;

        public bool TryInteract()
        {
            Collider[] hits = Physics.OverlapSphere(transform.position, interactRange, interactableLayers);
            if (hits.Length > 0)
            {
                var target = hits[0].gameObject;
                EventBus.Instance.Publish(GameEvents.CHOICE_MADE, new { target = target.name });
                return true;
            }
            return false;
        }

        private void OnDrawGizmosSelected()
        {
            Gizmos.color = Color.yellow;
            Gizmos.DrawWireSphere(transform.position, interactRange);
        }
    }
}
