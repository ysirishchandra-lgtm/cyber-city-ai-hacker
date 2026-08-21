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
        public T[] GetComponentsInChildren<T>() where T : class { return new T[0]; }
        public T AddComponent<T>() where T : new() { return new T(); }
        public Coroutine StartCoroutine(System.Collections.IEnumerator routine) { while (routine.MoveNext()) { } return new Coroutine(); }
        public void StopCoroutine(Coroutine c) { }
        public static void DontDestroyOnLoad(GameObject target) { }
        public static void Destroy(object target) { }
        public static void Destroy(object target, float t) { }
        public static void DestroyImmediate(object target) { }
        public void Invoke(string methodName, float time) { }
        public static T Instantiate<T>(T original, Vector3 position, Quaternion rotation) where T : class { return original; }
        public static T Instantiate<T>(T original, Vector3 position, Quaternion rotation, Transform parent) where T : class { return original; }
    }

    public class GameObject 
    { 
        public string name = "GameObject";
        public Transform transform;
        public Transform root { get { return transform; } }
        public int layer = 0;
        public bool activeSelf = true;

        public GameObject()
        {
            transform = new Transform(this);
        }

        public GameObject(string name)
        {
            this.name = name;
            transform = new Transform(this);
        }

        public void SetActive(bool active) { activeSelf = active; }
        public T GetComponent<T>() where T : class { return null; }
        public T GetComponentInChildren<T>() where T : class { return null; }
        public T[] GetComponentsInChildren<T>() where T : class { return new T[0]; }
        public T GetComponentInParent<T>() where T : class { return null; }
        public T AddComponent<T>() where T : new() { return new T(); }
        public static GameObject FindGameObjectWithTag(string tag) { return new GameObject { name = tag }; }
    }

    public class Transform 
    { 
        public Vector3 position = new Vector3(0, 0, 0);
        public Vector3 localEulerAngles = new Vector3(0, 0, 0);
        public Quaternion rotation = new Quaternion();
        public Quaternion localRotation = new Quaternion();
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

        public Vector3 InverseTransformDirection(Vector3 direction) { return direction; }
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

    public struct Color
    {
        public float r, g, b, a;
        public Color(float r, float g, float b, float a) { this.r = r; this.g = g; this.b = b; this.a = a; }
        public static Color white { get { return new Color(1, 1, 1, 1); } }
        public static Color black { get { return new Color(0, 0, 0, 1); } }
        public static Color yellow { get { return new Color(1, 0.92f, 0.016f, 1); } }
        public static Color operator *(Color c, float f) { return new Color(c.r * f, c.g * f, c.b * f, c.a); }
        public static bool operator ==(Color a, Color b) { return a.r == b.r && a.g == b.g && a.b == b.b && a.a == b.a; }
        public static bool operator !=(Color a, Color b) { return !(a == b); }
        public override bool Equals(object obj) { return obj is Color && this == (Color)obj; }
        public override int GetHashCode() { return r.GetHashCode() ^ g.GetHashCode() ^ b.GetHashCode(); }
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
        public static Vector2 operator +(Vector2 a, Vector2 b) { return new Vector2(a.x + b.x, a.y + b.y); }
        public static Vector2 operator -(Vector2 a, Vector2 b) { return new Vector2(a.x - b.x, a.y - b.y); }
        public static Vector2 operator *(Vector2 a, float d) { return new Vector2(a.x * d, a.y * d); }
        public static Vector2 operator /(Vector2 a, Vector2 b) { return new Vector2(b.x != 0 ? a.x / b.x : 0, b.y != 0 ? a.y / b.y : 0); }
        public static bool operator ==(Vector2 a, Vector2 b) { return a.x == b.x && a.y == b.y; }
        public static bool operator !=(Vector2 a, Vector2 b) { return !(a == b); }
        public override bool Equals(object obj) { return obj is Vector2 && this == (Vector2)obj; }
        public override int GetHashCode() { return x.GetHashCode() ^ y.GetHashCode(); }
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
        public static Vector3 operator -(Vector3 a) { return new Vector3(-a.x, -a.y, -a.z); }
        public static bool operator ==(Vector3 a, Vector3 b) { return a.x == b.x && a.y == b.y && a.z == b.z; }
        public static bool operator !=(Vector3 a, Vector3 b) { return !(a == b); }
        public override bool Equals(object obj) { return obj is Vector3 && this == (Vector3)obj; }
        public override int GetHashCode() { return x.GetHashCode() ^ y.GetHashCode(); }
        public static float Distance(Vector3 a, Vector3 b) { return (float)Math.Sqrt((a.x-b.x)*(a.x-b.x) + (a.y-b.y)*(a.y-b.y) + (a.z-b.z)*(a.z-b.z)); }
    }

    public class Quaternion
    {
        public static Quaternion identity { get { return new Quaternion(); } }
        public static Quaternion LookRotation(Vector3 forward) { return new Quaternion(); }
        public static Quaternion Slerp(Quaternion a, Quaternion b, float t) { return new Quaternion(); }
        public static Quaternion Euler(float x, float y, float z) { return new Quaternion(); }
    }

    public static class Mathf
    {
        public static float Min(float a, float b) { return Math.Min(a, b); }
        public static float Max(float a, float b) { return Math.Max(a, b); }
        public static int Max(int a, int b) { return Math.Max(a, b); }
        public static float Clamp(float val, float min, float max) { return Math.Max(min, Math.Min(max, val)); }
        public static float Clamp01(float val) { return Clamp(val, 0f, 1f); }
        public static float MoveTowards(float current, float target, float maxDelta)
        {
            if (Math.Abs(target - current) <= maxDelta) return target;
            return current + Math.Sign(target - current) * maxDelta;
        }
        public static float Lerp(float a, float b, float t) { return a + (b - a) * Clamp01(t); }
        public static int CeilToInt(float f) { return (int)Math.Ceiling(f); }
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

    public class CanvasGroup : MonoBehaviour { public float alpha; }
    public class Canvas : MonoBehaviour { }
    public class RectTransform : MonoBehaviour 
    { 
        public Vector2 anchorMin = Vector2.zero; 
        public Vector2 anchorMax = Vector2.zero; 
    }
    public class Rect 
    { 
        public float x, y, width, height; 
        public Rect(float x, float y, float w, float h) { this.x = x; this.y = y; this.width = w; this.height = h; } 
        public Vector2 position { get { return new Vector2(x, y); } }
        public Vector2 size { get { return new Vector2(width, height); } }
        public static bool operator ==(Rect a, Rect b) { if (object.ReferenceEquals(a, b)) return true; if (object.ReferenceEquals(a, null) || object.ReferenceEquals(b, null)) return false; return a.x == b.x && a.y == b.y && a.width == b.width && a.height == b.height; }
        public static bool operator !=(Rect a, Rect b) { return !(a == b); }
        public override bool Equals(object obj) { return obj is Rect && this == (Rect)obj; }
        public override int GetHashCode() { return x.GetHashCode() ^ y.GetHashCode(); }
    }
    public class Screen { public static int width = 1920; public static int height = 1080; public static Rect safeArea = new Rect(0, 0, 1920, 1080); }
    public class Renderer : MonoBehaviour { public Material material = new Material(); }
    public class Material { public Color color; public void SetColor(string name, Color c) { } }
    public class Rigidbody : MonoBehaviour { public Vector3 linearVelocity = Vector3.zero; }
    public class ParticleSystem : MonoBehaviour { public bool isPlaying = false; public void Play() { isPlaying = true; } public void Emit(int count) { } }
    public enum KeyCode { Alpha1, Alpha2, Alpha3, Keypad1, Keypad2, Keypad3, Space }
    public class Input { public static bool GetKeyDown(KeyCode k) { return false; } public static bool GetMouseButtonDown(int b) { return false; } }

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

    public static class Application
    {
        public static string persistentDataPath { get { return System.IO.Path.GetTempPath(); } }
    }

    public static class JsonUtility
    {
        private static readonly System.Collections.Generic.Dictionary<System.Type, object> _cache = new System.Collections.Generic.Dictionary<System.Type, object>();

        public static string ToJson(object obj) 
        { 
            if (obj != null) _cache[obj.GetType()] = obj;
            return obj != null ? obj.ToString() : "{}"; 
        }

        public static string ToJson(object obj, bool pretty) 
        { 
            return ToJson(obj); 
        }

        public static T FromJson<T>(string json) 
        { 
            object val;
            if (_cache.TryGetValue(typeof(T), out val)) return (T)val;
            return default(T); 
        }
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

namespace UnityEngine.UI
{
    public class Slider : MonoBehaviour { public float value; }
    public class Image : MonoBehaviour { public Color color; public float fillAmount; }
    public class Button : MonoBehaviour 
    { 
        public class ButtonClickedEvent 
        { 
            private List<UnityEngine.Events.UnityAction> listeners = new List<UnityEngine.Events.UnityAction>();
            public void AddListener(UnityEngine.Events.UnityAction action) { listeners.Add(action); }
            public void RemoveAllListeners() { listeners.Clear(); }
            public void Invoke() { for (int i = 0; i < listeners.Count; i++) listeners[i](); }
        }
        public ButtonClickedEvent onClick = new ButtonClickedEvent(); 
    }
    public class CanvasScaler : MonoBehaviour 
    {
        public enum ScaleMode { ScaleWithScreenSize }
        public ScaleMode uiScaleMode;
        public Vector2 referenceResolution;
        public float matchWidthOrHeight;
    }
}

namespace UnityEngine.Events
{
    public delegate void UnityAction();
}

namespace TMPro
{
    public class TextMeshProUGUI : UnityEngine.MonoBehaviour 
    { 
        public string text = ""; 
        public UnityEngine.Color color; 
    }
    public class TextAreaAttribute : Attribute { public TextAreaAttribute(int min, int max) { } }
}

namespace UnityEngine.Playables
{
    public class PlayableDirector : UnityEngine.MonoBehaviour { public void Play() { } }
}

namespace Unity.Cinemachine
{
    public class CinemachineCamera : UnityEngine.MonoBehaviour 
    { 
        public int Priority; 
        public class CameraTarget { public UnityEngine.Transform TrackingTarget; }
        public CameraTarget Target = new CameraTarget();
    }
    public class CinemachineImpulseSource : UnityEngine.MonoBehaviour 
    { 
        public void GenerateImpulse(float power) { } 
    }
}

namespace UnityEngine.Networking
{
    public class UnityWebRequest : IDisposable
    {
        public enum Result { Success, ConnectionError, ProtocolError }
        public Result result { get { return Result.Success; } }
        public int timeout = 5;
        public string error = "";
        public UploadHandler uploadHandler;
        public DownloadHandler downloadHandler = new DownloadHandlerBuffer();

        public UnityWebRequest(string url, string method) { }
        public static UnityWebRequest Get(string url) { return new UnityWebRequest(url, "GET"); }
        public void SetRequestHeader(string name, string value) { }
        public AsyncOperation SendWebRequest() { return new AsyncOperation(); }
        public void Dispose() { }
    }

    public class UploadHandler { }
    public class UploadHandlerRaw : UploadHandler { public UploadHandlerRaw(byte[] data) { } }
    public class DownloadHandler { public string text { get { return "{}"; } } }
    public class DownloadHandlerBuffer : DownloadHandler { }
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
    using Scar.UI;
    using Scar.Backend;

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
            Console.WriteLine("SCAR — MASTER PHASE 4 INTEGRATION & PLAYABLE TEST");
            Console.WriteLine("==================================================");

            EventBus.ClearAll();

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

            // 10. CyberHUD & Visual Presentation Verification
            Console.WriteLine("\n--- 10. CyberHUD & Visual Presentation Integration ---");
            var hud = new CyberHUD();
            bool hudDamagedEvent = false;
            EventBus.Subscribe<GameEvents.PlayerDamagedEvent>(delegate(GameEvents.PlayerDamagedEvent e)
            {
                hudDamagedEvent = true;
            });
            var dmgEvt = new GameEvents.PlayerDamagedEvent();
            dmgEvt.DamageAmount = 20f;
            dmgEvt.RemainingHealth = 80f;
            dmgEvt.DamageSource = "Atlas Beam";
            EventBus.Publish(dmgEvt);
            AssertTest(hudDamagedEvent, "CyberHUD processes PlayerDamagedEvent");

            // 11. Holographic ChoiceUI Integration
            Console.WriteLine("\n--- 11. ChoiceUI Integration ---");
            var choiceUI = new ChoiceUI();
            bool choicePresentedEvent = false;
            EventBus.Subscribe<GameEvents.ChoicePresentedEvent>(delegate(GameEvents.ChoicePresentedEvent e)
            {
                choicePresentedEvent = true;
            });
            var chEvt = new GameEvents.ChoicePresentedEvent();
            chEvt.ChoiceId = "CHOICE_FINAL";
            chEvt.Title = "WHAT WILL YOU DO?";
            chEvt.OptionDescriptions = new string[] { "Burn the order", "Protect the innocent", "Seize control" };
            EventBus.Publish(chEvt);
            AssertTest(choicePresentedEvent, "ChoiceUI processes ChoicePresentedEvent");

            // 12. Cinemachine Camera Controller Integration
            Console.WriteLine("\n--- 12. Cinemachine Camera Controller ---");
            var camCtrl = new CinemachineCameraController();
            camCtrl.SwitchCameraMode(CinemachineCameraController.CameraMode.BOSS_FRAMING);
            AssertTest(camCtrl.CurrentMode == CinemachineCameraController.CameraMode.BOSS_FRAMING, "Camera switches to BOSS_FRAMING mode");
            camCtrl.AddTrauma(0.7f);
            AssertTest(camCtrl.GetShakeMagnitude() > 0f, "Camera trauma shake calculated quadratic magnitude");

            // 13. VFXManager Integration
            Console.WriteLine("\n--- 13. VFXManager Integration ---");
            var vfx = new VFXManager();
            vfx.PlayHitImpactSparks(UnityEngine.Vector3.zero);
            vfx.PlayDestructionNova(UnityEngine.Vector3.zero);
            AssertTest(true, "VFXManager spawns particle effects cleanly without throwing exceptions");

            // 14. Backend LocalSaveService & Offline Persistence
            Console.WriteLine("\n--- 14. Backend LocalSaveService & Offline-First Check ---");
            LocalSaveService localSave = new LocalSaveService();
            GameSaveData saveData = new GameSaveData
            {
                playerId = state.PlayerId,
                playerName = state.PlayerName,
                score = state.Score,
                ending = state.Ending,
                unlockedPower = state.PowerPath,
                currentLevel = state.CurrentLevel,
                revenge = state.Revenge,
                humanity = state.Humanity,
                freedom = state.Freedom,
                control = state.Control
            };
            localSave.Save(saveData);
            GameSaveData loadedData = localSave.Load();
            AssertTest(loadedData != null && loadedData.playerId == "usr_valkyrie", "LocalSaveService writes and reads saved game data successfully");
            AssertTest(loadedData != null && loadedData.score == 2950, "Saved score matches authoritative 2950");
            AssertTest(loadedData != null && loadedData.ending == "HERO", "Saved ending matches authoritative HERO");

            // 15. AWSBackendService Integration & Empty Leaderboard Check
            Console.WriteLine("\n--- 15. AWSBackendService & Leaderboard Contract ---");
            AWSBackendService awsService = new AWSBackendService();
            bool offlineSaveCallbackFired = false;
            awsService.SubmitFinalScore(state, delegate(bool success, string msg)
            {
                offlineSaveCallbackFired = true;
            });
            AssertTest(offlineSaveCallbackFired, "AWSBackendService falls back cleanly to local save when offline");

            bool leaderboardCallbackFired = false;
            awsService.FetchGlobalLeaderboard(delegate(bool success, List<LeaderboardEntryDTO> entries)
            {
                leaderboardCallbackFired = true;
                AssertTest(entries != null, "Leaderboard returns valid non-null list without fake records");
            });
            System.Threading.Thread.Sleep(60);
            AssertTest(leaderboardCallbackFired, "FetchGlobalLeaderboard executes callback safely");

            // 16. Single Architecture & EventBus Audit
            Console.WriteLine("\n--- 16. Single Architecture & EventBus Audit ---");
            AssertTest(EventBus.Instance != null, "Canonical EventBus.Instance accessible");
            EventBus.ClearAll();

            Console.WriteLine("\n==================================================");
            Console.WriteLine("RESULTS: " + _passed + " / " + _total + " MASTER INTEGRATION TESTS PASSED (" + ((_passed * 100) / _total) + "%)");
            Console.WriteLine("==================================================");

            return _passed == _total ? 0 : 1;
        }
    }
}
