using System;
using System.Collections;
using UnityEngine;
using Scar.Core;

namespace Scar.UI
{
    /// <summary>
    /// SCAR — The Last Choice
    /// CharacterVisualPresentation: Enhances the visual presentation and feedback of Player,
    /// Enemies, and Atlas (Hurt flashes, movement lean, aura states, and scar glow scaling).
    /// Purely VISUAL. Does not alter gameplay movement or combat calculations.
    /// Author: Ashwidha (Visual / UI / Cinematic Lead)
    /// </summary>
    public class CharacterVisualPresentation : MonoBehaviour
    {
        public enum CharacterType
        {
            PLAYER,
            DRONE,
            ENFORCER,
            STALKER,
            SENTINEL,
            MINI_BOSS,
            HERO_ATLAS
        }

        [Header("Character Identity")]
        [SerializeField] private CharacterType _characterType = CharacterType.PLAYER;
        [SerializeField] private Renderer[] _meshRenderers;
        [SerializeField] private Material _scarGlowMaterial;

        [Header("Aura & Particle Enhancements")]
        [SerializeField] private GameObject _celestialGoldenAura;
        [SerializeField] private GameObject _tyrantCrimsonAura;
        [SerializeField] private ParticleSystem _footstepDustParticles;

        [Header("Tuning")]
        [SerializeField] private float _tiltAmount = 8.0f;
        [SerializeField] private float _tiltSmoothSpeed = 10.0f;
        [SerializeField] private Color _hurtFlashColor = new Color(1f, 0.2f, 0.2f, 1f);

        private Material[] _originalMaterials;
        private Coroutine _hurtFlashCoroutine;
        private Rigidbody _rb;
        private float _currentTiltZ = 0f;

        private void Awake()
        {
            _rb = GetComponent<Rigidbody>();

            if (_meshRenderers == null || _meshRenderers.Length == 0)
            {
                _meshRenderers = GetComponentsInChildren<Renderer>();
            }

            SetupHeroAura(false);
        }

        private void OnEnable()
        {
            EventBus.Subscribe<GameEvents.PhaseChangedEvent>(OnPhaseChanged);
            EventBus.Subscribe<GameEvents.PlayerDamagedEvent>(OnPlayerDamaged);
        }

        private void OnDisable()
        {
            EventBus.Unsubscribe<GameEvents.PhaseChangedEvent>(OnPhaseChanged);
            EventBus.Unsubscribe<GameEvents.PlayerDamagedEvent>(OnPlayerDamaged);
        }

        private void Update()
        {
            if (_characterType == CharacterType.PLAYER)
            {
                UpdatePlayerMovementLean();
            }
        }

        public void PlayHurtFlash()
        {
            if (_hurtFlashCoroutine != null) StopCoroutine(_hurtFlashCoroutine);
            _hurtFlashCoroutine = StartCoroutine(HurtFlashRoutine());
        }

        private IEnumerator HurtFlashRoutine()
        {
            if (_meshRenderers == null) yield break;

            foreach (var r in _meshRenderers)
            {
                if (r != null && r.material != null)
                {
                    r.material.color = _hurtFlashColor;
                }
            }

            yield return new WaitForSeconds(0.12f);

            foreach (var r in _meshRenderers)
            {
                if (r != null && r.material != null)
                {
                    r.material.color = Color.white;
                }
            }
        }

        private void UpdatePlayerMovementLean()
        {
            if (_rb == null) return;

            Vector3 localVel = transform.InverseTransformDirection(_rb.linearVelocity);
            float targetTilt = -localVel.x * _tiltAmount;
            _currentTiltZ = Mathf.Lerp(_currentTiltZ, targetTilt, Time.deltaTime * _tiltSmoothSpeed);

            transform.localRotation = Quaternion.Euler(transform.localEulerAngles.x, transform.localEulerAngles.y, _currentTiltZ);

            if (_footstepDustParticles != null && _rb.linearVelocity.sqrMagnitude > 1f)
            {
                if (!_footstepDustParticles.isPlaying) _footstepDustParticles.Play();
            }
        }

        public void SetAtlasTyrantMode(bool isTyrant)
        {
            if (_celestialGoldenAura != null) _celestialGoldenAura.SetActive(!isTyrant);
            if (_tyrantCrimsonAura != null) _tyrantCrimsonAura.SetActive(isTyrant);
        }

        private void SetupHeroAura(bool isFinalBattle)
        {
            if (_characterType == CharacterType.HERO_ATLAS)
            {
                SetAtlasTyrantMode(isFinalBattle);
            }
        }

        private void OnPhaseChanged(GameEvents.PhaseChangedEvent e)
        {
            if (_characterType == CharacterType.HERO_ATLAS)
            {
                bool isBossFight = e.NewPhase == GamePhase.FINAL_BATTLE;
                SetAtlasTyrantMode(isBossFight);
            }
        }

        private void OnPlayerDamaged(GameEvents.PlayerDamagedEvent e)
        {
            if (_characterType == CharacterType.PLAYER)
            {
                PlayHurtFlash();

                // Scar gets brighter as health lowers
                if (_scarGlowMaterial != null && GameManager.Instance != null && GameManager.Instance.State != null)
                {
                    float hpPct = Mathf.Clamp01(e.RemainingHealth / GameManager.Instance.State.MaxHealth);
                    float emissionBoost = Mathf.Lerp(3.5f, 1.0f, hpPct);
                    _scarGlowMaterial.SetColor("_EmissionColor", new Color(1f, 0.1f, 0.1f, 1f) * emissionBoost);
                }
            }
        }
    }
}
