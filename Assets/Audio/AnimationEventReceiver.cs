using UnityEngine;
using Scar.Audio;
using Scar.VFX;

namespace Scar.Animation
{
    /// <summary>
    /// Receives animation events from Mecanim clips to trigger exact audio SFX,
    /// particle spawns, and camera impulses.
    /// </summary>
    public class AnimationEventReceiver : MonoBehaviour
    {
        [Header("Weapon Sockets")]
        [SerializeField] private Transform weaponTipSocket;
        [SerializeField] private Transform leftFootSocket;
        [SerializeField] private Transform rightFootSocket;

        // ─── SFX Events ───────────────────────────────────────────────────────

        public void PlaySFX(string sfxName)
        {
            if (AudioManager.Instance == null) return;

            switch (sfxName.ToLower())
            {
                case "slash_light":
                case "attack1":
                case "attack2":
                    AudioManager.Instance.PlayLightSlash();
                    break;
                case "slash_heavy":
                case "attack3":
                case "slam":
                    AudioManager.Instance.PlayHeavyImpact();
                    break;
                case "dash":
                case "dodge":
                    AudioManager.Instance.PlayDashSwoosh();
                    break;
                case "energy_clash":
                case "power":
                    AudioManager.Instance.PlayEnergyClash();
                    break;
                case "footstep":
                    AudioManager.Instance.PlayFootstep();
                    break;
            }
        }

        // ─── VFX Events ───────────────────────────────────────────────────────

        public void SpawnVFX(string vfxName)
        {
            Vector3 spawnPos = weaponTipSocket != null ? weaponTipSocket.position : transform.position + transform.forward * 1.2f;
            Quaternion spawnRot = transform.rotation;

            switch (vfxName.ToLower())
            {
                case "slash_arc_1":
                    if (HitSparksManager.Instance != null)
                        HitSparksManager.Instance.SpawnComboSlash(0, spawnPos, spawnRot);
                    break;
                case "slash_arc_2":
                    if (HitSparksManager.Instance != null)
                        HitSparksManager.Instance.SpawnComboSlash(1, spawnPos, spawnRot);
                    break;
                case "slash_arc_3":
                case "heavy_cleave":
                    if (HitSparksManager.Instance != null)
                        HitSparksManager.Instance.SpawnComboSlash(2, spawnPos, spawnRot);
                    break;
                case "ground_slam":
                    if (GroundDecalManager.Instance != null)
                        GroundDecalManager.Instance.SpawnGroundSlam(transform.position, Vector3.up);
                    break;
                case "dash_start":
                    if (SpeedTrailsManager.Instance != null)
                        SpeedTrailsManager.Instance.StartDashTrails();
                    break;
                case "dash_end":
                    if (SpeedTrailsManager.Instance != null)
                        SpeedTrailsManager.Instance.StopDashTrails();
                    break;
            }
        }
    }
}
