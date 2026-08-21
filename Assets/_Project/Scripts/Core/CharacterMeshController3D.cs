using UnityEngine;

namespace Scar.Core
{
    public class CharacterMeshController3D : MonoBehaviour
    {
        [Header("Mesh & Materials")]
        [SerializeField] private SkinnedMeshRenderer[] _characterRenderers;
        [SerializeField] private Material _animeCelShaderMaterial;
        
        [Header("Tactical Accessories")]
        [SerializeField] private GameObject _shadesAccessory;
        [SerializeField] private GameObject _trenchCoatMesh;
        
        private void Awake()
        {
            ApplyTacticalLoadout();
        }

        public void ApplyTacticalLoadout()
        {
            // Apply Cel-shaded material to all character meshes
            if (_animeCelShaderMaterial != null)
            {
                foreach (var rnd in _characterRenderers)
                {
                    if (rnd != null)
                    {
                        Material[] newMats = new Material[rnd.materials.Length];
                        for(int i = 0; i < newMats.Length; i++)
                        {
                            newMats[i] = _animeCelShaderMaterial;
                        }
                        rnd.materials = newMats;
                    }
                }
            }

            // Ensure tactical gear is visible
            if (_shadesAccessory != null) _shadesAccessory.SetActive(true);
            if (_trenchCoatMesh != null) _trenchCoatMesh.SetActive(true);
            
            Debug.Log("[CharacterMeshController3D] Tactical loadout & Anime Cel-Shader applied.");
        }
    }
}
