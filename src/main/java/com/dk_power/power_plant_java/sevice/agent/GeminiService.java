package com.dk_power.power_plant_java.sevice.agent;

import com.dk_power.power_plant_java.dto.agent.AgentChatResponse;
import com.dk_power.power_plant_java.dto.agent.AgentChatResponse.PendingAction;
import com.google.genai.Client;
import com.google.genai.types.*;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Slf4j
@Service
@ConditionalOnProperty(name = "gemini.api.key")
public class GeminiService {

    private final Client geminiClient;
    private final String modelName;
    private final AgentSessionManager sessionManager;
    private final AgentActionExecutor actionExecutor;
    private final AgentSearchVocabulary searchVocabulary;

    private static final String BASE_systemPrompt = """
            You are Jackson, an AI assistant for the Jackson Generation power plant management application.
            You help plant operators and engineers with:
            1. Searching for files (P&IDs, drawings, documents) by name, number, system, or type
            2. Searching for LOTO (Lock Out Tag Out) isolation points AND equipment using searchLotoPoints
            3. Searching for work permits and daily permit packages
            4. Creating new LOTO points, LOTO standards, and daily permit packages (use assistLotoPointCreation for detailed creates)
            5. Teaching users how to use the application
            6. Answering questions about the power plant and its systems

            IMPORTANT SEARCH GUIDELINES:
            - Equipment and LOTO points are searched with the same function: searchLotoPoints.
              When a user asks about equipment, valves, pumps, breakers, or any physical plant component,
              use searchLotoPoints — it covers all isolation points and their associated equipment.
            - ALWAYS provide multiple query variations in the 'queries' array parameter.
              Power plant databases use heavy abbreviations. You MUST include abbreviated forms.
            - Generate at least 3-5 query variations: the original phrase, abbreviated forms matching the
              database naming patterns below, and key individual terms.
            - Example: user asks "find the boiler feed pump discharge valve" ->
              queries: ["boiler feed pump discharge valve", "BFP DISCH VLV", "BFP DISCH", "BFP", "boiler feed pump"]

            LOTO POINT CREATION GUIDELINES:
            - When a user wants to create a LOTO point, ALWAYS use assistLotoPointCreation. Extract as
              many fields as possible from the user's message. This starts an interactive creation flow.
            - Only use createLotoPoint for very simple quick creates with JUST a tag number and nothing else.

            FIELD EXTRACTION FROM USER MESSAGES:
            - Tag number: look for patterns like 01-VCND377, 02-MOVCND001, etc.
            - From tag number 01-VCND377: extract unit="01", equipmentType="V" (the prefix before system code)
            - Unit: "unit 1" or "unit 01" -> "01", "unit 2" or "unit 02" -> "02"
            - Equipment type: parse from tag prefix. V=Manual Valve, MOV=Motor Operated Valve,
              AOV=Air Operated Valve, PCV=Pressure Control Valve, PMP=Pump, etc.
            - Location: infer from context. "ACC" hints -> ACC-related location, "turbine hall" -> Turbine Hall
            - Specific location: physical location text like "under ACC", "near BFP discharge", "east wall"
            - Normal/Isolated position: drain valves are normally CLOSED/isolated CLOSED.
              Motor valves are often normally OPEN/isolated CLOSED.

            EXAMPLES:
            - "create LOTO point for unit 1 ACC loop seal drain under ACC tag 01-VCND377"
              -> assistLotoPointCreation(tagNumber="01-VCND377", description="ACC LOOP SEAL DRAIN",
                 unit="01", equipmentType="V", location="ACC", specificLocation="Under ACC")
            - "add a motor operated valve on the feedwater system, normally open, tag 01-MOVBFW025"
              -> assistLotoPointCreation(tagNumber="01-MOVBFW025", equipmentType="MOV",
                 unit="01", normalPosition="OPEN", isolatedPosition="CLOSED")

            General guidelines:
            - Be concise and helpful. Use technical power plant terminology appropriately.
            - When a user asks to search for something, use the appropriate search function.
            - When a user asks to create something, use the appropriate create function and confirm the parameters.
            - IMPORTANT: When search results are returned, provide ONLY a brief summary in your text response
              (e.g., "Found 15 LOTO points across Condensate, Feedwater, and Steam systems.").
              Do NOT list individual items — the app displays results in a separate interactive card.
              Your text should summarize the count, note which systems/areas were matched, and suggest
              refinements if results seem incomplete.
            - When no results are found, suggest alternative search terms.
            - You can help users navigate the app: Permit Builder (/permit-builder), LOTO Standards (/loto-standards),
              Equipment (/equipment), Files (/files), and more.

            Power plant context:
            - This is a gas-fired power plant with two units (Unit 01 and Unit 02).
            - LOTO (Lock Out Tag Out) is used for equipment isolation during maintenance.
            - A LOTO Standard is a reusable set of LOTO points for a specific isolation procedure.
            - Daily Permit Packages group all permits for a contractor on a given day.
            - The permit hierarchy is: Job Log -> Daily Permit Package -> individual permits (SafeWork, HotWork, ConfinedSpace, etc.)
            """;

