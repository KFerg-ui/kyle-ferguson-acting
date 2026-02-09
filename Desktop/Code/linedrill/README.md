# 🎭 LineDrill — Your AI Scene Partner

An AI-powered line rehearsal app for actors. Upload a script, identify your character, tag your scenes, and (coming soon) drill your lines with voice-driven rehearsal and real-time scoring.

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

## Current Status: Phase 1 ✅

Phase 1 is complete and covers script upload, parsing, and scene management:

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
   - Scene navigation tabs with line counts
   - Stats: total lines, words, and scenes for your character

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
│   │   └── ScriptViewer.jsx    # Screenplay-formatted script display + stats + nav
│   ├── lib/
│   │   ├── ai-parser.js        # Claude Sonnet API integration for script analysis
│   │   ├── local-parser.js     # Regex fallback parser + merge logic
│   │   ├── file-readers.js     # PDF (pdfjs-dist), DOCX (mammoth), TXT readers
│   │   └── scene-helpers.js    # Scene building, preview, and dialogue extraction
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

## Phase 2 Roadmap: Rehearsal Engine

The next phase adds voice-driven line drilling. Here's the plan:

### New Dependencies (Phase 2)

| Service | Purpose | Monthly Cost (~45 min/day) |
|---------|---------|---------------------------|
| [Deepgram](https://deepgram.com) | Speech-to-text (your lines) | ~$3/mo |
| [ElevenLabs](https://elevenlabs.io) | Text-to-speech (other characters) | ~$22/mo |
| *or* Web Speech API + Google TTS | Free/cheap alternative | ~$5/mo total |

### Rehearsal Flow

1. Select a scene → tap "Start Rehearsal"
2. App reads other characters' lines aloud (TTS with distinct voices per character)
3. After ~1.5s pause → mic activates, listens for your line
4. Speech-to-text transcribes your words in real-time
5. Scoring engine compares transcription to script text
6. If you say "line" → app reads your next line, deducts 7 points, marks the spot
7. At scene end → score summary with problem spots highlighted

### Scoring System

- Start at **100%** for each scene run
- **-1 point** per missed/wrong word
- **-5 points** per skipped phrase or sentence
- **-7 points** per "line" call
- Uses fuzzy string matching (Levenshtein distance) to distinguish single-word misses from skipped phrases

### Progress Tracking

- Per-scene stats: best run, most recent run, average across all attempts
- Trouble spot tracking: lines where you consistently lose points
- All stored in browser localStorage (or a database for multi-device sync)

### Phase 2 Files to Create

```
src/
├── components/
│   ├── RehearsalEngine.jsx     # Main rehearsal UI and flow control
│   ├── ScoreDisplay.jsx        # Real-time and end-of-scene scoring
│   └── ProgressDashboard.jsx   # Per-scene progress tracking
├── lib/
│   ├── speech-to-text.js       # Deepgram or Web Speech API integration
│   ├── text-to-speech.js       # ElevenLabs or Google TTS integration
│   ├── scoring.js              # Word comparison, Levenshtein distance, point calculation
│   └── progress-store.js       # localStorage or DB-backed session tracking
```

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
