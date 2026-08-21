using UnityEngine;

namespace Scar.UI_Visuals
{
    [CreateAssetMenu(fileName = "NewCharacterProfile", menuName = "SCAR/Character Profile")]
    public class CharacterProfile : ScriptableObject
    {
        public string characterId;
        public string characterName;
        public string playstyle;
        [TextArea] public string description;
        [TextArea] public string strength;
        [TextArea] public string weakness;

        [Header("Stats")]
        [Range(0, 10)] public int speedStat;
        [Range(0, 10)] public int damageStat;
        [Range(0, 10)] public int healthStat;
        [Range(0, 10)] public int utilityStat;

        [Header("Visuals")]
        public Sprite characterArt;
        public Color themeColor = Color.cyan;
    }
}
