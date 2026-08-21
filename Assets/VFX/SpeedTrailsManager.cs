using System.Collections;
using UnityEngine;

namespace Scar.VFX
{
    /// <summary>
    /// Manages high-speed ribbon/afterimage ghost trails attached to character rig
    /// and screen-space radial speed lines overlay.
    /// </summary>
    public class SpeedTrailsManager : MonoBehaviour
    {
        public static SpeedTrailsManager Instance { get; private set; }

        [Header("Ghost Trail Settings")]
        [SerializeField] private SkinnedMeshRenderer[] characterMeshRenderers;
        [SerializeField] private Material ghostTrailMaterial;
        [SerializeField] private float trailInterval = 0.04f;
        [SerializeField] private float ghostDuration = 0.25f;

        [Header("Screen Speed Lines")]
        [SerializeField] private Material speedLinesMaterial;
        [SerializeField] private float speedThreshold = 8f;

        private bool isDashing = false;
        private Coroutine trailCoroutine;

        private void Awake()
        {
            if (Instance == null) Instance = this;
            else Destroy(gameObject);
        }

        public void SetSpeedLineIntensity(float velocity)
        {
            if (speedLinesMaterial == null) return;
            float intensity = Mathf.InverseLerp(speedThreshold, speedThreshold * 2f, velocity);
            speedLinesMaterial.SetFloat("_Intensity", intensity);
        }

        public void StartDashTrails()
        {
            if (isDashing) return;
            isDashing = true;
            trailCoroutine = StartCoroutine(EmitGhostTrails());
        }

        public void StopDashTrails()
        {
            isDashing = false;
            if (trailCoroutine != null)
            {
                StopCoroutine(trailCoroutine);
                trailCoroutine = null;
            }
            if (speedLinesMaterial != null)
            {
                speedLinesMaterial.SetFloat("_Intensity", 0f);
            }
        }

        private IEnumerator EmitGhostTrails()
        {
            while (isDashing)
            {
                if (characterMeshRenderers != null)
                {
                    foreach (var smr in characterMeshRenderers)
                    {
                        if (smr != null && smr.gameObject.activeInHierarchy)
                        {
                            SpawnMeshSnapshot(smr);
                        }
                    }
                }
                yield return new WaitForSeconds(trailInterval);
            }
        }

        private void SpawnMeshSnapshot(SkinnedMeshRenderer smr)
        {
            GameObject ghostObj = new GameObject("GhostSnapshot");
            ghostObj.transform.position = smr.transform.position;
            ghostObj.transform.rotation = smr.transform.rotation;

            MeshFilter mf = ghostObj.AddComponent<MeshFilter>();
            MeshRenderer mr = ghostObj.AddComponent<MeshRenderer>();

            Mesh bakedMesh = new Mesh();
            smr.BakeMesh(bakedMesh);
            mf.mesh = bakedMesh;

            mr.material = ghostTrailMaterial != null ? ghostTrailMaterial : smr.material;
            Destroy(ghostObj, ghostDuration);
        }
    }
}
