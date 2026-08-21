using UnityEngine;
using UnityEngine.UI;
using System.Collections.Generic;

namespace Scar.UI_Visuals
{
    public class CyberpunkAtmosphereUI : MonoBehaviour
    {
        [Header("Scanlines")]
        [SerializeField] private RawImage _scanlineOverlay;
        [SerializeField] private float _scanlineScrollSpeed = 0.5f;
        [SerializeField] private float _scanlineOpacity = 0.15f;

        [Header("Embers")]
        [SerializeField] private RectTransform _emberContainer;
        [SerializeField] private GameObject _emberPrefab;
        [SerializeField] private int _emberCount = 20;
        
        private List<RectTransform> _embers = new List<RectTransform>();
        private List<float> _emberSpeeds = new List<float>();

        private void Start()
        {
            if (_scanlineOverlay != null)
            {
                Color c = _scanlineOverlay.color;
                c.a = _scanlineOpacity;
                _scanlineOverlay.color = c;
            }

            if (_emberPrefab != null && _emberContainer != null)
            {
                for (int i = 0; i < _emberCount; i++)
                {
                    var ember = Instantiate(_emberPrefab, _emberContainer).GetComponent<RectTransform>();
                    ResetEmber(ember, i);
                    _embers.Add(ember);
                }
            }
        }

        private void Update()
        {
            if (_scanlineOverlay != null)
            {
                Rect uvRect = _scanlineOverlay.uvRect;
                uvRect.y += _scanlineScrollSpeed * Time.deltaTime;
                _scanlineOverlay.uvRect = uvRect;
            }

            for (int i = 0; i < _embers.Count; i++)
            {
                var ember = _embers[i];
                ember.anchoredPosition += Vector2.up * _emberSpeeds[i] * Time.deltaTime;
                
                // Slight horizontal wobble
                ember.anchoredPosition += Vector2.right * Mathf.Sin(Time.time * 2f + i) * 30f * Time.deltaTime;

                if (ember.anchoredPosition.y > Screen.height + 100)
                {
                    ResetEmber(ember, i);
                }
            }
        }

        private void ResetEmber(RectTransform ember, int index)
        {
            float startX = Random.Range(-Screen.width / 2f, Screen.width / 2f);
            ember.anchoredPosition = new Vector2(startX, -Screen.height / 2f - Random.Range(50f, 200f));
            
            if (_emberSpeeds.Count <= index) 
                _emberSpeeds.Add(Random.Range(50f, 150f));
            else 
                _emberSpeeds[index] = Random.Range(50f, 150f);
            
            ember.localScale = Vector3.one * Random.Range(0.2f, 0.8f);
            
            var img = ember.GetComponent<Image>();
            if (img != null)
            {
                Color c = img.color;
                c.a = Random.Range(0.2f, 0.8f);
                img.color = c;
            }
        }
    }
}
