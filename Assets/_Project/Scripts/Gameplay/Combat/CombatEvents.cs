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
            if (OnDamageDealt != null) OnDamageDealt(target, data);
        }

        public static void RaiseTargetKilled(GameObject target, GameObject killer)
        {
            if (OnTargetKilled != null) OnTargetKilled(target, killer);
        }
    }
}
