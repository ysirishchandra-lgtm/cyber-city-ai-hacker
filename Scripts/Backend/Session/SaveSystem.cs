using System;
using System.Collections.Generic;
using System.IO;
using UnityEngine;
using GameHack.Backend.Scoring;

namespace GameHack.Backend.Session
{
    /// <summary>
    /// Local Save System for SCAR — BECOME.
    /// Handles persistent storage of GameSummaryPayload run records,
    /// high scores, unlock states (e.g. New Game+), and run history.
    /// Fully platform-independent using Unity's persistentDataPath and JSON serialization.
    /// </summary>
    public static class SaveSystem
    {
        private static readonly string SaveFileName = "scar_run_history.json";
        private static string SaveFilePath => Path.Combine(Application.persistentDataPath, SaveFileName);

        [Serializable]
        public class SaveDataContainer
        {
            public int HighScore;
            public string HighestStyleRank = "D";
            public bool IsNewGamePlusUnlocked;
            public List<GameSummaryPayload> RunHistory = new List<GameSummaryPayload>();
            public string LastSavedTimestamp;
        }

        private static SaveDataContainer _cachedData;

        /// <summary>
        /// Loads cached or persistent save data from disk.
        /// </summary>
        public static SaveDataContainer LoadData()
        {
            if (_cachedData != null) return _cachedData;

            try
            {
                if (File.Exists(SaveFilePath))
                {
                    string json = File.ReadAllText(SaveFilePath);
                    _cachedData = JsonUtility.FromJson<SaveDataContainer>(json);
                    if (_cachedData != null) return _cachedData;
                }
            }
            catch (Exception ex)
            {
                Debug.LogWarning($"[SaveSystem] Failed to read save file from disk: {ex.Message}. Initializing fresh profile.");
            }

            _cachedData = new SaveDataContainer();
            return _cachedData;
        }

        /// <summary>
        /// Saves a completed run summary, updates high scores, and commits to file.
        /// </summary>
        public static void SaveRunSummary(GameSummaryPayload summary, bool unlockNGPlus = false)
        {
            var data = LoadData();

            data.RunHistory.Add(summary);
            if (summary.FinalScore > data.HighScore)
            {
                data.HighScore = summary.FinalScore;
            }

            // Update highest style rank if applicable
            if (string.Compare(summary.MaxStyleRankLabel, data.HighestStyleRank, StringComparison.OrdinalIgnoreCase) > 0)
            {
                data.HighestStyleRank = summary.MaxStyleRankLabel;
            }

            if (unlockNGPlus || summary.SelectedEnding == "TAKE_CONTROL")
            {
                data.IsNewGamePlusUnlocked = true;
            }

            data.LastSavedTimestamp = DateTime.UtcNow.ToString("o");

            try
            {
                string json = JsonUtility.ToJson(data, true);
                File.WriteAllText(SaveFilePath, json);
                Debug.Log($"[SaveSystem] Saved run successfully ({summary.SelectedEnding}). File at: {SaveFilePath}");
            }
            catch (Exception ex)
            {
                Debug.LogError($"[SaveSystem] Failed to write save file: {ex.Message}");
            }
        }

        /// <summary>
        /// Clears local save data (for debugging / fresh runs).
        /// </summary>
        public static void ClearSaveData()
        {
            _cachedData = new SaveDataContainer();
            try
            {
                if (File.Exists(SaveFilePath))
                {
                    File.Delete(SaveFilePath);
                }
                Debug.Log("[SaveSystem] Cleared all persistent save data.");
            }
            catch (Exception ex)
            {
                Debug.LogError($"[SaveSystem] Failed to delete save file: {ex.Message}");
            }
        }
    }
}
