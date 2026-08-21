using System.IO;
using UnityEngine;

namespace Scar.Backend
{
    public class LocalSaveService
    {
        private readonly string _savePath;

        public LocalSaveService()
        {
            _savePath = Path.Combine(Application.persistentDataPath, "scar_localsave.json");
        }

        public void Save(GameSaveData data)
        {
            try
            {
                string json = JsonUtility.ToJson(data, true);
                File.WriteAllText(_savePath, json);
                Debug.Log("[LocalSaveService] Game saved locally.");
            }
            catch (System.Exception e)
            {
                Debug.LogError($"[LocalSaveService] Failed to save: {e.Message}");
            }
        }

        public GameSaveData Load()
        {
            try
            {
                if (File.Exists(_savePath))
                {
                    string json = File.ReadAllText(_savePath);
                    return JsonUtility.FromJson<GameSaveData>(json);
                }
            }
            catch (System.Exception e)
            {
                Debug.LogError($"[LocalSaveService] Failed to load: {e.Message}");
            }
            return null;
        }

        public void DeleteSave()
        {
            if (File.Exists(_savePath))
            {
                File.Delete(_savePath);
            }
        }
    }
}
