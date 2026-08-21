using UnityEngine;
using UnityEngine.AI;
using Scar.Gameplay.Health;
using Scar.Gameplay.Combat;
using Scar.Core;

namespace Scar.Gameplay.Enemy
{
    [RequireComponent(typeof(NavMeshAgent))]
    [RequireComponent(typeof(HealthComponent))]
    public class EnemyController : MonoBehaviour
    {
        [Header("Archetype & Stats")]
        [SerializeField] private EnemyArchetype archetype = EnemyArchetype.MELEE;
        [SerializeField] private float detectionRadius = 12f;
        [SerializeField] private float attackRange = 2f;
        [SerializeField] private float attackCooldown = 1.5f;
        [SerializeField] private float attackDamage = 15f;
        [SerializeField] private Hitbox meleeHitbox;

        [Header("Patrol Points")]
        [SerializeField] private Transform[] patrolWaypoints;

        private NavMeshAgent _agent;
        private HealthComponent _health;
        private Transform _playerTransform;
        private EnemyState _currentState = EnemyState.PATROL;
        private int _currentWaypointIndex = 0;
        private float _attackTimer = 0f;
        private Vector3 _lastKnownPlayerPos;

        public EnemyState CurrentState { get { return _currentState; } }
        public EnemyArchetype Archetype { get { return archetype; } }

        private void Awake()
        {
            _agent = GetComponent<NavMeshAgent>();
            _health = GetComponent<HealthComponent>();

            if (_health != null)
            {
                _health.OnDeath += HandleDeath;
                _health.OnDamaged += HandleDamage;
            }

            // Configure archetype stats
            switch (archetype)
            {
                case EnemyArchetype.RANGED:
                    attackRange = 8f;
                    attackDamage = 10f;
                    break;
                case EnemyArchetype.ELITE:
                    attackRange = 2.5f;
                    attackDamage = 35f;
                    if (_health != null) _health.Initialize(250f);
                    break;
            }
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
            if (_currentState == EnemyState.DEAD) return;

            if (_attackTimer > 0f) _attackTimer -= Time.deltaTime;

            float distToPlayer = _playerTransform != null ? Vector3.Distance(transform.position, _playerTransform.position) : float.MaxValue;

            switch (_currentState)
            {
                case EnemyState.PATROL:
                    UpdatePatrol(distToPlayer);
                    break;
                case EnemyState.CHASE:
                    UpdateChase(distToPlayer);
                    break;
                case EnemyState.ATTACK:
                    UpdateAttack(distToPlayer);
                    break;
                case EnemyState.SEARCH:
                    UpdateSearch();
                    break;
            }
        }

        private void UpdatePatrol(float distToPlayer)
        {
            if (distToPlayer <= detectionRadius)
            {
                _currentState = EnemyState.CHASE;
                return;
            }

            if (patrolWaypoints != null && patrolWaypoints.Length > 0 && _agent != null)
            {
                if (_agent.remainingDistance < 0.5f)
                {
                    _currentWaypointIndex = (_currentWaypointIndex + 1) % patrolWaypoints.Length;
                    if (patrolWaypoints[_currentWaypointIndex] != null)
                    {
                        _agent.SetDestination(patrolWaypoints[_currentWaypointIndex].position);
                    }
                }
            }
        }

        private void UpdateChase(float distToPlayer)
        {
            if (distToPlayer > detectionRadius * 1.5f)
            {
                _currentState = EnemyState.SEARCH;
                if (_playerTransform != null) _lastKnownPlayerPos = _playerTransform.position;
                return;
            }

            if (distToPlayer <= attackRange)
            {
                _currentState = EnemyState.ATTACK;
                if (_agent != null) _agent.isStopped = true;
                return;
            }

            if (_agent != null && _playerTransform != null)
            {
                _agent.isStopped = false;
                _agent.SetDestination(_playerTransform.position);
            }
        }

        private void UpdateAttack(float distToPlayer)
        {
            if (distToPlayer > attackRange)
            {
                _currentState = EnemyState.CHASE;
                if (_agent != null) _agent.isStopped = false;
                return;
            }

            if (_playerTransform != null)
            {
                Vector3 lookDir = (_playerTransform.position - transform.position).normalized;
                lookDir.y = 0;
                transform.rotation = Quaternion.Slerp(transform.rotation, Quaternion.LookRotation(lookDir), Time.deltaTime * 10f);
            }

            if (_attackTimer <= 0f)
            {
                PerformAttack();
                _attackTimer = attackCooldown;
            }
        }

        private void PerformAttack()
        {
            if (meleeHitbox != null)
            {
                meleeHitbox.EnableHitbox();
                Invoke("DisableHitbox", 0.3f);
            }
            else if (archetype == EnemyArchetype.RANGED && _playerTransform != null)
            {
                var hurtbox = _playerTransform.GetComponentInChildren<Hurtbox>();
                if (hurtbox != null)
                {
                    hurtbox.ReceiveDamage(new DamageData(attackDamage, DamageType.RANGED, gameObject, Vector3.zero));
                }
            }
        }

        private void DisableHitbox()
        {
            if (meleeHitbox != null) meleeHitbox.DisableHitbox();
        }

        private void UpdateSearch()
        {
            if (_agent != null)
            {
                _agent.SetDestination(_lastKnownPlayerPos);
                if (_agent.remainingDistance < 0.5f)
                {
                    _currentState = EnemyState.PATROL;
                }
            }
        }

        private void HandleDamage(DamageData data)
        {
            if (_currentState == EnemyState.PATROL)
            {
                _currentState = EnemyState.CHASE;
            }
        }

        private void HandleDeath()
        {
            _currentState = EnemyState.DEAD;
            if (_agent != null)
            {
                _agent.isStopped = true;
                _agent.enabled = false;
            }

            var defeatedEvent = new GameEvents.EnemyDefeatedEvent();
            defeatedEvent.EnemyId = gameObject.name;
            defeatedEvent.EnemyType = archetype.ToString();
            defeatedEvent.TotalDefeated = GameManager.Instance != null && GameManager.Instance.State != null ? GameManager.Instance.State.EnemiesDefeated + 1 : 1;
            EventBus.Publish(defeatedEvent);

            if (GameManager.Instance != null && GameManager.Instance.State != null)
            {
                GameManager.Instance.State.RecordEnemyDefeated(gameObject.name, archetype.ToString(), 100);
            }

            Destroy(gameObject, 3.0f);
        }
    }
}
