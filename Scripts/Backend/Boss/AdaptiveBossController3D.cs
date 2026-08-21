using System;
using System.Collections;
using UnityEngine;
using UnityEngine.AI;
using GameHack.Backend;
using GameHack.Backend.Boss;

namespace GameHack.Backend.Boss
{
    /// <summary>
    /// Level 3 Final Boss — "SCAR: BECOME"
    /// 5-Phase adaptive combat controller. Reads BossStrategy from BossAdaptiveStrategy
    /// every tick and adjusts its own patterns dynamically.
    ///
    /// Phase 1 — The Human       : Martial arts, parries, directional dodges.
    /// Phase 2 — Awakened        : Void blinks, shockwave projectiles, gravity pull.
    /// Phase 3 — Power Clash     : Cinematic clash trigger on simultaneous heavy attacks.
    /// Phase 4 — Evolution       : Full adaptive mode — armor, combo scaling, AoE denial.
    /// Phase 5 — Final Strike    : Low-HP execution sequence, fires OnBossDefeated.
    ///
    /// All visual/audio/camera triggers are event-driven — zero Animator coupling.
    /// </summary>
    [RequireComponent(typeof(NavMeshAgent))]
    public class AdaptiveBossController3D : MonoBehaviour
    {
        // ─── Events ───────────────────────────────────────────────────────────
        public event Action<BossPhase>          OnPhaseChanged;
        public event Action<string>             OnAbilityStarted;      // abilityID
        public event Action<string>             OnAbilityEnded;
        public event Action                     OnParryAttempted;
        public event Action<bool>               OnParryResult;         // true = success
        public event Action                     OnClashStarted;
        public event Action<bool>               OnClashResolved;       // true = player wins
        public event Action<float>              OnClashProgress;       // 0→1
        public event Action<string>             OnSpamBreakerTriggered;// abilityID countered
        public event Action<BossPhase>          OnBossDefeated;        // phase when defeated

        // ─── Inspector: Health Thresholds ────────────────────────────────────
        [Header("Phase Health Thresholds (0–1)")]
        [SerializeField] private float _phase2Threshold = 0.75f;  // drops below → Phase 2
        [SerializeField] private float _phase3Threshold = 0.50f;
        [SerializeField] private float _phase4Threshold = 0.30f;
        [SerializeField] private float _phase5Threshold = 0.12f;

        [Header("Boss Stats")]
        [SerializeField] private float _maxHealth       = 800f;
        [SerializeField] private float _moveSpeed       = 5.5f;

        // ─── Inspector: Phase 1 ───────────────────────────────────────────────
        [Header("Phase 1 — Human")]
        [SerializeField] private float _p1AttackCooldownBase = 1.6f;
        [SerializeField] private float _p1DodgeChance        = 0.30f;
        [SerializeField] private float _p1ParryWindowDuration = 0.25f;

        // ─── Inspector: Phase 2 ───────────────────────────────────────────────
        [Header("Phase 2 — Awakened")]
        [SerializeField] private float _blinkCooldown         = 3.5f;
        [SerializeField] private float _shockwaveCooldown     = 4.0f;
        [SerializeField] private float _gravityPullCooldown   = 6.0f;
        [SerializeField] private float _gravityPullRadius     = 8f;
        [SerializeField] private float _gravityPullForce      = 18f;

        // ─── Inspector: Phase 3 ───────────────────────────────────────────────
        [Header("Phase 3 — Power Clash")]
        [SerializeField] private float _clashDuration         = 3.0f;
        [SerializeField] private float _clashInputWindow      = 1.5f;

        // ─── Inspector: Phase 4 ───────────────────────────────────────────────
        [Header("Phase 4 — Evolution")]
        [SerializeField] private float _p4BaseArmorDuration   = 0.4f;
        [SerializeField] private float _p4ComboExtension      = 1;    // extra hits per combo

        // ─── Inspector: Phase 5 ───────────────────────────────────────────────
        [Header("Phase 5 — Final Strike")]
        [SerializeField] private float _p5StaggerDuration     = 2.5f;
        [SerializeField] private int   _p5RequiredInputCount  = 3;

