using System;
using System.Collections.Generic;

namespace UnityEngine
{
    public class MonoBehaviour
    {
        private GameObject _gameObject;
        public GameObject gameObject 
        { 
            get 
            { 
                if (_gameObject == null) _gameObject = new GameObject(); 
                return _gameObject; 
            } 
        }
        public Transform transform { get { return gameObject.transform; } }

        public T GetComponent<T>() where T : class { return null; }
        public T GetComponentInParent<T>() where T : class { return null; }
        public T GetComponentInChildren<T>() where T : class { return null; }
        public T AddComponent<T>() where T : new() { return new T(); }
        public Coroutine StartCoroutine(System.Collections.IEnumerator routine) { while (routine.MoveNext()) { } return new Coroutine(); }
        public static void DontDestroyOnLoad(GameObject target) { }
        public static void Destroy(GameObject target) { }
        public static void Destroy(GameObject target, float t) { }
        public void Invoke(string methodName, float time) { }
    }

    public class GameObject 
    { 
        public string name = "GameObject";
        public Transform transform;
        public Transform root { get { return transform; } }
        public int layer = 0;

        public GameObject()
        {
            transform = new Transform(this);
        }

        public T GetComponent<T>() where T : class { return null; }
        public T GetComponentInChildren<T>() where T : class { return null; }
        public T GetComponentInParent<T>() where T : class { return null; }
        public T AddComponent<T>() where T : new() { return new T(); }
        public static GameObject FindGameObjectWithTag(string tag) { return new GameObject { name = tag }; }
    }

    public class Transform 
    { 
        public Vector3 position = new Vector3(0, 0, 0);
        public Quaternion rotation = new Quaternion();
        public Vector3 forward { get { return Vector3.forward; } }
        public Vector3 right { get { return new Vector3(1, 0, 0); } }
        public Transform root { get { return this; } }
        public GameObject gameObject;

        public Transform(GameObject owner)
        {
            gameObject = owner;
        }

        public Transform()
        {
        }

        public T GetComponentInChildren<T>() where T : class 
        { 
            return gameObject != null ? gameObject.GetComponentInChildren<T>() : null; 
        }
    }

    public class Coroutine { }
    public class AsyncOperation { public bool isDone { get { return true; } } }

    public class HeaderAttribute : Attribute { public HeaderAttribute(string header) { } }
    public class SerializeField : Attribute { }
    public class RangeAttribute : Attribute { public RangeAttribute(float min, float max) { } }
    public class CreateAssetMenuAttribute : Attribute { public string fileName; public string menuName; }
    
    [AttributeUsage(AttributeTargets.Class, AllowMultiple = true)]
    public class RequireComponentAttribute : Attribute { public RequireComponentAttribute(Type requiredComponentType) { } }

    public class ScriptableObject 
    { 
        public static T CreateInstance<T>() where T : new() { return new T(); } 
    }

    public class LayerMask
    {
        public int value = ~0;
        public static implicit operator int(LayerMask mask) { return mask != null ? mask.value : ~0; }
        public static implicit operator LayerMask(int intVal) { return new LayerMask { value = intVal }; }
    }

    public class Color
    {
        public static Color yellow { get { return new Color(); } }
    }

    public static class Gizmos
    {
        public static Color color;
        public static void DrawWireSphere(Vector3 pos, float radius) { }
    }

    public struct Vector2
    {
        public float x, y;
        public Vector2(float x, float y) { this.x = x; this.y = y; }
        public float sqrMagnitude { get { return x * x + y * y; } }
        public Vector2 normalized { get { return this; } }
        public static Vector2 zero { get { return new Vector2(0, 0); } }
    }

    public struct Vector3
    {
        public float x, y, z;
        public Vector3(float x, float y, float z) { this.x = x; this.y = y; this.z = z; }
        public static Vector3 zero { get { return new Vector3(0, 0, 0); } }
        public static Vector3 forward { get { return new Vector3(0, 0, 1); } }
        public static Vector3 up { get { return new Vector3(0, 1, 0); } }
        public float sqrMagnitude { get { return x * x + y * y + z * z; } }
        public Vector3 normalized { get { return this; } }
        public void Normalize() { }
        public static Vector3 operator +(Vector3 a, Vector3 b) { return new Vector3(a.x + b.x, a.y + b.y, a.z + b.z); }
        public static Vector3 operator -(Vector3 a, Vector3 b) { return new Vector3(a.x - b.x, a.y - b.y, a.z - b.z); }
        public static Vector3 operator *(Vector3 a, float d) { return new Vector3(a.x * d, a.y * d, a.z * d); }
        public static bool operator ==(Vector3 a, Vector3 b) { return a.x == b.x && a.y == b.y && a.z == b.z; }
        public static bool operator !=(Vector3 a, Vector3 b) { return !(a == b); }
        public override bool Equals(object obj) { return obj is Vector3 && this == (Vector3)obj; }
        public override int GetHashCode() { return x.GetHashCode() ^ y.GetHashCode() ^ z.GetHashCode(); }
        public static float Distance(Vector3 a, Vector3 b) { return (float)Math.Sqrt((a.x-b.x)*(a.x-b.x) + (a.y-b.y)*(a.y-b.y) + (a.z-b.z)*(a.z-b.z)); }
    }

