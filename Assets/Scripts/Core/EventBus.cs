using System;
using System.Collections.Generic;

namespace Scar.Core
{
    public static class GameEvents
    {
        public const string GAME_STARTED = "GAME_STARTED";
        public const string PLAYER_MOVED = "PLAYER_MOVED";
        public const string PLAYER_DAMAGED = "PLAYER_DAMAGED";
        public const string COMBAT_STARTED = "COMBAT_STARTED";
        public const string COMBAT_ENDED = "COMBAT_ENDED";
        public const string ENEMY_DEFEATED = "ENEMY_DEFEATED";
        public const string SCAR_RECEIVED = "SCAR_RECEIVED";
        public const string POWER_AWAKENED = "POWER_AWAKENED";
        public const string CHOICE_MADE = "CHOICE_MADE";
        public const string POWER_PATH_CHANGED = "POWER_PATH_CHANGED";
        public const string HERO_DETECTED_PLAYER = "HERO_DETECTED_PLAYER";
        public const string HERO_ENCOUNTER = "HERO_ENCOUNTER";
        public const string FINAL_BATTLE_STARTED = "FINAL_BATTLE_STARTED";
        public const string BOSS_DEFEATED = "BOSS_DEFEATED";
        public const string FINAL_CHOICE_MADE = "FINAL_CHOICE_MADE";
        public const string ENDING_TRIGGERED = "ENDING_TRIGGERED";
        public const string GAME_OVER = "GAME_OVER";
    }

    public class EventBus
    {
        private static EventBus _instance;
        public static EventBus Instance => _instance ??= new EventBus();

        private readonly Dictionary<string, List<Action<object>>> _listeners = new();

        public void Subscribe(string eventName, Action<object> callback)
        {
            if (!_listeners.ContainsKey(eventName))
            {
                _listeners[eventName] = new List<Action<object>>();
            }
            _listeners[eventName].Add(callback);
        }

        public void Unsubscribe(string eventName, Action<object> callback)
        {
            if (_listeners.ContainsKey(eventName))
            {
                _listeners[eventName].Remove(callback);
            }
        }

        public void Publish(string eventName, object payload = null)
        {
            if (_listeners.TryGetValue(eventName, out var callbacks))
            {
                var copy = new List<Action<object>>(callbacks);
                foreach (var callback in copy)
                {
                    callback?.Invoke(payload);
                }
            }
        }

        public void Reset()
        {
            _listeners.Clear();
        }
    }
}
