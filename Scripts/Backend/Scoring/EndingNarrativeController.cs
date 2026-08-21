using System;
using System.Collections;
using UnityEngine;
using GameHack.Backend;
using GameHack.Backend.Boss;
using GameHack.Backend.Scoring;
using GameHack.Backend.Characters;

namespace GameHack.Backend.Scoring
{
    /// <summary>
    /// Level 3 Ending State Machine for SCAR — BECOME.
    ///
    /// Listens to AdaptiveBossController3D.OnBossDefeated, locks player movement,
    /// and presents the 3-choice ending resolution:
    ///
    ///   DESTROY     — Obliterate the villain's legacy. (Vengeance path, high score bonus)
    ///   TAKE CONTROL — Seize the organization's tech. (Unlocks villain NG+ abilities)
    ///   BECOME      — Ascend beyond the cycle. (True ending cinematic)
    ///
    /// Records the full run into a GameSummaryPayload on resolution.
    /// All triggers are event-driven for Frontend/Cinematic/Audio subscribers.
    /// </summary>
    public class EndingNarrativeController : MonoBehaviour
    {
        // ─── Events ───────────────────────────────────────────────────────────
        public event Action                         OnPostVictoryStateEntered;
        public event Action<EndingChoice[]>         OnChoicesPresented;         // show 3 options to UI
        public event Action<EndingChoice>           OnChoiceSelected;
        public event Action<EndingChoice>           OnEndingCinematicTriggered;
        public event Action<GameSummaryPayload>     OnRunSummaryReady;          // pass stats to backend/cloud
        public event Action                         OnNewGamePlusUnlocked;      // TAKE CONTROL path

        // ─── Inspector: Dependencies ──────────────────────────────────────────
        [Header("Scene References")]
        [SerializeField] private AdaptiveBossController3D _bossController;
        [SerializeField] private PlayerStatsManager       _playerStats;
        [SerializeField] private GameStateController      _gameState;
        [SerializeField] private StyleRatingSystem        _styleSystem;
        [SerializeField] private AdaptiveCombatTelemetry  _telemetry;
        [SerializeField] private CharacterArchetypeManager _archetypeManager;

        [Header("Timing")]
        [SerializeField] private float _victoryFreezeDelay   = 1.2f;  // cinematic pause before choices
        [SerializeField] private float _choiceExpiryDuration = 30f;   // auto-select BECOME if no input

        [Header("Score Bonuses")]
        [SerializeField] private int _destroyScoreBonus      = 5000;
        [SerializeField] private int _takeControlScoreBonus  = 2500;
        [SerializeField] private int _becomeScoreBonus       = 8000; // true ending bonus

        // ─── Runtime State ────────────────────────────────────────────────────
        private bool          _endingActive;
        private bool          _choiceMade;
        private EndingChoice  _resolvedChoice;
        private float         _runStartTime;
        private float         _totalDamageTaken;

        // The 3 canonical endings
        private static readonly EndingChoice[] Choices =
        {
            new EndingChoice
            {
                ID          = "DESTROY",
                DisplayName = "DESTROY",
                Subtitle    = "Obliterate the villain's legacy and power network.",
                Path        = EndingPath.Vengeance,
                Emoji       = "💥"
            },
            new EndingChoice
            {
                ID          = "TAKE_CONTROL",
                DisplayName = "TAKE CONTROL",
                Subtitle    = "Seize the organization's resources and technology.",
                Path        = EndingPath.Dominion,
                Emoji       = "👑"
            },
            new EndingChoice
            {
                ID          = "BECOME",
                DisplayName = "BECOME",
                Subtitle    = "Ascend beyond the cycle. Reject both villain and ordinary status.",
                Path        = EndingPath.Transcendence,
                Emoji       = "✨"
            }
        };

        // ─────────────────────────────────────────────────────────────────────

        private void Awake()
        {
            _runStartTime = Time.time;

            // Subscribe to boss defeat event
            if (_bossController != null)
                _bossController.OnBossDefeated += HandleBossDefeated;

            // Track total damage received
            if (_playerStats != null)
                _playerStats.OnHealthChanged += TrackDamageTaken;
        }

        private void OnDestroy()
        {
            if (_bossController != null)
                _bossController.OnBossDefeated -= HandleBossDefeated;

            if (_playerStats != null)
                _playerStats.OnHealthChanged -= TrackDamageTaken;
        }

        // ─── Boss Defeat Handler ──────────────────────────────────────────────

        private void HandleBossDefeated(BossPhase phaseAtDefeat)
        {
            if (_endingActive) return;
            _endingActive = true;

            Debug.Log($"[Ending] Boss defeated at {phaseAtDefeat}. Entering post-victory state.");
            StartCoroutine(PostVictorySequence());
        }

        private IEnumerator PostVictorySequence()
        {
            // Brief cinematic pause
            yield return new WaitForSeconds(_victoryFreezeDelay);

            // Lock player movement
            _playerStats?.TransitionState(PlayerState.Stunned);

            OnPostVictoryStateEntered?.Invoke();

            // Present the 3 choices to the UI
            OnChoicesPresented?.Invoke(Choices);

            // Start auto-select timer
            StartCoroutine(ChoiceExpiryTimer());
        }

        private IEnumerator ChoiceExpiryTimer()
        {
            yield return new WaitForSeconds(_choiceExpiryDuration);

            // If player hasn't chosen, auto-select BECOME (true ending)
            if (!_choiceMade)
            {
                Debug.Log("[Ending] Choice window expired — auto-selecting BECOME.");
                SelectEnding("BECOME");
            }
        }

        // ─── Public Choice API ────────────────────────────────────────────────

