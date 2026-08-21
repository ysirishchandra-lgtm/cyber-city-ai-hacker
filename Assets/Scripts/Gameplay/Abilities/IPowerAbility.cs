using UnityEngine;

namespace Scar.Gameplay.Abilities
{
    public interface IPowerAbility
    {
        string Name { get; }
        float Cooldown { get; }
        float CurrentCooldown { get; }
        bool IsReady { get; }
        bool Activate(GameObject caster);
        void UpdateCooldown(float deltaTime);
    }
}