        // ─── Inspector: References ────────────────────────────────────────────
        [Header("References")]
        [SerializeField] private Hitbox3D              _hitbox;
        [SerializeField] private Hurtbox3D             _hurtbox;
        [SerializeField] private BossAdaptiveStrategy  _strategyEngine;
        [SerializeField] private Transform             _playerTransform;
        [SerializeField] private Rigidbody             _playerRigidbody;

        // ─── Runtime State ────────────────────────────────────────────────────
        private NavMeshAgent  _agent;
        private BossPhase     _currentPhase    = BossPhase.Phase1_Human;
        private BossStrategy  _strategy;
        private float         _currentHealth;

        // Cooldown timers
        private float _attackTimer;
        private float _blinkTimer;
        private float _shockwaveTimer;
        private float _gravityTimer;
        private float _spamBreakerTimer;

        // Clash state
        private bool  _clashActive;
        private float _clashTimer;
        private float _clashProgress;        // 0 = boss winning, 1 = player winning
        private int   _playerClashInputs;

        // Phase 5
        private bool  _p5Staggered;
        private int   _p5PlayerInputs;

        // Armor frames
        private bool  _armorActive;

        // ─────────────────────────────────────────────────────────────────────

        private void Awake()
        {
            _agent         = GetComponent<NavMeshAgent>();
            _currentHealth = _maxHealth;
            _agent.speed   = _moveSpeed;

            if (_hurtbox != null)
                _hurtbox.OnHitReceived += HandleHitReceived;

            if (_strategyEngine != null)
                _strategyEngine.OnStrategyChanged += s => _strategy = s;

            _hitbox?.SetActive(false);
        }

        private void OnDestroy()
        {
            if (_hurtbox != null)
                _hurtbox.OnHitReceived -= HandleHitReceived;
        }

        private void Update()
        {
            if (_currentPhase == BossPhase.Defeated) return;
            if (_clashActive) { TickClash(Time.deltaTime); return; }

            // Refresh strategy each frame (lightweight struct copy)
            if (_strategyEngine != null)
                _strategy = _strategyEngine.GetCurrentStrategy();

            TickCooldowns(Time.deltaTime);
            CheckPhaseTransition();

            switch (_currentPhase)
            {
                case BossPhase.Phase1_Human:    TickPhase1(Time.deltaTime); break;
                case BossPhase.Phase2_Awakened: TickPhase2(Time.deltaTime); break;
                case BossPhase.Phase3_Clash:    break; // handled by clash tick
                case BossPhase.Phase4_Evolution:TickPhase4(Time.deltaTime); break;
                case BossPhase.Phase5_Final:    TickPhase5(Time.deltaTime); break;
            }
        }

        // ─── Phase Tick Methods ───────────────────────────────────────────────

        // ── Phase 1: Human — Martial Arts ────────────────────────────────────
        private void TickPhase1(float dt)
        {
            MoveTowardPlayer();

            if (_attackTimer <= 0f)
            {
                float roll = UnityEngine.Random.value;

                // Adaptive: try parry if melee-heavy player
                if (roll < _strategy.ParryFrequency)
                    ExecuteParry();
                else if (roll < _strategy.ParryFrequency + _p1DodgeChance)
                    ExecuteDirectionalDodge();
                else
                    ExecuteComboAttack("MartialCombo", 2 + Mathf.RoundToInt(_strategy.AggressionMultiplier));

                ResetAttackTimer();
            }
        }

        // ── Phase 2: Awakened — Void Manipulation ────────────────────────────
        private void TickPhase2(float dt)
        {
            // Prioritize gap-closer if ranged strategy is active
            float gapRoll = UnityEngine.Random.value;
            if (_blinkTimer <= 0f && gapRoll < _strategy.GapCloserPriority)
            {
                ExecuteVoidBlink();
                _blinkTimer = _blinkCooldown / _strategy.AggressionMultiplier;
            }

            if (_shockwaveTimer <= 0f)
            {
                // AoE denial for dashing players, else use shockwave
                if (_strategy.AoEDenialWeight > 0.4f)
                    ExecuteAoEDenial();
                else
                    ExecuteShockwaveProjectile();
                _shockwaveTimer = _shockwaveCooldown / _strategy.AggressionMultiplier;
            }

            if (_gravityTimer <= 0f && _strategy.AggressionMultiplier >= 1.2f)
            {
                ExecuteGravityPull();
                _gravityTimer = _gravityPullCooldown;
            }

            if (_attackTimer <= 0f)
            {
                ExecuteComboAttack("VoidStrike", 3);
                ResetAttackTimer();
            }

            MoveTowardPlayer();
        }