    private final String systemPrompt;

    public GeminiService(Client geminiClient,
                         @Qualifier("geminiModelName") String modelName,
                         AgentSessionManager sessionManager,
                         AgentActionExecutor actionExecutor,
                         AgentSearchVocabulary searchVocabulary) {
        this.geminiClient = geminiClient;
        this.modelName = modelName;
        this.sessionManager = sessionManager;
        this.actionExecutor = actionExecutor;
        this.searchVocabulary = searchVocabulary;

        // Build full system prompt: base + data-driven vocabulary
        String vocab = searchVocabulary.getVocabularyPrompt();
        this.systemPrompt = vocab.isEmpty() ? BASE_systemPrompt : BASE_systemPrompt + vocab;

        log.info("[Gemini] Service initialized with model={}", modelName);
    }

    public AgentChatResponse chat(String sessionId, String userMessage) {
        try {
            if (sessionId == null || sessionId.isBlank()) {
                sessionId = sessionManager.createSession();
            }

            List<Content> history = sessionManager.getHistory(sessionId);

            Content userContent = Content.builder()
                    .role("user")
                    .parts(List.of(Part.builder().text(userMessage).build()))
                    .build();

            List<Content> contents = new ArrayList<>(history);
            contents.add(userContent);

            GenerateContentConfig config = GenerateContentConfig.builder()
                    .tools(AgentFunctionDeclarations.getAllTools())
                    .systemInstruction(Content.builder()
                            .parts(List.of(Part.builder().text(systemPrompt).build()))
                            .build())
                    .build();

            GenerateContentResponse response = geminiClient.models.generateContent(
                    modelName, contents, config);

            // Check for function calls
            List<FunctionCall> functionCalls = response.functionCalls();
            if (functionCalls != null && !functionCalls.isEmpty()) {
                FunctionCall functionCall = functionCalls.get(0);
                String funcName = functionCall.name().orElse("");
                Map<String, Object> args = functionCall.args().orElse(Map.of());

                log.info("[Agent] Function call: {}({})", funcName, args);

                if (actionExecutor.isWizardAssist(funcName)) {
                    return handleWizardAssist(sessionId, userContent, response, funcName, args);
                } else if (actionExecutor.isCreateAction(funcName)) {
                    return handleCreateAction(sessionId, userContent, response, funcName, args);
                } else {
                    return handleSearchAction(sessionId, userContent, response, funcName, args, contents, config);
                }
            }

            // Plain text response
            String text = response.text();
            sessionManager.addToHistory(sessionId, userContent);
            sessionManager.addToHistory(sessionId, getModelContent(response));

            return AgentChatResponse.text(sessionId, text);

        } catch (Exception e) {
            log.error("[Agent] Error in chat", e);
            return AgentChatResponse.error(sessionId, "Sorry, I encountered an error: " + e.getMessage());
        }
    }

    public AgentChatResponse handleConfirmation(String sessionId, boolean confirmed) {
        try {
            PendingAction pending = sessionManager.getPendingAction(sessionId);
            if (pending == null) {
                return AgentChatResponse.error(sessionId, "No pending action to confirm.");
            }

            Map<String, Object> args = sessionManager.getPendingActionArgs(sessionId);
            sessionManager.clearPendingAction(sessionId);

            if (!confirmed) {
                return AgentChatResponse.text(sessionId, "Action cancelled. How else can I help?");
            }

            Map<String, Object> result = actionExecutor.executeCreate(pending.getActionName(), args);

            AgentChatResponse chatResponse = new AgentChatResponse();
            chatResponse.setSessionId(sessionId);
            chatResponse.setType("action_completed");
            chatResponse.setData(result);

            if (Boolean.TRUE.equals(result.get("success"))) {
                chatResponse.setMessage("Successfully completed: " + pending.getDescription());
            } else {
                chatResponse.setMessage("Action failed: " + result.getOrDefault("error", "Unknown error"));
            }

            return chatResponse;

        } catch (Exception e) {
            log.error("[Agent] Error handling confirmation", e);
            return AgentChatResponse.error(sessionId, "Error executing action: " + e.getMessage());
        }
    }

