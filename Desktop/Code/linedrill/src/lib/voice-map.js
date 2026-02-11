/**
 * Voice Map — assigns distinct browser TTS voices to characters
 * based on AI-inferred gender/age metadata.
 */

import { isSpeechSynthesisSupported } from "./text-to-speech";

// macOS novelty/robotic voices — these sound terrible for dialogue
const BLOCKED_VOICES = new Set([
  "agnes", "albert", "bad news", "bahh", "bells", "boing", "bruce",
  "bubbles", "cellos", "deranged", "fred", "good news", "hysterical",
  "junior", "jester", "kathy", "organ", "pipe organ", "princess",
  "ralph", "superstar", "trinoids", "whisper", "wobble", "zarvox",
]);

// Known voice name → gender map (covers macOS, Windows, Chrome)
// Only includes voices that sound natural for dialogue
const KNOWN_VOICES = {
  // macOS / iOS — natural voices
  samantha: "female", karen: "female", moira: "female", victoria: "female",
  tessa: "female", fiona: "female", veena: "female", allison: "female",
  ava: "female", joelle: "female", kate: "female", serena: "female",
  shelley: "female", sandy: "female", susan: "female", catherine: "female",
  daniel: "male", alex: "male", tom: "male", oliver: "male",
  lee: "male", rishi: "male", jamie: "male", liam: "male", gordon: "male",
  // Windows
  zira: "female", hazel: "female", jenny: "female", aria: "female", sara: "female",
  david: "male", mark: "male", george: "male", james: "male", richard: "male",
  ryan: "male", guy: "male",
  // Chrome / generic
  "google uk english female": "female",
  "google uk english male": "male",
  "google us english": "female",
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

function isBlockedVoice(voiceName) {
  const lower = voiceName.toLowerCase();
  for (const blocked of BLOCKED_VOICES) {
    // Match exact name or name before parenthetical like "Fred (Enhanced)"
    if (lower === blocked || lower.startsWith(blocked + " ")) return true;
  }
  return false;
}

function voiceQuality(v) {
  // Enhanced/Premium variants are higher quality downloads
  const name = v.name.toLowerCase();
  if (name.includes("enhanced") || name.includes("premium")) return 3;
  // Local voices are generally better than cloud
  if (v.localService) return 2;
  return 1;
}

export function classifyVoices() {
  if (!isSpeechSynthesisSupported()) return { female: [], male: [], unknown: [], all: [] };

  const voices = speechSynthesis.getVoices();
  const english = voices.filter((v) => v.lang.startsWith("en"));

  const classified = english.map((v) => ({
    voice: v,
    gender: inferVoiceGender(v.name),
    local: v.localService,
    novelty: isBlockedVoice(v.name),
  }));

  // Sort: enhanced > local > cloud, novelty voices last
  const sort = (arr) => arr.sort((a, b) => {
    if (a.novelty !== b.novelty) return a.novelty ? 1 : -1;
    return voiceQuality(b.voice) - voiceQuality(a.voice);
  });

  return {
    female: sort(classified.filter((c) => c.gender === "female")),
    male: sort(classified.filter((c) => c.gender === "male")),
    unknown: sort(classified.filter((c) => c.gender === "unknown")),
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

    // Filter out novelty voices for auto-assignment (users can still pick them manually)
    const naturalOnly = (arr) => arr.filter((p) => !p.novelty);

    if (meta.gender === "female" && classified.female.length > 0) {
      pool = naturalOnly(classified.female);
      usedSet = usedFemale;
    } else if (meta.gender === "male" && classified.male.length > 0) {
      pool = naturalOnly(classified.male);
      usedSet = usedMale;
    } else {
      pool = naturalOnly(classified.all);
      usedSet = usedMale;
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
