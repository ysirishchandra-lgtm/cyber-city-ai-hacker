using System;
using UnityEngine;
using UnityEngine.AI;

namespace GameHack.Backend.AI
{
    /// <summary>
    /// Grunt / Minion AI — 6-state machine (Idle, Patrol, Chase, Attack, Stagger, Defeated).
    /// Integrates Hitbox3D / Hurtbox3D for full combat participation.
    /// Uses NavMesh for pathfinding and Physics raycasts for line-of-sight.
    /// All visual/audio triggers are event-driven — no Animator coupling.
    /// </summary>
    [RequireComponent(typeof(NavMeshAgent))]
    public class EnemyController3D : MonoBehaviour
    {
        // ─── Events ───────────────────────────────────────────────────────────
        public event Action<EnemyState>    OnStateChanged;
        public event Action<DamagePayload> OnHitReceived;
        public event Action               OnDefeated;
        public event Action               OnAttackExecuted;   // trigger hitbox activation
        public event Action               OnPatrolPointReached;

        // ─── Inspector: Detection ─────────────────────────────────────────────
        [Header("Detection")]
        [SerializeField] private float _aggroRadius       = 10f;
        [SerializeField] private float _attackRadius      = 2.0f;
        [SerializeField] private float _deAggroRadius     = 16f;
        [SerializeField] private float _sightAngle        = 120f; // degrees cone
        [SerializeField] private LayerMask _sightBlockers;        // walls, obstacles

        // ─── Inspector: Patrol ────────────────────────────────────────────────
        [Header("Patrol")]
        [SerializeField] private Transform[] _patrolPoints;
        [SerializeField] private float       _patrolWaitTime  = 1.5f;

        // ─── Inspector: Combat ────────────────────────────────────────────────
        [Header("Combat")]
        [SerializeField] private float _attackCooldown    = 1.8f;
        [SerializeField] private float _attackWindup      = 0.4f;  // sec before hitbox active
        [SerializeField] private float _staggerDuration   = 0.6f;
        [SerializeField] private float _maxHealth         = 60f;
        [SerializeField] private float _chaseSpeed        = 5.5f;
        [SerializeField] private float _patrolSpeed       = 2.5f;

        // ─── Inspector: References ────────────────────────────────────────────
        [Header("References")]
        [SerializeField] private Hitbox3D  _hitbox;
        [SerializeField] private Hurtbox3D _hurtbox;
        [SerializeField] private Transform _playerTransform;

        // ─── Runtime State ────────────────────────────────────────────────────
        private NavMeshAgent    _agent;
        private EnemyState      _state            = EnemyState.Idle;
        private float           _currentHealth;
        private float           _attackTimer;
        private float           _windupTimer;
        private float           _staggerTimer;
        private float           _patrolWaitTimer;
        private int             _patrolIndex;
        private bool            _attackQueued;

        // ─────────────────────────────────────────────────────────────────────
        private void Awake()
        {
            _agent         = GetComponent<NavMeshAgent>();
            _currentHealth = _maxHealth;

            // Subscribe hurtbox so we receive player hits
            if (_hurtbox != null)
                _hurtbox.OnHitReceived += HandleHitReceived;

            // Start hitbox inactive
            _hitbox?.SetActive(false);
        }

        private void OnDestroy()
        {
            if (_hurtbox != null)
                _hurtbox.OnHitReceived -= HandleHitReceived;
        }

        private void Update()
        {
            if (_state == EnemyState.Defeated) return;

            float dt = Time.deltaTime;

            switch (_state)
            {
                case EnemyState.Idle:    TickIdle(dt);    break;
                case EnemyState.Patrol:  TickPatrol(dt);  break;
                case EnemyState.Chase:   TickChase(dt);   break;
                case EnemyState.Attack:  TickAttack(dt);  break;
                case EnemyState.Stagger: TickStagger(dt); break;
            }
        }

        // ─── State Ticks ──────────────────────────────────────────────────────

        private void TickIdle(float dt)
        {
            if (CanSeePlayer())
            {
                TransitionTo(EnemyState.Chase);
                return;
            }
            if (_patrolPoints != null && _patrolPoints.Length > 0)
            {
                _patrolWaitTimer -= dt;
                if (_patrolWaitTimer <= 0f)
                    TransitionTo(EnemyState.Patrol);
            }
        }

        private void TickPatrol(float dt)
        {
            // Check aggro first
            if (CanSeePlayer())
            {
                TransitionTo(EnemyState.Chase);
                return;
            }

            if (_patrolPoints == null || _patrolPoints.Length == 0) return;

            // Walk to current patrol point
            if (!_agent.pathPending && _agent.remainingDistance < 0.5f)
            {
                OnPatrolPointReached?.Invoke();
                _patrolIndex     = (_patrolIndex + 1) % _patrolPoints.Length;
                _patrolWaitTimer = _patrolWaitTime;
                TransitionTo(EnemyState.Idle);
            }
        }

