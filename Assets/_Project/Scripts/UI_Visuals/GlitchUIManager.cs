using System.Collections;
using UnityEngine;
using TMPro;

namespace Scar.UI_Visuals
{
    /// <summary>
    /// Handles psychological UI warfare in Round 2.
    /// Intercepts standard HUD elements to briefly display subliminal/disturbing messages.
    /// </summary>
    public class GlitchUIManager : MonoBehaviour
    {
        [Header("UI References")]
        [SerializeField] private TextMeshProUGUI _missionText;
        
        [Header("Glitch Settings")]
        [SerializeField] private string _normalText = "MISSION: DEFEAT THE ENEMY";
        [SerializeField] private string _glitchText = "MISSION: FIND YOURSELF";
        [SerializeField] private float _glitchDuration = 0.5f;
        [SerializeField] private float _minTimeBetweenGlitches = 10f;
        [SerializeField] private float _maxTimeBetweenGlitches = 25f;

        private void Start()
        {
            if (_missionText != null)
            {
                _missionText.text = _normalText;
                StartCoroutine(GlitchRoutine());
            }
        }

        private IEnumerator GlitchRoutine()
        {
            while (true)
            {
                // Wait for a random, long interval
                float waitTime = Random.Range(_minTimeBetweenGlitches, _maxTimeBetweenGlitches);
                yield return new WaitForSeconds(waitTime);

                // Execute the Glitch
                yield return StartCoroutine(TriggerGlitch());
            }
        }

        private IEnumerator TriggerGlitch()
        {
            // Optional: You can check HeatManager here to only glitch if Heat > 50
            if (HeatManager.Instance != null && HeatManager.Instance.CurrentHeat < 30f)
            {
                // Player is calm, don't glitch yet
                yield break;
            }

            Debug.Log("[GlitchUIManager] Triggering subliminal UI glitch...");
            
            // Swap text and scramble formatting
            _missionText.text = $"<color=red>{_glitchText}</color>";
            _missionText.fontStyle = FontStyles.Strikethrough | FontStyles.Italic;

            // TODO: Trigger a UI audio static sound here

            // Hold for exactly the glitch duration
            yield return new WaitForSeconds(_glitchDuration);

            // Restore normal HUD
            _missionText.text = _normalText;
            _missionText.fontStyle = FontStyles.Normal;
            _missionText.color = Color.white;
        }
    }
}
