using System;
using System.Collections.Generic;

namespace Scar.Core
{
    /// <summary>
    /// SCAR — The Last Choice
    /// Master Lightweight, type-safe, decoupled Event Bus for Unity 6.
    /// Supports both generic typed struct dispatch and string topic dispatch.
    /// Author: Sirish (Lead / Integration)
    /// </summary>
    public static class EventBus
    {
        private static readonly Dictionary<Type, List<Delegate>> _typedSubscribers = new Dictionary<Type, List<Delegate>>();
        private static readonly Dictionary<string, List<Action<object>>> _stringSubscribers = new Dictionary<string, List<Action<object>>>();

        // Singleton compatibility wrapper for legacy or dynamic calls (EventBus.Instance)
        public static readonly EventBusInstanceWrapper Instance = new EventBusInstanceWrapper();

        public class EventBusInstanceWrapper
        {
            public void Subscribe(string eventName, Action<object> callback) 
            { 
                EventBus.Subscribe(eventName, callback); 
            }

            public void Unsubscribe(string eventName, Action<object> callback) 
            { 
                EventBus.Unsubscribe(eventName, callback); 
            }

            public void Publish(string eventName, object payload) 
            { 
                EventBus.Publish(eventName, payload); 
            }

            public void Publish(string eventName) 
            { 
                EventBus.Publish(eventName, null); 
            }

            public void Subscribe<T>(Action<T> listener) where T : struct 
            { 
                EventBus.Subscribe(listener); 
            }

            public void Unsubscribe<T>(Action<T> listener) where T : struct 
            { 
                EventBus.Unsubscribe(listener); 
            }

            public void Publish<T>(T eventData) where T : struct 
            { 
                EventBus.Publish(eventData); 
            }
        }

        // ─── Generic Typed Struct Pub/Sub ─────────────────────────────────────────

        public static void Subscribe<T>(Action<T> listener) where T : struct
        {
            if (listener == null) return;
            Type eventType = typeof(T);

            if (!_typedSubscribers.ContainsKey(eventType))
            {
                _typedSubscribers[eventType] = new List<Delegate>();
            }

            if (!_typedSubscribers[eventType].Contains(listener))
            {
                _typedSubscribers[eventType].Add(listener);
            }
        }

        public static void Unsubscribe<T>(Action<T> listener) where T : struct
        {
            if (listener == null) return;
            Type eventType = typeof(T);

            if (_typedSubscribers.ContainsKey(eventType))
            {
                _typedSubscribers[eventType].Remove(listener);
                if (_typedSubscribers[eventType].Count == 0)
                {
                    _typedSubscribers.Remove(eventType);
                }
            }
        }

        public static void Publish<T>(T eventData) where T : struct
        {
            Type eventType = typeof(T);
            List<Delegate> listeners;

            if (_typedSubscribers.TryGetValue(eventType, out listeners))
            {
                var listenersCopy = new List<Delegate>(listeners);
                for (int i = 0; i < listenersCopy.Count; i++)
                {
                    var action = listenersCopy[i] as Action<T>;
                    if (action != null)
                    {
                        try
                        {
                            action.Invoke(eventData);
                        }
                        catch (Exception ex)
                        {
                            UnityEngine.Debug.LogError("[EventBus] Exception in typed handler for " + eventType.Name + ": " + ex.Message);
                        }
                    }
                }
            }
        }

        // ─── String Topic Pub/Sub ─────────────────────────────────────────────────

        public static void Subscribe(string eventName, Action<object> callback)
        {
            if (string.IsNullOrEmpty(eventName) || callback == null) return;

            if (!_stringSubscribers.ContainsKey(eventName))
            {
                _stringSubscribers[eventName] = new List<Action<object>>();
            }

            if (!_stringSubscribers[eventName].Contains(callback))
            {
                _stringSubscribers[eventName].Add(callback);
            }
        }

        public static void Unsubscribe(string eventName, Action<object> callback)
        {
            if (string.IsNullOrEmpty(eventName) || callback == null) return;

            if (_stringSubscribers.ContainsKey(eventName))
            {
                _stringSubscribers[eventName].Remove(callback);
                if (_stringSubscribers[eventName].Count == 0)
                {
                    _stringSubscribers.Remove(eventName);
                }
            }
        }

        public static void Publish(string eventName, object payload)
        {
            if (string.IsNullOrEmpty(eventName)) return;
            List<Action<object>> listeners;

            if (_stringSubscribers.TryGetValue(eventName, out listeners))
            {
                var listenersCopy = new List<Action<object>>(listeners);
                for (int i = 0; i < listenersCopy.Count; i++)
                {
                    var action = listenersCopy[i];
                    if (action != null)
                    {
                        try
                        {
                            action.Invoke(payload);
                        }
                        catch (Exception ex)
                        {
                            UnityEngine.Debug.LogError("[EventBus] Exception in string handler for " + eventName + ": " + ex.Message);
                        }
                    }
                }
            }
        }

        public static void Publish(string eventName)
        {
            Publish(eventName, null);
        }

        /// <summary>
        /// Clear all subscriptions.
        /// </summary>
        public static void ClearAll()
        {
            _typedSubscribers.Clear();
            _stringSubscribers.Clear();
        }
    }
}
