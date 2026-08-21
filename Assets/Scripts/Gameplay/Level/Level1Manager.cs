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

        public Level1Stage CurrentStage => _currentStage;

        private void Awake()
        {
            EventBus.Instance.Subscribe("CLUE_DISCOVERED", OnClueDiscovered);
            EventBus.Instance.Subscribe(GameEvents.ENEMY_DEFEATED, OnEnemyDefeated);
            EventBus.Instance.Subscribe(GameEvents.BOSS_DEFEATED, OnBossDefeated);
        }

        private void OnDestroy()
        {
            EventBus.Instance.Unsubscribe("CLUE_DISCOVERED", OnClueDiscovered);
            EventBus.Instance.Unsubscribe(GameEvents.ENEMY_DEFEATED, OnEnemyDefeated);
            EventBus.Instance.Unsubscribe(GameEvents.BOSS_DEFEATED, OnBossDefeated);
        }

        public void AdvanceStage(Level1Stage nextStage)
        {
            _currentStage = nextStage;
            EventBus.Instance.Publish("LEVEL_STAGE_CHANGED", new { stage = _currentStage.ToString() });
        }

        private void OnClueDiscovered(object payload)
        {
            _clueFound = true;
            if (_currentStage == Level1Stage.INVESTIGATE_CLUE || _currentStage == Level1Stage.REACH_ALLEY)
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
            EventBus.Instance.Publish(GameEvents.POWER_AWAKENED, "DESTRUCTION");
        }
    }
}
