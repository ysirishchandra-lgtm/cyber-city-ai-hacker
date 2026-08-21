using System.Collections.Generic;
using UnityEngine;
using Scar.Core;
using Scar.Gameplay.Combat;
using Scar.Gameplay.Health;

namespace Scar.Gameplay.Abilities
{
    public class DestructionNovaAbility : IPowerAbility
    {
        public string AbilityId { get { return "DESTRUCTION_NOVA"; } }
        public string AbilityName { get { return "Destruction Nova"; } }
        public string PowerPath { get { return "AGGRESSIVE"; } }
        public float CooldownDuration { get { return 5.0f; } }
        public float RemainingCooldown { get; private set; }
        public bool IsReady { get { return RemainingCooldown <= 0f; } }

        private readonly GameObject _caster;

        public DestructionNovaAbility(GameObject caster)
        {
            _caster = caster;
            RemainingCooldown = 0f;
        }

        public bool CanActivate() { return IsReady && _caster != null; }

        public void Activate()
        {
            if (!CanActivate()) return;
            RemainingCooldown = CooldownDuration;

            if (_caster != null && _caster.transform != null)
            {
                Collider[] hits = Physics.OverlapSphere(_caster.transform.position, 6.0f);
                for (int i = 0; i < hits.Length; i++)
                {
                    if (hits[i].gameObject == _caster) continue;
                    var hurtbox = hits[i].GetComponent<Hurtbox>();
                    if (hurtbox != null)
                    {
                        Vector3 push = (hits[i].transform.position - _caster.transform.position).normalized * 10f;
                        hurtbox.ReceiveDamage(new DamageData(75f, DamageType.POWER_DESTRUCTION, _caster, push));
                    }
                }
            }
        }

        public void UpdateCooldown(float deltaTime)
        {
            if (RemainingCooldown > 0f) RemainingCooldown -= deltaTime;
        }
    }

    public class KineticBarrierAbility : IPowerAbility
    {
        public string AbilityId { get { return "KINETIC_BARRIER"; } }
        public string AbilityName { get { return "Kinetic Barrier"; } }
        public string PowerPath { get { return "PROTECTIVE"; } }
        public float CooldownDuration { get { return 6.0f; } }
        public float RemainingCooldown { get; private set; }
        public bool IsReady { get { return RemainingCooldown <= 0f; } }

        private readonly GameObject _caster;

        public KineticBarrierAbility(GameObject caster)
        {
            _caster = caster;
            RemainingCooldown = 0f;
        }

        public bool CanActivate() { return IsReady && _caster != null; }

        public void Activate()
        {
            if (!CanActivate()) return;
            RemainingCooldown = CooldownDuration;

            if (_caster != null)
            {
                var hurtbox = _caster.GetComponentInChildren<Hurtbox>();
                if (hurtbox != null)
                {
                    hurtbox.SetInvulnerable(true);
                    var runner = _caster.GetComponent<AbilityManager>();
                    if (runner != null)
                    {
                        runner.InvokeDisableInvulnerability(hurtbox, 3.5f);
                    }
                }
            }
        }

        public void UpdateCooldown(float deltaTime)
        {
            if (RemainingCooldown > 0f) RemainingCooldown -= deltaTime;
        }
    }

    public class StasisHackAbility : IPowerAbility
    {
        public string AbilityId { get { return "STASIS_HACK"; } }
        public string AbilityName { get { return "Stasis Hack"; } }
        public string PowerPath { get { return "STRATEGIC"; } }
        public float CooldownDuration { get { return 7.0f; } }
        public float RemainingCooldown { get; private set; }
        public bool IsReady { get { return RemainingCooldown <= 0f; } }

        private readonly GameObject _caster;

        public StasisHackAbility(GameObject caster)
        {
            _caster = caster;
            RemainingCooldown = 0f;
        }

        public bool CanActivate() { return IsReady && _caster != null; }

        public void Activate()
        {
            if (!CanActivate()) return;
            RemainingCooldown = CooldownDuration;

            if (_caster != null && _caster.transform != null)
            {
                Collider[] hits = Physics.OverlapSphere(_caster.transform.position, 8.0f);
                for (int i = 0; i < hits.Length; i++)
                {
                    if (hits[i].gameObject == _caster) continue;
                    var agent = hits[i].GetComponent<UnityEngine.AI.NavMeshAgent>();
                    if (agent != null)
                    {
                        agent.isStopped = true;
                        var runner = _caster.GetComponent<AbilityManager>();
                        if (runner != null)
                        {
                            runner.InvokeUnfreezeAgent(agent, 4.0f);
                        }
                    }
                }
            }
        }

        public void UpdateCooldown(float deltaTime)
        {
            if (RemainingCooldown > 0f) RemainingCooldown -= deltaTime;
        }
    }

    public class AbilityManager : MonoBehaviour
    {
        private IPowerAbility _equippedAbility = null;
        public bool HasPower { get { return _equippedAbility != null; } }
        public IPowerAbility EquippedAbility { get { return _equippedAbility; } }

        private void Update()
        {
            var dn = _equippedAbility as DestructionNovaAbility;
            if (dn != null) { dn.UpdateCooldown(Time.deltaTime); return; }

            var kb = _equippedAbility as KineticBarrierAbility;
            if (kb != null) { kb.UpdateCooldown(Time.deltaTime); return; }

            var sh = _equippedAbility as StasisHackAbility;
            if (sh != null) { sh.UpdateCooldown(Time.deltaTime); return; }
        }

        public void UnlockAbility(string powerPath)
        {
            if (string.IsNullOrEmpty(powerPath)) return;

            switch (powerPath.ToUpper())
            {
                case "DESTRUCTION":
                case "AGGRESSIVE":
                    _equippedAbility = new DestructionNovaAbility(gameObject);
                    break;
                case "PROTECTION":
                case "PROTECTIVE":
                    _equippedAbility = new KineticBarrierAbility(gameObject);
                    break;
                case "CONTROL":
                case "STRATEGIC":
                    _equippedAbility = new StasisHackAbility(gameObject);
                    break;
            }
        }

        public bool TryActivatePower()
        {
            if (_equippedAbility == null || !_equippedAbility.CanActivate()) return false;
            _equippedAbility.Activate();
            return true;
        }

        public void InvokeDisableInvulnerability(Hurtbox hurtbox, float delay)
        {
            StartCoroutine(DisableInvulnerabilityRoutine(hurtbox, delay));
        }

        private System.Collections.IEnumerator DisableInvulnerabilityRoutine(Hurtbox hurtbox, float delay)
        {
            yield return new WaitForSeconds(delay);
            if (hurtbox != null) hurtbox.SetInvulnerable(false);
        }

        public void InvokeUnfreezeAgent(UnityEngine.AI.NavMeshAgent agent, float delay)
        {
            StartCoroutine(UnfreezeAgentRoutine(agent, delay));
        }

        private System.Collections.IEnumerator UnfreezeAgentRoutine(UnityEngine.AI.NavMeshAgent agent, float delay)
        {
            yield return new WaitForSeconds(delay);
            if (agent != null && agent.enabled) agent.isStopped = false;
        }
    }
}
