using System.Collections.Generic;
using UnityEngine;
using Scar.Gameplay.Combat;
using Scar.Gameplay.Health;
using Scar.Core;

namespace Scar.Gameplay.Abilities
{
    public class DestructionNovaAbility : IPowerAbility
    {
        public string Name => "Destruction Nova";
        public float Cooldown => 5.0f;
        public float CurrentCooldown { get; private set; }
        public bool IsReady => CurrentCooldown <= 0f;

        public bool Activate(GameObject caster)
        {
            if (!IsReady) return false;
            CurrentCooldown = Cooldown;

            Collider[] hits = Physics.OverlapSphere(caster.transform.position, 6.0f);
            foreach (var hit in hits)
            {
                if (hit.gameObject == caster) continue;
                var hurtbox = hit.GetComponent<Hurtbox>();
                if (hurtbox != null)
                {
                    Vector3 push = (hit.transform.position - caster.transform.position).normalized * 10f;
                    hurtbox.ReceiveDamage(new DamageData(75f, DamageType.POWER_DESTRUCTION, caster, push));
                }
            }
            return true;
        }

        public void UpdateCooldown(float deltaTime)
        {
            if (CurrentCooldown > 0f) CurrentCooldown -= deltaTime;
        }
    }

    public class KineticBarrierAbility : IPowerAbility
    {
        public string Name => "Kinetic Barrier";
        public float Cooldown => 6.0f;
        public float CurrentCooldown { get; private set; }
        public bool IsReady => CurrentCooldown <= 0f;

        public bool Activate(GameObject caster)
        {
            if (!IsReady) return false;
            CurrentCooldown = Cooldown;

            var hurtbox = caster.GetComponentInChildren<Hurtbox>();
            if (hurtbox != null)
            {
                hurtbox.SetInvulnerable(true);
                // Disable invulnerability after 3.5s duration
                var runner = caster.GetComponent<AbilityManager>();
                if (runner != null)
                {
                    runner.InvokeDisableInvulnerability(hurtbox, 3.5f);
                }
            }
            return true;
        }

        public void UpdateCooldown(float deltaTime)
        {
            if (CurrentCooldown > 0f) CurrentCooldown -= deltaTime;
        }
    }

    public class StasisHackAbility : IPowerAbility
    {
        public string Name => "Stasis Hack";
        public float Cooldown => 7.0f;
        public float CurrentCooldown { get; private set; }
        public bool IsReady => CurrentCooldown <= 0f;

        public bool Activate(GameObject caster)
        {
            if (!IsReady) return false;
            CurrentCooldown = Cooldown;

            Collider[] hits = Physics.OverlapSphere(caster.transform.position, 8.0f);
            foreach (var hit in hits)
            {
                if (hit.gameObject == caster) continue;
                var agent = hit.GetComponent<UnityEngine.AI.NavMeshAgent>();
                if (agent != null)
                {
                    agent.isStopped = true;
                    var runner = caster.GetComponent<AbilityManager>();
                    if (runner != null)
                    {
                        runner.InvokeUnfreezeAgent(agent, 4.0f);
                    }
                }
            }
            return true;
        }

        public void UpdateCooldown(float deltaTime)
        {
            if (CurrentCooldown > 0f) CurrentCooldown -= deltaTime;
        }
    }

    public class AbilityManager : MonoBehaviour
    {
        private IPowerAbility _equippedAbility = null;
        public bool HasPower => _equippedAbility != null;

        private void Awake()
        {
            EventBus.Instance.Subscribe(GameEvents.POWER_AWAKENED, OnPowerAwakened);
        }

        private void OnDestroy()
        {
            EventBus.Instance.Unsubscribe(GameEvents.POWER_AWAKENED, OnPowerAwakened);
        }

        private void Update()
        {
            if (_equippedAbility != null)
            {
                _equippedAbility.UpdateCooldown(Time.deltaTime);
            }
        }

        public void UnlockAbility(string powerPath)
        {
            switch (powerPath.ToUpper())
            {
                case "DESTRUCTION":
                case "AGGRESSIVE":
                    _equippedAbility = new DestructionNovaAbility();
                    break;
                case "PROTECTION":
                case "PROTECTIVE":
                    _equippedAbility = new KineticBarrierAbility();
                    break;
                case "CONTROL":
                case "STRATEGIC":
                    _equippedAbility = new StasisHackAbility();
                    break;
            }
        }

        public bool TryActivatePower()
        {
            if (_equippedAbility == null) return false;
            return _equippedAbility.Activate(gameObject);
        }

        private void OnPowerAwakened(object payload)
        {
            if (payload is string path)
            {
                UnlockAbility(path);
            }
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