        // ── Phase 4: Evolution — Full Adaptive ───────────────────────────────
        private void TickPhase4(float dt)
        {
            // Spam breaker check — hard-counter detected ability
            if (_strategy.SpamBreakerActive && _spamBreakerTimer <= 0f)
            {
                ExecuteSpamBreaker(_strategy.CounteredAbilityID);
                _spamBreakerTimer = 8f;
            }

            // Void shield if needed
            if (_strategy.UsesVoidShield && _shockwaveTimer <= 0f)
            {
                ActivateVoidShield();
                _shockwaveTimer = _shockwaveCooldown;
            }

            if (_attackTimer <= 0f)
            {
                int comboLen = 3 + _p4ComboExtension +
                               Mathf.RoundToInt(_strategy.AggressionMultiplier - 1f);
                ExecuteComboAttack(_strategy.ActiveCounterAbility ?? "EvolutionCombo", comboLen);
                ResetAttackTimer();
            }

            MoveTowardPlayer();
        }

        // ── Phase 5: Final Strike — Execution Sequence ───────────────────────
        private void TickPhase5(float dt)
        {
            if (!_p5Staggered)
            {
                // Enter stagger once, then wait for player inputs
                StartCoroutine(EnterFinalStagger());
                _p5Staggered = true;
            }
        }

        // ─── Ability Implementations ──────────────────────────────────────────

        private void ExecuteComboAttack(string comboID, int hits)
        {
            StartCoroutine(ComboRoutine(comboID, hits));
        }

        private IEnumerator ComboRoutine(string comboID, int hits)
        {
            OnAbilityStarted?.Invoke(comboID);
            for (int i = 0; i < hits; i++)
            {
                // Armor frames on startup if strategy demands it
                if (_strategy.ArmorStartupFrames > 0)
                {
                    _armorActive = true;
                    _hurtbox?.SetInvulnerable(true);
                    yield return new WaitForSeconds(_strategy.ArmorStartupFrames / 60f);
                    _armorActive = false;
                    _hurtbox?.SetInvulnerable(false);
                }

                _hitbox?.SetActive(true);
                yield return new WaitForSeconds(0.15f);
                _hitbox?.SetActive(false);
                yield return new WaitForSeconds(0.12f);
            }
            OnAbilityEnded?.Invoke(comboID);
        }

        private void ExecuteParry()
        {
            OnParryAttempted?.Invoke();
            StartCoroutine(ParryRoutine());
        }

        private IEnumerator ParryRoutine()
        {
            OnAbilityStarted?.Invoke("Parry");
            _hurtbox?.SetInvulnerable(true);  // I-frames during parry window
            yield return new WaitForSeconds(_p1ParryWindowDuration);
            _hurtbox?.SetInvulnerable(false);
            // Parry result is determined when a hit is received during window
            OnAbilityEnded?.Invoke("Parry");
        }

        private void ExecuteDirectionalDodge()
        {
            if (_playerTransform == null) return;
            // Dodge perpendicular to player direction
            Vector3 toPlayer = (_playerTransform.position - transform.position).normalized;
            Vector3 dodgeDir = Vector3.Cross(toPlayer, Vector3.up).normalized
                               * (UnityEngine.Random.value > 0.5f ? 1f : -1f);

            _agent.Move(dodgeDir * 3f);
            OnAbilityStarted?.Invoke("DirectionalDodge");
        }

        private void ExecuteVoidBlink()
        {
            if (_playerTransform == null) return;
            OnAbilityStarted?.Invoke("VoidBlink");
            _hurtbox?.StartIFrames(0.3f); // invulnerable during blink

            // Teleport behind player
            Vector3 behind = _playerTransform.position
                           - _playerTransform.forward * 1.5f
                           + Vector3.up * 0.1f;

            if (NavMesh.SamplePosition(behind, out NavMeshHit hit, 3f, NavMesh.AllAreas))
                _agent.Warp(hit.position);

            OnAbilityEnded?.Invoke("VoidBlink");
        }