    public class Quaternion
    {
        public static Quaternion LookRotation(Vector3 forward) { return new Quaternion(); }
        public static Quaternion Slerp(Quaternion a, Quaternion b, float t) { return new Quaternion(); }
    }

    public static class Mathf
    {
        public static float Min(float a, float b) { return Math.Min(a, b); }
        public static float Max(float a, float b) { return Math.Max(a, b); }
        public static int Max(int a, int b) { return Math.Max(a, b); }
        public static float Clamp(float val, float min, float max) { return Math.Max(min, Math.Min(max, val)); }
    }

    public static class Debug
    {
        public static void Log(object message) { Console.WriteLine("[Unity Log] " + message); }
        public static void LogWarning(object message) { Console.WriteLine("[Unity Warning] " + message); }
        public static void LogError(object message) { Console.WriteLine("[Unity Error] " + message); }
    }

    public class WaitForSeconds
    {
        public WaitForSeconds(float s) { }
    }

    public class Time
    {
        public static float deltaTime { get { return 0.016f; } }
    }

    public class CharacterController : MonoBehaviour
    {
        public bool isGrounded { get { return true; } }
        public void Move(Vector3 motion) { }
    }

    public class Collider : MonoBehaviour 
    { 
        public bool isTrigger = false;
        public bool enabled = true;
        public bool CompareTag(string tag) { return true; }
    }

    public static class Physics
    {
        public static Collider[] OverlapSphere(Vector3 position, float radius) { return new Collider[0]; }
        public static Collider[] OverlapSphere(Vector3 position, float radius, int layerMask) { return new Collider[0]; }
    }

    public class Camera : MonoBehaviour
    {
        public static Camera main = new Camera();
    }

    public class Animator : MonoBehaviour
    {
        public static int StringToHash(string name) { return name.GetHashCode(); }
        public void SetFloat(int id, float val) { }
        public void SetBool(int id, bool val) { }
        public void SetTrigger(int id) { }
    }
}

namespace UnityEngine.SceneManagement
{
    public static class SceneManager
    {
        public static int sceneCountInBuildSettings { get { return 0; } }
        public static AsyncOperation LoadSceneAsync(string sceneName) { return new AsyncOperation(); }
    }

    public static class SceneUtility
    {
        public static string GetScenePathByBuildIndex(int index) { return string.Empty; }
    }
}

namespace UnityEngine.AI
{
    public class NavMeshAgent : MonoBehaviour
    {
        public bool enabled = true;
        public bool isStopped = false;
        public float speed = 3.5f;
        public float remainingDistance { get { return 0f; } }
        public bool hasPath { get { return false; } }
        public void SetDestination(Vector3 target) { }
        public void ResetPath() { }
    }
}

namespace Scar.Tests
{
    using Scar.Core;
    using Scar.Gameplay.Player;
    using Scar.Gameplay.Combat;
    using Scar.Gameplay.Health;
    using Scar.Gameplay.Enemy;
    using Scar.Gameplay.Level;
    using Scar.Gameplay.Abilities;
    using Scar.Gameplay.Hero;

    public class MasterPlayableLoopTests
    {
        private static int _total = 0;
        private static int _passed = 0;

        private static void AssertTest(bool condition, string testName)
        {
            _total++;
            if (condition)
            {
                _passed++;
                Console.WriteLine("  [PASS] " + testName);
            }
            else
            {
                Console.ForegroundColor = ConsoleColor.Red;
                Console.WriteLine("  [FAIL] " + testName);
                Console.ResetColor();
            }
        }

