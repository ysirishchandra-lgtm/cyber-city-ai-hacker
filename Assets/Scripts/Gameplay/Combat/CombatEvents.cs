using System;
using UnityEngine;

namespace Scar.Gameplay.Combat
{
    public static class CombatEvents
    {
        public static event Action<GameObject, DamageData> OnDamageDealt;
        public static event Action<GameObject, GameObject> OnTargetKilled;

        public static void RaiseDamageDealt(GameObject target, DamageData data)
        {
            OnDamageDealt?.Invoke(target, data);
        }

        public static void RaiseTargetKilled(GameObject target, GameObject killer)
        {
            OnTargetKilled?.Invoke(target, killer);
        }
    }
}
