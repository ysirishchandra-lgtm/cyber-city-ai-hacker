using System.Collections;
using UnityEngine;
using UnityEngine.UI;
using Scar.Core;
using Unity.Cinemachine;

namespace Scar.UI_Visuals
{
    public class VisualJuiceManager : MonoBehaviour
    {
        public static VisualJuiceManager Instance { get; private set; }

        [Header("Impact Frames")]
        [SerializeField] private Image _impactFrameOverlay;
        [SerializeField] private float _defaultHitstopDuration = 0.05f;

        [Header("Cinemachine Zoom")]
        [SerializeField] private CinemachineCamera _activeCinemachineCam; // Or get it dynamically
        private float _originalOrthoSize = 5f;
        private float _originalFOV = 60f;

        private void Awake()
        {
            if (Instance == null) Instance = this;
            else Destroy(gameObject);

            if (_impactFrameOverlay != null)
                _impactFrameOverlay.gameObject.SetActive(false);
        }

        private void OnEnable()
        {
            EventBus.Subscribe<GameEvents.PlayerDamagedEvent>(OnHeavyImpact);
            EventBus.Subscribe<GameEvents.BossDefeatedEvent>(OnBossImpact);
        }

        private void OnDisable()
        {
            EventBus.Unsubscribe<GameEvents.PlayerDamagedEvent>(OnHeavyImpact);
            EventBus.Unsubscribe<GameEvents.BossDefeatedEvent>(OnBossImpact);
        }

        private void OnHeavyImpact(GameEvents.PlayerDamagedEvent e)
        {
            if (e.DamageAmount > 20f)
            {
                TriggerHitstop(_defaultHitstopDuration);
                StartCoroutine(FlashImpactFrame(Color.white, 0.05f));
            }
        }

        private void OnBossImpact(GameEvents.BossDefeatedEvent e)
        {
            TriggerHitstop(0.15f);
            StartCoroutine(FlashImpactFrame(Color.white, 0.15f));
            // Trigger dynamic zoom
            StartCoroutine(ZoomInAndOut(0.5f, 1f));
        }

        public void TriggerHitstop(float duration)
        {
            StartCoroutine(HitstopCoroutine(duration));
        }

        private IEnumerator HitstopCoroutine(float duration)
        {
            Time.timeScale = 0.1f; // Slow down drastically for impact
            yield return new WaitForSecondsRealtime(duration);
            Time.timeScale = 1f;
        }

        private IEnumerator FlashImpactFrame(Color color, float duration)
        {
            if (_impactFrameOverlay == null) yield break;

            _impactFrameOverlay.color = color;
            _impactFrameOverlay.gameObject.SetActive(true);
            yield return new WaitForSecondsRealtime(duration);
            _impactFrameOverlay.gameObject.SetActive(false);
        }

        public void TriggerMotionTrails(Transform target, Color trailColor, float duration)
        {
            // For a 2D anime feel, we would spawn TrailRenderers or GhostSprites behind the player
            // This is a placeholder for the actual implementation in character controllers
            Debug.Log($"[VisualJuice] Triggering Motion Trails for {target.name} for {duration}s");
        }

        private IEnumerator ZoomInAndOut(float zoomFactor, float duration)
        {
            if (_activeCinemachineCam == null) yield break;

            // Simple FOV/Ortho zoom depending on camera type
            bool isOrtho = _activeCinemachineCam.Lens.Orthographic;
            if (isOrtho) _originalOrthoSize = _activeCinemachineCam.Lens.OrthographicSize;
            else _originalFOV = _activeCinemachineCam.Lens.FieldOfView;

            float targetVal = isOrtho ? _originalOrthoSize * zoomFactor : _originalFOV * zoomFactor;
            
            float elapsed = 0;
            float halfDur = duration / 2f;

            // Zoom in
            while (elapsed < halfDur)
            {
                elapsed += Time.unscaledDeltaTime;
                float t = elapsed / halfDur;
                if (isOrtho) _activeCinemachineCam.Lens.OrthographicSize = Mathf.Lerp(_originalOrthoSize, targetVal, t);
                else _activeCinemachineCam.Lens.FieldOfView = Mathf.Lerp(_originalFOV, targetVal, t);
                yield return null;
            }

            // Zoom out
            elapsed = 0;
            while (elapsed < halfDur)
            {
                elapsed += Time.unscaledDeltaTime;
                float t = elapsed / halfDur;
                if (isOrtho) _activeCinemachineCam.Lens.OrthographicSize = Mathf.Lerp(targetVal, _originalOrthoSize, t);
                else _activeCinemachineCam.Lens.FieldOfView = Mathf.Lerp(targetVal, _originalFOV, t);
                yield return null;
            }
        }
    }
}
