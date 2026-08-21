using UnityEngine;
using Unity.Cinemachine;

namespace Scar.UI_Visuals
{
    public class ThirdPersonCameraController : MonoBehaviour
    {
        [Header("Cinemachine Integration")]
        [SerializeField] private CinemachineCamera _freeLookCam;
        [SerializeField] private Transform _playerLookAtTarget;
        
        [Header("Orbit Settings")]
        [SerializeField] private float _mouseSensitivity = 2f;
        [SerializeField] private float _controllerSensitivity = 100f;

        private void Start()
        {
            // Lock cursor for true 3D action feel
            Cursor.lockState = CursorLockMode.Locked;
            Cursor.visible = false;
        }

        private void Update()
        {
            // Basic camera input passing (Cinemachine handles the rest if configured correctly)
            float lookX = Input.GetAxis("Mouse X") * _mouseSensitivity + Input.GetAxis("RightStickHorizontal") * _controllerSensitivity * Time.deltaTime;
            float lookY = Input.GetAxis("Mouse Y") * _mouseSensitivity + Input.GetAxis("RightStickVertical") * _controllerSensitivity * Time.deltaTime;

            // Optional: Manual axis manipulation if not relying entirely on Cinemachine Input Provider
            // This script acts as the bridge for custom 3D orbiting requirements
        }

        public void ActivateThirdPersonCamera()
        {
            if (_freeLookCam != null)
            {
                _freeLookCam.Priority = 20; // Ensure it overrides Cutscene/Menu cameras
            }
        }
    }
}
