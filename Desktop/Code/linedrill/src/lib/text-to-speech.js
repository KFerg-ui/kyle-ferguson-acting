/**
 * Text-to-Speech — SpeechSynthesis wrapper for reading partner lines aloud.
 */

export function isSpeechSynthesisSupported() {
  return typeof window !== "undefined" && "speechSynthesis" in window;
}

export class TextToSpeech {
  constructor({ lang = "en-US", rate = 0.95, pitch = 1.0 } = {}) {
    this._lang = lang;
    this._rate = rate;
    this._pitch = pitch;
    this._voice = null;
    this._ready = false;
    this._initVoice();
  }

  _initVoice() {
    if (!isSpeechSynthesisSupported()) return;

    const pick = () => {
      const voices = speechSynthesis.getVoices();
      if (!voices.length) return;

      // Prefer high-quality local English voices
      const english = voices.filter((v) => v.lang.startsWith("en"));
      const local = english.filter((v) => v.localService);
      const preferred = ["samantha", "daniel", "karen", "moira", "alex"];

      this._voice =
        local.find((v) => preferred.some((p) => v.name.toLowerCase().includes(p))) ||
        local[0] ||
        english[0] ||
        voices[0];
      this._ready = true;
    };

    pick();
    if (!this._ready) {
      speechSynthesis.addEventListener("voiceschanged", pick, { once: true });
      // Fallback if voiceschanged never fires
      setTimeout(() => { if (!this._ready) pick(); }, 2000);
    }
  }

  /** Speak text. Returns a Promise that resolves when the utterance finishes.
   *  Optional overrides: { voice: SpeechSynthesisVoice, pitch: number } */
  speak(text, { voice = null, pitch = null } = {}) {
    return new Promise((resolve, reject) => {
      if (!isSpeechSynthesisSupported()) { resolve(); return; }

      // Chrome workaround: cancel before speaking to avoid stuck queue
      speechSynthesis.cancel();

      const utt = new SpeechSynthesisUtterance(text);
      utt.lang = this._lang;
      utt.rate = this._rate;
      utt.pitch = pitch ?? this._pitch;
      utt.voice = voice ?? this._voice;

      utt.onend = () => resolve();
      utt.onerror = (e) => {
        // "interrupted" fires when we cancel — not a real error
        if (e.error === "interrupted" || e.error === "canceled") resolve();
        else reject(e);
      };

      speechSynthesis.speak(utt);
    });
  }

  /** Stop current speech immediately. */
  stop() {
    if (isSpeechSynthesisSupported()) speechSynthesis.cancel();
  }

  /** Pause speech. */
  pause() {
    if (isSpeechSynthesisSupported()) speechSynthesis.pause();
  }

  /** Resume paused speech. */
  resume() {
    if (isSpeechSynthesisSupported()) speechSynthesis.resume();
  }

  /** Warm up for iOS — call from a user gesture handler. */
  warmUp() {
    if (!isSpeechSynthesisSupported()) return;
    const utt = new SpeechSynthesisUtterance("");
    utt.volume = 0;
    speechSynthesis.speak(utt);
  }

  /** Wait for browser voices to load and return them. */
  static getVoicesAsync() {
    return new Promise((resolve) => {
      if (!isSpeechSynthesisSupported()) { resolve([]); return; }
      const voices = speechSynthesis.getVoices();
      if (voices.length) { resolve(voices); return; }
      speechSynthesis.addEventListener("voiceschanged", () => {
        resolve(speechSynthesis.getVoices());
      }, { once: true });
      setTimeout(() => resolve(speechSynthesis.getVoices()), 2000);
    });
  }
}