        /// <summary>
        /// Called by UI when the player selects an ending.
        /// Pass the ending ID: "DESTROY", "TAKE_CONTROL", or "BECOME".
        /// </summary>
        public void SelectEnding(string endingID)
        {
            if (_choiceMade) return;

            EndingChoice? match = null;
            foreach (var c in Choices)
                if (c.ID == endingID) { match = c; break; }

            if (match == null)
            {
                Debug.LogError($"[Ending] Unknown ending ID: {endingID}");
                return;
            }

            _choiceMade      = true;
            _resolvedChoice  = match.Value;

            OnChoiceSelected?.Invoke(_resolvedChoice);
            StartCoroutine(ResolveEnding(_resolvedChoice));
        }

        private IEnumerator ResolveEnding(EndingChoice choice)
        {
            Debug.Log($"[Ending] Resolving: {choice.DisplayName} ({choice.Path})");

            // Apply path-specific effects
            switch (choice.Path)
            {
                case EndingPath.Vengeance:
                    _gameState?.AddBonusScore(_destroyScoreBonus);
                    break;

                case EndingPath.Dominion:
                    _gameState?.AddBonusScore(_takeControlScoreBonus);
                    OnNewGamePlusUnlocked?.Invoke();
                    break;

                case EndingPath.Transcendence:
                    _gameState?.AddBonusScore(_becomeScoreBonus);
                    break;
            }

            // Assemble and fire the run summary
            GameSummaryPayload summary = BuildSummary(choice);
            OnRunSummaryReady?.Invoke(summary);

            // Brief pause before cinematic
            yield return new WaitForSeconds(0.5f);

            OnEndingCinematicTriggered?.Invoke(choice);
            Debug.Log($"[Ending] Cinematic triggered: {choice.DisplayName}");
        }

        // ─── Run Summary Builder ──────────────────────────────────────────────

        private GameSummaryPayload BuildSummary(EndingChoice choice)
        {
            float totalTime   = Time.time - _runStartTime;
            StyleRank maxRank = _styleSystem != null ? _styleSystem.PeakRank : StyleRank.D;
            int totalScore    = _gameState  != null ? _gameState.TotalScore  : 0;
            int styleScore    = _styleSystem != null ? _styleSystem.TotalScore : 0;

            BehaviorProfile profile = _telemetry != null
                ? _telemetry.GetCurrentProfile()
                : new BehaviorProfile();

            CharacterArchetype archetype = _archetypeManager != null
                ? _archetypeManager.CurrentArchetype
                : CharacterArchetype.SCAR;

            return new GameSummaryPayload
            {
                RunDurationSeconds    = totalTime,
                TotalDamageTaken      = _totalDamageTaken,
                FinalScore            = totalScore,
                StyleScore            = styleScore,
                MaxStyleRank          = maxRank,
                MaxStyleRankLabel     = maxRank.ToString(),
                PlaystyleProfileHash  = profile.ToHashString(),
                DominantCombatStyle   = profile.DominantStyle.ToString(),
                SelectedEnding        = choice.ID,
                EndingPath            = choice.Path,
                CharacterUsed         = archetype,
                Timestamp             = System.DateTime.UtcNow.ToString("o")
            };
        }

        private void TrackDamageTaken(float currentHP, float maxHP)
        {
            // Infer damage from health delta (stateless — best-effort)
            float prevHP = currentHP + Time.deltaTime * 100f; // approximate
            float delta  = prevHP - currentHP;
            if (delta > 0f) _totalDamageTaken += delta;
        }

        // ─── Accessors ────────────────────────────────────────────────────────

        public bool          EndingActive    => _endingActive;
        public bool          ChoiceMade      => _choiceMade;
        public EndingChoice  ResolvedChoice  => _resolvedChoice;

        /// <summary>Read-only reference to the 3 available ending choices.</summary>
        public static EndingChoice[] AvailableChoices => Choices;
    }

    // ─── Data Structures ──────────────────────────────────────────────────────

    [Serializable]
    public struct EndingChoice
    {
        public string      ID;
        public string      DisplayName;
        public string      Subtitle;
        public string      Emoji;
        public EndingPath  Path;
    }

    public enum EndingPath
    {
        Vengeance,      // DESTROY
        Dominion,       // TAKE CONTROL
        Transcendence   // BECOME
    }

    [Serializable]
    public struct GameSummaryPayload
    {
        // ── Time & Survival ───────────────────────────────────────────────────
        public float  RunDurationSeconds;
        public float  TotalDamageTaken;

        // ── Score ─────────────────────────────────────────────────────────────
        public int    FinalScore;
        public int    StyleScore;
        public StyleRank MaxStyleRank;
        public string MaxStyleRankLabel;

        // ── Playstyle ─────────────────────────────────────────────────────────
        public string PlaystyleProfileHash;    // from BehaviorProfile.ToHashString()
        public string DominantCombatStyle;     // e.g., "MeleeHeavy"

        // ── Ending ────────────────────────────────────────────────────────────
        public string           SelectedEnding;   // "DESTROY" / "TAKE_CONTROL" / "BECOME"
        public EndingPath       EndingPath;

        // ── Meta ──────────────────────────────────────────────────────────────
        public CharacterArchetype CharacterUsed;
        public string             Timestamp;       // ISO 8601

        public override string ToString() =>
            $"[{SelectedEnding}] Char={CharacterUsed} Score={FinalScore} " +
            $"Style={MaxStyleRankLabel} Time={RunDurationSeconds:F1}s " +
            $"Dmg={TotalDamageTaken:F0} Style={PlaystyleProfileHash}";
    }
}
