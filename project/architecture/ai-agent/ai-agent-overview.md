# Jackson AI Agent

## Overview
Jackson is the AI assistant for the Jackson Generation power plant management application. Using Google Gemini with function calling, it translates natural language into app actions — searching data, creating records, and teaching users about the app and plant operations.

The agent is accessible from any page via a floating chat sidebar in the Angular frontend.

## Supported Actions

### Data Search (immediate execution)
- **Files** — P&IDs, drawings, documents by name, number, system, type
- **Equipment** — by tag number, description, system, location
- **LOTO Points** — by tag number, description, location
- **Permits** — daily permit packages by status, company, person

### Data Creation (requires user confirmation)
- **LotoPoint** — new isolation point with tag number, description, location
- **LotoStandard** — new reusable isolation procedure
- **DailyPermitPackage** — new permit package for a contractor on a date

### Teaching
- How to use app features (LOTO standards, permits, equipment, files, navigation)
- Power plant domain knowledge (LOTO procedures, permit workflows, equipment terminology)

## Architecture

```
[User] <-> [Angular Chat Sidebar] <-> [Spring Boot /ng/agent/* API] <-> [GeminiService] <-> [Gemini API]
                                              |
                                      [AgentActionExecutor] --> existing NgXxxService classes
```

- Backend orchestrates all Gemini communication (frontend never talks to Gemini directly)
- Gemini function calling: backend receives function_call, validates, executes or asks confirmation
- Search actions execute immediately; create actions require user confirmation in chat
- Session state (conversation history + pending confirmations) held in-memory on backend
- Feature auto-disables when `gemini.api.key` is not configured

## Safety Model

All write operations go through a confirmation flow:
1. Gemini returns a `functionCall` for a create action
2. Backend stores it as a `PendingAction` (not executed)
3. Frontend shows confirmation card with parameters + Confirm/Cancel buttons
4. User clicks Confirm -> backend executes the action
5. User clicks Cancel -> action is discarded

Search actions are read-only and execute immediately without confirmation.

## Data Flow

```
User types message
  -> Frontend adds to message list, calls POST /ng/agent/chat
    -> GeminiService sends message + tool declarations to Gemini API
      -> Gemini responds with either:
         (a) Plain text -> return as-is
         (b) functionCall for search -> execute immediately, send results back to Gemini for NL summary
         (c) functionCall for create -> store as pending, return confirmation_required to frontend
  -> Frontend displays response (text / search results card / confirmation card)

User confirms action
  -> Frontend calls POST /ng/agent/chat with confirmationId + confirmed=true
    -> GeminiService retrieves pending action, executes via ActionExecutor
    -> Returns action_completed with success/failure message
```

## Configuration

### Prerequisites
Add Gemini API key to `application-secrets.properties` (gitignored):
```properties
gemini.api.key=YOUR_ACTUAL_API_KEY
```

### Optional
Override default model in `application.properties`:
```properties
gemini.model=gemini-2.0-flash
```

### Feature Toggle
When `gemini.api.key` is absent, all agent beans are skipped via `@ConditionalOnProperty`. The frontend toggle button is hidden, and `GET /ng/agent/status` returns 404.

## Dependency
```xml
<dependency>
    <groupId>com.google.genai</groupId>
    <artifactId>google-genai</artifactId>
    <version>1.1.0</version>
</dependency>
```
