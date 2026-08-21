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
        private static VFXManager _instance;
        public static VFXManager Instance 
        { 
            get { return _instance; } 
            private set { _instance = value; } 
        }

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
            if (_instance != null && _instance != this)
            {
                Destroy(gameObject);
                return;
            }
            _instance = this;
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

        // ─── VFX Spawning & Management ─────────────────────────────────────────────

        public GameObject SpawnVfx(GameObject prefab, Vector3 position, Quaternion rotation, float lifetime)
        {
            if (prefab == null) return null;

            var vfxInstance = Instantiate(prefab, position, rotation);
            if (vfxInstance != null)
            {
                _activeVfxInstances.Add(vfxInstance);
                Destroy(vfxInstance, lifetime > 0 ? lifetime : _defaultVfxLifetime);
            }
            return vfxInstance;
        }

        public GameObject SpawnVfx(GameObject prefab, Vector3 position, Quaternion rotation)
        {
            return SpawnVfx(prefab, position, rotation, _defaultVfxLifetime);
        }

        public void PlayHitImpactSparks(Vector3 position)
        {
            SpawnVfx(_hitImpactSparksPrefab, position, Quaternion.identity);
        }

        public void PlayEnemyDefeatBurst(Vector3 position)
        {
            SpawnVfx(_enemyDefeatBurstPrefab, position, Quaternion.identity, 3.0f);
        }

        public void PlayDestructionNova(Vector3 origin)
        {
            SpawnVfx(_destructionNovaPrefab, origin, Quaternion.identity, 3.5f);
        }

        public void AttachKineticBarrier(Transform parent)
        {
            if (_kineticBarrierPrefab != null && parent != null)
            {
                var barrier = Instantiate(_kineticBarrierPrefab, parent.position, Quaternion.identity, parent);
                Destroy(barrier, 4.0f);
            }
        }

        public void DeployChronoStasisGrid(Vector3 origin)
        {
            SpawnVfx(_chronoStasisGridPrefab, origin, Quaternion.identity, 5.0f);
        }

        public void PlayBossSlamShockwave(Vector3 position)
        {
            SpawnVfx(_bossSlamShockwavePrefab, position, Quaternion.identity, 4.0f);
        }

        // ─── Event Callbacks ────────────────────────────────────────────────────────

        private void OnPlayerDamaged(GameEvents.PlayerDamagedEvent e)
        {
            if (_scarGlowParticles != null)
            {
                _scarGlowParticles.Emit(20);
            }
        }

        private void OnEnemyDefeated(GameEvents.EnemyDefeatedEvent e)
        {
            // Trigger defeat feedback
        }

        private void OnPowerUnlocked(GameEvents.PowerUnlockedEvent e)
        {
            if (_scarGlowParticles != null && !_scarGlowParticles.isPlaying)
            {
                _scarGlowParticles.Play();
            }
        }

        private void OnBossDefeated(GameEvents.BossDefeatedEvent e)
        {
            // Flash ambient environment
        }
    }
}
