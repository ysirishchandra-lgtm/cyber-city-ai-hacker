using System;
using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using UnityEngine.Playables;
using TMPro;
using Scar.Core;

namespace Scar.UI
{
    /// <summary>
    /// SCAR — The Last Choice
    /// CinematicTimelineManager: Orchestrates Timeline Playable Directors, cinematic camera cuts,
    /// and title overlays for key story beats (Prologue, Scar Awakening, Mini-Boss, Atlas Reveal, Endings).
    /// Author: Ashwidha (Visual / UI / Cinematic Lead)
    /// </summary>
    public class CinematicTimelineManager : MonoBehaviour
    {
        private static CinematicTimelineManager _instance;
        public static CinematicTimelineManager Instance 
        { 
            get { return _instance; } 
            private set { _instance = value; } 
        }

        [Header("Playable Directors (Optional Timeline Assets)")]
        [SerializeField] private PlayableDirector _prologueDirector;
        [SerializeField] private PlayableDirector _scarAwakeningDirector;
        [SerializeField] private PlayableDirector _miniBossDefeatDirector;
        [SerializeField] private PlayableDirector _finalBattleDirector;
        [SerializeField] private PlayableDirector _endingDirector;

        [Header("Cinematic Typography & Overlays")]
        [SerializeField] private GameObject _cinematicCanvas;
        [SerializeField] private CanvasGroup _cinematicFadeGroup;
        [SerializeField] private TextMeshProUGUI _cinematicHeadlineText;
        [SerializeField] private TextMeshProUGUI _cinematicSubheadText;
        [SerializeField] private GameObject _cinematicLetterboxBars;

        [Header("Tuning")]
        [SerializeField] private float _defaultFadeDuration = 1.2f;
        [SerializeField] private float _prologueDuration = 10f;

        private Coroutine _activeCinematicCoroutine;
        private bool _isPlayingCinematic = false;

        public bool IsPlayingCinematic 
        { 
            get { return _isPlayingCinematic; } 
            private set { _isPlayingCinematic = value; } 
        }

        private void Awake()
        {
            if (_instance != null && _instance != this)
            {
                Destroy(gameObject);
                return;
            }
            _instance = this;

            if (_cinematicCanvas != null) _cinematicCanvas.SetActive(true);
            if (_cinematicFadeGroup != null) _cinematicFadeGroup.alpha = 0f;
            if (_cinematicLetterboxBars != null) _cinematicLetterboxBars.SetActive(false);
        }

        private void OnEnable()
        {
            EventBus.Subscribe<GameEvents.PhaseChangedEvent>(OnPhaseChanged);
            EventBus.Subscribe<GameEvents.BossDefeatedEvent>(OnBossDefeated);
            EventBus.Subscribe<GameEvents.EndingReachedEvent>(OnEndingReached);
        }

        private void OnDisable()
        {
            EventBus.Unsubscribe<GameEvents.PhaseChangedEvent>(OnPhaseChanged);
            EventBus.Unsubscribe<GameEvents.BossDefeatedEvent>(OnBossDefeated);
            EventBus.Unsubscribe<GameEvents.EndingReachedEvent>(OnEndingReached);
        }

        private void OnPhaseChanged(GameEvents.PhaseChangedEvent e)
        {
            switch (e.NewPhase)
            {
                case GamePhase.PROLOGUE:
                    PlayPrologueSequence();
                    break;
                case GamePhase.LEVEL_1:
                    break;
                case GamePhase.FINAL_ENCOUNTER:
                    PlayAtlasRevealSequence();
                    break;
            }
        }

        private void OnBossDefeated(GameEvents.BossDefeatedEvent e)
        {
            PlayMiniBossDefeatSequence(e.BossId);
        }

        private void OnEndingReached(GameEvents.EndingReachedEvent e)
        {
            PlayEndingCinematic(e.EndingId);
        }

        // ─── Cinematic Sequences ───────────────────────────────────────────────────

        public void PlayPrologueSequence(Action onComplete = null)
        {
            if (_activeCinematicCoroutine != null) StopCoroutine(_activeCinematicCoroutine);
            _activeCinematicCoroutine = StartCoroutine(PrologueRoutine(onComplete));
        }

        private IEnumerator PrologueRoutine(Action onComplete)
        {
            IsPlayingCinematic = true;
            SetLetterbox(true);

            if (_prologueDirector != null)
            {
                _prologueDirector.Play();
            }

            // Panel 1: Black screen + First statement
            yield return StartCoroutine(FadeTo(1f, 0.6f));
            SetText("NEO-VERIDIA // SECTOR 4", "EVERYONE HAS A POWER.");
            yield return new WaitForSeconds(2.8f);

            // Panel 2: Dramatic pause
            SetText("THE PROMISE OF ASCENSION", "SOME CAN BEND LIGHT. OTHERS COMMAND GRAVITY.");
            yield return new WaitForSeconds(2.6f);

            // Panel 3: The Core Premise Hook
            SetText("THE EXCEPTION", "YOU HAVE ZERO.");
            yield return new WaitForSeconds(2.8f);

            // Fade out of text, reveal city
            yield return StartCoroutine(FadeTo(0f, 1.0f));
            ClearText();
            SetLetterbox(false);

            IsPlayingCinematic = false;
            if (onComplete != null) onComplete();

            // Advance automatically to Level 1 if in Prologue
            if (GameManager.Instance != null && GameManager.Instance.State != null && GameManager.Instance.State.CurrentPhase == GamePhase.PROLOGUE)
            {
                GameManager.Instance.AdvanceToLevel1();
            }
        }

