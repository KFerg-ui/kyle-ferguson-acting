# LineDrill — Dev Notes for Claude Code

## What This Is
AI-powered line rehearsal app for actors. Upload a script (PDF/DOCX/TXT), pick your character, tag your scenes, view formatted script. Phase 2 (voice rehearsal) not yet built.

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
- `ScriptViewer.jsx` — screenplay-formatted display with scene nav tabs, stats, scroll reset + fade on switch

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

## Phase 2 Roadmap (Not Started)
Voice-driven rehearsal: speech-to-text (Deepgram/Web Speech API), text-to-speech (ElevenLabs/Google TTS),
scoring engine (Levenshtein), progress tracking (localStorage). See README.md for full details.

## Running
```bash
npm install
cp .env.example .env.local  # add NEXT_PUBLIC_ANTHROPIC_API_KEY
npm run dev                  # http://localhost:3000
```
