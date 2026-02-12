"use client";

import { useState, useCallback, useEffect, useMemo, useRef } from "react";
import DropZone from "../components/DropZone";
import StepIndicator from "../components/StepIndicator";
import CharacterStep from "../components/CharacterStep";
import SceneTaggingStep from "../components/SceneTaggingStep";
import { SceneNav, ScriptViewer, ScriptStats, SearchBar } from "../components/ScriptViewer";
import RehearsalEngine from "../components/RehearsalEngine";
import VoiceSettings from "../components/VoiceSettings";

import { readScriptFile } from "../lib/file-readers";
import { analyzeScriptWithAI } from "../lib/ai-parser";
import { localParseScript, mergeResults, autoMergeAllCharacters } from "../lib/local-parser";
import { buildFinalScenes } from "../lib/scene-helpers";
import { loadSession, saveSession, clearSession } from "../lib/session-store";
import { TextToSpeech } from "../lib/text-to-speech";
import { buildVoiceMap, loadVoiceOverrides, saveVoiceOverrides, clearVoiceOverrides } from "../lib/voice-map";

const GOLD = "#c9a227";

function GhostLight({ size = 48 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 80" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ display: "block", margin: "0 auto 6px" }}>
      {/* Glow */}
      <ellipse cx="32" cy="18" rx="18" ry="16" fill={GOLD} opacity="0.08"/>
      <ellipse cx="32" cy="18" rx="11" ry="10" fill={GOLD} opacity="0.15"/>
      {/* Bulb */}
      <ellipse cx="32" cy="16" rx="6.5" ry="9" fill={GOLD} opacity="0.9"/>
      {/* Socket */}
      <rect x="28" y="24.5" width="8" height="3.5" rx="1" fill="#666"/>
      <line x1="29" y1="25.5" x2="35" y2="25.5" stroke="#555" strokeWidth="0.5"/>
      <line x1="29" y1="27" x2="35" y2="27" stroke="#555" strokeWidth="0.5"/>
      {/* Pole */}
      <line x1="32" y1="28" x2="32" y2="60" stroke="#666" strokeWidth="2.5" strokeLinecap="round"/>
      {/* Base tripod */}
      <line x1="32" y1="60" x2="19" y2="76" stroke="#666" strokeWidth="2.5" strokeLinecap="round"/>
      <line x1="32" y1="60" x2="45" y2="76" stroke="#666" strokeWidth="2.5" strokeLinecap="round"/>
      <line x1="32" y1="60" x2="32" y2="78" stroke="#666" strokeWidth="2.5" strokeLinecap="round"/>
    </svg>
  );
}

const BTN_SMALL = {
  padding: "8px 12px", borderRadius: 4, border: "1px solid #444",
  background: "transparent", color: "#aaa", fontSize: 11, cursor: "pointer", fontFamily: "inherit",
  minHeight: 36, display: "inline-flex", alignItems: "center", justifyContent: "center",
};

