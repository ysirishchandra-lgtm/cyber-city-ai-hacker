using System.Collections.Generic;
using UnityEngine;
using Scar.Core;
using Scar.Gameplay.Combat;
using Scar.Gameplay.Health;

namespace Scar.Gameplay.Abilities
{
    public class DestructionNovaAbility : IPowerAbility
    {
        public string AbilityId => "DESTRUCTION_NOVA";
        public string AbilityName => "Destruction Nova";
        public string PowerPath => "AGGRESSIVE";
        public float CooldownDuration => 5.0f;
        public float RemainingCooldown { get; private set; }
        public bool IsReady => RemainingCooldown <= 0f;

        private readonly GameObject _caster;

        public DestructionNovaAbility(GameObject caster)
        {
            _caster = caster;
        }

        public bool CanActivate() => IsReady && _caster != null;

        public void Activate()
        {
            if (!CanActivate()) return;
            RemainingCooldown = CooldownDuration;

            Collider[] hits = Physics.OverlapSphere(_caster.transform.position, 6.0f);
            foreach (var hit in hits)
            {
                if (hit.gameObject == _caster) continue;
                var hurtbox = hit.GetComponent<Hurtbox>();
                if (hurtbox != null)
                {
                    Vector3 push = (hit.transform.position - _caster.transform.position).normalized * 10f;
                    hurtbox.ReceiveDamage(new DamageData(75f, DamageType.POWER_DESTRUCTION, _caster, push));
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
        public string AbilityId => "KINETIC_BARRIER";
        public string AbilityName => "Kinetic Barrier";
        public string PowerPath => "PROTECTIVE";
        public float CooldownDuration => 6.0f;
        public float RemainingCooldown { get; private set; }
        public bool IsReady => RemainingCooldown <= 0f;

        private readonly GameObject _caster;

        public KineticBarrierAbility(GameObject caster)
        {
            _caster = caster;
        }

        public bool CanActivate() => IsReady && _caster != null;

        public void Activate()
        {
            if (!CanActivate()) return;
            RemainingCooldown = CooldownDuration;

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

        public void UpdateCooldown(float deltaTime)
        {
            if (RemainingCooldown > 0f) RemainingCooldown -= deltaTime;
        }
    }

    public class StasisHackAbility : IPowerAbility
    {
        public string AbilityId => "STASIS_HACK";
        public string AbilityName => "Stasis Hack";
        public string PowerPath => "STRATEGIC";
        public float CooldownDuration => 7.0f;
        public float RemainingCooldown { get; private set; }
        public bool IsReady => RemainingCooldown <= 0f;

        private readonly GameObject _caster;

        public StasisHackAbility(GameObject caster)
        {
            _caster = caster;
        }

        public bool CanActivate() => IsReady && _caster != null;

        public void Activate()
        {
            if (!CanActivate()) return;
            RemainingCooldown = CooldownDuration;

            Collider[] hits = Physics.OverlapSphere(_caster.transform.position, 8.0f);
            foreach (var hit in hits)
            {
                if (hit.gameObject == _caster) continue;
                var agent = hit.GetComponent<UnityEngine.AI.NavMeshAgent>();
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

        public void UpdateCooldown(float deltaTime)
        {
            if (RemainingCooldown > 0f) RemainingCooldown -= deltaTime;
        }
    }

    public class AbilityManager : MonoBehaviour
    {
        private IPowerAbility _equippedAbility = null;
        public bool HasPower => _equippedAbility != null;
        public IPowerAbility EquippedAbility => _equippedAbility;

        private void Update()
        {
            if (_equippedAbility is DestructionNovaAbility dn) dn.UpdateCooldown(Time.deltaTime);
            else if (_equippedAbility is KineticBarrierAbility kb) kb.UpdateCooldown(Time.deltaTime);
            else if (_equippedAbility is StasisHackAbility sh) sh.UpdateCooldown(Time.deltaTime);
        }

        public void UnlockAbility(string powerPath)
        {
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
