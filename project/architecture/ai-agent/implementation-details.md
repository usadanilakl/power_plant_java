# Jackson AI Agent - Implementation Details

## File Inventory

### Backend (8 files)

| File | Path | Purpose |
|------|------|---------|
| GeminiConfig | `config/GeminiConfig.java` | Spring config: creates Gemini `Client` bean + `geminiModelName` bean. Conditional on `gemini.api.key` property. Default model: `gemini-2.0-flash`. |
| AgentChatRequest | `dto/agent/AgentChatRequest.java` | Request DTO: `sessionId`, `message`, `confirmationId`, `confirmed` |
| AgentChatResponse | `dto/agent/AgentChatResponse.java` | Response DTO: `sessionId`, `message`, `type`, `data`, `confirmationId`, `pendingAction`. Inner class `PendingAction` (actionName, description, parameters). Static factories `text()`, `error()`. |
| AgentSessionManager | `sevice/agent/AgentSessionManager.java` | In-memory session store using `ConcurrentHashMap`. Tracks conversation history (`List<Content>`), pending actions, and pending action args per session. |
| GeminiService | `sevice/agent/GeminiService.java` | Core orchestrator. Routes Gemini function calls to search (immediate) or create (confirmation). Manages the Gemini conversation loop including FunctionResponse round-trips. |
| AgentFunctionDeclarations | `sevice/agent/AgentFunctionDeclarations.java` | Static `FunctionDeclaration` constants for all 8 tools. `getAllTools()` returns them wrapped in a `Tool` list. |
| AgentActionExecutor | `sevice/agent/AgentActionExecutor.java` | Bridges Gemini function calls to existing `NgXxxService` classes. Handles search execution, create execution, and static help text. |
| NgAgentController | `controller/angular/agent/NgAgentController.java` | REST endpoints: `POST /ng/agent/chat`, `GET /ng/agent/status`, `DELETE /ng/agent/session/{id}`. Wraps responses in `NgApiResponse<T>`. |

### Frontend (6 files)

| File | Path | Purpose |
|------|------|---------|
| AgentService | `services/agent/agent.service.ts` | HTTP wrapper: `chat()`, `checkStatus()`, `clearSession()`. Defines TS interfaces matching backend DTOs. |
| AgentChatService | `services/agent/agent-chat.service.ts` | Signal-based state management: `messages`, `isOpen`, `isLoading`, `isAvailable`, `sessionId`. Handles send/confirm/cancel flows. TTS via speechSynthesis. STT via Web Speech API (browser) and Vosk IPC (Electron). |
| AgentToggleComponent | `shared/agent/agent-toggle/agent-toggle.component.ts` | Header icon button (`smart_toy`). Hidden when agent unavailable. Toggles chat panel. |
| AgentChatPanelComponent | `shared/agent/agent-chat-panel/agent-chat-panel.component.ts` | Chat panel logic: send, confirm, cancel, auto-scroll. |
| Template | `shared/agent/agent-chat-panel/agent-chat-panel.component.html` | Chat UI: welcome message, message bubbles, confirmation cards, search result cards, typing indicator, input area. |
| Styles | `shared/agent/agent-chat-panel/agent-chat-panel.component.css` | Fixed right sidebar (400px, full height, z-index 999), slide-in animation, message bubbles, dark theme via CSS vars, responsive (100vw on mobile). |

### Modified Files (4)

| File | Change |
|------|--------|
| `pom.xml` | Added `com.google.genai:google-genai:1.1.0` dependency |
| `application-secrets.example.properties` | Added `gemini.api.key=YOUR_GEMINI_API_KEY` template |
| `layout/refactored/main-layout.component.ts` | Added imports for `AgentToggleComponent`, `AgentChatPanelComponent` |
| `layout/refactored/main-layout.component.html` | Added `<app-agent-toggle>` in header-actions, `<app-agent-chat-panel>` at end of layout |

---

## Gemini Function Declarations

8 functions declared in `AgentFunctionDeclarations.java`:

### Search Functions (execute immediately)
| Function | Required Params | Maps To |
|----------|----------------|---------|
| `searchFiles` | `query` | `NgFileService.complexSearch(query, 0, 10)` |
| `searchEquipment` | `query` | `NgEquipmentService.complexSearch(query, 0, 10)` |
| `searchLotoPoints` | `query` | `NgLotoPointService.complexSearch(query, 0, 10)` |
| `searchPermits` | (all optional: `status`, `companyName`, `personName`) | `NgDailyPermitPackageService.getAllDtos()` + in-memory filter |

