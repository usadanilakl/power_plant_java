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

    private static final String SYSTEM_PROMPT = """
            You are Jackson, an AI assistant for the Jackson Generation power plant management application.
            You help plant operators and engineers with:
            1. Searching for files (P&IDs, drawings, documents) by name, number, system, or type
            2. Searching for equipment by tag number, description, system, or location
            3. Searching for LOTO (Lock Out Tag Out) isolation points by tag number, description, or location
            4. Searching for work permits and daily permit packages
            5. Creating new LOTO points, LOTO standards, and daily permit packages
            6. Teaching users how to use the application
            7. Answering questions about the power plant and its systems

            Guidelines:
            - Be concise and helpful. Use technical power plant terminology appropriately.
            - When a user asks to search for something, use the appropriate search function.
            - When a user asks to create something, use the appropriate create function and confirm the parameters.
            - For searches, present results clearly with relevant details (tag numbers, descriptions, locations).
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

    public GeminiService(Client geminiClient,
                         @Qualifier("geminiModelName") String modelName,
                         AgentSessionManager sessionManager,
                         AgentActionExecutor actionExecutor) {
        this.geminiClient = geminiClient;
        this.modelName = modelName;
        this.sessionManager = sessionManager;
        this.actionExecutor = actionExecutor;
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
                            .parts(List.of(Part.builder().text(SYSTEM_PROMPT).build()))
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

                if (actionExecutor.isCreateAction(funcName)) {
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