        public void PlayScarAwakeningSequence(Action onComplete = null)
        {
            if (_activeCinematicCoroutine != null) StopCoroutine(_activeCinematicCoroutine);
            _activeCinematicCoroutine = StartCoroutine(ScarAwakeningRoutine(onComplete));
        }

        private IEnumerator ScarAwakeningRoutine(Action onComplete)
        {
            IsPlayingCinematic = true;
            SetLetterbox(true);

            if (_scarAwakeningDirector != null) _scarAwakeningDirector.Play();

            // Screen flash
            SetText("CRITICAL SURGE", "THE SCAR IGNITES.");
            yield return StartCoroutine(FadeTo(0.9f, 0.4f));
            yield return new WaitForSeconds(1.8f);

            SetText("SCAR — THE LAST CHOICE", "A POWER BORN FROM WHAT WAS TAKEN.");
            yield return new WaitForSeconds(2.2f);

            yield return StartCoroutine(FadeTo(0f, 0.8f));
            ClearText();
            SetLetterbox(false);

            IsPlayingCinematic = false;
            if (onComplete != null) onComplete();
        }

        public void PlayMiniBossDefeatSequence(string bossName, Action onComplete = null)
        {
            if (_miniBossDefeatDirector != null) _miniBossDefeatDirector.Play();
            string sub = (bossName != null ? bossName.ToUpper() : "TARGET") + " NEUTRALIZED";
            StartCoroutine(FlashTextRoutine("THREAT ELIMINATED", sub, 2.2f, onComplete));
        }

        public void PlayAtlasRevealSequence(Action onComplete = null)
        {
            if (_finalBattleDirector != null) _finalBattleDirector.Play();
            StartCoroutine(FlashTextRoutine("ATLAS — THE PRODIGY", "THE ARCHITECT OF ORDER HAS ARRIVED.", 3.0f, onComplete));
        }

        public void PlayEndingCinematic(string endingId, Action onComplete = null)
        {
            if (_endingDirector != null) _endingDirector.Play();
            StartCoroutine(EndingRoutine(endingId, onComplete));
        }

        private IEnumerator EndingRoutine(string endingId, Action onComplete)
        {
            IsPlayingCinematic = true;
            SetLetterbox(true);

            yield return StartCoroutine(FadeTo(1f, 1.2f));

            string headline = "ENDING // " + (endingId != null ? endingId.ToUpper() : "UNKNOWN");
            string subtext = GetEndingSubtext(endingId);
            SetText(headline, subtext);

            yield return new WaitForSeconds(4.0f);

            ClearText();
            SetLetterbox(false);
            IsPlayingCinematic = false;
            if (onComplete != null) onComplete();
        }

        private IEnumerator FlashTextRoutine(string headline, string subhead, float duration, Action onComplete)
        {
            SetText(headline, subhead);
            yield return StartCoroutine(FadeTo(0.8f, 0.3f));
            yield return new WaitForSeconds(duration);
            yield return StartCoroutine(FadeTo(0f, 0.5f));
            ClearText();
            if (onComplete != null) onComplete();
        }

        // ─── Helpers ───────────────────────────────────────────────────────────────

        private void SetText(string headline, string subhead)
        {
            if (_cinematicHeadlineText != null) _cinematicHeadlineText.text = headline;
            if (_cinematicSubheadText != null) _cinematicSubheadText.text = subhead;
        }

        private void ClearText()
        {
            if (_cinematicHeadlineText != null) _cinematicHeadlineText.text = string.Empty;
            if (_cinematicSubheadText != null) _cinematicSubheadText.text = string.Empty;
        }

        private void SetLetterbox(bool active)
        {
            if (_cinematicLetterboxBars != null) _cinematicLetterboxBars.SetActive(active);
        }

        private IEnumerator FadeTo(float targetAlpha, float duration)
        {
            if (_cinematicFadeGroup == null) yield break;

            float startAlpha = _cinematicFadeGroup.alpha;
            float elapsed = 0f;

            while (elapsed < duration)
            {
                elapsed += Time.deltaTime;
                _cinematicFadeGroup.alpha = Mathf.Lerp(startAlpha, targetAlpha, elapsed / duration);
                yield return null;
            }
            _cinematicFadeGroup.alpha = targetAlpha;
        }

        private string GetEndingSubtext(string endingId)
        {
            if (endingId == null) return "The choice has been made. Neo-Veridia will never be the same.";
            switch (endingId.ToUpper())
            {
                case "VILLAIN": return "You took their power and burned their order to the ground. Fear is the only law now.";
                case "HERO": return "You took the burden upon your own shoulders. A solitary guardian in the neon dark.";
                case "SAVIOR": return "You dismantled the hierarchy and shared power with everyone. Freedom belongs to the city.";
                case "HUMAN": return "You rejected superpowers entirely. Proving that true strength never required a spark.";
                default: return "The choice has been made. Neo-Veridia will never be the same.";
            }
        }
    }
}
