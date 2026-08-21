using UnityEngine;

namespace Scar.Gameplay.Combat
{
    public enum DamageType
    {
        MELEE,
        RANGED,
        POWER_DESTRUCTION,
        POWER_STASIS,
        ENVIRONMENTAL
    }

    [System.Serializable]
    public class DamageData
    {
        public float amount;
        public DamageType type;
        public GameObject attacker;
        public Vector3 knockbackForce;
        public bool isCritical;

        public DamageData(float amount, DamageType type = DamageType.MELEE, GameObject attacker = null, Vector3 knockbackForce = default)
        {
            this.amount = amount;
            this.type = type;
            this.attacker = attacker;
            this.knockbackForce = knockbackForce;
            this.isCritical = false;
        }
    }
}
