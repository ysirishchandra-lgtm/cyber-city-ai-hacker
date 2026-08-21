namespace Scar.Core
{
    /// <summary>
    /// SCAR — The Last Choice
    /// Contract for all damageable entities (Player, Drone, Enforcer, Stalker, Sentinel, Hero Atlas).
    /// Used by: Kaustub (Gameplay) & Ashwidha (VFX)
    /// </summary>
    public interface IDamageable
    {
        float CurrentHealth { get; }
        float MaxHealth { get; }
        bool IsAlive { get; }

        void TakeDamage(float amount, string damageSource = "Unknown");
        void Heal(float amount);
    }
}
