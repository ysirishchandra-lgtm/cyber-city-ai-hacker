using UnityEngine;

namespace Scar.Core
{
    public class PlayerAnimationController3D : MonoBehaviour
    {
        [Header("Components")]
        [SerializeField] private Animator _animator;
        
        [Header("Animation Hashes")]
        private int _speedHash = Animator.StringToHash("Speed");
        private int _isGroundedHash = Animator.StringToHash("IsGrounded");
        private int _verticalVelocityHash = Animator.StringToHash("VerticalVelocity");
        private int _attackIndexHash = Animator.StringToHash("AttackIndex");
        private int _isDashingHash = Animator.StringToHash("IsDashing");
        private int _dashDirectionHash = Animator.StringToHash("DashDirection");

        private void Awake()
        {
            if (_animator == null) _animator = GetComponent<Animator>();
        }

        // --- State Updaters (Called by Movement Controller) ---
        
        public void UpdateLocomotion(float normalizedSpeed, bool isGrounded, float verticalVelocity)
        {
            _animator.SetFloat(_speedHash, normalizedSpeed, 0.1f, Time.deltaTime);
            _animator.SetBool(_isGroundedHash, isGrounded);
            _animator.SetFloat(_verticalVelocityHash, verticalVelocity);
        }

        public void PlayAttackSequence(int comboIndex)
        {
            _animator.SetInteger(_attackIndexHash, comboIndex);
            _animator.SetTrigger("AttackTrigger");
        }

        public void PlayDash(Vector2 direction)
        {
            _animator.SetBool(_isDashingHash, true);
            // Example mapping: 0 = Forward, 1 = Back, 2 = Left, 3 = Right
            float dirIndex = 0f;
            if (direction.y < -0.1f) dirIndex = 1f;
            else if (direction.x < -0.1f) dirIndex = 2f;
            else if (direction.x > 0.1f) dirIndex = 3f;
            
            _animator.SetFloat(_dashDirectionHash, dirIndex);
        }

        public void EndDash()
        {
            _animator.SetBool(_isDashingHash, false);
        }

        // --- Animation Events (Called from Animation Clips) ---
        
        public void AnimEvent_EnableHitbox()
        {
            // Debug.Log("[AnimEvent] Hitbox Enabled");
            // Hitbox3D.EnableHitbox();
        }

        public void AnimEvent_DisableHitbox()
        {
            // Debug.Log("[AnimEvent] Hitbox Disabled");
            // Hitbox3D.DisableHitbox();
        }

        public void AnimEvent_SpawnSlashRibbon()
        {
            // Debug.Log("[AnimEvent] Spawning Slash Ribbon");
            // HitSparksManager.Instance.SpawnSlashRibbon(transform.position, transform.forward);
        }
        
        public void AnimEvent_PlayFootstepSound()
        {
            // AudioManager.Instance.PlaySFX("Footstep", pitchVariation: true);
        }
    }
}
