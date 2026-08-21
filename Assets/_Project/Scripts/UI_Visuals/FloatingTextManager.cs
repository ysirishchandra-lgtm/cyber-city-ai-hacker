using UnityEngine;
using TMPro;
using System.Collections.Generic;

namespace Scar.UI_Visuals
{
    public class FloatingTextManager : MonoBehaviour
    {
        public static FloatingTextManager Instance { get; private set; }

        [Header("Prefabs & Pooling")]
        [SerializeField] private GameObject _floatingTextPrefab; // Prefab must contain a TextMeshPro component
        [SerializeField] private int _poolSize = 20;

        private Queue<GameObject> _textPool = new Queue<GameObject>();

        private void Awake()
        {
            if (Instance == null) Instance = this;
            else Destroy(gameObject);

            InitializePool();
        }

        private void InitializePool()
        {
            if (_floatingTextPrefab == null) return;

            for (int i = 0; i < _poolSize; i++)
            {
                var obj = Instantiate(_floatingTextPrefab, transform);
                obj.SetActive(false);
                _textPool.Enqueue(obj);
            }
        }

        public void SpawnDamageNumber(Vector3 worldPosition, int damage, bool isCritical)
        {
            if (_textPool.Count == 0 || Camera.main == null) return;

            var txtObj = _textPool.Dequeue();
            txtObj.SetActive(true);

            // Simple billboard & placement (assumes this manager is on a world space canvas or updates via script)
            txtObj.transform.position = worldPosition + Vector3.up * Random.Range(1f, 2f) + Vector3.right * Random.Range(-0.5f, 0.5f);
            txtObj.transform.rotation = Camera.main.transform.rotation;

            var tmp = txtObj.GetComponent<TextMeshPro>();
            if (tmp != null)
            {
                tmp.text = damage.ToString();
                if (isCritical)
                {
                    tmp.text += "!";
                    tmp.color = Color.red;
                    tmp.fontSize = 8f;
                }
                else
                {
                    tmp.color = Color.white;
                    tmp.fontSize = 5f;
                }
            }

            StartCoroutine(AnimateAndReturnToPool(txtObj, isCritical));
        }

        private System.Collections.IEnumerator AnimateAndReturnToPool(GameObject obj, bool isCritical)
        {
            float duration = 1.0f;
            float elapsed = 0f;
            Vector3 startPos = obj.transform.position;
            Vector3 targetScale = isCritical ? new Vector3(1.5f, 1.5f, 1.5f) : Vector3.one;
            Vector3 initialScale = isCritical ? new Vector3(2.5f, 2.5f, 2.5f) : Vector3.one;
            
            var tmp = obj.GetComponent<TextMeshPro>();

            while (elapsed < duration)
            {
                elapsed += Time.deltaTime;
                
                // Float upwards
                obj.transform.position = startPos + Vector3.up * (elapsed * 2f);
                
                // Scale pop
                obj.transform.localScale = Vector3.Lerp(initialScale, targetScale, elapsed * 5f); // Pop fast, then settle
                
                // Alpha fade out near the end
                if (tmp != null && elapsed > duration * 0.5f)
                {
                    float alpha = Mathf.Lerp(1f, 0f, (elapsed - (duration * 0.5f)) / (duration * 0.5f));
                    Color c = tmp.color;
                    c.a = alpha;
                    tmp.color = c;
                }

                yield return null;
            }

            obj.SetActive(false);
            _textPool.Enqueue(obj);
        }
    }
}
