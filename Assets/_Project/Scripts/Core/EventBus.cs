using System;
using System.Collections.Generic;

namespace Scar.Core
{
    /// <summary>
    /// SCAR — The Last Choice
    /// Lightweight, type-safe, decoupled Event Bus for Unity 6.
    /// Author: Sirish (Lead / Integration)
    /// </summary>
    public static class EventBus
    {
        private static readonly Dictionary<Type, List<Delegate>> _subscribers = new Dictionary<Type, List<Delegate>>();

        /// <summary>
        /// Subscribe a listener method to a specific event type.
        /// </summary>
        public static void Subscribe<T>(Action<T> listener) where T : struct
        {
            if (listener == null) return;
            Type eventType = typeof(T);

            if (!_subscribers.ContainsKey(eventType))
            {
                _subscribers[eventType] = new List<Delegate>();
            }

            if (!_subscribers[eventType].Contains(listener))
            {
                _subscribers[eventType].Add(listener);
            }
        }

        /// <summary>
        /// Unsubscribe a listener method from a specific event type.
        /// </summary>
        public static void Unsubscribe<T>(Action<T> listener) where T : struct
        {
            if (listener == null) return;
            Type eventType = typeof(T);

            if (_subscribers.ContainsKey(eventType))
            {
                _subscribers[eventType].Remove(listener);
                if (_subscribers[eventType].Count == 0)
                {
                    _subscribers.Remove(eventType);
                }
            }
        }

        /// <summary>
        /// Publish an event to all registered subscribers.
        /// </summary>
        public static void Publish<T>(T eventData) where T : struct
        {
            Type eventType = typeof(T);
            List<Delegate> listeners;

            if (_subscribers.TryGetValue(eventType, out listeners))
            {
                // Iterate on a shallow copy to allow safe mutation/unsubscribing inside callbacks
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
                            UnityEngine.Debug.LogError("[EventBus] Exception while invoking handler for " + eventType.Name + ": " + ex.Message);
                        }
                    }
                }
            }
        }

        /// <summary>
        /// Clear all subscriptions (e.g. during scene transitions or application teardown).
        /// </summary>
        public static void ClearAll()
        {
            _subscribers.Clear();
        }
    }
}
