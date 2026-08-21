using UnityEngine;
using UnityEngine.AI;
using Scar.Gameplay.Health;
using Scar.Gameplay.Combat;
using Scar.Core;

namespace Scar.Gameplay.Enemy
{
    [RequireComponent(typeof(NavMeshAgent))]
    [RequireComponent(typeof(HealthComponent))]
    public class MiniBossController : MonoBehaviour
    {
        [Header("Mini-Boss Config")]
        [SerializeField] private float maxHealth = 300f;
        [SerializeField] private float phase1Damage = 20f;
        [SerializeField] private float phase2Damage = 35f;
        [SerializeField] private float attackRange = 3f;
        [SerializeField] private float attackCooldown = 1.2f;
        [SerializeField] private Hitbox bossHitbox;

        private NavMeshAgent _agent;
        private HealthComponent _health;
        private Transform _playerTransform;
        private bool _isPhase2 = false;
        private float _attackTimer = 0f;
        private bool _isDead = false;

        public bool IsPhase2 => _isPhase2;

        private void Awake()
        {
            _agent = GetComponent<NavMeshAgent>();
            _health = GetComponent<HealthComponent>();
            _health.Initialize(maxHealth);

            _health.OnHealthChanged += HandleHealthChanged;
            _health.OnDeath += HandleDeath;
        }

        private void Start()
        {
            var player = GameObject.FindGameObjectWithTag("Player");
            if (player != null)
            {
                _playerTransform = player.transform;
            }
        }

        private void Update()
        {
            if (_isDead || _playerTransform == null) return;

            if (_attackTimer > 0f) _attackTimer -= Time.deltaTime;

            float dist = Vector3.Distance(transform.position, _playerTransform.position);

            if (dist <= attackRange)
            {
                _agent.isStopped = true;
                if (_attackTimer <= 0f)
                {
                    ExecuteBossAttack();
                    _attackTimer = _isPhase2 ? attackCooldown * 0.7f : attackCooldown;
                }
            }
            else
            {
                _agent.isStopped = false;
                _agent.speed = _isPhase2 ? 7.0f : 5.0f;
                _agent.SetDestination(_playerTransform.position);
            }
        }

        private void HandleHealthChanged(float current, float max)
        {
            float pct = current / max;
            if (pct <= 0.5f && !_isPhase2)
            {
                _isPhase2 = true;
                EventBus.Instance.Publish("BOSS_PHASE2_ENTERED", new { bossId = gameObject.name });
            }
        }

        private void ExecuteBossAttack()
        {
            if (bossHitbox != null)
            {
                bossHitbox.EnableHitbox();
                Invoke(nameof(DisableHitbox), 0.4f);
            }
            else
            {
                var hurtbox = _playerTransform.GetComponentInChildren<Hurtbox>();
                if (hurtbox != null)
                {
                    float dmg = _isPhase2 ? phase2Damage : phase1Damage;
                    hurtbox.ReceiveDamage(new DamageData(dmg, DamageType.MELEE, gameObject));
                }
            }
        }

        private void DisableHitbox()
        {
            if (bossHitbox != null) bossHitbox.DisableHitbox();
        }

        private void HandleDeath()
        {
            if (_isDead) return;
            _isDead = true;
            _agent.isStopped = true;
            _agent.enabled = false;

            EventBus.Instance.Publish(GameEvents.BOSS_DEFEATED, new
            {
                bossId = "MINI_BOSS_ELITE",
                name = "Elite Cyber Enforcer"
            });

            Destroy(gameObject, 3.0f);
        }
    }
}
