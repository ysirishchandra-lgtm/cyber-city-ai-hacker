using UnityEngine;
using TMPro;

namespace Scar.UI_Visuals
{
    public class UIStyleManager : MonoBehaviour
    {
        public static UIStyleManager Instance { get; private set; }

        [Header("Global Palettes")]
        public Color cyberCyan = new Color(0f, 0.95f, 1f, 1f);
        public Color neonRed = new Color(1f, 0.1f, 0.2f, 1f);
        public Color alertOrange = new Color(1f, 0.6f, 0f, 1f);
        public Color neonPurple = new Color(0.6f, 0f, 1f, 1f);
        public Color stealthGreen = new Color(0.1f, 1f, 0.3f, 1f);

        private void Awake()
        {
            if (Instance == null) Instance = this;
            else Destroy(gameObject);
        }

        public void ApplyGlowingOutline(TextMeshProUGUI textComponent, Color glowColor, float thickness = 0.2f)
        {
            if (textComponent == null || textComponent.fontSharedMaterial == null) return;
            
            // To ensure we don't accidentally modify the shared asset globally across the entire project in a destructive way,
            // we create an instance of the material for this specific text component if it needs a unique glow.
            Material matInstance = new Material(textComponent.fontSharedMaterial);
            
            matInstance.EnableKeyword("OUTLINE_ON");
            matInstance.SetColor("_OutlineColor", glowColor);
            matInstance.SetFloat("_OutlineWidth", thickness);
            
            textComponent.fontMaterial = matInstance;
        }
    }
}
