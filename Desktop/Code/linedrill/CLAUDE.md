# LineDrill — Dev Notes for Claude Code

## What This Is
AI-powered line rehearsal app for actors. Upload a script (PDF/DOCX/TXT), pick your character, tag your scenes, view formatted script, and drill your lines with voice-driven rehearsal. Phase 1 complete, Phase 2 Slice 1 (voice rehearsal with browser APIs) complete.

## Tech Stack
- Next.js 14 (App Router), React 18, Tailwind CSS
- pdfjs-dist (PDF extraction), mammoth (DOCX extraction)
- Claude Sonnet API (AI script parsing — client-side, needs server-side migration)
- Font: Courier Prime. Theme: dark (#111) + gold (#c9a227)

## Architecture
**4-step state machine** in `src/app/page.jsx`: upload → character → tag → view

**Parsing pipeline** (two-pronged):
1. `ai-parser.js` — sends first 25K chars to Claude Sonnet, returns characters + scene breaks + format
2. `local-parser.js` — regex fallback, detects characters/breaks/dialogue line-by-line
3. `mergeResults()` — union characters, prefer AI breaks, use local dialogue entries

**Key components:**
- `DropZone.jsx` — file upload (drag-drop + click). Resets input before opening picker (Safari compat).
- `CharacterStep.jsx` — character selection grid
- `SceneTaggingStep.jsx` — step-by-step or bulk scene confirmation. Keyboard: Enter=confirm, Esc=skip.
- `ScriptViewer.jsx` — screenplay-formatted display with scene nav tabs, stats, search (Cmd+F), scroll reset + fade on switch. Exports: `SceneNav`, `ScriptViewer`, `ScriptStats`, `SearchBar`.
- `RehearsalEngine.jsx` — voice-driven rehearsal with state machine (idle → direction → partner → listening → done). TTS for partner lines, STT for user lines, Levenshtein scoring.

**Rehearsal support libs:**
- `scoring.js` — `normalizeForScoring()`, word-level Levenshtein, `scoreLine()`, `isLineComplete()`, `scoreScene()`
- `text-to-speech.js` — `TextToSpeech` class wrapping SpeechSynthesis. Prefers local English voices, rate 0.95, Chrome/iOS workarounds.
- `speech-to-text.js` — `SpeechToText` class wrapping Web Speech API. Continuous mode, interim results, auto-restart on unexpected end, silence timeout (8s no results / 4s gap).
- `progress-store.js` — localStorage wrapper. Key: `"linedrill:progress"` → `{ [character::sceneLabel]: { runs: [...] } }`. Keeps last 50 runs per scene.

## Critical Implementation Details

### PDF Worker
The pdfjs-dist web worker is served from `public/pdf.worker.min.js` (same origin).
**Do NOT use a CDN URL** — browsers block cross-origin Web Workers, causing a silent hang.
If you update pdfjs-dist, re-copy: `cp node_modules/pdfjs-dist/build/pdf.worker.min.js public/`

### File Input Reset (Safari)
Do NOT clear `input.value` in the `onChange` handler — Safari invalidates the File object.
Instead, clear it in the `onClick` *before* opening the picker. See `DropZone.jsx:26-31`.

### API Key Security
`NEXT_PUBLIC_ANTHROPIC_API_KEY` is exposed client-side. For production, move to a server-side
API route at `src/app/api/parse/route.js` using `ANTHROPIC_API_KEY` (without NEXT_PUBLIC_).

### Scene Tagging Guards
- `finish()` is no-op when 0 scenes confirmed (prevents empty viewer)
- "Finish early" button hidden when confirmedCount === 0
- "Done" button shows "Select at least one scene" when disabled

### Rehearsal Engine
- **Browser support**: SpeechRecognition is Chrome/Edge only. SpeechSynthesis works in all modern browsers. Show unsupported message gracefully on Safari/Firefox.
- **iOS quirk**: SpeechSynthesis needs a user gesture — the "Start Rehearsal" button click satisfies this.
- **Scene switching**: Changing scenes auto-stops rehearsal (clears TTS/STT, resets state to idle). Handled in both `page.jsx` (SceneNav onSelect) and `RehearsalEngine.jsx` (useEffect on scene.label).
- **"line" command**: When user says "line" as the sole word → TTS reads their line back, -7 point penalty, re-listens.
- **Early completion**: `isLineComplete()` checks if last 2-3 spoken words match the tail of the expected line AND 70%+ word coverage. Triggers immediate advance instead of waiting for silence timeout.
- **Progress persistence**: Runs saved to localStorage via `progress-store.js`. Idle state shows per-mode stats (standard: best/avg score; speed: best time + score).
- **Speed Drill**: Mode selection on idle screen. Speed mode: `TextToSpeech({ rate: 1.3 })`, 1s direction display, 400ms advance delay, running `drillTimer` via `setInterval`, per-line response time via `cueEndTimeRef`. Progress stored under separate `::speed` key. "Run Again" preserves current mode; scene switch/stop resets to mode picker.

### Parser Continuation Logic
- PDF page boundaries insert `\n\n` which creates blank lines in the text.
- Blank lines in `local-parser.js` trigger `flush()` which clears `currentCharacter`.
- **Fix**: After classifying a line as a stage direction, check if the previous entry was dialogue and the current line starts lowercase OR the previous dialogue ended without terminal punctuation. If so, treat as a continuation of that dialogue instead.

## Bug Fix History (Feb 2025 session)

### Bugs Fixed
1. **PDF worker hang** — CDN cross-origin worker blocked by browser. Fixed: serve from `public/`.
2. **Safari File invalidation** — `e.target.value = ""` after onChange revoked File data. Fixed: clear before click.
3. **File readers swallowing errors** — readers caught errors and returned `""`, giving generic "Couldn't extract" message. Fixed: throw real errors with descriptive messages.
4. **Empty scenes = stuck UI** — skipping all scenes → `finalScenes=[]` → nothing renders. Fixed: guard `finish()`, disable button.
5. **AI parser silent HTTP failures** — no `response.ok` check, so 401/429 gave cryptic JSON parse errors. Fixed: check status, surface API error message.
6. **ScriptViewer scroll position persists** — switching tabs kept old scroll. Fixed: reset scrollTop on scene change.
7. **"Finish early (0 confirmed)"** — button showed even with nothing confirmed. Fixed: only show when confirmedCount > 0.
8. **useEffect missing deps** — edit fields could go stale. Fixed: added `cur?.name`, `cur?.label` to deps.

### Polish Added
1. **Keyboard shortcuts** — Enter=confirm, Esc=skip in SceneTaggingStep
2. **SceneNav auto-scroll** — active tab scrolls into view
3. **Scene fade transition** — 0.25s fadeIn animation on scene switch
4. **Cleaner file readers** — shared `readAsArrayBuffer()` helper, proper reject on errors, 30s timeout on PDF

## Phase 2 Session (Feb 2026)

### Features Built
1. **Script search** — Cmd+F opens search bar, highlights matches, navigates across scenes with prev/next
2. **Voice rehearsal engine** — full rehearsal flow with browser Speech APIs and Levenshtein scoring
3. **Early line completion** — detects when user has finished their line by matching tail words, advances immediately
4. **Progress tracking** — localStorage persistence, shows best/avg/run count per scene
5. **Scene title display** — SceneNav tabs show user-defined titles instead of numeric labels
6. **Auto-stop on scene switch** — changing scenes during rehearsal auto-stops TTS/STT and resets
7. **Speed Drill mode** — timed rehearsal variant: 1.3x TTS, 1s direction flash, running timer, per-line response times, separate progress tracking

### Bugs Fixed
1. **PDF page-break splitting** — long speeches crossing pages were split into stage directions. Fixed: continuation detection in `local-parser.js` checks lowercase start + missing terminal punctuation.
2. **Parser continuation double-negation** — first fix had `!/regex/.test() === false`, always true. Fixed: simplified to `startsLower || lastEndsMidSentence`.

## Phase 2 Status

### Slice 1: Browser-Only Voice Rehearsal (Complete)
- Web Speech API (STT) + SpeechSynthesis (TTS) + Levenshtein scoring
- Full rehearsal flow: directions → partner lines (TTS) → user lines (STT + scoring) → summary
- Progress persistence in localStorage
- Script search (Cmd+F) with cross-scene navigation
- Scene nav shows user-defined scene titles

### Slice 2: Speed Drill Mode (Complete)
- Mode selection UI: Standard vs Speed Drill cards with per-mode stats
- Speed Drill: 1.3x TTS rate, 1s direction display, 400ms inter-line delay
- Running timer with timerGlow animation during drill
- Per-line response time tracking (cue end → line finalized)
- ScoreSummary: time as hero metric (speed) vs score as hero (standard)
- Progress stored separately per mode (`::standard` / `::speed` key suffix)
- Legacy key fallback preserves existing standard-mode data

### Slice 3+ (Not Started)
- Deepgram STT for better accuracy and broader browser support
- ElevenLabs TTS for higher quality voices
- Distinct voices per character
- Cue-only mode (hide your lines)
- Multi-device sync

## Running
```bash
npm install
cp .env.example .env.local  # add NEXT_PUBLIC_ANTHROPIC_API_KEY
npm run dev                  # http://localhost:3000
```
