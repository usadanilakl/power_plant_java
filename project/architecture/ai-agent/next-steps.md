# Jackson AI Agent - Next Steps

## 1. STT (Speech-to-Text)

Allow users to speak to Jackson instead of typing.

### Browser (Web version)
- **Web Speech API** (`SpeechRecognition`) — built-in, free, no dependencies
- Supported in Chrome, Edge, Safari. Not supported in Firefox.
- Continuous or single-shot recognition
- Language detection available

### Electron (Desktop version)
- Web Speech API is **NOT available** in Electron (no Google speech server)
- **Vosk** — free, offline, open-source speech recognition
  - Models: ~50MB (lightweight) to ~1.8GB (accurate English model)
  - Runs locally, no internet required, no API costs
  - Node.js binding: `vosk` npm package
  - Works via IPC: Electron main process runs Vosk, renderer sends audio via `electronAPI`
- Alternative: **Whisper.cpp** (OpenAI Whisper ported to C++) — very accurate, larger models, more complex setup

### Implementation Plan
1. Add mic button to chat input area (already exists as disabled placeholder)
2. Detect runtime: `window.electronAPI` exists -> Electron path, else -> browser path
3. Browser: `navigator.mediaDevices.getUserMedia()` -> `SpeechRecognition` -> text to chat input
4. Electron: `navigator.mediaDevices.getUserMedia()` -> audio chunks via IPC -> Vosk in main process -> transcription back via IPC -> text to chat input
5. Visual feedback: mic button pulses red while recording, waveform optional

### Files to Create/Modify
- `frontend/src/app/services/agent/agent-chat.service.ts` — implement `startVoiceInput()`/`stopVoiceInput()`
- `electron-manager/src/main/stt/vosk-service.ts` — Vosk integration in Electron main process
- `electron-manager/src/shared/types.ts` — add STT IPC channel types
- `electron-manager/src/preload/preload.ts` — expose STT methods via contextBridge

---

## 2. TTS (Text-to-Speech)

Have Jackson speak responses aloud.

### Browser (Web version)
- **Web Speech API** (`speechSynthesis`) — built-in, free
- Works in all major browsers including Electron's Chromium
- Multiple voices available, rate/pitch configurable

### Electron (Desktop version)
- `speechSynthesis` **does work** in Electron (unlike SpeechRecognition)
- Can use browser API directly — no need for a separate library
- Alternative for better quality: **say.js** — uses OS-native TTS (Windows SAPI, macOS say, Linux espeak)
  - Better voice quality than Chromium's speechSynthesis on Windows
  - `npm install say`
  - Runs in main process, no complex setup

### Implementation Plan
1. Add speaker icon button to each assistant message
2. Browser + Electron: Use `speechSynthesis` API first (simplest, works everywhere)
3. Optional Electron upgrade: Use `say.js` via IPC for better voice quality
4. Auto-read option: toggle in settings to automatically speak new responses
5. Stop-speaking button while audio is playing

### Files to Create/Modify
- `frontend/src/app/services/agent/agent-chat.service.ts` — implement `speakMessage()`
- `agent-chat-panel.component.html` — add speaker icon to assistant messages
- Optionally: `electron-manager/src/main/tts/say-service.ts` for say.js integration

---

## 3. AI Performance - Local Lingo & Domain Knowledge

Improve Jackson's understanding of plant-specific terminology and conversational patterns.

### Problem
Users will use shorthand, abbreviations, and plant-specific jargon that Gemini won't understand:
- "HRH" = Hot Reheat system
- "CRH" = Cold Reheat system
- "BFP" = Boiler Feed Pump
- "CT" = Combustion Turbine (or Cooling Tower — context dependent)
- "HRSG" = Heat Recovery Steam Generator
- "CEMS" = Continuous Emissions Monitoring System
- "FGD" = Flue Gas Desulfurization
- "DCS" = Distributed Control System
- "MCC" = Motor Control Center
- "SLD" = Single Line Diagram
- "01-" prefix = Unit 01, "02-" prefix = Unit 02
- "hot side" / "cold side" = steam temperature zones
- Tag format: `{unit}-{system}-{type}-{seq}` (e.g., `01-HRH-HV-0001`)

### Approach: Enhanced System Prompt
Expand `GeminiService.SYSTEM_PROMPT` with:

1. **Abbreviation glossary** — map abbreviations to full terms so Gemini can interpret queries
2. **Tag number format** — explain the tagging convention so Gemini can parse partial queries
3. **System hierarchy** — list plant systems and their relationships
4. **Common user patterns** — examples of how operators phrase requests:
   - "Pull up the HRH P&ID" -> searchFiles with query "HRH P&ID"
   - "What valves are on the hot reheat?" -> searchEquipment with query "HRH"
   - "Lock out the BFP" -> searchLotoPoints with query "BFP"
   - "New package for ABB tomorrow" -> createDailyPermitPackage

### Approach: Few-Shot Examples
Add example conversations to the system prompt showing how Jackson should handle real queries. This teaches Gemini the mapping between user slang and function calls.

### Approach: Dynamic Context (Future)
Load plant-specific data at startup and inject into system prompt:
- List of all systems from equipment table
- List of all company names from permit packages
- Common tag number prefixes
This keeps the prompt current as data changes.

### Files to Modify
- `sevice/agent/GeminiService.java` — expand `SYSTEM_PROMPT`
- Optionally: create `sevice/agent/AgentPromptBuilder.java` to dynamically build prompts from DB data

---

## 4. Additional Improvements

### Session Expiry
- Add TTL to sessions (e.g., 30 minutes of inactivity)
- Use a scheduled task to clean up expired sessions
- Prevents memory leak from abandoned sessions

### Conversation Context Window
- Gemini has token limits; long conversations will fail
- Implement sliding window: keep last N messages + system prompt
- Or summarize older messages before sending

### Error Recovery
- If Gemini API is down or rate-limited, show user-friendly message
- Retry logic with exponential backoff for transient errors
- Fallback: disable agent temporarily and re-check periodically

### Search Result Navigation
- Make search results clickable — navigate to the item in the app
- E.g., clicking a LOTO point result navigates to `/loto-points?id=123`
- Requires adding route links to search result cards in the frontend

### Expand Create Actions
- Create new File records
- Create new Equipment records
- Modify existing records (update description, location, etc.)
- Each new action needs: FunctionDeclaration + ActionExecutor method + service call

### Voice Wake Word (Future)
- "Hey Jackson" wake word detection
- Always-listening microphone with low-power wake word model
- Only practical in Electron (not web browser background tabs)

---

## Priority Order

| Priority | Item | Effort | Impact |
|----------|------|--------|--------|
| 1 | Local lingo / system prompt enhancement | Low | High — directly improves search accuracy |
| 2 | TTS (speechSynthesis) | Low | Medium — hands-free response reading |
| 3 | STT browser (Web Speech API) | Low | Medium — voice input for web users |
| 4 | Search result navigation | Low | Medium — clickable results |
| 5 | Session expiry | Low | Low — prevents memory leaks |
| 6 | STT Electron (Vosk) | Medium | Medium — voice input for desktop users |
| 7 | Conversation context window | Medium | Medium — prevents long conversation failures |
| 8 | Expand create actions | Medium | Medium — more things Jackson can do |
| 9 | Dynamic context from DB | Medium | Medium — keeps prompt current |
| 10 | Voice wake word | High | Low — novelty feature |
