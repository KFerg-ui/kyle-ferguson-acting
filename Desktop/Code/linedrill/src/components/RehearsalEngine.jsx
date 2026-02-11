"use client";

import { useState, useEffect, useRef, useCallback, forwardRef, useImperativeHandle } from "react";
import { isSpeechRecognitionSupported, SpeechToText } from "../lib/speech-to-text";
import { isSpeechSynthesisSupported, TextToSpeech } from "../lib/text-to-speech";
import { scoreLine, scoreScene, isLineComplete } from "../lib/scoring";
import { saveRun, getSceneStats } from "../lib/progress-store";
import { getPitchForCharacter } from "../lib/voice-map";

const GOLD = "#c9a227";

/**
 * RehearsalEngine — walks through a scene line by line with voice.
 *
 * Props:
 *   scene            — { label, title, lines: [{ id, type, character, text }] }
 *   selectedCharacter — string
 *   onLineChange     — (lineId) => void  (tells parent which line to highlight)
 *   onStop           — () => void         (user exited rehearsal)
 */
export default forwardRef(function RehearsalEngine({ scene, selectedCharacter, onLineChange, onStop, voiceMap, characterMeta }, ref) {
  const [phase, setPhase] = useState("idle"); // idle | direction | partner | listening | done
  const [lineIndex, setLineIndex] = useState(0);
  const [transcript, setTranscript] = useState("");
  const [liveScore, setLiveScore] = useState(null);
  const [lineScores, setLineScores] = useState([]);
  const [isPaused, setIsPaused] = useState(false);
  const [usedLineThisTurn, setUsedLineThisTurn] = useState(false);
  const [sttSupported, setSttSupported] = useState(true);
  const [error, setError] = useState("");
  const [startTime, setStartTime] = useState(null);

  // Speed drill state
  const [mode, setMode] = useState(null); // null | "standard" | "speed"
  const [drillTimer, setDrillTimer] = useState(0);
  const [lineTimings, setLineTimings] = useState([]);

  const ttsRef = useRef(null);
  const sttRef = useRef(null);
  const timerRef = useRef(null);
  const pausedRef = useRef(false);
  const phaseRef = useRef("idle");
  const lineIndexRef = useRef(0);
  const modeRef = useRef(null);
  const drillIntervalRef = useRef(null);
  const cueEndTimeRef = useRef(null);
  const sceneRef = useRef(scene);
  const advanceLineRef = useRef(null);
  const recordScoreRef = useRef(null);
  const voiceMapRef = useRef(voiceMap);
  const characterMetaRef = useRef(characterMeta);

  // Keep refs in sync with state
  useEffect(() => { pausedRef.current = isPaused; }, [isPaused]);
  useEffect(() => { phaseRef.current = phase; }, [phase]);
  useEffect(() => { lineIndexRef.current = lineIndex; }, [lineIndex]);
  useEffect(() => { modeRef.current = mode; }, [mode]);
  useEffect(() => { sceneRef.current = scene; }, [scene]);
  useEffect(() => { voiceMapRef.current = voiceMap; }, [voiceMap]);
  useEffect(() => { characterMetaRef.current = characterMeta; }, [characterMeta]);

  // Check browser support
  useEffect(() => {
    setSttSupported(isSpeechRecognitionSupported());
  }, []);

  // Reset when scene changes (e.g. user switches tabs mid-rehearsal)
  useEffect(() => {
    if (ttsRef.current) ttsRef.current.stop();
    if (sttRef.current) sttRef.current.abort();
    if (timerRef.current) clearTimeout(timerRef.current);
    if (drillIntervalRef.current) clearInterval(drillIntervalRef.current);
    setPhase("idle");
    setLineIndex(0);
    setTranscript("");
    setLiveScore(null);
    setIsPaused(false);
    setLineScores([]);
    setError("");
    setMode(null);
    setDrillTimer(0);
    setLineTimings([]);
  }, [scene.label]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (ttsRef.current) ttsRef.current.stop();
      if (sttRef.current) sttRef.current.abort();
      if (timerRef.current) clearTimeout(timerRef.current);
      if (drillIntervalRef.current) clearInterval(drillIntervalRef.current);
    };
  }, []);

  const currentLine = scene.lines[lineIndex] || null;
  const totalLines = scene.lines.length;
  const userLineCount = scene.lines.filter((l) => l.type === "dialogue" && l.character === selectedCharacter).length;

  // --- Core stepper ---

  const advanceLine = useCallback((index) => {
    const s = sceneRef.current;
    if (index >= s.lines.length) {
      setPhase("done");
      onLineChange(null);
      if (drillIntervalRef.current) {
        clearInterval(drillIntervalRef.current);
        drillIntervalRef.current = null;
      }
      return;
    }

    if (pausedRef.current) return;

    const line = s.lines[index];
    setLineIndex(index);
    lineIndexRef.current = index;
    setTranscript("");
    setLiveScore(null);
    setUsedLineThisTurn(false);
    onLineChange(line.id);

    if (line.type === "direction") {
      setPhase("direction");
      const isSpeed = modeRef.current === "speed";
      const delay = isSpeed ? 1000 : Math.max(1500, line.text.split(/\s+/).length * 300);
      timerRef.current = setTimeout(() => advanceLineRef.current(index + 1), delay);
    } else if (line.character !== selectedCharacter) {
      setPhase("partner");
      const isSpeed = modeRef.current === "speed";
      if (ttsRef.current) {
        const charVoice = voiceMapRef.current?.[line.character] || null;
        const charPitch = getPitchForCharacter(characterMetaRef.current, line.character);
        ttsRef.current.speak(line.text, { voice: charVoice, pitch: charPitch }).then(() => {
          if (!pausedRef.current) advanceLineRef.current(index + 1);
        }).catch(() => {
          const delay = isSpeed
            ? Math.max(800, line.text.split(/\s+/).length * 200)
            : Math.max(1500, line.text.split(/\s+/).length * 300);
          timerRef.current = setTimeout(() => advanceLineRef.current(index + 1), delay);
        });
      } else {
        const delay = isSpeed
          ? Math.max(800, line.text.split(/\s+/).length * 200)
          : Math.max(1500, line.text.split(/\s+/).length * 300);
        timerRef.current = setTimeout(() => advanceLineRef.current(index + 1), delay);
      }
    } else {
      // User's line — listen
      setPhase("listening");
      cueEndTimeRef.current = Date.now();
      startListening(line, index);
    }
  }, [selectedCharacter, onLineChange]);
  advanceLineRef.current = advanceLine;

  const startListening = useCallback((line, index) => {
    if (sttRef.current) sttRef.current.abort();

    const stt = new SpeechToText({
      onInterim: (t) => {
        setTranscript(t);
        // Check for "line" command
        const words = t.trim().toLowerCase().split(/\s+/);
        if (words.length === 1 && words[0] === "line") {
          handleLineCommand(line, index);
          return;
        }
        // Live score
        const result = scoreLine(line.text, t);
        setLiveScore(result.score);
        // Early completion — user said the last few words of the line
        if (isLineComplete(line.text, t)) {
          if (sttRef.current) sttRef.current.stop();
        }
      },
      onFinal: (t) => {
        const result = scoreLine(line.text, t);
        setLiveScore(result.score);
        recordScoreRef.current(line, t, result.score, index);
      },
      onError: (err) => {
        setError(err);
        setPhase("idle");
      },
    });
    sttRef.current = stt;
    stt.start();
  }, []);

  const handleLineCommand = useCallback((line, index) => {
    if (sttRef.current) sttRef.current.abort();
    setUsedLineThisTurn(true);
    setTranscript("");
    setLiveScore(null);

    // Read the line to the user
    if (ttsRef.current) {
      ttsRef.current.speak(line.text).then(() => {
        // Re-listen after reading
        if (phaseRef.current === "listening" && !pausedRef.current) {
          startListening(line, index);
        }
      }).catch(() => {
        if (phaseRef.current === "listening" && !pausedRef.current) {
          startListening(line, index);
        }
      });
    }
  }, [startListening]);

  const recordScore = useCallback((line, spoken, score, index) => {
    // Capture per-line response time
    const responseTime = cueEndTimeRef.current
      ? Math.round(((Date.now() - cueEndTimeRef.current) / 1000) * 10) / 10
      : null;

    setLineScores((prev) => [
      ...prev,
      {
        lineId: line.id,
        expected: line.text,
        spoken,
        score,
        usedLine: usedLineThisTurn,
      },
    ]);

    if (modeRef.current === "speed" && responseTime !== null) {
      setLineTimings((prev) => [
        ...prev,
        {
          lineId: line.id,
          responseTime,
          wordCount: line.text.split(/\s+/).length,
        },
      ]);
    }

    cueEndTimeRef.current = null;

    // Shorter inter-line delay for speed drill
    const advanceDelay = modeRef.current === "speed" ? 400 : 800;
    timerRef.current = setTimeout(() => {
      advanceLineRef.current(index + 1);
    }, advanceDelay);
  }, [usedLineThisTurn]);
  recordScoreRef.current = recordScore;

  // --- Controls ---

  const handleStart = (selectedMode, startIndex = 0) => {
    const m = selectedMode || mode || "standard";
    setMode(m);
    modeRef.current = m;

    // Create TTS with appropriate rate
    if (ttsRef.current) ttsRef.current.stop();
    if (sttRef.current) sttRef.current.abort();
    if (timerRef.current) clearTimeout(timerRef.current);
    const rate = m === "speed" ? 1.3 : 0.95;
    const tts = new TextToSpeech({ rate });
    tts.warmUp();
    ttsRef.current = tts;

    setLineScores([]);
    setLineTimings([]);
    setError("");
    setStartTime(Date.now());
    setDrillTimer(0);
    setIsPaused(false);
    pausedRef.current = false;

    // Start running timer for speed drill
    if (drillIntervalRef.current) clearInterval(drillIntervalRef.current);
    if (m === "speed") {
      drillIntervalRef.current = setInterval(() => {
        setDrillTimer((prev) => prev + 1);
      }, 1000);
    }

    advanceLine(startIndex);
  };

  // Expose startFrom for parent components (e.g. clicking a script line)
  const handleStartRef = useRef(null);
  handleStartRef.current = handleStart;

  useImperativeHandle(ref, () => ({
    startFrom: (lineId) => {
      const idx = sceneRef.current.lines.findIndex((l) => l.id === lineId);
      if (idx >= 0) handleStartRef.current(modeRef.current || "standard", idx);
    },
  }), []);

  const handlePause = () => {
    setIsPaused(true);
    pausedRef.current = true;
    if (ttsRef.current) ttsRef.current.pause();
    if (sttRef.current) sttRef.current.abort();
    if (timerRef.current) clearTimeout(timerRef.current);
    if (drillIntervalRef.current) {
      clearInterval(drillIntervalRef.current);
      drillIntervalRef.current = null;
    }
  };

  const handleResume = () => {
    setIsPaused(false);
    pausedRef.current = false;
    if (ttsRef.current) ttsRef.current.resume();
    // Restart drill timer if speed mode
    if (modeRef.current === "speed") {
      drillIntervalRef.current = setInterval(() => {
        setDrillTimer((prev) => prev + 1);
      }, 1000);
    }
    // Re-advance from current line
    advanceLine(lineIndexRef.current);
  };

  const handleStop = () => {
    if (ttsRef.current) ttsRef.current.stop();
    if (sttRef.current) sttRef.current.abort();
    if (timerRef.current) clearTimeout(timerRef.current);
    if (drillIntervalRef.current) {
      clearInterval(drillIntervalRef.current);
      drillIntervalRef.current = null;
    }
    setPhase("idle");
    setLineIndex(0);
    setIsPaused(false);
    setMode(null);
    onStop();
  };

  const handleRunAgain = () => {
    const currentMode = modeRef.current;
    setPhase("idle");
    setLineIndex(0);
    setLineScores([]);
    setLineTimings([]);
    setTranscript("");
    setLiveScore(null);
    setIsPaused(false);
    setError("");
    onLineChange(null);
    // Auto-start with same mode
    setTimeout(() => handleStart(currentMode), 100);
  };

  const handleSkipToCue = () => {
    const s = sceneRef.current;
    let searchFrom = lineIndexRef.current + 1;

    // If currently on user's own line, skip past consecutive user lines first
    const curLine = s.lines[lineIndexRef.current];
    if (curLine && curLine.type === "dialogue" && curLine.character === selectedCharacter) {
      while (searchFrom < s.lines.length) {
        const l = s.lines[searchFrom];
        if (l.type !== "dialogue" || l.character !== selectedCharacter) break;
        searchFrom++;
      }
    }

    // Find next user line after non-user lines
    let nextUserIdx = -1;
    for (let i = searchFrom; i < s.lines.length; i++) {
      if (s.lines[i].type === "dialogue" && s.lines[i].character === selectedCharacter) {
        nextUserIdx = i;
        break;
      }
    }

    if (nextUserIdx === -1) return; // No more user lines ahead

    // Cue = line right before user's next line
    const cueIdx = nextUserIdx > 0 ? nextUserIdx - 1 : 0;

    // Stop current TTS/STT/timers
    if (ttsRef.current) ttsRef.current.stop();
    if (sttRef.current) sttRef.current.abort();
    if (timerRef.current) clearTimeout(timerRef.current);

    advanceLineRef.current(cueIdx);
  };

  const handleBackToScript = () => {
    setPhase("idle");
    setLineIndex(0);
    setLineScores([]);
    setLineTimings([]);
    setMode(null);
    onLineChange(null);
    onStop();
  };

  // --- Render ---

  // Not supported
  if (!sttSupported) {
    return (
      <div style={panelStyle}>
        <div style={{ textAlign: "center", padding: "20px 0" }}>
          <div style={{ fontSize: 13, color: "#888", marginBottom: 6 }}>
            Voice rehearsal requires Chrome or Edge.
          </div>
          <div style={{ fontSize: 11, color: "#666" }}>
            Speech recognition is not available in this browser.
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div style={panelStyle}>
        <div style={{ textAlign: "center", padding: "16px 0" }}>
          <div style={{ fontSize: 13, color: "#ff7070", marginBottom: 10 }}>{error}</div>
          <button onClick={() => { setError(""); setPhase("idle"); setMode(null); }} style={btnPrimary}>Try Again</button>
        </div>
      </div>
    );
  }

  // Idle — compact mode buttons
  if (phase === "idle") {
    return (
      <div style={{ display: "flex", gap: 8, justifyContent: "center", marginBottom: 12 }}>
        <button onClick={() => handleStart("standard")} style={compactModeBtn}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={GOLD} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
          </svg>
          Standard
        </button>
        <button onClick={() => handleStart("speed")} style={compactModeBtn}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#e8a735" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="13" r="8"/><path d="M12 9v4l2 1"/><line x1="12" y1="1" x2="12" y2="3"/>
          </svg>
          Speed Drill
        </button>
      </div>
    );
  }

  // Done — score summary
  if (phase === "done") {
    return (
      <ScoreSummary
        lineScores={lineScores}
        lineTimings={lineTimings}
        startTime={startTime}
        scene={scene}
        selectedCharacter={selectedCharacter}
        mode={mode}
        onRunAgain={handleRunAgain}
        onBack={handleBackToScript}
        onLineRestart={(lineId) => {
          const idx = sceneRef.current.lines.findIndex((l) => l.id === lineId);
          if (idx >= 0) handleStart(modeRef.current || "standard", idx);
        }}
      />
    );
  }

  // Active rehearsal
  const isSpeed = mode === "speed";
  return (
    <div style={panelStyle}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <div style={{ fontSize: 11, color: isSpeed ? "#e8a735" : GOLD, letterSpacing: "0.1em", textTransform: "uppercase", fontWeight: 700 }}>
          {isSpeed ? "Speed Drill" : "Rehearsing"}
        </div>
        {isSpeed && (
          <div style={{
            fontSize: 20, fontWeight: 700, color: GOLD,
            fontVariantNumeric: "tabular-nums",
            letterSpacing: "0.05em",
            animation: "timerGlow 2s ease-in-out infinite",
          }}>
            {Math.floor(drillTimer / 60)}:{(drillTimer % 60).toString().padStart(2, "0")}
          </div>
        )}
        <div style={{ fontSize: 11, color: "#666" }}>
          Line {lineIndex + 1} of {totalLines}
        </div>
      </div>

      {/* Current line display */}
      {currentLine && (
        <div style={{
          padding: "12px 14px", borderRadius: 5, marginBottom: 12,
          background: phase === "listening" ? "rgba(201,162,39,0.08)" : "rgba(255,255,255,0.03)",
          border: `1px solid ${phase === "listening" ? "rgba(201,162,39,0.25)" : "#333"}`,
        }}>
          {phase === "direction" && (
            <>
              <div style={{ fontSize: 10, color: "#666", textTransform: "uppercase", marginBottom: 4 }}>Stage Direction</div>
              <div style={{ fontSize: 13, color: "#bbb", fontStyle: "italic" }}>{currentLine.text}</div>
            </>
          )}
          {phase === "partner" && (
            <>
              <div style={{ fontSize: 10, color: "#888", textTransform: "uppercase", marginBottom: 4 }}>{currentLine.character}</div>
              <div style={{ fontSize: 13, color: "#ddd" }}>{currentLine.text}</div>
              <div style={{ fontSize: 10, color: GOLD, marginTop: 6 }}>Speaking...</div>
            </>
          )}
          {phase === "listening" && (
            <>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                <div style={{
                  width: 10, height: 10, borderRadius: "50%", background: GOLD,
                  animation: "micPulse 1.5s ease-in-out infinite",
                }} />
                <div style={{ fontSize: 10, color: GOLD, textTransform: "uppercase", fontWeight: 700 }}>
                  Your Line — Listening
                </div>
                {liveScore !== null && (
                  <div style={{
                    marginLeft: "auto", fontSize: 13, fontWeight: 700,
                    color: liveScore >= 80 ? GOLD : liveScore >= 60 ? "#e8a735" : "#ff7070",
                  }}>
                    {liveScore}%
                  </div>
                )}
              </div>
              {transcript ? (
                <div style={{ fontSize: 13, color: "#eee", lineHeight: 1.6 }}>{transcript}</div>
              ) : (
                <div style={{ fontSize: 12, color: "#666", fontStyle: "italic" }}>
                  Speak your line... or say &quot;line&quot; for help
                </div>
              )}
              {usedLineThisTurn && (
                <div style={{ fontSize: 10, color: "#e8a735", marginTop: 4 }}>Used &quot;line&quot; (-7 pts)</div>
              )}
            </>
          )}
        </div>
      )}

      {/* Controls */}
      <div style={{ display: "flex", justifyContent: "center", gap: 10 }}>
        {isPaused ? (
          <button onClick={handleResume} style={btnControl}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill={GOLD} stroke="none"><polygon points="5 3 19 12 5 21"/></svg>
            <span>Resume</span>
          </button>
        ) : (
          <button onClick={handlePause} style={btnControl}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="#aaa" stroke="none"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>
            <span>Pause</span>
          </button>
        )}
        <button onClick={handleSkipToCue} style={btnControl} title="Skip to your next cue">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="#aaa" stroke="none"><polygon points="3 5 13 12 3 19"/><polygon points="11 5 21 12 11 19"/></svg>
          <span>Skip to Cue</span>
        </button>
        <button onClick={handleStop} style={btnControl}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="#aaa" stroke="none"><rect x="4" y="4" width="16" height="16" rx="2"/></svg>
          <span>Stop</span>
        </button>
      </div>
    </div>
  );
});

