"use client";

import { useState, useCallback } from "react";
import DropZone from "../components/DropZone";
import StepIndicator from "../components/StepIndicator";
import CharacterStep from "../components/CharacterStep";
import SceneTaggingStep from "../components/SceneTaggingStep";
import { SceneNav, ScriptViewer, ScriptStats } from "../components/ScriptViewer";

import { readScriptFile } from "../lib/file-readers";
import { analyzeScriptWithAI } from "../lib/ai-parser";
import { localParseScript, mergeResults } from "../lib/local-parser";
import { buildFinalScenes } from "../lib/scene-helpers";

const GOLD = "#c9a227";
const BTN_SMALL = {
  padding: "4px 12px", borderRadius: 4, border: "1px solid #444",
  background: "transparent", color: "#aaa", fontSize: 11, cursor: "pointer", fontFamily: "inherit",
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
    setStep("upload");
    setParsed(null);
    setSelectedCharacter("");
    setFinalScenes([]);
    setActiveScene(0);
    setFileName("");
    setError("");
    setRawText("");
  };

  return (
    <div style={{ minHeight: "100vh" }}>
      <div style={{ maxWidth: 640, margin: "0 auto", padding: "28px 16px", animation: "fadeIn 0.4s ease" }}>
        {/* Header */}
        <header style={{ textAlign: "center", marginBottom: 24 }}>
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
            <span style={{ fontSize: 12, color: "#999" }}>📄 {fileName}</span>
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
            onSelect={(c) => {
              setSelectedCharacter(c);
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
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
              <div style={{ fontSize: 12, color: "#888" }}>
                Playing: <span style={{ color: GOLD, fontWeight: 700 }}>{selectedCharacter}</span>
              </div>
              <button onClick={() => setStep("tag")} style={BTN_SMALL}>Edit Scenes</button>
            </div>

            <ScriptStats scenes={finalScenes} selectedCharacter={selectedCharacter} />
            <SceneNav scenes={finalScenes} activeScene={activeScene} onSelect={setActiveScene} selectedCharacter={selectedCharacter} />
            <ScriptViewer scene={finalScenes[activeScene]} selectedCharacter={selectedCharacter} />

            {/* Phase 2 placeholder */}
            <div style={{
              marginTop: 24, textAlign: "center", padding: "16px",
              border: "1px dashed #444", borderRadius: 6,
            }}>
              <p style={{ fontSize: 13, color: GOLD, fontWeight: 700, marginBottom: 3 }}>🎙️ REHEARSAL MODE</p>
              <p style={{ color: "#777", fontSize: 11 }}>Voice-driven line drilling — Phase 2</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
