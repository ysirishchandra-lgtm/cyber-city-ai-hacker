#if UNITY_EDITOR
using UnityEngine;
using UnityEditor;

namespace Scar.Editor
{
    public class LevelGeneratorTool : EditorWindow
    {
        [MenuItem("SCAR/Generate Level 1 Environment")]
        public static void GenerateLevel1()
        {
            GameObject levelRoot = new GameObject("Level_1_Environment");

            // 1. Base Geometry & Alleyway
            GameObject floor = GameObject.CreatePrimitive(PrimitiveType.Plane);
            floor.name = "Alleyway_Floor";
            floor.transform.SetParent(levelRoot.transform);
            floor.transform.localScale = new Vector3(5f, 1f, 10f); // Long alley
            floor.GetComponent<Renderer>().sharedMaterial.color = new Color(0.1f, 0.1f, 0.15f);

            // Left Wall
            GameObject wallL = GameObject.CreatePrimitive(PrimitiveType.Cube);
            wallL.name = "Wall_Left (WallRun)";
            wallL.transform.SetParent(levelRoot.transform);
            wallL.transform.position = new Vector3(-25f, 10f, 0f);
            wallL.transform.localScale = new Vector3(2f, 20f, 100f);
            
            // Right Wall
            GameObject wallR = GameObject.CreatePrimitive(PrimitiveType.Cube);
            wallR.name = "Wall_Right";
            wallR.transform.SetParent(levelRoot.transform);
            wallR.transform.position = new Vector3(25f, 10f, 0f);
            wallR.transform.localScale = new Vector3(2f, 20f, 100f);

            // 2. Multi-tier platforms
            for (int i = 0; i < 4; i++)
            {
                GameObject platform = GameObject.CreatePrimitive(PrimitiveType.Cube);
                platform.name = $"Platform_Tier_{i+1}";
                platform.transform.SetParent(levelRoot.transform);
                platform.transform.position = new Vector3(Random.Range(-15f, 15f), 5f + (i * 4f), Random.Range(-30f, 30f));
                platform.transform.localScale = new Vector3(10f, 1f, 10f);
                
                // Add jump-up ledges tagging if needed
                platform.tag = "TraversableLedge";
            }

            // 3. Environment Lighting & Atmosphere
            GameObject lightObj = new GameObject("Neon_KeyLight");
            lightObj.transform.SetParent(levelRoot.transform);
            lightObj.transform.position = new Vector3(0f, 20f, 0f);
            Light light = lightObj.AddComponent<Light>();
            light.type = LightType.Directional;
            light.color = new Color(0f, 0.8f, 1f); // Cyber Cyan
            light.intensity = 1.2f;

            // Fog Volume approximation
            RenderSettings.fog = true;
            RenderSettings.fogColor = new Color(0.05f, 0.05f, 0.1f);
            RenderSettings.fogMode = FogMode.ExponentialSquared;
            RenderSettings.fogDensity = 0.02f;

            Debug.Log("[SCAR Editor] Level 1 Geometry, Collisions, and Atmospheric Lighting successfully generated!");
        }
    }
}
#endif
