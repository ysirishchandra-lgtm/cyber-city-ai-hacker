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

        public bool IsPhase2 { get { return _isPhase2; } }

        private void Awake()
        {
            _agent = GetComponent<NavMeshAgent>();
            _health = GetComponent<HealthComponent>();
            if (_health != null)
            {
                _health.Initialize(maxHealth);
                _health.OnHealthChanged += HandleHealthChanged;
                _health.OnDeath += HandleDeath;
            }
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
                if (_agent != null) _agent.isStopped = true;
                if (_attackTimer <= 0f)
                {
                    ExecuteBossAttack();
                    _attackTimer = _isPhase2 ? attackCooldown * 0.7f : attackCooldown;
                }
            }
            else
            {
                if (_agent != null)
                {
                    _agent.isStopped = false;
                    _agent.SetDestination(_playerTransform.position);
                }
            }
        }

        private void HandleHealthChanged(float current, float max)
        {
            if (max <= 0f) return;
            float pct = current / max;
            if (pct <= 0.5f && !_isPhase2)
            {
                _isPhase2 = true;
                EventBus.Publish("BOSS_PHASE2_ENTERED", gameObject.name);
            }
        }

        private void ExecuteBossAttack()
        {
            if (bossHitbox != null)
            {
                bossHitbox.EnableHitbox();
                Invoke("DisableHitbox", 0.4f);
            }
            else if (_playerTransform != null)
            {
                var hurtbox = _playerTransform.GetComponentInChildren<Hurtbox>();
                if (hurtbox != null)
                {
                    float dmg = _isPhase2 ? phase2Damage : phase1Damage;
                    hurtbox.ReceiveDamage(new DamageData(dmg, DamageType.MELEE, gameObject, Vector3.zero));
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
            if (_agent != null)
            {
                _agent.isStopped = true;
                _agent.enabled = false;
            }

            var bossDefeatedEvent = new GameEvents.BossDefeatedEvent();
            bossDefeatedEvent.BossId = "MINI_BOSS_ELITE";
            bossDefeatedEvent.BattleDuration = 15f;
            EventBus.Publish(bossDefeatedEvent);

            EventBus.Publish(GameEvents.BOSS_DEFEATED, "MINI_BOSS_ELITE");

            if (GameManager.Instance != null && GameManager.Instance.State != null)
            {
                GameManager.Instance.State.RecordEnemyDefeated("MINI_BOSS_ELITE", "MiniBoss", 500);
            }

            Destroy(gameObject, 3.0f);
        }
    }
}