### Create Functions (require confirmation)
| Function | Required Params | Maps To |
|----------|----------------|---------|
| `createLotoPoint` | `tagNumber`, `description` | `NgLotoPointService.processLotoPoint(LotoPointIdDto)` |
| `createLotoStandard` | `name` | `NgLotoStandardService.createStandard(LotoStandardIdDto)` |
| `createDailyPermitPackage` | `companyName`, `personName`, `date` | `NgDailyPermitPackageService.createDailyPermitPackage(DailyPermitPackageDto)` |

### Teaching Function
| Function | Required Params | Behavior |
|----------|----------------|----------|
| `getAppHelp` | `topic` | Returns static help text per topic, Gemini enriches with NL |

Topics covered: LOTO points, LOTO standards, permits, equipment, files/drawings, navigation/app overview.

---

## Conditional Bean Strategy

All agent beans use `@ConditionalOnProperty(name = "gemini.api.key")` — NOT `@ConditionalOnBean`.

**Why not `@ConditionalOnBean`:** Spring component scanning doesn't guarantee creation order between `@Service` and `@RestController`. A controller might be scanned before the service it depends on, causing the conditional check to fail even when the service would eventually be created.

**`@ConditionalOnProperty`** evaluates against the properties source directly — no ordering dependency. When the key is absent, all 4 agent beans are skipped:
- `GeminiConfig` (also uses `@ConditionalOnProperty`)
- `AgentSessionManager`
- `AgentActionExecutor`
- `GeminiService`
- `NgAgentController`

---

## System Prompt

Located in `GeminiService.SYSTEM_PROMPT`. Tells Gemini:
- Its name is Jackson
- It's an assistant for the Jackson Generation power plant app
- The 7 categories of actions it can perform
- Guidelines for behavior (concise, technical terminology, suggest alternatives when no results)
- App navigation routes
- Power plant context (gas-fired, two units, LOTO procedures, permit hierarchy)

---

## Frontend Chat Panel Design

- **Position:** Fixed right sidebar, 400px wide, full viewport height
- **Animation:** Slides in/out with CSS `transform: translateX` transition (0.3s)
- **Z-index:** 999 (above all content, below modals)
- **Message layout:** User bubbles right-aligned (accent color), assistant bubbles left-aligned (secondary bg)
- **Confirmation cards:** Show action description + parameters in key-value rows + Confirm/Cancel buttons
- **Search results cards:** Count badge + list of items (id, name/tagNumber, description)
- **Loading:** Three-dot typing animation
- **Input:** Auto-resize textarea, Enter to send, Shift+Enter for newline, disabled mic button placeholder
- **Responsive:** 100vw width on screens below 500px
- **Theme:** Uses CSS variables (--primary-background, --accent-color, etc.) — works with existing dark/light theme toggle

---

## API Endpoints

### POST /ng/agent/chat
**Request:** `AgentChatRequest`
```json
{
  "sessionId": "uuid-or-null",
  "message": "Find LOTO points for HRH",
  "confirmationId": null,
  "confirmed": false
}
```

**Response types:**

Text response:
```json
{
  "responseData": {
    "sessionId": "abc-123",
    "type": "text",
    "message": "Hello! How can I help you today?"
  }
}
```

Search results:
```json
{
  "responseData": {
    "sessionId": "abc-123",
    "type": "search_results",
    "message": "I found 3 LOTO points related to HRH...",
    "data": {
      "results": [
        {"id": "1", "tagNumber": "01-HRH-HV-0001", "description": "..."}
      ],
      "totalCount": 3
    }
  }
}
```

Confirmation required:
```json
{
  "responseData": {
    "sessionId": "abc-123",
    "type": "confirmation_required",
    "message": "I'd like to create LOTO point '01-HRH-HV-0099'. Should I proceed?",
    "confirmationId": "conf-uuid",
    "pendingAction": {
      "actionName": "createLotoPoint",
      "description": "create LOTO point '01-HRH-HV-0099' - Main steam valve",
      "parameters": {"tagNumber": "01-HRH-HV-0099", "description": "Main steam valve"}
    }
  }
}
```

