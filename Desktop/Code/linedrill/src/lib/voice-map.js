/**
 * Voice Map — assigns distinct browser TTS voices to characters
 * based on AI-inferred gender/age metadata.
 */

import { isSpeechSynthesisSupported } from "./text-to-speech";

// Known voice name → gender map (covers macOS, Windows, Chrome)
const KNOWN_VOICES = {
  // macOS / iOS
  samantha: "female", karen: "female", moira: "female", victoria: "female",
  tessa: "female", fiona: "female", veena: "female", allison: "female",
  ava: "female", joelle: "female", kate: "female", serena: "female",
  daniel: "male", alex: "male", fred: "male", tom: "male", oliver: "male",
  lee: "male", ralph: "male", bruce: "male", junior: "male", albert: "male",
  // Windows
  zira: "female", hazel: "female", susan: "female", catherine: "female",
  jenny: "female", aria: "female", sara: "female",
  david: "male", mark: "male", george: "male", james: "male", richard: "male",
  ryan: "male", guy: "male",
  // Chrome / generic
  "google uk english female": "female",
  "google uk english male": "male",
};

function inferVoiceGender(voiceName) {
  const lower = voiceName.toLowerCase();
  for (const [key, gender] of Object.entries(KNOWN_VOICES)) {
    if (lower.includes(key)) return gender;
  }
  if (/\bfemale\b/i.test(voiceName)) return "female";
  if (/\bmale\b/i.test(voiceName)) return "male";
  return "unknown";
}

export function classifyVoices() {
  if (!isSpeechSynthesisSupported()) return { female: [], male: [], unknown: [], all: [] };

  const voices = speechSynthesis.getVoices();
  const english = voices.filter((v) => v.lang.startsWith("en"));

  const classified = english.map((v) => ({
    voice: v,
    gender: inferVoiceGender(v.name),
    local: v.localService,
  }));

  // Sort: local voices first (higher quality)
  const sort = (arr) => arr.sort((a, b) => (b.local ? 1 : 0) - (a.local ? 1 : 0));

  return {
    female: sort(classified.filter((c) => c.gender === "female")),
    male: sort(classified.filter((c) => c.gender === "male")),
    unknown: classified.filter((c) => c.gender === "unknown"),
    all: sort(classified),
  };
}

export function buildVoiceMap(characters, characterMeta, selectedCharacter, overrides = {}) {
  const classified = classifyVoices();
  const map = {};
  const partners = characters.filter((c) => c !== selectedCharacter);

  // Track used voice URIs per gender pool for round-robin
  const usedFemale = new Set();
  const usedMale = new Set();

  for (const char of partners) {
    // Check for user override first
    if (overrides[char]) {
      const allVoices = speechSynthesis.getVoices();
      const override = allVoices.find((v) => v.voiceURI === overrides[char]);
      if (override) { map[char] = override; continue; }
    }

    const meta = characterMeta?.[char] || { gender: "unknown" };
    let pool;
    let usedSet;

    if (meta.gender === "female" && classified.female.length > 0) {
      pool = classified.female;
      usedSet = usedFemale;
    } else if (meta.gender === "male" && classified.male.length > 0) {
      pool = classified.male;
      usedSet = usedMale;
    } else {
      // Unknown or empty pool — round-robin through all
      pool = classified.all;
      usedSet = usedMale; // shared tracker
    }

    const available = pool.filter((p) => !usedSet.has(p.voice.voiceURI));
    const pick = available[0] || pool[0];

    if (pick) {
      map[char] = pick.voice;
      usedSet.add(pick.voice.voiceURI);
    }
  }

  return map;
}

export function getPitchForCharacter(characterMeta, charName) {
  const meta = characterMeta?.[charName];
  if (!meta) return 1.0;
  switch (meta.ageRange) {
    case "young": return 1.1;
    case "elderly": return 0.85;
    default: return 1.0;
  }
}

// --- localStorage persistence for user overrides ---

const OVERRIDE_KEY = "linedrill:voiceOverrides";

export function saveVoiceOverrides(overrides) {
  try { localStorage.setItem(OVERRIDE_KEY, JSON.stringify(overrides)); } catch {}
}

export function loadVoiceOverrides() {
  try {
    const raw = localStorage.getItem(OVERRIDE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch { return {}; }
}

export function clearVoiceOverrides() {
  try { localStorage.removeItem(OVERRIDE_KEY); } catch {}
}
