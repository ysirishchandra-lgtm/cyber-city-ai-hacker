using UnityEngine;
using UnityEngine.AI;
using Scar.Gameplay.Health;
using Scar.Gameplay.Combat;
using Scar.Core;

namespace Scar.Gameplay.Hero
{
    public enum HeroState
    {
        OBSERVE,
        FOLLOW,
        CONFRONT,
        COUNTER,
        RETREAT
    }

    [RequireComponent(typeof(NavMeshAgent))]
    [RequireComponent(typeof(HealthComponent))]
    public class HeroAI : MonoBehaviour
    {
        [Header("Hero Vitals & Config")]
        [SerializeField] private float maxHealth = 350f;
        [SerializeField] private float observeDistance = 15f;
        [SerializeField] private float confrontDistance = 4f;
        [SerializeField] private float attackCooldown = 1.2f;

        private NavMeshAgent _agent;
        private HealthComponent _health;
        private Transform _playerTransform;
        private HeroState _currentState = HeroState.OBSERVE;
        private float _attackTimer = 0f;
        private string _observedPlayerPath = "NEUTRAL";

        public HeroState CurrentState => _currentState;

        private void Awake()
        {
            _agent = GetComponent<NavMeshAgent>();
            _health = GetComponent<HealthComponent>();
            _health.Initialize(maxHealth);

            _health.OnDamage += HandleDamage;
            _health.OnDeath += HandleDeath;

            EventBus.Instance.Subscribe(GameEvents.POWER_PATH_CHANGED, OnPowerPathChanged);
        }

        private void OnDestroy()
        {
            EventBus.Instance.Unsubscribe(GameEvents.POWER_PATH_CHANGED, OnPowerPathChanged);
        }

        private void Start()
        {
            var playerObj = GameObject.FindGameObjectWithTag("Player");
            if (playerObj != null)
            {
                _playerTransform = playerObj.transform;
            }
        }

        private void Update()
        {
            if (_health != null && !_health.IsAlive) return;

            if (_attackTimer > 0f) _attackTimer -= Time.deltaTime;

            float distToPlayer = _playerTransform != null ? Vector3.Distance(transform.position, _playerTransform.position) : float.MaxValue;

            switch (_currentState)
            {
                case HeroState.OBSERVE:
                    if (distToPlayer <= observeDistance)
                    {
                        _currentState = HeroState.FOLLOW;
                        EventBus.Instance.Publish(GameEvents.HERO_DETECTED_PLAYER, transform.position);
                    }
                    break;

                case HeroState.FOLLOW:
                    _agent.isStopped = false;
                    _agent.SetDestination(_playerTransform.position);
                    if (distToPlayer <= confrontDistance)
                    {
                        _currentState = HeroState.CONFRONT;
                        EventBus.Instance.Publish(GameEvents.HERO_ENCOUNTER, transform.position);
                    }
                    break;

                case HeroState.CONFRONT:
                    if (distToPlayer > confrontDistance * 1.5f)
                    {
                        _currentState = HeroState.FOLLOW;
                    }
                    else
                    {
                        _agent.isStopped = true;
                        PerformHeroAttack();
                    }
                    break;

                case HeroState.COUNTER:
                    // High aggression burst phase in Final Battle
                    _agent.isStopped = false;
                    _agent.SetDestination(_playerTransform.position);
                    if (distToPlayer <= confrontDistance)
                    {
                        PerformHeroAttack();
                    }
                    break;

                case HeroState.RETREAT:
                    Vector3 retreatDir = (transform.position - _playerTransform.position).normalized;
                    _agent.isStopped = false;
                    _agent.SetDestination(transform.position + retreatDir * 10f);
                    if (distToPlayer > observeDistance)
                    {
                        _currentState = HeroState.CONFRONT;
                    }
                    break;
            }
        }

        public void StartFinalBattle()
        {
            _currentState = HeroState.COUNTER;
            EventBus.Instance.Publish(GameEvents.FINAL_BATTLE_STARTED, transform.position);
        }

        private void PerformHeroAttack()
        {
            if (_attackTimer > 0f) return;
            _attackTimer = attackCooldown;

            var hurtbox = _playerTransform != null ? _playerTransform.GetComponentInChildren<Hurtbox>() : null;
            if (hurtbox != null)
            {
                float damage = _observedPlayerPath == "AGGRESSIVE" ? 30f : 20f;
                hurtbox.ReceiveDamage(new DamageData(damage, DamageType.MELEE, gameObject));
            }
        }

        private void HandleDamage(DamageData data)
        {
            // If Hero suffers massive damage, enter RETREAT state briefly
            if (data.amount >= 40f && _currentState != HeroState.COUNTER)
            {
                _currentState = HeroState.RETREAT;
            }
        }

        private void HandleDeath()
        {
            _agent.isStopped = true;
            _agent.enabled = false;

            EventBus.Instance.Publish(GameEvents.BOSS_DEFEATED, new { bossId = "ATLAS_BOSS" });
        }

        private void OnPowerPathChanged(object payload)
        {
            if (payload is string path)
            {
                _observedPlayerPath = path;
            }
        }
    }
}
