using UnityEngine;
using Scar.Core;

namespace Scar.Production
{
    public class MasterScene_BuildRunner : MonoBehaviour
    {
        [Header("Optimization Settings")]
        [SerializeField] private int _targetFPS = 60;
        
        [Header("Shader Pre-Warming Variants")]
        [SerializeField] private ShaderVariantCollection _shaderVariants;

        private void Awake()
        {
            // 1. Performance Lock
            QualitySettings.vSyncCount = 0; // Disable VSync to manually cap framerate
            Application.targetFrameRate = _targetFPS;

            // 2. Pre-Warm Shaders to prevent combat hitches
            if (_shaderVariants != null)
            {
                if (!_shaderVariants.isWarmedUp)
                {
                    _shaderVariants.WarmUp();
                    Debug.Log("[BuildRunner] Shader Variants Pre-Warmed.");
                }
            }

            // 3. Optimize volumetric fog and reflections
            RenderSettings.fogDensity = 0.015f; // reduced from 0.03 for performance
            QualitySettings.realtimeReflectionProbes = false; // Disable heavy real-time reflections

            Debug.Log($"[BuildRunner] Environment Optimized. Target FPS locked to {_targetFPS}.");
        }
    }
}
