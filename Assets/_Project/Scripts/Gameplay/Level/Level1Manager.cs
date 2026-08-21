using System.Collections.Generic;
using UnityEngine;
using Scar.Core;

namespace Scar.Gameplay.Level
{
    public enum Level1Stage
    {
        START_HOME,
        REACH_ALLEY,
        INVESTIGATE_CLUE,
        DEFEAT_WAVE,
        ENTER_WAREHOUSE,
        DEFEAT_MINI_BOSS,
        POWER_AWAKENING,
        COMPLETE
    }

    public class Level1Manager : MonoBehaviour
    {
        private Level1Stage _currentStage = Level1Stage.START_HOME;
        private int _enemiesDefeated = 0;
        private bool _clueFound = false;

        public Level1Stage CurrentStage { get { return _currentStage; } }

        private void Awake()
        {
            EventBus.Subscribe(GameEvents.CLUE_DISCOVERED, OnClueDiscovered);
            EventBus.Subscribe(GameEvents.ENEMY_DEFEATED, OnEnemyDefeated);
            EventBus.Subscribe(GameEvents.BOSS_DEFEATED, OnBossDefeated);
        }

        private void OnDestroy()
        {
            EventBus.Unsubscribe(GameEvents.CLUE_DISCOVERED, OnClueDiscovered);
            EventBus.Unsubscribe(GameEvents.ENEMY_DEFEATED, OnEnemyDefeated);
            EventBus.Unsubscribe(GameEvents.BOSS_DEFEATED, OnBossDefeated);
        }

        public void AdvanceStage(Level1Stage nextStage)
        {
            _currentStage = nextStage;
            EventBus.Publish("LEVEL_STAGE_CHANGED", _currentStage.ToString());
        }

        private void OnClueDiscovered(object payload)
        {
            _clueFound = true;
            if (_currentStage == Level1Stage.INVESTIGATE_CLUE || _currentStage == Level1Stage.REACH_ALLEY || _currentStage == Level1Stage.START_HOME)
            {
                AdvanceStage(Level1Stage.DEFEAT_WAVE);
            }
        }

        private void OnEnemyDefeated(object payload)
        {
            _enemiesDefeated++;
            if (_currentStage == Level1Stage.DEFEAT_WAVE && _enemiesDefeated >= 3)
            {
                AdvanceStage(Level1Stage.ENTER_WAREHOUSE);
            }
        }

        private void OnBossDefeated(object payload)
        {
            AdvanceStage(Level1Stage.POWER_AWAKENING);
            EventBus.Publish(GameEvents.POWER_AWAKENED, "DESTRUCTION");

            if (GameManager.Instance != null && GameManager.Instance.State != null)
            {
                GameManager.Instance.State.SetPhase(GamePhase.POWER_AWAKENING);
            }
        }
    }
}
