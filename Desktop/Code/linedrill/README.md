# 🎭 LineDrill — Your AI Scene Partner

An AI-powered line rehearsal app for actors. Upload a script, identify your character, tag your scenes, and drill your lines with voice-driven rehearsal and real-time scoring.

---

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Set up environment variables
cp .env.example .env.local
# Edit .env.local and add your Anthropic API key

# 3. Run dev server
npm run dev

# 4. Open http://localhost:3000
```

### Prerequisites

- **Node.js 18+**
- **Anthropic API key** — get one at [console.anthropic.com](https://console.anthropic.com/)
  - Used for AI-powered script parsing (Claude Sonnet)
  - Without this key, the app falls back to regex-based parsing (less accurate)

---

## Current Status: Phase 1 + Phase 2 Slice 1

Phase 1 (script upload, parsing, scene management) and Phase 2 Slice 1 (voice rehearsal with browser APIs) are complete.

### What Works Now

1. **Upload** — Drop a PDF, DOCX, or TXT script
2. **AI Parsing** — Claude Sonnet analyzes the script to detect characters, scene breaks (acts, scenes, slug lines), and format type
3. **Local Fallback** — Regex-based parser runs in parallel; results are merged with AI for maximum accuracy
4. **Character Selection** — Pick your character from the detected list
5. **Scene Tagging** — Interactive walkthrough of detected scene breaks:
   - Only shows scenes where your character has lines
   - Displays a preview of the first few lines after each break for context
   - Editable labels (e.g., "1.3") and scene names
   - Confirm, skip, or go back to re-tag
   - "View All" mode for quick bulk editing
6. **Script Viewer** — Screenplay-formatted display:
   - Character names centered in ALL CAPS
   - Your lines highlighted with gold accent
   - Stage directions in italicized blocks
   - Scene navigation tabs with user-defined scene titles and line counts
   - Stats: total lines, words, and scenes for your character
   - Search (Cmd+F) with cross-scene navigation and match highlighting
7. **Voice Rehearsal** (Chrome/Edge) — Drill your lines with voice:
   - Stage directions display briefly, then auto-advance
   - Partner lines read aloud via browser SpeechSynthesis
   - Your lines: mic activates, listens via Web Speech API, scores in real-time
   - Say "line" to hear your line read back (costs 7 points)
   - Early completion detection: advances as soon as you finish your line
   - End-of-scene score summary with per-line breakdown and trouble spots
   - Pause/resume and stop controls
   - Progress tracking: best score, average, run count per scene (localStorage)

---

## Project Structure

```
linedrill/
├── src/
│   ├── app/
│   │   ├── layout.jsx          # Root layout with global styles
│   │   └── page.jsx            # Main app (state machine & step orchestration)
│   ├── components/
│   │   ├── DropZone.jsx        # File upload with drag-and-drop
│   │   ├── StepIndicator.jsx   # Progress dots (Script → Character → Scenes → View)
│   │   ├── CharacterStep.jsx   # Character selection grid
│   │   ├── SceneTaggingStep.jsx # Interactive scene break confirmation
│   │   ├── ScriptViewer.jsx    # Screenplay display + search + scene nav + stats
│   │   └── RehearsalEngine.jsx # Voice rehearsal: TTS, STT, scoring, progress
│   ├── lib/
│   │   ├── ai-parser.js        # Claude Sonnet API integration for script analysis
│   │   ├── local-parser.js     # Regex fallback parser + merge logic
│   │   ├── file-readers.js     # PDF (pdfjs-dist), DOCX (mammoth), TXT readers
│   │   ├── scene-helpers.js    # Scene building, preview, and dialogue extraction
│   │   ├── scoring.js          # Word-level Levenshtein, line/scene scoring
│   │   ├── text-to-speech.js   # SpeechSynthesis wrapper (partner lines)
│   │   ├── speech-to-text.js   # Web Speech API wrapper (user lines)
│   │   └── progress-store.js   # localStorage rehearsal history
│   └── styles/
│       └── globals.css         # Tailwind directives + custom animations
├── .env.example                # Environment variable template
├── .gitignore
├── next.config.js
├── package.json
├── postcss.config.js
├── tailwind.config.js
└── README.md
```

---

## Architecture Notes

### Parsing Pipeline

The script parsing uses a two-pronged approach:

1. **AI Parser** (`ai-parser.js`) — Sends up to 25K characters of the script to Claude Sonnet with a detailed prompt that understands stage plays, screenplays, TV scripts, and musicals. Returns structured JSON with characters, break locations, and format type.

2. **Local Parser** (`local-parser.js`) — Regex-based parser that detects character names (CAPS: dialogue, CAPS on own line, etc.), scene breaks (ACT/SCENE/INT./EXT.), and stage directions. Runs instantly as a fallback.

3. **Merge** (`local-parser.js: mergeResults()`) — Combines both results. AI breaks are preferred (smarter detection), character lists are unioned, and the local parser provides the actual line-by-line dialogue entries that the AI doesn't do.

### State Machine

The app flows through four steps: `upload` → `character` → `tag` → `view`. Each step is a distinct UI component. The user can go back from `view` to `tag` to re-edit scenes.

### API Key Security

Currently, the Anthropic API key is exposed client-side via `NEXT_PUBLIC_*`. For production, you should:
1. Create an API route at `src/app/api/parse/route.js`
2. Move the Anthropic call server-side
3. Use `ANTHROPIC_API_KEY` (without `NEXT_PUBLIC_`) so it's never sent to the browser

---

## Phase 2: Rehearsal Engine

### Slice 1: Browser-Only Voice Rehearsal (Complete)

Uses free browser APIs — no external services or API costs:
- **SpeechSynthesis** (TTS) for reading partner lines aloud
- **Web Speech API** (STT) for listening to your lines (Chrome/Edge only)
- **Levenshtein scoring** for real-time accuracy feedback
- **localStorage** for progress persistence

#### How Rehearsal Works

1. Select a scene, tap "Start Rehearsal"
2. Stage directions display briefly (timed by word count), auto-advance
3. Partner lines read aloud via SpeechSynthesis, auto-advance
4. Your lines: mic activates, live transcript shown, scored against script
5. Say "line" to hear your line read back (-7 point penalty)
6. Early completion: advances as soon as your last words match the script
7. End of scene: score summary with per-line breakdown and trouble spots

#### Scoring

- Word-level Levenshtein distance → 0-100% per line
- "line" calls: -7 point penalty each
- Aggregate scene score weighted by line count

### Slice 2+ Roadmap (Not Started)

| Upgrade | Purpose | Benefit |
|---------|---------|---------|
| [Deepgram](https://deepgram.com) STT | Replace Web Speech API | Better accuracy, works in all browsers |
| [ElevenLabs](https://elevenlabs.io) TTS | Replace SpeechSynthesis | Higher quality, distinct character voices |
| Cue-only mode | Hide your lines entirely | Harder rehearsal mode |
| Multi-device sync | Supabase or similar | Progress available on any device |

---

## Phase 3+: Future Ideas

- **Different character voices** — Assign distinct ElevenLabs voices per character
- **Pause/resume** mid-rehearsal
- **Visual script follower** — Highlights current position in script as you go
- **Export trouble spots** — Generate a "cheat sheet" of your problem lines
- **Multi-device sync** — Supabase or similar for cloud storage
- **Cue-only mode** — Hide your lines entirely, only show cues

---

## Tech Stack

| Layer | Tech |
|-------|------|
| Framework | Next.js 14 (App Router) |
| Styling | Tailwind CSS + inline styles |
| AI Parsing | Claude Sonnet (Anthropic API) |
| PDF Reading | pdfjs-dist |
| DOCX Reading | mammoth |
| Font | Courier Prime (Google Fonts) |

---

## Development Tips for Claude Code

When working on this project with Claude Code in VS Code:

- **Testing parsing changes**: Keep a few sample scripts (PDF + DOCX) in a `test-scripts/` folder to quickly verify parser behavior
- **AI prompt tuning**: The AI parsing prompt is in `src/lib/ai-parser.js` — iterate on it if you encounter scripts that parse poorly
- **Adding Phase 2**: Start with `speech-to-text.js` using the Web Speech API (free, built into browsers) before integrating Deepgram — this lets you prototype without API costs
- **Mobile testing**: Use `npm run dev` with `--hostname 0.0.0.0` to test on your phone over local network

---

## License

Private project. Not for distribution.
