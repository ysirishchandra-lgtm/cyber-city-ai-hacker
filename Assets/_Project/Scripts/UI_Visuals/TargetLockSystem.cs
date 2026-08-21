using UnityEngine;
using Unity.Cinemachine;

namespace Scar.UI_Visuals
{
    public class TargetLockSystem : MonoBehaviour
    {
        [Header("References")]
        [SerializeField] private CinemachineTargetGroup _targetGroup;
        [SerializeField] private CinemachineCamera _lockOnCamera;
        [SerializeField] private Transform _playerTransform;
        
        [Header("Targeting Settings")]
        [SerializeField] private float _lockRadius = 15f;
        [SerializeField] private LayerMask _enemyLayer;
        [SerializeField] private GameObject _lockOnUIPrefab;
        
        private Transform _currentTarget;
        private GameObject _activeLockUI;

        private void Start()
        {
            if (_lockOnCamera != null) _lockOnCamera.Priority = 0; // Disabled by default
        }

        private void Update()
        {
            if (Input.GetKeyDown(KeyCode.Tab) || Input.GetKeyDown(KeyCode.JoystickButton9)) // Example Lock-On button (R3)
            {
                ToggleLockOn();
            }

            UpdateLockOnUI();
        }

        private void ToggleLockOn()
        {
            if (_currentTarget != null)
            {
                ClearTarget();
            }
            else
            {
                FindBestTarget();
            }
        }

        private void FindBestTarget()
        {
            Collider[] hits = Physics.OverlapSphere(_playerTransform.position, _lockRadius, _enemyLayer);
            Transform bestTarget = null;
            float closestDist = Mathf.Infinity;

            foreach (var hit in hits)
            {
                Vector3 toEnemy = hit.transform.position - _playerTransform.position;
                float dist = toEnemy.magnitude;
                
                // Simple dot product to prefer targets in front of player
                float dot = Vector3.Dot(_playerTransform.forward, toEnemy.normalized);
                
                if (dot > 0f && dist < closestDist)
                {
                    closestDist = dist;
                    bestTarget = hit.transform;
                }
            }

            if (bestTarget != null)
            {
                SetTarget(bestTarget);
            }
        }

        private void SetTarget(Transform target)
        {
            _currentTarget = target;

            if (_targetGroup != null)
            {
                // Clear existing
                while (_targetGroup.Targets.Count > 0) _targetGroup.RemoveMember(_targetGroup.Targets[0].Object);

                _targetGroup.AddMember(_playerTransform, 1f, 2f);
                _targetGroup.AddMember(_currentTarget, 1f, 2f);
            }

            if (_lockOnCamera != null)
            {
                _lockOnCamera.Priority = 30; // Override exploration/combat cameras
            }

            if (_lockOnUIPrefab != null && _activeLockUI == null)
            {
                _activeLockUI = Instantiate(_lockOnUIPrefab);
            }
        }

        private void ClearTarget()
        {
            _currentTarget = null;

            if (_lockOnCamera != null)
            {
                _lockOnCamera.Priority = 0;
            }

            if (_activeLockUI != null)
            {
                Destroy(_activeLockUI);
            }
        }

        private void UpdateLockOnUI()
        {
            if (_currentTarget != null && _activeLockUI != null)
            {
                // Assuming world space UI or billboarded reticle on enemy
                _activeLockUI.transform.position = _currentTarget.position + Vector3.up * 1.5f; // Adjust offset based on enemy height
                
                // Break lock if too far
                if (Vector3.Distance(_playerTransform.position, _currentTarget.position) > _lockRadius * 1.5f)
                {
                    ClearTarget();
                }
            }
        }
    }
}
