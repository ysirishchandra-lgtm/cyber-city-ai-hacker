using System;
using System.Collections;
using UnityEngine;
using UnityEngine.SceneManagement;

namespace Scar.Core
{
    /// <summary>
    /// SCAR — The Last Choice
    /// Scene Transition and Flow Coordinator.
    /// Handles missing scenes gracefully with configuration warnings.
    /// Author: Sirish (Lead / Integration)
    /// </summary>
    public class SceneFlowManager : MonoBehaviour
    {
        [Header("Scene Configuration (Unity Build Settings)")]
        [SerializeField] private string _mainMenuScene = "MainMenu";
        [SerializeField] private string _prologueScene = "Prologue";
        [SerializeField] private string _level1Scene = "Level1_Streets";
        [SerializeField] private string _level2Scene = "Level2_Atlas";
        [SerializeField] private string _endingScene = "Ending";

        [Header("Transition Settings")]
        [SerializeField] private float _transitionDelay = 0.5f;

        public event Action<string> OnSceneLoadStarted;
        public event Action<string> OnSceneLoadCompleted;

        public void LoadMainMenu() { TransitionToScene(_mainMenuScene, GamePhase.MAIN_MENU); }
        public void LoadPrologue() { TransitionToScene(_prologueScene, GamePhase.PROLOGUE); }
        public void LoadLevel1() { TransitionToScene(_level1Scene, GamePhase.LEVEL_1); }
        public void LoadLevel2() { TransitionToScene(_level2Scene, GamePhase.LEVEL_2); }
        public void LoadEnding() { TransitionToScene(_endingScene, GamePhase.ENDING); }

        public void TransitionToScene(string sceneName, GamePhase associatedPhase)
        {
            if (string.IsNullOrEmpty(sceneName))
            {
                Debug.LogWarning("[SceneFlowManager] Attempted to load scene with empty name.");
                return;
            }

            if (!IsSceneInBuildSettings(sceneName))
            {
                Debug.LogWarning("[SceneFlowManager] Scene '" + sceneName + "' is not present in Build Settings. Simulating phase switch to " + associatedPhase + " without loading scene.");
                if (GameManager.Instance != null && GameManager.Instance.State != null)
                {
                    GameManager.Instance.State.SetPhase(associatedPhase);
                }
                return;
            }

            StartCoroutine(LoadSceneRoutine(sceneName, associatedPhase));
        }

        private IEnumerator LoadSceneRoutine(string sceneName, GamePhase phase)
        {
            if (OnSceneLoadStarted != null) OnSceneLoadStarted(sceneName);
            Debug.Log("[SceneFlowManager] Starting transition to scene '" + sceneName + "' (Phase: " + phase + ")...");

            if (_transitionDelay > 0f)
            {
                yield return new WaitForSeconds(_transitionDelay);
            }

            AsyncOperation asyncOp = SceneManager.LoadSceneAsync(sceneName);
            if (asyncOp == null)
            {
                Debug.LogError("[SceneFlowManager] Failed to begin async load for scene '" + sceneName + "'.");
                yield break;
            }

            while (!asyncOp.isDone)
            {
                yield return null;
            }

            if (GameManager.Instance != null && GameManager.Instance.State != null)
            {
                GameManager.Instance.State.SetPhase(phase);
            }

            if (OnSceneLoadCompleted != null) OnSceneLoadCompleted(sceneName);
            Debug.Log("[SceneFlowManager] Scene '" + sceneName + "' loaded successfully.");
        }

        public bool IsSceneInBuildSettings(string sceneName)
        {
            if (string.IsNullOrEmpty(sceneName)) return false;

            int sceneCount = SceneManager.sceneCountInBuildSettings;
            for (int i = 0; i < sceneCount; i++)
            {
                string path = SceneUtility.GetScenePathByBuildIndex(i);
                string nameFromPath = System.IO.Path.GetFileNameWithoutExtension(path);
                if (string.Equals(nameFromPath, sceneName, StringComparison.OrdinalIgnoreCase))
                {
                    return true;
                }
            }

            return false;
        }
    }
}
