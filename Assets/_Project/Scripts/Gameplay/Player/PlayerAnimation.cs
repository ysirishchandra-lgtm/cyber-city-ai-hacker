using UnityEngine;

namespace Scar.Gameplay.Player
{
    [RequireComponent(typeof(Animator))]
    public class PlayerAnimation : MonoBehaviour
    {
        private Animator _animator;
        private PlayerController _controller;
        private PlayerCombat _combat;

        private static readonly int SpeedHash = Animator.StringToHash("Speed");
        private static readonly int IsSprintingHash = Animator.StringToHash("IsSprinting");
        private static readonly int IsDodgingHash = Animator.StringToHash("IsDodging");
        private static readonly int AttackTriggerHash = Animator.StringToHash("LightAttack");

        private void Awake()
        {
            _animator = GetComponent<Animator>();
            _controller = GetComponentInParent<PlayerController>();
            _combat = GetComponentInParent<PlayerCombat>();
        }

        private void Update()
        {
            if (_controller != null)
            {
                _animator.SetFloat(SpeedHash, _controller.IsSprinting ? 1.0f : 0.5f);
                _animator.SetBool(IsSprintingHash, _controller.IsSprinting);
                _animator.SetBool(IsDodgingHash, _controller.IsDodging);
            }

            if (_combat != null && _combat.IsAttacking)
            {
                _animator.SetTrigger(AttackTriggerHash);
            }
        }
    }
}