        private void ExecuteShockwaveProjectile()
        {
            // Fire data event — VFX layer spawns the actual projectile prefab
            OnAbilityStarted?.Invoke("VoidShockwave");
            // Damage is handled by a separate projectile Hitbox3D component (not instantiated here)
        }

        private void ExecuteAoEDenial()
        {
            OnAbilityStarted?.Invoke("ShockwaveAoEBurst");
            // Radial knockback — apply force to player if in range
            if (_playerRigidbody != null && _playerTransform != null)
            {
                float dist = Vector3.Distance(transform.position, _playerTransform.position);
                if (dist <= 8f)
                {
                    Vector3 dir = (_playerTransform.position - transform.position).normalized;
                    _playerRigidbody.AddForce(dir * 20f, ForceMode.Impulse);
                }
            }
        }

        private void ExecuteGravityPull()
        {
            OnAbilityStarted?.Invoke("GravityPull");
            if (_playerRigidbody != null && _playerTransform != null)
            {
                float dist = Vector3.Distance(transform.position, _playerTransform.position);
                if (dist <= _gravityPullRadius)
                {
                    Vector3 dir = (transform.position - _playerTransform.position).normalized;
                    _playerRigidbody.AddForce(dir * _gravityPullForce, ForceMode.Impulse);
                }
            }
        }

        private void ExecuteSpamBreaker(string targetAbilityID)
        {
            OnAbilityStarted?.Invoke("SpamBreaker");
            OnSpamBreakerTriggered?.Invoke(targetAbilityID);
            // Activate long I-frames as the "hard counter" to the spammed ability
            _hurtbox?.StartIFrames(1.2f);
            StartCoroutine(ComboRoutine("SpamBreakerCounter", 4));
        }

        private void ActivateVoidShield()
        {
            OnAbilityStarted?.Invoke("VoidShield");
            _hurtbox?.StartIFrames(2.0f); // projectile immunity window
        }

        // ─── Phase 3: Power Clash ─────────────────────────────────────────────

        /// <summary>
        /// Call when both boss and player use heavy attacks simultaneously.
        /// Exposed as public so CombatController3D can trigger it from player side.
        /// </summary>
        public void TriggerPowerClash()
        {
            if (_clashActive) return;
            _clashActive      = true;
            _clashTimer       = _clashDuration;
            _clashProgress    = 0.5f;
            _playerClashInputs = 0;

            TransitionToPhase(BossPhase.Phase3_Clash);
            _agent.isStopped = true;
            _hitbox?.SetActive(false);

            OnClashStarted?.Invoke();
        }

        /// <summary>
        /// Called by input system when player mashes during clash.
        /// Each call nudges clashProgress toward 1 (player winning).
        /// </summary>
        public void RegisterClashInput()
        {
            if (!_clashActive) return;
            _playerClashInputs++;
            _clashProgress = Mathf.Clamp01(
                _clashProgress + (0.15f / _strategy.AggressionMultiplier)
            );
            OnClashProgress?.Invoke(_clashProgress);
        }

        private void TickClash(float dt)
        {
            // Boss pushes progress back toward 0 at aggression rate
            _clashProgress = Mathf.Clamp01(
                _clashProgress - (0.05f * _strategy.AggressionMultiplier * dt)
            );
            _clashTimer -= dt;

            OnClashProgress?.Invoke(_clashProgress);

            bool timedOut    = _clashTimer <= 0f;
            bool playerWins  = _clashProgress >= 1.0f;
            bool bossWins    = _clashProgress <= 0.0f;

            if (playerWins || bossWins || timedOut)
            {
                bool result = playerWins || (!bossWins && _clashProgress >= 0.5f);
                ResolveClash(result);
            }
        }

        private void ResolveClash(bool playerWins)
        {
            _clashActive  = false;
            _agent.isStopped = false;
            OnClashResolved?.Invoke(playerWins);

            if (playerWins)
            {
                // Deal significant damage to boss
                float clashDamage = _maxHealth * 0.15f;
                _currentHealth -= clashDamage;
                CheckPhaseTransition();
            }
            else
            {
                // Player takes stagger — emit event for PlayerStatsManager
                OnAbilityStarted?.Invoke("ClashStagger");
            }
        }

