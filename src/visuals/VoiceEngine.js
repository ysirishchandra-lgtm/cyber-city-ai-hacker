/**
 * SCAR — THE LAST CHOICE
 * VoiceEngine.js — Neural Cyberpunk Speech & Voiceover Synthesis Engine
 * Author: Ashwidha (Visual / Audio Lead)
 *
 * Provides real-time spoken dialogue, cinematic voiceovers, and tactical comms audio:
 * - Narrator: Deep, atmospheric cinematic voice for prologue & endings.
 * - Atlas: Imposing, resonant cyber-commander speech.
 * - Informant Kira: Fast, filtered tactical radio comms.
 * - Protagonist: Gritty, determined vocalizations & power shout.
 */

import { audioEngine } from './AudioEngine.js';

export class VoiceEngine {
  constructor() {
    this.synth = typeof window !== 'undefined' ? window.speechSynthesis : null;
    this.voices = [];
    this.enabled = true;
    this.currentUtterance = null;
    this._initVoices();
  }

  _initVoices() {
    if (!this.synth) return;
    const loadVoices = () => {
      this.voices = this.synth.getVoices();
    };
    loadVoices();
    if (this.synth.onvoiceschanged !== undefined) {
      this.synth.onvoiceschanged = loadVoices;
    }
  }

  speak(text, speaker = 'NARRATOR', onEnd = null) {
    if (!this.synth || !this.enabled || !text) {
      if (onEnd) onEnd();
      return;
    }

    try {
      this.synth.cancel(); // Cancel any ongoing line

      const utterance = new SpeechSynthesisUtterance(text);
      this.currentUtterance = utterance;

      // Select voice profile
      const voiceConfig = this._getVoiceConfig(speaker);
      utterance.pitch = voiceConfig.pitch;
      utterance.rate = voiceConfig.rate;
      utterance.volume = voiceConfig.volume;

      // Assign matching voice if available
      if (this.voices.length > 0) {
        const preferredVoice = this.voices.find(v =>
          voiceConfig.gender === 'female'
            ? v.name.toLowerCase().includes('female') || v.name.toLowerCase().includes('zira') || v.name.toLowerCase().includes('samantha')
            : v.name.toLowerCase().includes('david') || v.name.toLowerCase().includes('mark') || v.name.toLowerCase().includes('male') || v.lang.startsWith('en')
        );
        if (preferredVoice) utterance.voice = preferredVoice;
      }

      // Audio chirps for radio comms
      if (speaker === 'INFORMANT KIRA' || speaker === 'TACTICAL') {
        audioEngine.playDialogueBlip();
      }

      utterance.onend = () => {
        this.currentUtterance = null;
        if (onEnd) onEnd();
      };

      utterance.onerror = () => {
        this.currentUtterance = null;
        if (onEnd) onEnd();
      };

      this.synth.speak(utterance);
    } catch (e) {
      console.warn('[VoiceEngine] Voice synthesis error:', e);
      if (onEnd) onEnd();
    }
  }

  stop() {
    if (this.synth) {
      try {
        this.synth.cancel();
      } catch (e) {}
    }
  }

  _getVoiceConfig(speaker) {
    switch (speaker) {
      case 'ATLAS':
      case 'ATLAS — THE PRODIGY':
        return { pitch: 0.75, rate: 0.95, volume: 1.0, gender: 'male' };
      case 'INFORMANT KIRA':
      case 'KIRA':
        return { pitch: 1.25, rate: 1.15, volume: 0.95, gender: 'female' };
      case 'PLAYER':
      case 'PROTAGONIST':
        return { pitch: 0.9, rate: 1.0, volume: 1.0, gender: 'male' };
      case 'INNER VOICE':
        return { pitch: 0.65, rate: 0.88, volume: 0.9, gender: 'male' };
      default: // NARRATOR
        return { pitch: 0.82, rate: 0.92, volume: 1.0, gender: 'male' };
    }
  }
}

export const voiceEngine = new VoiceEngine();