export default function HomePage() {
  const [step, setStep] = useState("upload");
  const [rawText, setRawText] = useState("");
  const [parsed, setParsed] = useState(null);
  const [selectedCharacter, setSelectedCharacter] = useState("");
  const [finalScenes, setFinalScenes] = useState([]);
  const [activeScene, setActiveScene] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMsg, setLoadingMsg] = useState("");
  const [fileName, setFileName] = useState("");
  const [error, setError] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeMatchIdx, setActiveMatchIdx] = useState(0);
  const [rehearsalLineId, setRehearsalLineId] = useState(null);
  const [rehearsalActive, setRehearsalActive] = useState(false);
  const [zoom, setZoom] = useState(1.0);
  const [hasMounted, setHasMounted] = useState(false);
  const [voiceMap, setVoiceMap] = useState({});
  const [voiceSettingsOpen, setVoiceSettingsOpen] = useState(false);
  const [hideMyLines, setHideMyLines] = useState(false);
  const [deepgramKey, setDeepgramKey] = useState(null);
  const rehearsalRef = useRef(null);

  // Restore session from localStorage on mount
  useEffect(() => {
    const saved = loadSession();
    if (saved) {
      if (saved.step) setStep(saved.step);
      if (saved.rawText) setRawText(saved.rawText);
      if (saved.parsed) setParsed(saved.parsed);
      if (saved.selectedCharacter) setSelectedCharacter(saved.selectedCharacter);
      if (saved.finalScenes?.length) setFinalScenes(saved.finalScenes);
      if (saved.fileName) setFileName(saved.fileName);
      if (saved.zoom) setZoom(saved.zoom);
      if (saved.hideMyLines) setHideMyLines(saved.hideMyLines);
    }
    setHasMounted(true);
  }, []);

  // Auto-save session whenever key state changes
  useEffect(() => {
    if (!hasMounted) return;
    if (step === "upload" && !rawText) return;
    saveSession({ step, rawText, parsed, selectedCharacter, finalScenes, fileName, zoom, hideMyLines });
  }, [step, rawText, parsed, selectedCharacter, finalScenes, fileName, zoom, hideMyLines, hasMounted]);

  // Check if Deepgram STT is available (server has DEEPGRAM_API_KEY)
  useEffect(() => {
    fetch("/api/deepgram-token", { method: "POST" })
      .then((res) => res.ok ? res.json() : null)
      .then((data) => { if (data?.key) setDeepgramKey(data.key); })
      .catch(() => {}); // No Deepgram — will fall back to browser STT
  }, []);

  // Build voice map when characters and selected character are available
  useEffect(() => {
    if (!parsed?.characters?.length || !selectedCharacter) return;
    const init = async () => {
      await TextToSpeech.getVoicesAsync();
      const overrides = loadVoiceOverrides();
      const map = buildVoiceMap(parsed.characters, parsed.characterMeta || {}, selectedCharacter, overrides);
      setVoiceMap(map);
    };
    init();
  }, [parsed?.characters, selectedCharacter]);

  // Characters that actually speak in confirmed scenes (for VoiceSettings)
  const activePartnerCharacters = useMemo(() => {
    if (!finalScenes.length || !selectedCharacter) return [];
    const chars = new Set();
    for (const scene of finalScenes) {
      for (const line of scene.lines) {
        if (line.type === "dialogue" && line.character && line.character !== selectedCharacter) {
          chars.add(line.character);
        }
      }
    }
    return Array.from(chars).sort();
  }, [finalScenes, selectedCharacter]);

  // Build flat list of matches across all scenes
  const searchMatches = useMemo(() => {
    if (!searchQuery.trim() || finalScenes.length === 0) return [];
    const q = searchQuery.toLowerCase();
    const matches = [];
    finalScenes.forEach((scene, sceneIdx) => {
      scene.lines.forEach((line, lineIdx) => {
        if (line.text.toLowerCase().includes(q)) {
          matches.push({ sceneIdx, lineIdx, lineId: line.id });
        }
      });
    });
    return matches;
  }, [searchQuery, finalScenes]);

  // Clamp activeMatchIdx when matches change
  useEffect(() => {
    if (searchMatches.length === 0) setActiveMatchIdx(0);
    else if (activeMatchIdx >= searchMatches.length) setActiveMatchIdx(0);
  }, [searchMatches, activeMatchIdx]);

  // Auto-switch scene when active match is in a different scene
  useEffect(() => {
    if (searchMatches.length > 0 && searchMatches[activeMatchIdx]) {
      const match = searchMatches[activeMatchIdx];
      if (match.sceneIdx !== activeScene) setActiveScene(match.sceneIdx);
    }
  }, [activeMatchIdx, searchMatches, activeScene]);

  // Cmd+F / Ctrl+F to open search
  useEffect(() => {
    if (step !== "view") return;
    const handleKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "f") {
        e.preventDefault();
        setSearchOpen(true);
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [step]);

  const closeSearch = () => {
    setSearchOpen(false);
    setSearchQuery("");
    setActiveMatchIdx(0);
  };

  const goToMatch = (dir) => {
    if (searchMatches.length === 0) return;
    setActiveMatchIdx((prev) => (prev + dir + searchMatches.length) % searchMatches.length);
  };

  const handleFileSelect = useCallback(async (file) => {
    setIsLoading(true);
    setError("");
    setFileName(file.name);
    setParsed(null);
    setSelectedCharacter("");
    setFinalScenes([]);

    try {
      // 1. Extract text
      setLoadingMsg("Extracting text...");
      const text = await readScriptFile(file);
      if (!text || !text.trim()) {
        setError("Couldn't extract text from this file. Try a different format.");
        setIsLoading(false);
        return;
      }
      setRawText(text);

      // 2. Local parse (fast fallback)
      setLoadingMsg("Analyzing structure...");
      const localResult = localParseScript(text);

      // 3. AI parse (smart)
      setLoadingMsg("AI is reading your script...");
      const aiResult = await analyzeScriptWithAI(text);

      // 4. Merge
      const merged = mergeResults(aiResult, localResult, text);

      if (merged.characters.length === 0) {
        setError("No characters detected. The script may use an unusual format.");
        setIsLoading(false);
        return;
      }

      if (merged.breaks.length === 0) {
        merged.breaks.push({
          exactText: "Full Script",
          type: "scene",
          suggestedLabel: "1",
          suggestedName: "Full Script",
          srcLine: -1,
        });
      }

      setParsed(merged);
      setStep("character");
    } catch (err) {
      setError("Error: " + err.message);
    }

    setIsLoading(false);
    setLoadingMsg("");
  }, []);

  const reset = () => {
    clearSession();
    clearVoiceOverrides();
    setVoiceMap({});
    setStep("upload");
    setParsed(null);
    setSelectedCharacter("");
    setFinalScenes([]);
    setActiveScene(0);
    setFileName("");
    setError("");
    setRawText("");
  };

  // Show minimal shell until localStorage restore completes (avoids SSR hydration flash)
  if (!hasMounted) {
    return (
      <div style={{ minHeight: "100dvh" }}>
        <div style={{ maxWidth: 640, margin: "0 auto", padding: "20px 14px" }}>
          <header style={{ textAlign: "center" }}>
            <GhostLight />
            <h1 style={{
              fontSize: 32, fontWeight: 700, color: GOLD,
              letterSpacing: "0.18em", textTransform: "uppercase",
            }}>
              LineDrill
            </h1>
          </header>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100dvh" }}>
      <div style={{ maxWidth: 640, margin: "0 auto", padding: "20px 14px", animation: "fadeIn 0.4s ease" }}>
        {/* Header */}
        <header style={{ textAlign: "center", marginBottom: 24 }}>
          <GhostLight />
          <h1 style={{
            fontSize: 32, fontWeight: 700, color: GOLD,
            letterSpacing: "0.18em", textTransform: "uppercase", marginBottom: 3,
          }}>
            LineDrill
          </h1>
          <p style={{
            fontSize: 11, color: "#777",
            letterSpacing: "0.25em", textTransform: "uppercase",
          }}>
            Your AI Scene Partner
          </p>
          {step !== "upload" && <StepIndicator current={step} />}
        </header>

        {/* Error */}
        {error && (
          <div style={{
            background: "rgba(255,60,60,0.08)", border: "1px solid rgba(255,60,60,0.2)",
            borderRadius: 5, padding: "9px 14px", marginBottom: 14, color: "#ff7070", fontSize: 13,
          }}>
            {error}
          </div>
        )}

        {/* File info bar */}
        {step !== "upload" && (
          <div style={{
            display: "flex", justifyContent: "space-between", alignItems: "center",
            marginBottom: 14, padding: "7px 12px",
            background: "rgba(255,255,255,0.03)", borderRadius: 5, border: "1px solid #333",
          }}>
            <span style={{ fontSize: 12, color: "#999", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", marginRight: 8 }}>📄 {fileName}</span>
            <button onClick={reset} style={BTN_SMALL}>NEW SCRIPT</button>
          </div>
        )}

        {/* STEP: Upload */}
        {step === "upload" && (
          <DropZone onFileSelect={handleFileSelect} isLoading={isLoading} loadingMsg={loadingMsg} />
        )}

        {/* STEP: Character selection */}
        {step === "character" && parsed && (
          <CharacterStep
            characters={parsed.characters}
            formatInfo={parsed.formatDescription}
            dialogueEntries={parsed.dialogueEntries}
            onSelect={(canonical, mergedVariants) => {
              let updatedParsed = parsed;
              if (mergedVariants && mergedVariants.length > 1) {
                const variantSet = new Set(mergedVariants);
                const updatedEntries = parsed.dialogueEntries.map((entry) => {
                  if (entry.type === "dialogue" && variantSet.has(entry.character)) {
                    return { ...entry, character: canonical };
                  }
                  return entry;
                });
                const updatedChars = parsed.characters.filter(
                  (c) => !variantSet.has(c) || c === canonical
                );
                updatedParsed = { ...parsed, dialogueEntries: updatedEntries, characters: updatedChars };
              }
              // Auto-merge prefix variants for ALL remaining characters
              // so partner characters are clean in voice settings and rehearsal
              updatedParsed = autoMergeAllCharacters(updatedParsed);
              setParsed(updatedParsed);
              setSelectedCharacter(canonical);
              setStep("tag");
            }}
          />
        )}

        {/* STEP: Scene tagging */}
        {step === "tag" && parsed && (
          <SceneTaggingStep
            allBreaks={parsed.breaks}
            dialogueEntries={parsed.dialogueEntries}
            selectedCharacter={selectedCharacter}
            rawText={rawText}
            onComplete={(confirmed) => {
              setFinalScenes(buildFinalScenes(parsed.dialogueEntries, confirmed));
              setActiveScene(0);
              setStep("view");
            }}
          />
        )}

        {/* STEP: Script viewer */}
        {step === "view" && finalScenes.length > 0 && (
          <div style={{ animation: "fadeIn 0.3s ease" }}>
            <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: 6, marginBottom: 10 }}>
              <div style={{ fontSize: 12, color: "#888" }}>
                Playing: <span style={{ color: GOLD, fontWeight: 700 }}>{selectedCharacter}</span>
              </div>
              <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
                {/* Zoom controls */}
                <button onClick={() => setZoom((z) => Math.max(0.8, +(z - 0.1).toFixed(1)))} style={BTN_SMALL} title="Zoom out">A-</button>
                <button onClick={() => setZoom((z) => Math.min(1.6, +(z + 0.1).toFixed(1)))} style={BTN_SMALL} title="Zoom in">A+</button>
                {!rehearsalActive && (
                  <>
                    <button onClick={() => setHideMyLines((h) => !h)} style={{ ...BTN_SMALL, color: hideMyLines ? GOLD : "#aaa" }} title={hideMyLines ? "Show my lines" : "Hide my lines"}>
                      {hideMyLines ? (
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ verticalAlign: "-1px" }}>
                          <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
                          <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
                          <line x1="1" y1="1" x2="23" y2="23"/>
                        </svg>
                      ) : (
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ verticalAlign: "-1px" }}>
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                          <circle cx="12" cy="12" r="3"/>
                        </svg>
                      )}
                    </button>
                    <button onClick={() => setVoiceSettingsOpen((o) => !o)} style={BTN_SMALL} title="Voice settings">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ verticalAlign: "-1px" }}>
                        <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
                        <path d="M15.54 8.46a5 5 0 0 1 0 7.07"/>
                        <path d="M19.07 4.93a10 10 0 0 1 0 14.14"/>
                      </svg>
                    </button>
                    <button onClick={() => setSearchOpen((o) => !o)} style={BTN_SMALL} title="Search script (Cmd+F)">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ verticalAlign: "-1px" }}>
                        <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                      </svg>
                    </button>
                    <button onClick={() => setStep("tag")} style={BTN_SMALL}>Edit Scenes</button>
                  </>
                )}
              </div>
            </div>

            {searchOpen && !rehearsalActive && (
              <SearchBar
                query={searchQuery}
                onQueryChange={(q) => { setSearchQuery(q); setActiveMatchIdx(0); }}
                matchCount={searchMatches.length}
                activeMatchIdx={activeMatchIdx}
                onNext={() => goToMatch(1)}
                onPrev={() => goToMatch(-1)}
                onClose={closeSearch}
              />
            )}

            {voiceSettingsOpen && !rehearsalActive && (
              <VoiceSettings
                characters={activePartnerCharacters}
                characterMeta={parsed?.characterMeta || {}}
                selectedCharacter={selectedCharacter}
                voiceMap={voiceMap}
                onVoiceChange={(charName, voice) => {
                  const overrides = loadVoiceOverrides();
                  overrides[charName] = voice.voiceURI;
                  saveVoiceOverrides(overrides);
                  setVoiceMap((prev) => ({ ...prev, [charName]: voice }));
                }}
                onReset={() => {
                  clearVoiceOverrides();
                  const map = buildVoiceMap(parsed.characters, parsed.characterMeta || {}, selectedCharacter);
                  setVoiceMap(map);
                }}
                onClose={() => setVoiceSettingsOpen(false)}
              />
            )}

            <ScriptStats scenes={finalScenes} selectedCharacter={selectedCharacter} />
            <SceneNav
              scenes={finalScenes}
              activeScene={activeScene}
              onSelect={(idx) => {
                if (rehearsalActive) {
                  setRehearsalLineId(null);
                  setRehearsalActive(false);
                }
                setActiveScene(idx);
              }}
              selectedCharacter={selectedCharacter}
            />
            <RehearsalEngine
              ref={rehearsalRef}
              scene={finalScenes[activeScene]}
              selectedCharacter={selectedCharacter}
              voiceMap={voiceMap}
              characterMeta={parsed?.characterMeta}
              deepgramKey={deepgramKey}
              onLineChange={(id) => {
                setRehearsalLineId(id);
                setRehearsalActive(!!id);
              }}
              onStop={() => {
                setRehearsalLineId(null);
                setRehearsalActive(false);
              }}
            />

            <ScriptViewer
              scene={finalScenes[activeScene]}
              selectedCharacter={selectedCharacter}
              searchQuery={searchOpen && !rehearsalActive ? searchQuery : ""}
              activeMatchLineId={rehearsalLineId || searchMatches[activeMatchIdx]?.lineId || null}
              highlightStyle={rehearsalLineId ? "rehearsal" : "search"}
              zoom={zoom}
              hideMyLines={hideMyLines}
              onLineClick={(lineId) => rehearsalRef.current?.startFrom(lineId)}
            />
          </div>
        )}
      </div>
    </div>
  );
}
