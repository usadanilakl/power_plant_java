# Jackson AI Agent - Next Steps

## 1. STT (Speech-to-Text)

Allow users to speak to Jackson instead of typing.

### Browser (Web version)
- **Web Speech API** (`SpeechRecognition`) — built-in, free, no dependencies
- Supported in Chrome, Edge, Safari. Not supported in Firefox.
- Continuous or single-shot recognition
- Language detection available

### Electron (Desktop version) — DONE
- Web Speech API is **NOT available** in Electron (no Google speech server)
- **Vosk** — free (Apache 2.0), offline, open-source speech recognition
  - Model: `vosk-model-small-en-us-0.15` (~50MB), must be placed at `<workingDir>/vosk-model/`
  - Runs locally, no internet required, no API costs
  - Node.js binding: `vosk` npm package (native N-API addon)
  - Audio pipeline: `getUserMedia` → AudioWorklet (PCM16) → IPC → VoskManager → results back via IPC

### Implementation (Completed)

#### Files Created
- `electron-manager/src/main/managers/vosk.manager.ts` — VoskManager (load model, start/stop recognizer, feed audio, emit results)
- `frontend/src/assets/audio/pcm-processor.js` — AudioWorklet processor (Float32 → Int16 PCM conversion on audio thread)

#### Files Modified
- `electron-manager/src/main/ipc/events.ts` — added 6 Vosk IPC channel constants
- `electron-manager/src/shared/types.ts` — added `VoskResult`, `VoskStatus` interfaces
- `electron-manager/src/main/ipc/handlers.ts` — added VoskManager field, initialization, `registerVoskHandlers()`, cleanup
- `electron-manager/src/main/preload/main.preload.ts` — exposed 6 Vosk API methods via contextBridge
- `electron-manager/package.json` — added `vosk: ^0.3.45` dependency
- `frontend/src/app/services/agent/agent-chat.service.ts` — replaced Electron STT stubs with real AudioWorklet + Vosk IPC implementation

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

| Priority | Item | Status | Effort | Impact |
|----------|------|--------|--------|--------|
| ~~1~~ | ~~TTS (speechSynthesis)~~ | Done | Low | Medium |
| ~~2~~ | ~~STT browser (Web Speech API)~~ | Done | Low | Medium |
| 3 | Local lingo / system prompt enhancement | Pending | Low | High — directly improves search accuracy |
| 4 | Search result navigation | Pending | Low | Medium — clickable results |
| 5 | Session expiry | Pending | Low | Low — prevents memory leaks |
| ~~6~~ | ~~STT Electron (Vosk)~~ | Done | Medium | Medium — voice input for desktop users |
| 7 | Conversation context window | Pending | Medium | Medium — prevents long conversation failures |
| 8 | Expand create actions | Pending | Medium | Medium — more things Jackson can do |
| 9 | Dynamic context from DB | Pending | Medium | Medium — keeps prompt current |
| 10 | Voice wake word | Pending | High | Low — novelty feature |
