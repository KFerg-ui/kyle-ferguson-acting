/**
 * Speech-to-Text — Web Speech API wrapper for listening to the user's lines.
 */

const SpeechRecognitionAPI =
  typeof window !== "undefined"
    ? window.SpeechRecognition || window.webkitSpeechRecognition
    : null;

export function isSpeechRecognitionSupported() {
  return !!SpeechRecognitionAPI;
}

export class SpeechToText {
  /**
   * @param {object} opts
   * @param {(transcript: string) => void} opts.onInterim  — fires on every interim/final result
   * @param {(transcript: string) => void} opts.onFinal    — fires when recognition stops or silence timeout
   * @param {(error: string) => void}      opts.onError
   * @param {string}                        opts.lang
   */
  constructor({ onInterim, onFinal, onError, lang = "en-US" }) {
    this._onInterim = onInterim;
    this._onFinal = onFinal;
    this._onError = onError;
    this._lang = lang;
    this._recognition = null;
    this._stopped = true;
    this._transcript = "";
    this._silenceTimer = null;
    this._lastResultTime = 0;
  }

  start() {
    if (!SpeechRecognitionAPI) {
      this._onError("Speech recognition not supported in this browser.");
      return;
    }

    this._stopped = false;
    this._transcript = "";
    this._lastResultTime = Date.now();

    const rec = new SpeechRecognitionAPI();
    rec.lang = this._lang;
    rec.continuous = true;
    rec.interimResults = true;
    rec.maxAlternatives = 1;

    rec.onresult = (e) => {
      this._lastResultTime = Date.now();
      let full = "";
      for (let i = 0; i < e.results.length; i++) {
        full += e.results[i][0].transcript;
      }
      this._transcript = full;
      this._onInterim(full);

      // Check if the last result segment is final
      const last = e.results[e.results.length - 1];
      if (last.isFinal) {
        this._resetSilenceTimer();
      }
    };

    rec.onerror = (e) => {
      if (e.error === "aborted" || e.error === "no-speech") return;
      this._onError(e.error === "not-allowed"
        ? "Microphone access denied. Please allow mic access and try again."
        : `Speech recognition error: ${e.error}`);
    };

    rec.onend = () => {
      // Auto-restart if we didn't intentionally stop
      if (!this._stopped) {
        try { rec.start(); } catch { /* already started */ }
        return;
      }
      this._finalize();
    };

    this._recognition = rec;
    try { rec.start(); } catch { /* may already be started */ }

    // Start silence monitoring
    this._startSilenceTimer();
  }

  stop() {
    this._stopped = true;
    this._clearSilenceTimer();
    if (this._recognition) {
      try { this._recognition.stop(); } catch { /* ignore */ }
    }
  }

  abort() {
    this._stopped = true;
    this._clearSilenceTimer();
    if (this._recognition) {
      try { this._recognition.abort(); } catch { /* ignore */ }
    }
    this._recognition = null;
  }

  _finalize() {
    this._clearSilenceTimer();
    this._onFinal(this._transcript);
    this._recognition = null;
  }

  _startSilenceTimer() {
    this._clearSilenceTimer();
    this._silenceTimer = setInterval(() => {
      const elapsed = Date.now() - this._lastResultTime;
      // 8s with no results at all, or 4s gap after last result
      const timeout = this._transcript ? 4000 : 8000;
      if (elapsed > timeout) {
        this.stop();
      }
    }, 500);
  }

  _resetSilenceTimer() {
    // Just reset the timestamp; the interval keeps running
    this._lastResultTime = Date.now();
  }

  _clearSilenceTimer() {
    if (this._silenceTimer) {
      clearInterval(this._silenceTimer);
      this._silenceTimer = null;
    }
  }
}
