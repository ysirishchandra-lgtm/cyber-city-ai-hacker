using UnityEngine;
using Scar.Core;

namespace Scar.Gameplay.Player
{
    [RequireComponent(typeof(CharacterController))]
    public class PlayerController : MonoBehaviour
    {
        [Header("Settings")]
        [SerializeField] private PlayerStats stats;
        [SerializeField] private Transform cameraTransform;

        private CharacterController _characterController;
        private Vector2 _moveInput;
        private bool _isSprinting;
        private bool _isDodging;
        private float _dodgeTimer;
        private Vector3 _dodgeDirection;
        private float _currentStamina;

        public bool IsDodging { get { return _isDodging; } }
        public bool IsSprinting { get { return _isSprinting && _moveInput.sqrMagnitude > 0.1f; } }
        public float CurrentStamina { get { return _currentStamina; } }

        private void Awake()
        {
            _characterController = GetComponent<CharacterController>();
            if (cameraTransform == null && Camera.main != null)
            {
                cameraTransform = Camera.main.transform;
            }
            if (stats == null)
            {
                stats = ScriptableObject.CreateInstance<PlayerStats>();
            }
            _currentStamina = stats != null ? stats.maxStamina : 100f;
        }

        private void Update()
        {
            HandleDodgeTimer();
            HandleMovement();
            HandleStaminaRegen();
        }

        public void SetMoveInput(Vector2 input)
        {
            _moveInput = input;
        }

        public void SetSprinting(bool sprinting)
        {
            _isSprinting = sprinting && _currentStamina > 5f;
        }

        public bool TryDodge()
        {
            if (stats == null) return false;
            if (_isDodging || _currentStamina < stats.dodgeStaminaCost) return false;

            _isDodging = true;
            _dodgeTimer = stats.dodgeDuration;
            _currentStamina -= stats.dodgeStaminaCost;

            Vector3 moveDir = GetCameraRelativeMoveDir();
            _dodgeDirection = moveDir.sqrMagnitude > 0.1f ? moveDir : transform.forward;
            return true;
        }

        private void HandleMovement()
        {
            if (stats == null || _characterController == null) return;

            if (_isDodging)
            {
                _characterController.Move(_dodgeDirection * (stats.dodgeSpeed * Time.deltaTime));
                return;
            }

            Vector3 moveDir = GetCameraRelativeMoveDir();

            if (moveDir.sqrMagnitude > 0.01f)
            {
                float speed = IsSprinting ? stats.sprintSpeed : stats.walkSpeed;

                if (IsSprinting)
                {
                    _currentStamina = Mathf.Max(0f, _currentStamina - stats.sprintStaminaCost * Time.deltaTime);
                }

                _characterController.Move(moveDir * (speed * Time.deltaTime));

                Quaternion targetRot = Quaternion.LookRotation(moveDir);
                transform.rotation = Quaternion.Slerp(transform.rotation, targetRot, stats.rotationSpeed * Time.deltaTime);

                EventBus.Instance.Publish(GameEvents.PLAYER_MOVED, transform.position);
            }
        }

        private Vector3 GetCameraRelativeMoveDir()
        {
            if (cameraTransform == null)
            {
                return new Vector3(_moveInput.x, 0f, _moveInput.y).normalized;
            }

            Vector3 camForward = cameraTransform.forward;
            Vector3 camRight = cameraTransform.right;
            camForward.y = 0f;
            camRight.y = 0f;
            camForward.Normalize();
            camRight.Normalize();

            return (camForward * _moveInput.y + camRight * _moveInput.x).normalized;
        }

        private void HandleDodgeTimer()
        {
            if (!_isDodging) return;

            _dodgeTimer -= Time.deltaTime;
            if (_dodgeTimer <= 0f)
            {
                _isDodging = false;
            }
        }

        private void HandleStaminaRegen()
        {
            if (stats == null) return;
            if (!_isSprinting && !_isDodging)
            {
                _currentStamina = Mathf.Min(stats.maxStamina, _currentStamina + stats.staminaRegenRate * Time.deltaTime);
            }
        }
    }
}