// --- Helpers ---

function formatTime(seconds) {
  if (seconds == null) return "--";
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

// --- Score Summary ---

function ScoreSummary({ lineScores, lineTimings, startTime, scene, selectedCharacter, mode, onRunAgain, onBack, onLineRestart }) {
  const { aggregate, lineCount, usedLineCount } = scoreScene(lineScores);
  const elapsed = startTime ? Math.round((Date.now() - startTime) / 1000) : 0;
  const minutes = Math.floor(elapsed / 60);
  const seconds = elapsed % 60;
  const isSpeed = mode === "speed";

  // Save this run to localStorage on mount
  const savedRef = useRef(false);
  useEffect(() => {
    if (!savedRef.current && lineScores.length > 0) {
      savedRef.current = true;
      saveRun(selectedCharacter, scene.label, {
        score: aggregate,
        lineCount,
        usedLineCount,
        elapsed,
        mode: mode || "standard",
        lineTimings: isSpeed ? lineTimings : null,
      });
    }
  }, [aggregate, lineCount, usedLineCount, elapsed, selectedCharacter, scene.label, lineScores.length, mode, isSpeed, lineTimings]);

  const stats = getSceneStats(selectedCharacter, scene.label, mode || "standard");

  return (
    <div style={panelStyle}>
      <div style={{ textAlign: "center", marginBottom: 16 }}>
        <div style={{ fontSize: 11, color: "#888", letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: 12 }}>
          {isSpeed ? "Speed Drill Complete" : "Scene Complete"}
        </div>

        {isSpeed ? (
          <>
            {/* Speed drill: time is hero, score is secondary */}
            <div style={{
              fontSize: 42, fontWeight: 700, color: GOLD,
              lineHeight: 1, fontVariantNumeric: "tabular-nums",
            }}>
              {minutes}:{seconds.toString().padStart(2, "0")}
            </div>
            <div style={{
              fontSize: 20, fontWeight: 700, marginTop: 8,
              color: aggregate >= 80 ? GOLD : aggregate >= 60 ? "#e8a735" : "#ff7070",
            }}>
              {aggregate}% accuracy
            </div>
          </>
        ) : (
          <>
            {/* Standard: score is hero */}
            <div style={{
              fontSize: 42, fontWeight: 700, color: aggregate >= 80 ? GOLD : aggregate >= 60 ? "#e8a735" : "#ff7070",
              lineHeight: 1,
            }}>
              {aggregate}%
            </div>
          </>
        )}

        <div style={{ fontSize: 11, color: "#888", marginTop: 6 }}>
          {lineCount} lines{usedLineCount > 0 ? ` \u00b7 ${usedLineCount} "line" call${usedLineCount > 1 ? "s" : ""}` : ""}
          {!isSpeed && elapsed > 0 ? ` \u00b7 ${minutes}:${seconds.toString().padStart(2, "0")}` : ""}
        </div>

        {stats && stats.runCount > 1 && (
          <div style={{ display: "flex", justifyContent: "center", gap: 16, marginTop: 10 }}>
            {isSpeed && stats.bestTime != null && (
              <span style={{ fontSize: 10, color: "#666" }}>Best: <span style={{ color: "#e8a735" }}>{formatTime(stats.bestTime)}</span></span>
            )}
            <span style={{ fontSize: 10, color: "#666" }}>Best: <span style={{ color: GOLD }}>{stats.best}%</span></span>
            <span style={{ fontSize: 10, color: "#666" }}>Avg: {stats.average}%</span>
            <span style={{ fontSize: 10, color: "#666" }}>Run #{stats.runCount}</span>
          </div>
        )}
      </div>

      {/* Per-line breakdown */}
      {lineScores.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 10, color: "#666", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 8 }}>
            Line Breakdown <span style={{ fontWeight: 400, textTransform: "none", letterSpacing: 0 }}>— click to restart</span>
          </div>
          <div style={{ maxHeight: 200, overflowY: "auto" }}>
            {lineScores.map((ls, i) => {
              const timing = isSpeed && lineTimings[i] ? lineTimings[i] : null;
              return (
                <div key={i} onClick={() => onLineRestart && onLineRestart(ls.lineId)} style={{
                  display: "flex", alignItems: "center", gap: 8,
                  padding: "6px 0", borderBottom: "1px solid #222",
                  cursor: onLineRestart ? "pointer" : "default",
                  borderRadius: 3, transition: "background 0.15s",
                }} onMouseEnter={(e) => { if (onLineRestart) e.currentTarget.style.background = "rgba(201,162,39,0.08)"; }}
                   onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}>
                  <div style={{ flex: 1, fontSize: 12, color: "#aaa", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {ls.expected.substring(0, 50)}{ls.expected.length > 50 ? "..." : ""}
                  </div>
                  <div style={{
                    fontSize: 12, fontWeight: 700, minWidth: 36, textAlign: "right",
                    color: ls.score >= 80 ? GOLD : ls.score >= 60 ? "#e8a735" : "#ff7070",
                  }}>
                    {ls.score}%
                  </div>
                  {timing && (
                    <div style={{ fontSize: 11, color: "#888", minWidth: 36, textAlign: "right" }}>
                      {timing.responseTime}s
                    </div>
                  )}
                  {ls.score < 80 && (
                    <div style={{ fontSize: 10, color: ls.score < 60 ? "#ff7070" : "#e8a735" }}>
                      {ls.score < 60 ? "\u25cf\u25cf" : "\u25cf"}
                    </div>
                  )}
                  {ls.usedLine && (
                    <div style={{ fontSize: 9, color: "#e8a735" }}>LINE</div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Actions */}
      <div style={{ display: "flex", justifyContent: "center", gap: 10 }}>
        <button onClick={onRunAgain} style={btnPrimary}>Run Again</button>
        <button onClick={onBack} style={btnSecondary}>Back to Script</button>
      </div>
    </div>
  );
}

// --- Styles ---

const panelStyle = {
  marginTop: 20,
  padding: "20px 16px",
  background: "#1a1a1a",
  border: "1px solid #333",
  borderRadius: 6,
};

const compactModeBtn = {
  display: "flex",
  alignItems: "center",
  gap: 6,
  padding: "7px 14px",
  borderRadius: 5,
  border: "1px solid #444",
  background: "rgba(255,255,255,0.03)",
  color: "#ccc",
  fontSize: 12,
  fontWeight: 600,
  cursor: "pointer",
  fontFamily: "inherit",
};

const btnPrimary = {
  padding: "10px 24px",
  borderRadius: 5,
  border: "none",
  background: GOLD,
  color: "#111",
  fontSize: 13,
  fontWeight: 700,
  cursor: "pointer",
  fontFamily: "inherit",
};

const btnSecondary = {
  padding: "10px 24px",
  borderRadius: 5,
  border: "1px solid #444",
  background: "transparent",
  color: "#aaa",
  fontSize: 13,
  cursor: "pointer",
  fontFamily: "inherit",
};

const btnControl = {
  display: "flex",
  alignItems: "center",
  gap: 6,
  padding: "8px 16px",
  borderRadius: 5,
  border: "1px solid #444",
  background: "transparent",
  color: "#aaa",
  fontSize: 12,
  cursor: "pointer",
  fontFamily: "inherit",
};
