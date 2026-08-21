using System;
using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using Scar.Core;

namespace Scar.UI
{
    /// <summary>
    /// SCAR — The Last Choice
    /// VFXManager: Centralized Visual Effects Manager (Unity 6 / URP / Particle System).
    /// Spawns and recycles particle systems for the Scar, Combat Hits, Power Novas,
    /// Kinetic Barriers, Chrono Stasis, and Boss Battles.
    /// Author: Ashwidha (Visual / UI / Cinematic Lead)
    /// </summary>
    public class VFXManager : MonoBehaviour
    {
        public static VFXManager Instance { get; private set; }

        [Header("Player Scar Visuals")]
        [SerializeField] private ParticleSystem _scarGlowParticles;
        [SerializeField] private Material _playerScarMaterial;

        [Header("Combat & Hit Particle Prefabs")]
        [SerializeField] private GameObject _hitImpactSparksPrefab;
        [SerializeField] private GameObject _enemyDefeatBurstPrefab;
        [SerializeField] private GameObject _criticalSlashArcPrefab;

        [Header("Power Awakening VFX Prefabs")]
        [SerializeField] private GameObject _destructionNovaPrefab;
        [SerializeField] private GameObject _kineticBarrierPrefab;
        [SerializeField] private GameObject _chronoStasisGridPrefab;

        [Header("Boss & Environment VFX")]
        [SerializeField] private GameObject _bossSlamShockwavePrefab;
        [SerializeField] private GameObject _bossTyrantAuraPrefab;
        [SerializeField] private ParticleSystem _ambientCyberRain;

        [Header("Tuning & Performance Pools")]
        [SerializeField] private int _initialPoolSize = 10;
        [SerializeField] private float _defaultVfxLifetime = 2.5f;

        private readonly List<GameObject> _activeVfxInstances = new List<GameObject>();

        private void Awake()
        {
            if (Instance != null && Instance != this)
            {
                Destroy(gameObject);
                return;
            }
            Instance = this;
        }

        private void OnEnable()
        {
            EventBus.Subscribe<GameEvents.PlayerDamagedEvent>(OnPlayerDamaged);
            EventBus.Subscribe<GameEvents.EnemyDefeatedEvent>(OnEnemyDefeated);
            EventBus.Subscribe<GameEvents.PowerUnlockedEvent>(OnPowerUnlocked);
            EventBus.Subscribe<GameEvents.BossDefeatedEvent>(OnBossDefeated);
        }

        private void OnDisable()
        {
            EventBus.Unsubscribe<GameEvents.PlayerDamagedEvent>(OnPlayerDamaged);
            EventBus.Unsubscribe<GameEvents.EnemyDefeatedEvent>(OnEnemyDefeated);
            EventBus.Unsubscribe<GameEvents.PowerUnlockedEvent>(OnPowerUnlocked);
            EventBus.Unsubscribe<GameEvents.BossDefeatedEvent>(OnBossDefeated);
        }

        private void Start()
        {
            InitializeAmbientEffects();
        }

        private void InitializeAmbientEffects()
        {
            if (_ambientCyberRain != null && !_ambientCyberRain.isPlaying)
            {
                _ambientCyberRain.Play();
            }
        }

        // ─── Power VFX Spawners ───────────────────────────────────────────────────

        public void SpawnDestructionNova(Vector3 origin)
        {
            SpawnVfxPrefab(_destructionNovaPrefab, origin, Quaternion.identity, 3.0f);
        }

        public GameObject SpawnKineticBarrier(Transform parentTransform, float duration = 5.0f)
        {
            if (_kineticBarrierPrefab == null || parentTransform == null) return null;

            GameObject barrier = Instantiate(_kineticBarrierPrefab, parentTransform.position, Quaternion.identity, parentTransform);
            Destroy(barrier, duration);
            return barrier;
        }

        public void SpawnChronoStasisGrid(Vector3 center, float radius = 8.0f)
        {
            SpawnVfxPrefab(_chronoStasisGridPrefab, center, Quaternion.identity, 4.0f);
        }

        public void SpawnHitSparks(Vector3 point, Vector3 normal)
        {
            Quaternion rot = normal != Vector3.zero ? Quaternion.LookRotation(normal) : Quaternion.identity;
            SpawnVfxPrefab(_hitImpactSparksPrefab, point, rot, 1.5f);
        }

        public void SpawnEnemyDefeatBurst(Vector3 position)
        {
            SpawnVfxPrefab(_enemyDefeatBurstPrefab, position, Quaternion.identity, 2.0f);
        }

        public void SpawnBossSlam(Vector3 position)
        {
            SpawnVfxPrefab(_bossSlamShockwavePrefab, position, Quaternion.identity, 3.5f);
        }

        public void EnableScarGlow(bool active)
        {
            if (_scarGlowParticles != null)
            {
                if (active && !_scarGlowParticles.isPlaying) _scarGlowParticles.Play();
                else if (!active && _scarGlowParticles.isPlaying) _scarGlowParticles.Stop();
            }
        }

        private void SpawnVfxPrefab(GameObject prefab, Vector3 pos, Quaternion rot, float lifetime)
        {
            if (prefab == null) return;

            GameObject vfx = Instantiate(prefab, pos, rot);
            _activeVfxInstances.Add(vfx);
            StartCoroutine(CleanupVfxRoutine(vfx, lifetime));
        }

        private IEnumerator CleanupVfxRoutine(GameObject instance, float delay)
        {
            yield return new WaitForSeconds(delay);
            if (instance != null)
            {
                _activeVfxInstances.Remove(instance);
                Destroy(instance);
            }
        }

        // ─── Event Handlers ─────────────────────────────────────────────────────────

        private void OnPlayerDamaged(GameEvents.PlayerDamagedEvent e)
        {
            // Flash crimson scar on player damage
            if (_playerScarMaterial != null)
            {
                StartCoroutine(ScarPulseRoutine());
            }
        }

        private void OnEnemyDefeated(GameEvents.EnemyDefeatedEvent e)
        {
            // Defeat explosion is handled at enemy position or via general particle
        }

        private void OnPowerUnlocked(GameEvents.PowerUnlockedEvent e)
        {
            EnableScarGlow(true);

            Vector3 spawnPos = Vector3.zero;
            GameObject player = GameObject.FindGameObjectWithTag("Player");
            if (player != null) spawnPos = player.transform.position;

            switch (e.PowerPath)
            {
                case "AGGRESSIVE":
                    SpawnDestructionNova(spawnPos);
                    break;
                case "PROTECTIVE":
                    if (player != null) SpawnKineticBarrier(player.transform, 6.0f);
                    break;
                case "STRATEGIC":
                    SpawnChronoStasisGrid(spawnPos);
                    break;
            }
        }

        private void OnBossDefeated(GameEvents.BossDefeatedEvent e)
        {
            GameObject boss = GameObject.FindGameObjectWithTag("Boss");
            if (boss != null)
            {
                SpawnEnemyDefeatBurst(boss.transform.position);
            }
        }

        private IEnumerator ScarPulseRoutine()
        {
            if (_playerScarMaterial == null) yield break;

            Color originalColor = _playerScarMaterial.GetColor("_EmissionColor");
            Color pulseColor = Color.red * 3.5f;

            _playerScarMaterial.SetColor("_EmissionColor", pulseColor);
            yield return new WaitForSeconds(0.25f);
            _playerScarMaterial.SetColor("_EmissionColor", originalColor);
        }
    }
}