        private void TickChase(float dt)
        {
            if (_playerTransform == null) return;

            float dist = Vector3.Distance(transform.position, _playerTransform.position);

            // Lost player
            if (dist > _deAggroRadius && !CanSeePlayer())
            {
                TransitionTo(EnemyState.Patrol);
                return;
            }

            // In attack range
            if (dist <= _attackRadius && _attackTimer <= 0f)
            {
                TransitionTo(EnemyState.Attack);
                return;
            }

            // Keep chasing
            _agent.SetDestination(_playerTransform.position);
            _attackTimer = Mathf.Max(0f, _attackTimer - dt);
        }

        private void TickAttack(float dt)
        {
            _windupTimer -= dt;
            if (_windupTimer <= 0f && !_attackQueued)
            {
                // Activate hitbox
                _hitbox?.SetActive(true);
                OnAttackExecuted?.Invoke();
                _attackQueued = true;

                // Auto-deactivate after 0.2s
                Invoke(nameof(DeactivateHitbox), 0.2f);
            }

            // After attack, return to chase
            if (_windupTimer <= -0.3f)
            {
                _attackTimer = _attackCooldown;
                TransitionTo(EnemyState.Chase);
            }
        }

        private void TickStagger(float dt)
        {
            _staggerTimer -= dt;
            if (_staggerTimer <= 0f)
                TransitionTo(EnemyState.Chase);
        }

        // ─── State Machine ────────────────────────────────────────────────────

        private void TransitionTo(EnemyState newState)
        {
            if (_state == newState) return;
            ExitState(_state);
            _state = newState;
            EnterState(newState);
            OnStateChanged?.Invoke(newState);
        }

        private void EnterState(EnemyState state)
        {
            switch (state)
            {
                case EnemyState.Idle:
                    _agent.isStopped = true;
                    break;

                case EnemyState.Patrol:
                    _agent.isStopped = false;
                    _agent.speed     = _patrolSpeed;
                    if (_patrolPoints != null && _patrolPoints.Length > 0)
                        _agent.SetDestination(_patrolPoints[_patrolIndex].position);
                    break;

                case EnemyState.Chase:
                    _agent.isStopped = false;
                    _agent.speed     = _chaseSpeed;
                    break;

                case EnemyState.Attack:
                    _agent.isStopped = true;
                    _windupTimer     = _attackWindup;
                    _attackQueued    = false;
                    // Face the player
                    if (_playerTransform != null)
                    {
                        Vector3 dir = (_playerTransform.position - transform.position).normalized;
                        if (dir != Vector3.zero)
                            transform.rotation = Quaternion.LookRotation(dir);
                    }
                    break;

                case EnemyState.Stagger:
                    _agent.isStopped = true;
                    _staggerTimer    = _staggerDuration;
                    _hitbox?.SetActive(false);
                    break;

                case EnemyState.Defeated:
                    _agent.isStopped = true;
                    _hitbox?.SetActive(false);
                    _hurtbox?.SetInvulnerable(true);
                    OnDefeated?.Invoke();
                    break;
            }
        }

        private void ExitState(EnemyState state)
        {
            if (state == EnemyState.Attack)
                _hitbox?.SetActive(false);
        }

        // ─── Detection ────────────────────────────────────────────────────────

        private bool CanSeePlayer()
        {
            if (_playerTransform == null) return false;

            Vector3 toPlayer = _playerTransform.position - transform.position;
            float   dist     = toPlayer.magnitude;

            // Range check
            if (dist > _aggroRadius) return false;

            // Angle check (sight cone)
            float angle = Vector3.Angle(transform.forward, toPlayer.normalized);
            if (angle > _sightAngle * 0.5f) return false;

            // Line-of-sight raycast
            if (Physics.Raycast(transform.position + Vector3.up * 0.5f,
                                 toPlayer.normalized, dist, _sightBlockers))
                return false; // blocked by wall

            return true;
        }

        // ─── Hit Reception ────────────────────────────────────────────────────

        private void HandleHitReceived(DamagePayload payload)
        {
            _currentHealth -= payload.damageAmount;
            OnHitReceived?.Invoke(payload);

            if (_currentHealth <= 0f)
            {
                TransitionTo(EnemyState.Defeated);
                return;
            }

            if (payload.hitStunDuration > 0f)
            {
                _staggerDuration = payload.hitStunDuration;
                TransitionTo(EnemyState.Stagger);
            }
        }

        private void DeactivateHitbox() => _hitbox?.SetActive(false);

        // ─── Public API ───────────────────────────────────────────────────────

        public void SetPlayer(Transform player) => _playerTransform = player;
        public float HealthRatio => _currentHealth / _maxHealth;
        public EnemyState CurrentState => _state;
    }

    public enum EnemyState
    {
        Idle,
        Patrol,
        Chase,
        Attack,
        Stagger,
        Defeated
    }
}
