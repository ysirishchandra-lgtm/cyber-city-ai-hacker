using UnityEngine;
using System.Collections;
using Unity.Cinemachine;
using Scar.Core;

namespace Scar.UI_Visuals
{
    public class BossEncounterTrigger : MonoBehaviour
    {
        [Header("Arena Setup")]
        [SerializeField] private GameObject[] _arenaBoundaries;
        [SerializeField] private Transform _bossSpawnPoint;
        [SerializeField] private GameObject _bossPrefab;
        [SerializeField] private string _bossName = "ATLAS - THE PRODIGY";

        [Header("Camera & UI Handlers")]
        [SerializeField] private CinemachineCamera _bossFocusCamera;
        [SerializeField] private BossHUDController _bossHUD;

        private bool _isTriggered = false;

        private void OnTriggerEnter(Collider other)
        {
            if (!_isTriggered && other.CompareTag("Player"))
            {
                _isTriggered = true;
                StartCoroutine(TriggerEncounterSequence(other.transform));
            }
        }

        private IEnumerator TriggerEncounterSequence(Transform playerTransform)
        {
            // 1. Lock the player inside the arena boundary
            if (_arenaBoundaries != null)
            {
                foreach (var wall in _arenaBoundaries)
                {
                    if (wall != null) wall.SetActive(true);
                }
            }

            // 2. Despawn leftover grunt enemies
            GameObject[] grunts = GameObject.FindGameObjectsWithTag("GruntEnemy");
            foreach (var grunt in grunts)
            {
                Destroy(grunt);
            }

            // Temporarily lock player input
            EventBus.Publish(new GameEvents.PhaseChangedEvent { NewPhase = GamePhase.FINAL_ENCOUNTER });

            // 3. Trigger camera focus pan to the Boss spawn point
            if (_bossFocusCamera != null)
            {
                _bossFocusCamera.Priority = 50; // Override main camera
            }

            yield return new WaitForSeconds(1f); // Camera pan time

            // 4. Instantiate the Boss prefab
            GameObject bossObj = null;
            if (_bossPrefab != null && _bossSpawnPoint != null)
            {
                bossObj = Instantiate(_bossPrefab, _bossSpawnPoint.position, _bossSpawnPoint.rotation);
            }
            else
            {
                Debug.Log("[BossEncounterTrigger] Spawning Mock Boss (Prefab missing)");
            }

            // 5. Camera dramatic pause
            yield return new WaitForSeconds(1.5f);

            // 6. Intro Sequence UI Hooks
            if (_bossHUD == null) _bossHUD = FindObjectOfType<BossHUDController>();
            
            if (_bossHUD != null)
            {
                _bossHUD.ShowBossHUD(_bossName, 1000f);
                _bossHUD.TriggerPhaseTransition(1); // PHASE 1: THE HUMAN
            }

            // Return camera to player
            if (_bossFocusCamera != null)
            {
                _bossFocusCamera.Priority = 0;
            }

            yield return new WaitForSeconds(1f);

            // Unlock player input
            Debug.Log("[BossEncounterTrigger] Boss Encounter officially started! Player input unlocked.");
        }
    }
}