        // ─── Phase 5: Final Execution ─────────────────────────────────────────

        private IEnumerator EnterFinalStagger()
        {
            _hurtbox?.SetInvulnerable(false);
            _agent.isStopped = true;
            OnAbilityStarted?.Invoke("FinalStagger");

            float elapsed = 0f;
            while (elapsed < _p5StaggerDuration && _p5PlayerInputs < _p5RequiredInputCount)
            {
                elapsed += Time.deltaTime;
                yield return null;
            }

            // Defeated
            TransitionToPhase(BossPhase.Defeated);
            _hurtbox?.SetInvulnerable(true);
            _hitbox?.SetActive(false);
            OnBossDefeated?.Invoke(_currentPhase);
        }

        /// <summary>
        /// Called by player input system during Phase 5 execution window.
        /// </summary>
        public void RegisterExecutionInput()
        {
            if (_currentPhase != BossPhase.Phase5_Final) return;
            _p5PlayerInputs++;
        }

        // ─── Phase Transition ─────────────────────────────────────────────────

        private void CheckPhaseTransition()
        {
            float ratio = _currentHealth / _maxHealth;
            BossPhase target = _currentPhase;

            if      (ratio <= _phase5Threshold) target = BossPhase.Phase5_Final;
            else if (ratio <= _phase4Threshold) target = BossPhase.Phase4_Evolution;
            else if (ratio <= _phase3Threshold) target = BossPhase.Phase3_Clash;
            else if (ratio <= _phase2Threshold) target = BossPhase.Phase2_Awakened;

            if (target != _currentPhase && (int)target > (int)_currentPhase)
                TransitionToPhase(target);
        }

        private void TransitionToPhase(BossPhase phase)
        {
            if (_currentPhase == phase) return;
            _currentPhase = phase;

            // Reset cooldowns at phase start so boss acts immediately
            _attackTimer    = 0.5f;
            _blinkTimer     = 1.0f;
            _shockwaveTimer = 1.5f;

            OnPhaseChanged?.Invoke(phase);
            Debug.Log($"[Boss] Transitioning to {phase}");
        }

        // ─── Hit Reception ────────────────────────────────────────────────────

        private void HandleHitReceived(DamagePayload payload)
        {
            if (_armorActive) return; // absorb during armor frames

            _currentHealth = Mathf.Max(0f, _currentHealth - payload.damageAmount);

            // Parry check — if we were in parry window, resolve it
            if (_currentPhase == BossPhase.Phase1_Human)
                OnParryResult?.Invoke(false); // hit landed, parry failed

            CheckPhaseTransition();
        }

        // ─── Utility ──────────────────────────────────────────────────────────

        private void MoveTowardPlayer()
        {
            if (_playerTransform == null || !_agent.isOnNavMesh) return;
            _agent.SetDestination(_playerTransform.position);
        }

        private void ResetAttackTimer()
        {
            float speed = _strategy.AggressionMultiplier > 0f ? _strategy.AggressionMultiplier : 1f;
            _attackTimer = _p1AttackCooldownBase / speed;
        }

        private void TickCooldowns(float dt)
        {
            _attackTimer      = Mathf.Max(0f, _attackTimer      - dt);
            _blinkTimer       = Mathf.Max(0f, _blinkTimer       - dt);
            _shockwaveTimer   = Mathf.Max(0f, _shockwaveTimer   - dt);
            _gravityTimer     = Mathf.Max(0f, _gravityTimer     - dt);
            _spamBreakerTimer = Mathf.Max(0f, _spamBreakerTimer - dt);
        }

        // ─── Public Query ─────────────────────────────────────────────────────

        public BossPhase  CurrentPhase  => _currentPhase;
        public float      HealthRatio   => _currentHealth / _maxHealth;
        public bool       IsClashActive => _clashActive;
        public float      ClashProgress => _clashProgress;
    }

    public enum BossPhase
    {
        Phase1_Human,
        Phase2_Awakened,
        Phase3_Clash,
        Phase4_Evolution,
        Phase5_Final,
        Defeated
    }
}
