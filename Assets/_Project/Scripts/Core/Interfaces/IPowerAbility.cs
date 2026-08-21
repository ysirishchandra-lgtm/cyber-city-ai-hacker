namespace Scar.Core
{
    /// <summary>
    /// SCAR — The Last Choice
    /// Contract for superpower abilities (Destruction Nova, Kinetic Barrier, Chrono Stasis).
    /// Used by: Kaustub (Gameplay mechanics) & Ashwidha (Particle/Shader VFX)
    /// </summary>
    public interface IPowerAbility
    {
        string AbilityId { get; }
        string AbilityName { get; }
        string PowerPath { get; } // AGGRESSIVE, PROTECTIVE, STRATEGIC
        float CooldownDuration { get; }
        float RemainingCooldown { get; }
        bool IsReady { get; }

        bool CanActivate();
        void Activate();
    }
}
