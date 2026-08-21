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
            wallL.name = "Wall_Left (Cyberpunk Backdrop)";
            wallL.transform.SetParent(levelRoot.transform);
            wallL.transform.position = new Vector3(-25f, 20f, 0f);
            wallL.transform.localScale = new Vector3(2f, 40f, 100f);
            
            // Right Wall
            GameObject wallR = GameObject.CreatePrimitive(PrimitiveType.Cube);
            wallR.name = "Wall_Right (Cyberpunk Backdrop)";
            wallR.transform.SetParent(levelRoot.transform);
            wallR.transform.position = new Vector3(25f, 20f, 0f);
            wallR.transform.localScale = new Vector3(2f, 40f, 100f);

            // 2. Destructible Street Barriers & Neon Billboards
            for (int i = 0; i < 6; i++)
            {
                GameObject billboard = GameObject.CreatePrimitive(PrimitiveType.Cube);
                billboard.name = $"Neon_Billboard_{i}";
                billboard.transform.SetParent(wallR.transform);
                billboard.transform.localPosition = new Vector3(-0.6f, Random.Range(-0.3f, 0.4f), Random.Range(-0.4f, 0.4f));
                billboard.transform.localScale = new Vector3(1.5f, 0.1f, 0.1f); // Sticking out
            }

            for (int i = 0; i < 4; i++)
            {
                GameObject platform = GameObject.CreatePrimitive(PrimitiveType.Cube);
                platform.name = $"Destructible_Barrier_{i+1}";
                platform.transform.SetParent(levelRoot.transform);
                platform.transform.position = new Vector3(Random.Range(-15f, 15f), 1f, Random.Range(-30f, 30f));
                platform.transform.localScale = new Vector3(3f, 2f, 1f);
                platform.tag = "Destructible";
            }

            // 3. Environment Lighting & Stormy Skybox Approximation
            GameObject lightObj = new GameObject("Sunset_Stormy_KeyLight");
            lightObj.transform.SetParent(levelRoot.transform);
            lightObj.transform.position = new Vector3(0f, 50f, 0f);
            lightObj.transform.rotation = Quaternion.Euler(30f, -45f, 0f);
            Light light = lightObj.AddComponent<Light>();
            light.type = LightType.Directional;
            light.color = new Color(1f, 0.4f, 0.1f); // Stormy Sunset Orange
            light.intensity = 0.8f;

            // Fog Volume approximation
            RenderSettings.fog = true;
            RenderSettings.fogColor = new Color(0.05f, 0.05f, 0.08f);
            RenderSettings.fogMode = FogMode.ExponentialSquared;
            RenderSettings.fogDensity = 0.03f;

            Debug.Log("[SCAR Editor] Level 1 Geometry, Collisions, and Atmospheric Lighting successfully generated!");
        }
    }
}
#endif
