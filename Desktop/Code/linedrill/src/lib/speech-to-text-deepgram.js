/**
 * Speech-to-Text — Deepgram Nova-2 streaming via WebSocket.
 * Same interface as SpeechToText (browser Web Speech API wrapper)
 * so RehearsalEngine can swap between them transparently.
 */

export class DeepgramSTT {
  /**
   * @param {object} opts
   * @param {(transcript: string) => void} opts.onInterim
   * @param {(transcript: string) => void} opts.onFinal
   * @param {(error: string) => void}      opts.onError
   * @param {string}                        opts.deepgramKey
   * @param {string}                        opts.lang
   */
  constructor({ onInterim, onFinal, onError, deepgramKey, lang = "en-US" }) {
    this._onInterim = onInterim;
    this._onFinal = onFinal;
    this._onError = onError;
    this._deepgramKey = deepgramKey;
    this._lang = lang;
    this._ws = null;
    this._recorder = null;
    this._stream = null;
    this._stopped = true;
    this._aborted = false;
    this._transcript = "";
    this._silenceTimer = null;
    this._lastResultTime = 0;
  }

  start() {
    this._stopped = false;
    this._aborted = false;
    this._transcript = "";
    this._lastResultTime = Date.now();
    this._init().catch((err) => {
      if (!this._aborted) {
        this._onError(err.message || "Failed to start speech recognition");
      }
    });
  }

  async _init() {
    // Get mic access
    try {
      this._stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch (err) {
      throw new Error(
        err.name === "NotAllowedError"
          ? "Microphone access denied. Please allow mic access and try again."
          : `Microphone error: ${err.message}`
      );
    }

    if (this._aborted) { this._releaseStream(); return; }

    // Connect to Deepgram
    const lang = this._lang.split("-")[0]; // "en-US" → "en"
    const params = new URLSearchParams({
      model: "nova-2",
      language: lang,
      smart_format: "true",
      interim_results: "true",
      utterance_end_ms: "1500",
      vad_events: "true",
      punctuate: "true",
    });

    const url = `wss://api.deepgram.com/v1/listen?${params}`;
    this._ws = new WebSocket(url, ["token", this._deepgramKey]);

    await new Promise((resolve, reject) => {
      this._ws.onopen = () => resolve();
      this._ws.onerror = () => reject(new Error("Could not connect to Deepgram"));

      // Timeout if connection takes too long
      setTimeout(() => reject(new Error("Deepgram connection timeout")), 5000);
    });

    if (this._aborted) { this._cleanup(); return; }

    // Set up message handler
    this._ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        this._handleMessage(data);
      } catch { /* ignore malformed messages */ }
    };

    this._ws.onerror = () => {
      if (!this._stopped && !this._aborted) {
        this._onError("Deepgram connection error");
      }
    };

    this._ws.onclose = () => {
      if (!this._stopped && !this._aborted) {
        // Unexpected close — finalize with whatever we have
        this._stopped = true;
        this._stopRecording();
        this._releaseStream();
        this._clearSilenceTimer();
        this._finalize();
      }
    };

    // Start recording and streaming audio
    this._startRecording();
    this._startSilenceTimer();
  }

  _startRecording() {
    const mimeType =
      typeof MediaRecorder !== "undefined" &&
      MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : typeof MediaRecorder !== "undefined" &&
          MediaRecorder.isTypeSupported("audio/webm")
          ? "audio/webm"
          : "audio/mp4";

    try {
      this._recorder = new MediaRecorder(this._stream, { mimeType });
    } catch {
      // Fallback without specifying mimeType
      this._recorder = new MediaRecorder(this._stream);
    }

    this._recorder.ondataavailable = (event) => {
      if (event.data.size > 0 && this._ws?.readyState === WebSocket.OPEN) {
        this._ws.send(event.data);
      }
    };

    this._recorder.start(250); // Send chunks every 250ms
  }

  _handleMessage(data) {
    if (data.type === "Results") {
      this._lastResultTime = Date.now();
      const alt = data.channel?.alternatives?.[0];
      const transcript = alt?.transcript || "";

      if (!transcript) return;

      if (data.is_final) {
        // Final result for this utterance segment — append to accumulated
        this._transcript += (this._transcript ? " " : "") + transcript;
        this._onInterim(this._transcript);
        this._resetSilenceTimer();
      } else {
        // Interim — show accumulated + current partial
        const display = this._transcript + (this._transcript ? " " : "") + transcript;
        this._onInterim(display);
      }
    } else if (data.type === "UtteranceEnd") {
      // Deepgram detected end of utterance — stop if we have a transcript
      if (this._transcript && !this._stopped) {
        this.stop();
      }
    }
  }

  stop() {
    if (this._stopped) return;
    this._stopped = true;
    this._clearSilenceTimer();
    this._stopRecording();

    if (this._ws?.readyState === WebSocket.OPEN) {
      try {
        this._ws.send(JSON.stringify({ type: "CloseStream" }));
      } catch { /* ignore */ }
      try { this._ws.close(); } catch { /* ignore */ }
    }
    this._ws = null;
    this._releaseStream();
    this._finalize();
  }

  abort() {
    this._stopped = true;
    this._aborted = true;
    this._clearSilenceTimer();
    this._cleanup();
  }

  _cleanup() {
    this._stopRecording();
    if (this._ws) {
      try { this._ws.close(); } catch { /* ignore */ }
    }
    this._ws = null;
    this._releaseStream();
  }

  _stopRecording() {
    if (this._recorder && this._recorder.state !== "inactive") {
      try { this._recorder.stop(); } catch { /* ignore */ }
    }
    this._recorder = null;
  }

  _releaseStream() {
    if (this._stream) {
      this._stream.getTracks().forEach((t) => t.stop());
      this._stream = null;
    }
  }

  _finalize() {
    this._clearSilenceTimer();
    if (!this._aborted) {
      this._onFinal(this._transcript);
    }
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
    this._lastResultTime = Date.now();
  }

  _clearSilenceTimer() {
    if (this._silenceTimer) {
      clearInterval(this._silenceTimer);
      this._silenceTimer = null;
    }
  }
}
