"use client";

import { useMemo } from "react";
import { classifyVoices } from "../lib/voice-map";
import { isSpeechSynthesisSupported } from "../lib/text-to-speech";

const GOLD = "#c9a227";

const GENDER_BADGE = {
  male: { label: "M", color: "#6a9fd8" },
  female: { label: "F", color: "#d87a9f" },
  unknown: { label: "?", color: "#888" },
};

const AGE_LABEL = { young: "Young", middle: "Mid", elderly: "Elder", unknown: "" };

export default function VoiceSettings({
  characters, characterMeta, selectedCharacter, voiceMap,
  onVoiceChange, onReset, onClose,
}) {
  const classified = useMemo(() => classifyVoices(), []);

  const allVoices = useMemo(() => {
    return classified.all.map((c) => c.voice);
  }, [classified]);

  // characters prop is already pre-filtered to active partners by page.jsx
  const partners = characters;

  const preview = (voice) => {
    if (!isSpeechSynthesisSupported()) return;
    speechSynthesis.cancel();
    const utt = new SpeechSynthesisUtterance("To be, or not to be, that is the question.");
    utt.voice = voice;
    utt.rate = 0.95;
    speechSynthesis.speak(utt);
  };

  if (!isSpeechSynthesisSupported() || allVoices.length === 0) {
    return (
      <div style={{ background: "#1a1a1a", border: "1px solid #333", borderRadius: 6, padding: 14, marginBottom: 10 }}>
        <div style={{ fontSize: 12, color: "#888", textAlign: "center" }}>
          No voices available in this browser.
        </div>
      </div>
    );
  }

  // Group voices for the select dropdown
  const femaleVoices = allVoices.filter((v) => {
    const c = classified.female.find((f) => f.voice.voiceURI === v.voiceURI);
    return !!c;
  });
  const maleVoices = allVoices.filter((v) => {
    const c = classified.male.find((m) => m.voice.voiceURI === v.voiceURI);
    return !!c;
  });
  const otherVoices = allVoices.filter((v) => {
    const inF = femaleVoices.includes(v);
    const inM = maleVoices.includes(v);
    return !inF && !inM;
  });

  return (
    <div style={{
      background: "#1a1a1a", border: "1px solid #333", borderRadius: 6,
      padding: "12px 14px", marginBottom: 10, animation: "fadeIn 0.2s ease",
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
        <div style={{ fontSize: 11, color: GOLD, letterSpacing: "0.15em", textTransform: "uppercase", fontWeight: 700 }}>
          Partner Voices
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          <button onClick={onReset} style={{
            padding: "2px 8px", fontSize: 10, background: "transparent",
            border: "1px solid #444", borderRadius: 3, color: "#888", cursor: "pointer", fontFamily: "inherit",
          }}>
            Reset
          </button>
          <button onClick={onClose} style={{
            padding: "2px 8px", fontSize: 10, background: "transparent",
            border: "1px solid #444", borderRadius: 3, color: "#888", cursor: "pointer", fontFamily: "inherit",
          }}>
            Close
          </button>
        </div>
      </div>

      {partners.map((char) => {
        const meta = characterMeta?.[char] || {};
        const currentVoice = voiceMap[char];
        const badge = GENDER_BADGE[meta.gender] || GENDER_BADGE.unknown;
        const age = AGE_LABEL[meta.ageRange] || "";

        return (
          <div key={char} style={{
            padding: "8px 0", borderBottom: "1px solid #222",
          }}>
            {/* Character name + badges */}
            <div style={{ marginBottom: 5 }}>
              <span style={{ fontSize: 12, color: "#ccc", textTransform: "uppercase", fontWeight: 600 }}>
                {char}
              </span>
              <span style={{
                marginLeft: 5, fontSize: 9, padding: "1px 4px",
                borderRadius: 2, background: badge.color + "22", color: badge.color,
                fontWeight: 700,
              }}>
                {badge.label}
              </span>
              {age && (
                <span style={{ marginLeft: 3, fontSize: 9, color: "#666" }}>{age}</span>
              )}
            </div>

            {/* Voice dropdown + preview — full width row */}
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <select
                value={currentVoice?.voiceURI || ""}
                onChange={(e) => {
                  const voice = allVoices.find((v) => v.voiceURI === e.target.value);
                  if (voice) onVoiceChange(char, voice);
                }}
                style={{
                  flex: 1, fontSize: 12, padding: "6px 8px",
                  background: "#222", color: "#ccc", border: "1px solid #444",
                  borderRadius: 4, fontFamily: "inherit", cursor: "pointer",
                  minHeight: 36,
                }}
              >
                {femaleVoices.length > 0 && (
                  <optgroup label="Female">
                    {femaleVoices.map((v) => (
                      <option key={v.voiceURI} value={v.voiceURI}>
                        {v.name}{v.localService ? "" : " (cloud)"}
                      </option>
                    ))}
                  </optgroup>
                )}
                {maleVoices.length > 0 && (
                  <optgroup label="Male">
                    {maleVoices.map((v) => (
                      <option key={v.voiceURI} value={v.voiceURI}>
                        {v.name}{v.localService ? "" : " (cloud)"}
                      </option>
                    ))}
                  </optgroup>
                )}
                {otherVoices.length > 0 && (
                  <optgroup label="Other">
                    {otherVoices.map((v) => (
                      <option key={v.voiceURI} value={v.voiceURI}>
                        {v.name}{v.localService ? "" : " (cloud)"}
                      </option>
                    ))}
                  </optgroup>
                )}
              </select>

              {/* Preview button */}
              <button
                onClick={() => currentVoice && preview(currentVoice)}
                title="Preview voice"
                style={{
                  flex: "0 0 auto", padding: "6px 10px",
                  background: "transparent", border: "1px solid #444",
                  borderRadius: 4, color: "#888", cursor: "pointer", fontFamily: "inherit",
                  minHeight: 36, display: "flex", alignItems: "center",
                }}
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
                  <polygon points="5 3 19 12 5 21 5 3"/>
                </svg>
              </button>
            </div>
          </div>
        );
      })}

      {meta_description(characterMeta, partners)}
    </div>
  );
}

function meta_description(characterMeta, partners) {
  const withMeta = partners.filter((c) => {
    const m = characterMeta?.[c];
    return m?.description;
  });
  if (withMeta.length === 0) return null;

  return (
    <div style={{ marginTop: 8, fontSize: 10, color: "#555", lineHeight: 1.5 }}>
      {withMeta.map((c) => (
        <div key={c}>
          <span style={{ color: "#777", textTransform: "uppercase" }}>{c}</span>
          {" — "}
          <span>{characterMeta[c].description}</span>
        </div>
      ))}
    </div>
  );
}