        public static int Main(string[] args)
        {
            Console.WriteLine("==================================================");
            Console.WriteLine("SCAR — MASTER PLAYABLE LOOP & INTEGRATION TEST");
            Console.WriteLine("==================================================");

            // 1. Core & GameState Setup
            Console.WriteLine("\n--- 1. Game Boot & State Machine ---");
            GameState state = new GameState();
            state.ResetForNewGame();
            state.SetPlayerIdentity("usr_valkyrie", "Valkyrie");

            AssertTest(state.CurrentPhase == GamePhase.MAIN_MENU, "Initial phase is MAIN_MENU");
            AssertTest(state.PlayerName == "Valkyrie", "Player name set correctly without fake defaults");
            AssertTest(state.Score == 0, "Initial score is exactly 0");

            // Transition to Prologue
            state.SetPhase(GamePhase.PROLOGUE);
            AssertTest(state.CurrentPhase == GamePhase.PROLOGUE, "Phase transitioned to PROLOGUE");

            // Transition to Level 1
            state.SetLevel(1, "Neon District Streets");
            state.SetPhase(GamePhase.LEVEL_1);
            AssertTest(state.CurrentPhase == GamePhase.LEVEL_1, "Phase transitioned to LEVEL_1");
            AssertTest(state.CurrentLevel == 1, "Level set to 1");

            // 2. Player Movement & Input Event Flow
            Console.WriteLine("\n--- 2. Player Controller & Movement Flow ---");
            bool playerMovedFired = false;
            EventBus.Subscribe(GameEvents.PLAYER_MOVED, delegate(object payload) { playerMovedFired = true; });

            EventBus.Publish(GameEvents.PLAYER_MOVED, new UnityEngine.Vector3(5, 0, 10));
            AssertTest(playerMovedFired, "PLAYER_MOVED event published and received via canonical EventBus");

            // 3. Combat System (Hitbox / Hurtbox / Damage)
            Console.WriteLine("\n--- 3. Combat Hitbox & HealthComponent Verification ---");
            HealthComponent enemyHealth = new HealthComponent();
            enemyHealth.Initialize(100f);

            bool damageEventFired = false;
            enemyHealth.OnDamaged += delegate(DamageData d) { damageEventFired = true; };

            DamageData attackDamage = new DamageData(35f, DamageType.MELEE, null, UnityEngine.Vector3.forward);
            enemyHealth.TakeDamage(attackDamage);

            AssertTest(damageEventFired, "HealthComponent.OnDamaged invoked on attack hit");
            AssertTest(enemyHealth.CurrentHealth == 65f, "Enemy health reduced from 100 to 65");
            AssertTest(enemyHealth.IsAlive, "Enemy is still alive with 65 HP");

            // 4. Clue Discovery & Level 1 Manager Progression
            Console.WriteLine("\n--- 4. Clue Discovery & Stage Progression ---");
            Level1Manager level1 = new Level1Manager();
            AssertTest(level1.CurrentStage == Level1Stage.START_HOME, "Level1 starts at START_HOME stage");

            level1.AdvanceStage(Level1Stage.REACH_ALLEY);
            AssertTest(level1.CurrentStage == Level1Stage.REACH_ALLEY, "Level1 advanced to REACH_ALLEY");

            bool clueDiscoveredFired = false;
            EventBus.Subscribe(GameEvents.CLUE_DISCOVERED, delegate(object payload) { clueDiscoveredFired = true; });

            EventBus.Publish(GameEvents.CLUE_DISCOVERED, "CLUE_DATAPAD_01");
            AssertTest(clueDiscoveredFired, "CLUE_DISCOVERED event published");

            // 5. Enemy Wave Defeat
            Console.WriteLine("\n--- 5. Enemy Wave Defeat & Score Tracking ---");
            int enemiesKilled = 0;
            EventBus.Subscribe(GameEvents.ENEMY_DEFEATED, delegate(object payload) 
            { 
                enemiesKilled++; 
                state.RecordEnemyDefeated("drone_" + enemiesKilled, "Drone", 150);
            });

            EventBus.Publish(GameEvents.ENEMY_DEFEATED, "drone_1");
            EventBus.Publish(GameEvents.ENEMY_DEFEATED, "drone_2");
            EventBus.Publish(GameEvents.ENEMY_DEFEATED, "drone_3");

            AssertTest(enemiesKilled == 3, "3 enemies recorded as defeated");
            AssertTest(state.EnemiesDefeated == 3, "GameState tracks 3 enemies defeated");
            AssertTest(state.Score == 450, "GameState score calculated accurately (3 * 150 = 450)");

            // 6. Mini-Boss Combat & Defeat
            Console.WriteLine("\n--- 6. Mini-Boss Combat & Power Awakening Trigger ---");
            HealthComponent bossHealth = new HealthComponent();
            bossHealth.Initialize(300f);

            bool bossDefeatedFired = false;
            EventBus.Subscribe(GameEvents.BOSS_DEFEATED, delegate(object payload) 
            { 
                bossDefeatedFired = true; 
                state.RecordEnemyDefeated("mini_boss_enforcer", "MiniBoss", 500);
            });

            // Lethal hit on boss
            bossHealth.TakeDamage(new DamageData(300f, DamageType.MELEE, null, UnityEngine.Vector3.zero));
            EventBus.Publish(GameEvents.BOSS_DEFEATED, "mini_boss_enforcer");

            AssertTest(bossDefeatedFired, "BOSS_DEFEATED event published and processed");
            AssertTest(state.Score == 950, "Score includes mini-boss reward (450 + 500 = 950)");

            // 7. Power Awakening Choice
            Console.WriteLine("\n--- 7. Power Awakening System & Ability Activation ---");
            state.SetPhase(GamePhase.POWER_AWAKENING);
            AssertTest(state.CurrentPhase == GamePhase.POWER_AWAKENING, "Phase transitioned to POWER_AWAKENING");

            // Unlock Destruction Nova
            state.UnlockPower("AGGRESSIVE", "Destruction Nova");
            AssertTest(state.PowerPath == "AGGRESSIVE", "Power path set to AGGRESSIVE");

            DestructionNovaAbility nova = new DestructionNovaAbility(new UnityEngine.GameObject());
            AssertTest(nova.AbilityId == "DESTRUCTION_NOVA", "Ability ID is DESTRUCTION_NOVA");
            AssertTest(nova.IsReady, "Destruction Nova starts ready");
            AssertTest(nova.CooldownDuration == 5.0f, "Destruction Nova cooldown duration is 5.0s");

            // 8. Level 2 Atlas Mirror Encounter
            Console.WriteLine("\n--- 8. Level 2 Atlas Boss State Machine ---");
            state.SetLevel(2, "Atlas Spire Lower Tier");
            state.SetPhase(GamePhase.LEVEL_2);
            AssertTest(state.CurrentPhase == GamePhase.LEVEL_2, "Phase transitioned to LEVEL_2");

            HeroAI heroAI = new HeroAI();
            AssertTest(heroAI.CurrentState == HeroState.OBSERVE, "Atlas AI starts in OBSERVE state");

            // Simulate combat confrontation
            heroAI.SetState(HeroState.CONFRONT);
            AssertTest(heroAI.CurrentState == HeroState.CONFRONT, "Atlas AI transitions to CONFRONT state");

            heroAI.SetState(HeroState.COUNTER);
            AssertTest(heroAI.CurrentState == HeroState.COUNTER, "Atlas AI transitions to COUNTER state");

            // 9. Final Moral Choice & Resolution
            Console.WriteLine("\n--- 9. Final Choice & Ending Telemetry ---");
            state.SetPhase(GamePhase.FINAL_CHOICE);
            AssertTest(state.CurrentPhase == GamePhase.FINAL_CHOICE, "Phase transitioned to FINAL_CHOICE");

            // Player chooses Hero alignment
            state.RecordChoice("CHOICE_FINAL", "opt_hero_alliance", 1, -20f, 30f, 10f, 0f);
            AssertTest(state.ChoicesMade == 1, "Choice count incremented to 1");
            AssertTest(state.Humanity == 80f, "Humanity increased to 80");

            state.SetEnding("HERO", 2000);
            AssertTest(state.Ending == "HERO", "Ending set to HERO");
            AssertTest(state.Score == 2950, "Final Authoritative Score: 2950 (950 gameplay + 2000 ending)");
            AssertTest(state.CurrentPhase == GamePhase.ENDING, "Phase transitioned to ENDING");

            // 10. Single EventBus Verification
            Console.WriteLine("\n--- 10. Single Architecture & EventBus Audit ---");
            AssertTest(EventBus.Instance != null, "EventBus.Instance accessible");
            EventBus.ClearAll();

            Console.WriteLine("\n==================================================");
            Console.WriteLine("RESULTS: " + _passed + " / " + _total + " PLAYABLE LOOP TESTS PASSED (" + ((_passed * 100) / _total) + "%)");
            Console.WriteLine("==================================================");

            return _passed == _total ? 0 : 1;
        }
    }
}