Confirmation request:
```json
{
  "sessionId": "abc-123",
  "message": null,
  "confirmationId": "conf-uuid",
  "confirmed": true
}
```

### GET /ng/agent/status
Returns `{"responseData": true, "message": "Agent is available"}` if agent is active, 404 otherwise.

### DELETE /ng/agent/session/{sessionId}
Clears conversation history and pending actions for a session.

---

## Session Management

- Sessions are created on first message (backend generates UUID if none provided)
- Conversation history is stored in-memory (`ConcurrentHashMap<String, List<Content>>`)
- Pending actions stored separately (`ConcurrentHashMap<String, PendingAction>`)
- Sessions are cleared explicitly via DELETE endpoint or "Clear chat" button
- No automatic session expiry (future improvement)

---

## Search Result Simplification

Search results from existing services are simplified to `Map<String, Object>` before sending to Gemini to avoid bloated context. Only key fields are included:

| Search Type | Fields Sent to Gemini |
|-------------|----------------------|
| Files | id, name, fileNumber, fileLink |
| Equipment | id, tagNumber, description |
| LOTO Points | id, tagNumber, description, specificLocation |
| Permits | id, companyName, personName, date, permitNumber |

---

## TTS (Text-to-Speech)

Uses the `speechSynthesis` Web API — works in both browser and Electron Chromium with zero dependencies.

- **Speaker button** on each assistant message (`volume_up` icon, toggles to `stop` when playing)
- **Text cleaning** before speech: strips markdown formatting, code blocks, link syntax
- **Voice selection**: prefers English Natural voice, falls back to any en-US or en voice
- **Signals**: `isSpeaking`, `currentSpeakingMessageTimestamp` — tracks which message is being read
- **Overlap handling**: starting a new utterance cancels the current one
- **Cleanup**: `OnDestroy` in component stops speech when navigating away

---

## STT (Speech-to-Text)

### Browser (Web Speech API)
- Uses `SpeechRecognition` / `webkitSpeechRecognition` — free, zero dependencies
- **Supported**: Chrome, Edge, Safari. **Not supported**: Firefox, Electron.
- **Continuous mode** with interim results — user sees live transcript while speaking
- **Transcript preview strip** above input area shows live text with hearing icon
- **Flow**: Click mic -> speak -> live transcript appears -> click mic again to stop -> transcript fills input textarea -> user reviews and presses Enter to send
- **Signals**: `isRecording`, `sttSupported`, `transcriptBuffer`
- **Visual**: Mic button pulses red while recording, icon changes to `mic_off`

### Electron (Vosk — implemented)
- `SpeechRecognition` Web API does NOT work in Electron (no Google speech server)
- Uses **Vosk** (free, Apache 2.0, offline, ~50MB model for `vosk-model-small-en-us-0.15`)
- **Architecture**: Renderer captures audio via `getUserMedia` → AudioWorklet (PCM16 conversion) → IPC chunks → VoskManager in main process → partial/final results broadcast back via IPC
- **AudioWorklet** (`assets/audio/pcm-processor.js`): Modern replacement for deprecated ScriptProcessorNode. Runs on dedicated audio thread, converts Float32 [-1,1] samples to Int16 PCM.
- **VoskManager** (`electron-manager/src/main/managers/vosk.manager.ts`): Follows established manager pattern. Constructor takes `onResult`/`onError` callbacks. Lifecycle: `start()` → `feedAudio()` → `stop()` → `cleanup()`.
- **IPC channels**: `vosk:start`, `vosk:stop`, `vosk:get-status` (invoke/handle), `vosk:audio-chunk` (one-way send), `vosk:result`, `vosk:error` (broadcast)
- **Shared types**: `VoskResult { transcript, isFinal }`, `VoskStatus { available, listening, modelPath }`
- **Model path**: `<workingDir>/vosk-model/` — must be manually downloaded and extracted
- **Preload API**: `voskStart()`, `voskStop()`, `voskGetStatus()`, `voskSendAudio(buffer)`, `onVoskResult(cb)`, `onVoskError(cb)`
- **Dependency**: `vosk: ^0.3.45` in `electron-manager/package.json` (native N-API addon)
- `sttSupported` is set based on `voskGetStatus().available` (true when model directory exists)