    public void clearSession(String sessionId) {
        sessionManager.clearSession(sessionId);
    }

    private AgentChatResponse handleWizardAssist(String sessionId, Content userContent,
                                                  GenerateContentResponse response,
                                                  String funcName, Map<String, Object> args) {
        sessionManager.addToHistory(sessionId, userContent);
        sessionManager.addToHistory(sessionId, getModelContent(response));

        Map<String, Object> result = actionExecutor.executeWizardAssist(funcName, args);

        AgentChatResponse chatResponse = new AgentChatResponse();
        chatResponse.setSessionId(sessionId);
        chatResponse.setType("creation_flow");
        chatResponse.setMessage("I'll help you create a LOTO point. Here's what I gathered from your request:");
        chatResponse.setData(result);
        return chatResponse;
    }

    private AgentChatResponse handleCreateAction(String sessionId, Content userContent,
                                                  GenerateContentResponse response,
                                                  String funcName, Map<String, Object> args) {
        sessionManager.addToHistory(sessionId, userContent);
        sessionManager.addToHistory(sessionId, getModelContent(response));

        PendingAction pending = new PendingAction();
        pending.setActionName(funcName);
        pending.setParameters(args);
        pending.setDescription(describeAction(funcName, args));

        String confirmId = UUID.randomUUID().toString();
        sessionManager.storePendingAction(sessionId, pending, args);

        AgentChatResponse chatResponse = new AgentChatResponse();
        chatResponse.setSessionId(sessionId);
        chatResponse.setType("confirmation_required");
        chatResponse.setConfirmationId(confirmId);
        chatResponse.setPendingAction(pending);
        chatResponse.setMessage("I'd like to " + pending.getDescription() + ". Should I proceed?");
        return chatResponse;
    }

    private AgentChatResponse handleSearchAction(String sessionId, Content userContent,
                                                  GenerateContentResponse modelResponse,
                                                  String funcName, Map<String, Object> args,
                                                  List<Content> contents,
                                                  GenerateContentConfig config) {
        Map<String, Object> result = actionExecutor.executeSearch(funcName, args);

        // Add model's function call to conversation
        Content modelContent = getModelContent(modelResponse);

        // Build function response
        Content functionResponseContent = Content.builder()
                .role("user")
                .parts(List.of(Part.builder()
                        .functionResponse(FunctionResponse.builder()
                                .name(funcName)
                                .response(result)
                                .build())
                        .build()))
                .build();

        // Send function result back to Gemini for natural language summary
        List<Content> updatedContents = new ArrayList<>(contents);
        updatedContents.add(modelContent);
        updatedContents.add(functionResponseContent);

        try {
            GenerateContentResponse finalResponse = geminiClient.models.generateContent(
                    modelName, updatedContents, config);

            String text = finalResponse.text();

            // Store full conversation in history
            sessionManager.addToHistory(sessionId, userContent);
            sessionManager.addToHistory(sessionId, modelContent);
            sessionManager.addToHistory(sessionId, functionResponseContent);
            sessionManager.addToHistory(sessionId, getModelContent(finalResponse));

            AgentChatResponse chatResponse = new AgentChatResponse();
            chatResponse.setSessionId(sessionId);
            chatResponse.setType("search_results");
            chatResponse.setMessage(text);
            chatResponse.setData(result);
            return chatResponse;

        } catch (Exception e) {
            log.error("[Agent] Error getting Gemini summary for search results", e);
            // Fallback: return raw results without Gemini summary
            AgentChatResponse chatResponse = new AgentChatResponse();
            chatResponse.setSessionId(sessionId);
            chatResponse.setType("search_results");
            chatResponse.setMessage("Found " + result.getOrDefault("totalCount", "some") + " results.");
            chatResponse.setData(result);
            return chatResponse;
        }
    }

    private Content getModelContent(GenerateContentResponse response) {
        return response.candidates().orElseThrow().get(0).content().orElseThrow();
    }

    private String describeAction(String funcName, Map<String, Object> args) {
        return switch (funcName) {
            case "createLotoPoint" -> "create LOTO point '" + args.getOrDefault("tagNumber", "") +
                    "' - " + args.getOrDefault("description", "");
            case "createLotoStandard" -> "create LOTO standard '" + args.getOrDefault("name", "") + "'";
            case "createDailyPermitPackage" -> "create daily permit package for " +
                    args.getOrDefault("companyName", "") + " (" + args.getOrDefault("personName", "") +
                    ") on " + args.getOrDefault("date", "");
            default -> funcName + " with parameters " + args;
        };
    }
}
