using System;

namespace Scar.Core
{
    /// <summary>
    /// SCAR — The Last Choice
    /// Strongly-typed event payloads and canonical event topic constants.
    /// Author: Sirish (Lead / Integration)
    /// </summary>
    public static class GameEvents
    {
        // ─── Canonical Event Topic Constants ──────────────────────────────────────
        public const string GAME_STARTED = "GAME_STARTED";
        public const string PHASE_CHANGED = "PHASE_CHANGED";
        public const string LEVEL_STARTED = "LEVEL_STARTED";
        public const string PLAYER_MOVED = "PLAYER_MOVED";
        public const string COMBAT_STARTED = "COMBAT_STARTED";
        public const string PLAYER_DAMAGED = "PLAYER_DAMAGED";
        public const string PLAYER_DIED = "PLAYER_DIED";
        public const string ENEMY_DEFEATED = "ENEMY_DEFEATED";
        public const string CLUE_DISCOVERED = "CLUE_DISCOVERED";
        public const string POWER_AWAKENED = "POWER_AWAKENED";
        public const string POWER_PATH_CHANGED = "POWER_PATH_CHANGED";
        public const string CHOICE_PRESENTED = "CHOICE_PRESENTED";
        public const string CHOICE_SELECTED = "CHOICE_SELECTED";
        public const string CHOICE_MADE = "CHOICE_MADE";
        public const string HERO_DETECTED_PLAYER = "HERO_DETECTED_PLAYER";
        public const string HERO_ENCOUNTER = "HERO_ENCOUNTER";
        public const string FINAL_BATTLE_STARTED = "FINAL_BATTLE_STARTED";
        public const string BOSS_DEFEATED = "BOSS_DEFEATED";
        public const string FINAL_CHOICE_MADE = "FINAL_CHOICE_MADE";
        public const string ENDING_TRIGGERED = "ENDING_TRIGGERED";
        public const string ENDING_REACHED = "ENDING_REACHED";
        public const string GAME_OVER = "GAME_OVER";

        // ─── Typed Event Structs ──────────────────────────────────────────────────
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
