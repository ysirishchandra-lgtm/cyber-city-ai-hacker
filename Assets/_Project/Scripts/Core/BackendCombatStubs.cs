using UnityEngine;
using System;

namespace Scar.Core
{
    public enum ArchetypeType
    {
        Scar, Titan, Volt, Phase, Nova
    }

    public class CharacterArchetypeManager : MonoBehaviour
    {
        public static CharacterArchetypeManager Instance { get; private set; }
        private void Awake() { if (Instance == null) Instance = this; }
        public void SelectArchetype(ArchetypeType type) { Debug.Log($"Archetype Selected: {type}"); }
    }

    public class CombatController3D : MonoBehaviour
    {
        public void ExecuteAttack() { Debug.Log("Executing Light Attack"); }
        public void ExecuteSpecial() { Debug.Log("Executing Special Attack"); }
        public void ConsumeEnergy(float amount) { Debug.Log($"Consuming {amount} Energy"); }
    }

    public class StyleRatingSystem : MonoBehaviour
    {
        public static Action<string, float> OnStyleRankChanged; // rank, multiplier
    }

    public class Hurtbox3D : MonoBehaviour
    {
        public static Action<Vector3, int, bool> OnTakeDamage; // position, damage, isCritical
    }
}
