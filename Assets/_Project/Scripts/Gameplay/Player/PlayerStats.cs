using UnityEngine;

namespace Scar.Gameplay.Player
{
    [CreateAssetMenu(fileName = "PlayerStats", menuName = "Scar/Player/PlayerStats")]
    public class PlayerStats : ScriptableObject
    {
        [Header("Movement")]
        public float walkSpeed = 4.5f;
        public float sprintSpeed = 8.0f;
        public float dodgeSpeed = 12.0f;
        public float dodgeDuration = 0.35f;
        public float rotationSpeed = 14.0f;

        [Header("Stamina")]
        public float maxStamina = 100f;
        public float sprintStaminaCost = 15f; // per sec
        public float dodgeStaminaCost = 25f;
        public float staminaRegenRate = 20f; // per sec

        [Header("Combat")]
        public float baseAttackDamage = 25f;
        public float attackCooldown = 0.45f;
        public float attackRange = 2.2f;
    }
}
