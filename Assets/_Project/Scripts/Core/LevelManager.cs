using UnityEngine;

namespace Scar.Core
{
    public class LevelManager : MonoBehaviour
    {
        public static LevelManager Instance { get; private set; }

        private void Awake()
        {
            if (Instance == null) Instance = this;
            else Destroy(gameObject);
        }

        public void SpawnCharacter(string characterId)
        {
            Debug.Log($"[LevelManager] Spawning character {characterId} into the scene.");
            // Actual spawning logic goes here
        }
    }
}
