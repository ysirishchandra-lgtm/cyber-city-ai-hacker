using System;

namespace Scar.Core
{
    /// <summary>
    /// SCAR — The Last Choice
    /// Strongly-typed event payloads for decoupled cross-system communication.
    /// Author: Sirish (Lead / Integration)
    /// </summary>
    public static class GameEvents
    {
        public struct GameStartedEvent
        {
            public string PlayerId;
            public string PlayerName;
        }

        public struct PhaseChangedEvent
        {
            public GamePhase PreviousPhase;
            public GamePhase NewPhase;
        }

        public struct LevelStartedEvent
        {
            public int LevelIndex;
            public string LevelName;
        }

        public struct PlayerDamagedEvent
        {
            public float DamageAmount;
            public float RemainingHealth;
            public string DamageSource;
        }

        public struct EnemyDefeatedEvent
        {
            public string EnemyId;
            public string EnemyType;
            public int TotalDefeated;
        }

        public struct PowerUnlockedEvent
        {
            public string PowerPath; // AGGRESSIVE, PROTECTIVE, STRATEGIC
            public string PowerName;
        }

        public struct ChoicePresentedEvent
        {
            public string ChoiceId;
            public string Title;
            public string[] OptionDescriptions;
        }

        public struct ChoiceSelectedEvent
        {
            public string ChoiceId;
            public string SelectedOptionId;
            public int ChoiceIndex;
        }

        public struct BossDefeatedEvent
        {
            public string BossId;
            public float BattleDuration;
        }

        public struct EndingReachedEvent
        {
            public string EndingId; // VILLAIN, HERO, SAVIOR, HUMAN
            public int FinalScore;
        }

        public struct GameOverEvent
        {
            public string CauseOfDeath;
            public int FinalScore;
        }
    }
}
