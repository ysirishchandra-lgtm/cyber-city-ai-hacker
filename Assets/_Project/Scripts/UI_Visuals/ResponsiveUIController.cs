using System;
using UnityEngine;
using UnityEngine.UI;

namespace Scar.UI
{
    /// <summary>
    /// SCAR — The Last Choice
    /// ResponsiveUIController: Configures CanvasScalers and safe area margins across
    /// 16:9, 16:10, 21:9 Ultrawide, and Mobile resolutions (Unity 6).
    /// Author: Ashwidha (Visual / UI / Cinematic Lead)
    /// </summary>
    [RequireComponent(typeof(Canvas))]
    [RequireComponent(typeof(CanvasScaler))]
    public class ResponsiveUIController : MonoBehaviour
    {
        [Header("Canvas References")]
        [SerializeField] private CanvasScaler _canvasScaler;
        [SerializeField] private RectTransform _safeAreaContainer;

        [Header("Reference Resolution Settings")]
        [SerializeField] private Vector2 _referenceResolution = new Vector2(1920f, 1080f);
        [SerializeField] private float _matchWidthOrHeight = 0.5f;

        private Rect _lastSafeArea = new Rect(0, 0, 0, 0);
        private Vector2 _lastScreenSize = new Vector2(0, 0);

        private void Awake()
        {
            if (_canvasScaler == null)
            {
                _canvasScaler = GetComponent<CanvasScaler>();
            }

            ConfigureScaler();
            ApplySafeArea();
        }

        private void Update()
        {
            if (_lastScreenSize.x != Screen.width || _lastScreenSize.y != Screen.height || _lastSafeArea != Screen.safeArea)
            {
                ConfigureScaler();
                ApplySafeArea();
            }
        }

        private void ConfigureScaler()
        {
            if (_canvasScaler == null) return;

            _canvasScaler.uiScaleMode = CanvasScaler.ScaleMode.ScaleWithScreenSize;
            _canvasScaler.referenceResolution = _referenceResolution;

            float currentAspect = (float)Screen.width / Screen.height;
            float targetAspect = _referenceResolution.x / _referenceResolution.y;

            // Adapt match factor based on aspect ratio
            if (currentAspect < targetAspect)
            {
                // Taller than 16:9 (e.g. 16:10, 4:3, Tablets) -> match width
                _canvasScaler.matchWidthOrHeight = 0f;
            }
            else
            {
                // Wider than 16:9 (e.g. 21:9 Ultrawide, Mobile notches) -> match height
                _canvasScaler.matchWidthOrHeight = 1f;
            }

            _lastScreenSize = new Vector2(Screen.width, Screen.height);
        }

        private void ApplySafeArea()
        {
            if (_safeAreaContainer == null) return;

            Rect safeArea = Screen.safeArea;
            _lastSafeArea = safeArea;

            Vector2 minAnchor = safeArea.position;
            Vector2 maxAnchor = minAnchor + safeArea.size;

            minAnchor.x /= Screen.width;
            minAnchor.y /= Screen.height;
            maxAnchor.x /= Screen.width;
            maxAnchor.y /= Screen.height;

            _safeAreaContainer.anchorMin = minAnchor;
            _safeAreaContainer.anchorMax = maxAnchor;
        }
    }
}
