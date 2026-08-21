using System;
using UnityEngine;

namespace Scar.Core
{
    /// <summary>
    /// SCAR — The Last Choice
    /// Centralized authoritative runtime GameState container.
    /// Author: Sirish (Lead / Integration)
    /// </summary>
    [System.Serializable]
    public class GameState
    {
        [Header("Player Identity (Zero Hardcoded Fake Data)")]
        [SerializeField] private string _playerId = string.Empty;
        [SerializeField] private string _playerName = "Player";

        [Header("Phase & Progression")]
        [SerializeField] private GamePhase _currentPhase = GamePhase.MAIN_MENU;
        [SerializeField] private int _currentLevel = 0;

        [Header("Vitals & Combat")]
        [SerializeField] private float _health = 100f;
        [SerializeField] private float _maxHealth = 100f;
        [SerializeField] private int _score = 0;
        [SerializeField] private int _enemiesDefeated = 0;
        [SerializeField] private int _missionsCompleted = 0;
        [SerializeField] private int _choicesMade = 0;

        [Header("Power & Alignment")]
        [SerializeField] private string _powerPath = "NONE"; // NONE, AGGRESSIVE, PROTECTIVE, STRATEGIC
        [SerializeField] private string _ending = "UNDETERMINED"; // VILLAIN, HERO, SAVIOR, HUMAN

        [Header("Moral / Philosophical Axis (0.0 to 100.0)")]
        [Range(0f, 100f)] [SerializeField] private float _revenge = 0f;
        [Range(0f, 100f)] [SerializeField] private float _humanity = 50f;
        [Range(0f, 100f)] [SerializeField] private float _freedom = 50f;
        [Range(0f, 100f)] [SerializeField] private float _control = 0f;

        // ─── Properties ─────────────────────────────────────────────────────────────
        public string PlayerId { get { return _playerId; } }
        public string PlayerName { get { return _playerName; } }
        public GamePhase CurrentPhase { get { return _currentPhase; } }
        public int CurrentLevel { get { return _currentLevel; } }
        public float Health { get { return _health; } }
        public float MaxHealth { get { return _maxHealth; } }
        public bool IsAlive { get { return _health > 0f; } }
        public int Score { get { return _score; } }
        public int EnemiesDefeated { get { return _enemiesDefeated; } }
        public int MissionsCompleted { get { return _missionsCompleted; } }
        public int ChoicesMade { get { return _choicesMade; } }
        public string PowerPath { get { return _powerPath; } }
        public string Ending { get { return _ending; } }

        public float Revenge { get { return _revenge; } }
        public float Humanity { get { return _humanity; } }
        public float Freedom { get { return _freedom; } }
        public float Control { get { return _control; } }

        // ─── Mutators & State Modifiers ───────────────────────────────────────────

        public void SetPlayerIdentity(string id, string name)
        {
            _playerId = string.IsNullOrEmpty(id) ? Guid.NewGuid().ToString() : id.Trim();
            _playerName = string.IsNullOrEmpty(name) ? "Player" : name.Trim();
        }

        public void SetPhase(GamePhase newPhase)
        {
            if (_currentPhase == newPhase) return;
            GamePhase prev = _currentPhase;
            _currentPhase = newPhase;

            var e = new GameEvents.PhaseChangedEvent();
            e.PreviousPhase = prev;
            e.NewPhase = newPhase;
            EventBus.Publish(e);
        }

        public void SetLevel(int levelIndex, string levelName)
        {
            _currentLevel = Mathf.Max(1, levelIndex);
            var e = new GameEvents.LevelStartedEvent();
            e.LevelIndex = _currentLevel;
            e.LevelName = string.IsNullOrEmpty(levelName) ? ("Level " + _currentLevel) : levelName;
            EventBus.Publish(e);
        }

        public void ApplyDamage(float amount, string damageSource)
        {
            if (!IsAlive || amount <= 0f) return;

            _health = Mathf.Max(0f, _health - amount);
            var damageEvent = new GameEvents.PlayerDamagedEvent();
            damageEvent.DamageAmount = amount;
            damageEvent.RemainingHealth = _health;
            damageEvent.DamageSource = string.IsNullOrEmpty(damageSource) ? "Unknown" : damageSource;
            EventBus.Publish(damageEvent);

            if (_health <= 0f)
            {
                SetPhase(GamePhase.GAME_OVER);
                var gameOverEvent = new GameEvents.GameOverEvent();
                gameOverEvent.CauseOfDeath = damageSource;
                gameOverEvent.FinalScore = _score;
                EventBus.Publish(gameOverEvent);
            }
        }

        public void Heal(float amount)
        {
            if (!IsAlive || amount <= 0f) return;
            _health = Mathf.Min(_maxHealth, _health + amount);
        }

        public void RecordEnemyDefeated(string enemyId, string enemyType, int scoreValue)
        {
            _enemiesDefeated++;
            AddScore(scoreValue);

            var e = new GameEvents.EnemyDefeatedEvent();
            e.EnemyId = enemyId;
            e.EnemyType = enemyType;
            e.TotalDefeated = _enemiesDefeated;
            EventBus.Publish(e);
        }

        public void RecordMissionCompleted(int scoreReward)
        {
            _missionsCompleted++;
            AddScore(scoreReward);
        }

        public void UnlockPower(string powerPathId, string powerName)
        {
            _powerPath = powerPathId;
            var e = new GameEvents.PowerUnlockedEvent();
            e.PowerPath = powerPathId;
            e.PowerName = powerName;
            EventBus.Publish(e);
        }

        public void RecordChoice(string choiceId, string selectedOptionId, int choiceIndex, 
                                 float deltaRevenge, float deltaHumanity, 
                                 float deltaFreedom, float deltaControl)
        {
            _choicesMade++;
            _revenge = Mathf.Clamp(_revenge + deltaRevenge, 0f, 100f);
            _humanity = Mathf.Clamp(_humanity + deltaHumanity, 0f, 100f);
            _freedom = Mathf.Clamp(_freedom + deltaFreedom, 0f, 100f);
            _control = Mathf.Clamp(_control + deltaControl, 0f, 100f);

            var e = new GameEvents.ChoiceSelectedEvent();
            e.ChoiceId = choiceId;
            e.SelectedOptionId = selectedOptionId;
            e.ChoiceIndex = choiceIndex;
            EventBus.Publish(e);
        }

        public void SetEnding(string endingId, int bonusScore)
        {
            _ending = endingId;
            AddScore(bonusScore);
            SetPhase(GamePhase.ENDING);

            var e = new GameEvents.EndingReachedEvent();
            e.EndingId = endingId;
            e.FinalScore = _score;
            EventBus.Publish(e);
        }

        public void AddScore(int amount)
        {
            if (amount > 0)
            {
                _score += amount;
            }
        }

        public void ResetForNewGame()
        {
            _currentPhase = GamePhase.MAIN_MENU;
            _currentLevel = 0;
            _health = _maxHealth;
            _score = 0;
            _enemiesDefeated = 0;
            _missionsCompleted = 0;
            _choicesMade = 0;
            _powerPath = "NONE";
            _ending = "UNDETERMINED";
            _revenge = 0f;
            _humanity = 50f;
            _freedom = 50f;
            _control = 0f;
        }
    }
}
