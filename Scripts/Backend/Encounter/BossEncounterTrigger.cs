using System;
using System.Collections;
using UnityEngine;
using GameHack.Backend.Boss;
using Scar.Audio;
using Scar.UI_Visuals;

namespace GameHack.Backend.Encounter
{
    /// <summary>
    /// Level 3 Boss Arena Trigger & Transition Controller.
    /// Detects player arena entry, locks arena boundaries, disables enemy spawners,
    /// crossfades BGM to Boss state, activates the BossHUDController, and presents
    /// the initial Phase 1 "THE HUMAN" intro banner.
    /// </summary>
    [RequireComponent(typeof(Collider))]
    public class BossEncounterTrigger : MonoBehaviour
    {
        // ─── Events ───────────────────────────────────────────────────────────
        public event Action<AdaptiveBossController3D> OnBossEncounterStarted;
        public event Action                           OnArenaLocked;
        public event Action                           OnArenaUnlocked;

        // ─── Inspector: Arena & Boss ──────────────────────────────────────────
        [Header("Boss References")]
        [SerializeField] private AdaptiveBossController3D _bossController;
        [SerializeField] private string                   _bossDisplayName = "ATLAS — THE PROTOTYPE";
        [SerializeField] private float                    _bossMaxHealth   = 800f;

        [Header("Arena Gates / Barriers")]
        [SerializeField] private GameObject[]             _arenaExitBarriers;
        [SerializeField] private GameObject[]             _minionSpawnersToDisable;

        [Header("UI Integration")]
        [SerializeField] private BossHUDController        _bossHUDController;

        [Header("Detection Settings")]
        [SerializeField] private string                   _playerTag = "Player";
        [SerializeField] private bool                     _triggerOnce = true;

        // ─── Runtime State ────────────────────────────────────────────────────
        private bool _hasTriggered;

        // ─────────────────────────────────────────────────────────────────────

        private void Awake()
        {
            var col = GetComponent<Collider>();
            col.isTrigger = true;

            // Ensure barriers start inactive/open
            SetBarriersActive(false);

            if (_bossController != null)
            {
                _bossController.OnPhaseChanged += HandleBossPhaseChanged;
                _bossController.OnBossDefeated += HandleBossDefeated;
            }
        }

        private void OnDestroy()
        {
            if (_bossController != null)
            {
                _bossController.OnPhaseChanged -= HandleBossPhaseChanged;
                _bossController.OnBossDefeated -= HandleBossDefeated;
            }
        }

        private void OnTriggerEnter(Collider other)
        {
            if (_hasTriggered && _triggerOnce) return;

            if (other.CompareTag(_playerTag) || other.GetComponent<PlayerStatsManager>() != null)
            {
                _hasTriggered = true;
                StartCoroutine(InitiateBossEncounterSequence());
            }
        }

        // ─── Boss Sequence ────────────────────────────────────────────────────

        private IEnumerator InitiateBossEncounterSequence()
        {
            Debug.Log($"[BossEncounterTrigger] Player entered Arena. Locking down arena & engaging {_bossDisplayName}.");

            // 1. Lock arena exits & disable grunt spawners
            SetBarriersActive(true);
            SetMinionSpawnersActive(false);
            OnArenaLocked?.Invoke();

            // 2. Crossfade BGM stem to Boss state
            AudioManager.Instance?.SetAudioState(AudioManager.AudioState.Boss);

            // 3. Initialize Boss HUD with Max Health
            if (_bossHUDController != null)
            {
                _bossHUDController.ShowBossHUD(_bossDisplayName, _bossMaxHealth);
                _bossHUDController.TriggerPhaseTransition(1); // "PHASE 1: THE HUMAN"
            }

            // 4. Notify Listeners
            OnBossEncounterStarted?.Invoke(_bossController);

            yield return null;
        }

        // ─── Handlers ─────────────────────────────────────────────────────────

        private void Update()
        {
            // Sync live boss health with HUD
            if (_hasTriggered && _bossController != null && _bossHUDController != null)
            {
                float currentHP = _bossController.HealthRatio * _bossMaxHealth;
                _bossHUDController.UpdateHealth(currentHP);
            }
        }

        private void HandleBossPhaseChanged(BossPhase phase)
        {
            int phaseIndex = (int)phase + 1; // 1-indexed phase
            Debug.Log($"[BossEncounterTrigger] Boss transitioned to {phase} (Index {phaseIndex}). Updating HUD banner.");
            _bossHUDController?.TriggerPhaseTransition(phaseIndex);
        }

        private void HandleBossDefeated(BossPhase finalPhase)
        {
            Debug.Log("[BossEncounterTrigger] Boss Defeated! Unlocking arena gates & transitioning BGM to Exploration.");
            SetBarriersActive(false);
            AudioManager.Instance?.SetAudioState(AudioManager.AudioState.Exploration);
            OnArenaUnlocked?.Invoke();
        }

        // ─── Helpers ──────────────────────────────────────────────────────────

        private void SetBarriersActive(bool active)
        {
            if (_arenaExitBarriers == null) return;
            foreach (var barrier in _arenaExitBarriers)
            {
                if (barrier != null) barrier.SetActive(active);
            }
        }

        private void SetMinionSpawnersActive(bool active)
        {
            if (_minionSpawnersToDisable == null) return;
            foreach (var spawner in _minionSpawnersToDisable)
            {
                if (spawner != null) spawner.SetActive(active);
            }
        }
    }
}
