package com.dk_power.power_plant_java.sevice.agent;

import com.dk_power.power_plant_java.dto.agent.AgentFormFillRequest;
import com.dk_power.power_plant_java.dto.agent.AgentFormFillResponse;
import com.dk_power.power_plant_java.entities.categories.Value;
import com.dk_power.power_plant_java.sevice.angular.NgValueService;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.google.genai.Client;
import com.google.genai.types.*;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Service;

import java.util.*;

@Slf4j
@Service
@ConditionalOnProperty(name = "gemini.api.key")
public class AgentFormFillService {

    private final Client geminiClient;
    private final String modelName;
    private final NgValueService valueService;
    private final AgentSearchVocabulary searchVocabulary;
    private final ObjectMapper objectMapper = new ObjectMapper();

    // Guidance keys the AI can include in its JSON response (not form fields)
    private static final Set<String> GUIDANCE_KEYS = Set.of(
            "zeroEnergyGuidance", "namingIssues", "locationGuidance", "pidGuidance"
    );

    public AgentFormFillService(Client geminiClient,
                                @Qualifier("geminiModelName") String modelName,
                                NgValueService valueService,
                                AgentSearchVocabulary searchVocabulary) {
        this.geminiClient = geminiClient;
        this.modelName = modelName;
        this.valueService = valueService;
        this.searchVocabulary = searchVocabulary;
    }

    public AgentFormFillResponse fillForm(AgentFormFillRequest request) {
        try {
            // 1. Load available options for value-select fields
            Map<String, List<Value>> optionsMap = loadOptionsForFields(request.getFields());

            // 2. Build the prompt
            String systemPrompt = buildSystemPrompt(request, optionsMap);
            String userPrompt = buildUserPrompt(request);

            log.info("[FormFill] formType={}, message='{}', fields={}",
                    request.getFormType(), request.getUserMessage(),
                    request.getFields().size());

            // 3. Call Gemini with JSON response
            GenerateContentConfig config = GenerateContentConfig.builder()
                    .responseMimeType("application/json")
                    .systemInstruction(Content.builder()
                            .parts(List.of(Part.builder().text(systemPrompt).build()))
                            .build())
                    .build();

            List<Content> contents = List.of(
                    Content.builder()
                            .role("user")
                            .parts(List.of(Part.builder().text(userPrompt).build()))
                            .build()
            );

            GenerateContentResponse response = geminiClient.models.generateContent(
                    modelName, contents, config);

            String jsonText = response.text();
            log.info("[FormFill] Raw AI response: {}", jsonText);

            // 4. Parse raw response
            Map<String, Object> rawValues = objectMapper.readValue(jsonText,
                    new TypeReference<Map<String, Object>>() {});

            // 5. Extract guidance keys before post-processing
            List<String> guidance = extractGuidanceFromRaw(rawValues);

            // 6. Post-process field values
            String formType = request.getFormType();
            Map<String, Object> resolvedValues = postProcess(rawValues, request, optionsMap);

            // 7. Build additional guidance from resolved values
            guidance.addAll(buildGuidance(resolvedValues, request, optionsMap));

            // 8. Build summary message
            String message = buildSummaryMessage(resolvedValues, request.getFields());

            return new AgentFormFillResponse(resolvedValues, message, true, guidance);

        } catch (Exception e) {
            log.error("[FormFill] Error filling form", e);
            return new AgentFormFillResponse(Map.of(),
                    "Failed to fill form: " + e.getMessage(), false);
        }
    }

    private Map<String, List<Value>> loadOptionsForFields(List<AgentFormFillRequest.FieldSpec> fields) {
        Map<String, List<Value>> optionsMap = new LinkedHashMap<>();
        for (AgentFormFillRequest.FieldSpec field : fields) {
            if ("value-select".equals(field.getType()) && field.getCategoryAlias() != null) {
                try {
                    List<Value> values = valueService.getValuesByCategoryAlias(field.getCategoryAlias());
                    optionsMap.put(field.getName(), values);
                } catch (Exception e) {
                    log.warn("[FormFill] Could not load options for {}: {}", field.getCategoryAlias(), e.getMessage());
                }
            }
        }
        return optionsMap;
    }

    private String buildSystemPrompt(AgentFormFillRequest request, Map<String, List<Value>> optionsMap) {
        StringBuilder sb = new StringBuilder();
        sb.append("""
                You are a form-filling assistant for a power plant management application.
                Given the user's natural language input, extract values for the specified form fields.
                Return a JSON object with field names as keys and extracted values.

                RULES:
                - Only include fields where you can extract or infer a value from the user's input.
                - Do NOT include fields you cannot determine — omit them entirely.
                - For dropdown fields (marked with "Options:"), return the EXACT option name from the list.
                - For text fields, return the extracted text value.
                - For checkbox/boolean fields, return true or false.
                - If the user's input updates specific fields, only return those fields (incremental update).
                - If the user asks a question instead of providing data, return only guidance keys (see below).

                GUIDANCE KEYS (optional, not form fields):
                You may include these special string keys in your JSON response to provide user-facing tips:
                - "zeroEnergyGuidance": advice about zero energy template phrases and equipment placeholders
                - "namingIssues": suggestions if the description doesn't follow naming conventions
                - "locationGuidance": tips about location vs specific location usage
                - "pidGuidance": guidance about connecting LOTO points to P&ID drawings
                These keys are NOT applied to the form — they are shown as tips to the user.

                """);

        // Add field definitions
        sb.append("FORM FIELDS:\n");
        for (AgentFormFillRequest.FieldSpec field : request.getFields()) {
            sb.append(String.format("- %s (%s): %s", field.getName(), field.getType(), field.getLabel()));

            // Add available options for value-select fields
            List<Value> options = optionsMap.get(field.getName());
            if (options != null && !options.isEmpty()) {
                List<String> names = options.stream()
                        .map(Value::getName)
                        .filter(n -> n != null && !n.isBlank())
                        .toList();
                sb.append("\n  Options: ").append(String.join(", ", names));
            }
            sb.append("\n");
        }

        // Add form-type specific instructions
        String typeInstructions = getFormTypeInstructions(request);
        if (!typeInstructions.isEmpty()) {
            sb.append("\nFORM-SPECIFIC RULES:\n").append(typeInstructions).append("\n");
        }

        // Add plant vocabulary for context
        String vocab = searchVocabulary.getVocabularyPrompt();
        if (!vocab.isEmpty()) {
            sb.append("\nPLANT VOCABULARY:\n").append(vocab);
        }

        return sb.toString();
    }

    private String buildUserPrompt(AgentFormFillRequest request) {
        StringBuilder sb = new StringBuilder();
        sb.append("Fill the form based on this input: ").append(request.getUserMessage());

        // Include current form values for context (incremental updates)
        if (request.getCurrentValues() != null && !request.getCurrentValues().isEmpty()) {
            sb.append("\n\nCurrent form state (for context, only change fields the user mentions):\n");
            for (Map.Entry<String, Object> entry : request.getCurrentValues().entrySet()) {
                if (entry.getValue() != null) {
                    sb.append("  ").append(entry.getKey()).append(": ").append(entry.getValue()).append("\n");
                }
            }
        }

        // Include form context metadata for dual form
        if (request.getFormContext() != null && !request.getFormContext().isEmpty()) {
            sb.append("\n\nForm context:\n");
            for (Map.Entry<String, String> entry : request.getFormContext().entrySet()) {
                sb.append("  ").append(entry.getKey()).append(": ").append(entry.getValue()).append("\n");
            }
        }

        return sb.toString();
    }

    private String getFormTypeInstructions(AgentFormFillRequest request) {
        String formType = request.getFormType();
        return switch (formType) {
            case "lotoPoint" -> getLotoPointBaseInstructions();
            case "lotoPointDual" -> getLotoPointBaseInstructions() + "\n" + getDualFormInstructions(request.getFormContext());
            case "safeWork" -> """
                    Extract work description, location, date, hazards, and PPE requirements from the prompt.
                    Hazard fields are booleans (true/false).
                    """;
            default -> "";
        };
    }

    private String getLotoPointBaseInstructions() {
        return """
                TAG NUMBER FORMAT: {UNIT}-{EQTYPE_PREFIX}{SYSTEM_PREFIX}{SEQUENCE}
                Example: 01-VCND377 means unit=01, equipment type prefix=V (Manual Valve), system=CND (Condensate), sequence=377
                Example: 02-MOVBFW025 means unit=02, equipment type prefix=MOV (Motor Operated Valve), system=BFW (Boiler Feed Water)

                Common equipment type prefixes: V=Manual Valve, MOV=Motor Operated Valve, AOV=Air Operated Valve,
                PCV=Pressure Control Valve, PMP=Pump, BKR=Breaker, DISC=Disconnect

                Common system prefixes: CND=Condensate, BFW=Boiler Feed Water, HRH=Hot Reheat,
                ACC=Air Cool Condenser, STM=Steam, CLG=Cooling, FW=Feed Water

                Position conventions:
                - Drain valves: normally CLOSED, isolated CLOSED
                - Motor operated valves: often normally OPEN, isolated CLOSED
                - Vent valves: normally CLOSED, isolated CLOSED
                - Supply/feed valves: normally OPEN, isolated CLOSED

                When you see "unit 1" or "unit 01", set unit to "01". "unit 2" → "02".
                Extract location hints from descriptions (e.g., "ACC" in description → ACC-related location).
                Extract specific location from physical location text (e.g., "under ACC", "east wall").
                The description should be in ALL CAPS and concise (e.g., "ACC LOOP SEAL DRAIN").

                ZERO ENERGY:
                Zero energy is a complex field you cannot directly fill. It involves selecting a template phrase
                (e.g., "Verify zero pressure on [tag1]") and then assigning equipment to each placeholder.
                If the user mentions zero energy verification, include a "zeroEnergyGuidance" key with advice:
                - For valves: typically "Verify zero pressure" or "Verify no flow" with 1-2 placeholders
                - For breakers: typically "Verify zero voltage" with 1 placeholder
                - For disconnects: typically "Verify zero voltage" with 1 placeholder
                Guide the user to: 1) Select a template phrase from the zero energy dropdown, 2) Assign equipment to each [tag] placeholder

                NAMING CONVENTIONS:
                Valve descriptions follow the pattern: EQUIPMENT_NAME (TAG_NUMBER) MODIFIER
                Common modifiers/keywords: ISO (isolation valve), DRAIN (drain valve), VENT (vent valve),
                EQ (equalizing valve), ROOT (root valve), BLOCK (block valve),
                LO SIDE (low pressure side), HI SIDE (high pressure side), UPSTREAM, DOWNSTREAM
                Examples: "HP TERM ATEMP STR (BFW100) OUTLET ROOT", "BFP B HP DISCHARGE MOV EQ"
                Breaker descriptions: use equipment name + breaker identifier
                ALL descriptions must be in ALL CAPS.
                If the user provides a description that doesn't follow these conventions, include a "namingIssues" key
                with a suggestion for how to format it properly.

                LOCATION vs SPECIFIC LOCATION:
                - "location" is a dropdown field for the general work area (e.g., ACC, Turbine Hall, Boiler Area, Control Room)
                - "specificLocation" is a free-text field for the precise physical position (e.g., "Under ACC near column B3", "East wall 12ft elevation")
                For BREAKERS and DISCONNECTS: specificLocation should include the panel and breaker/cubicle number.
                Breaker location format: "LOCATION > BUS > BREAKER" (e.g., "MVB SWITCHGEAR 1 CUBICLE 9B", "ACC MCC 02-ACC-MCC-241 BR12FM")
                If the user provides location information, include a "locationGuidance" key explaining which field it belongs in.

                P&ID CONNECTION:
                LOTO points connect to equipment, and equipment connects to P&ID drawings (image files).
                You cannot directly manage P&ID connections. If the user asks about P&ID or equipment connections,
                include a "pidGuidance" key explaining:
                1. Switch to the Images tab (slide 2) to view P&ID drawings related to this LOTO point
                2. Use the Equipment List field to add equipment — this links the LOTO point to equipment on P&IDs
                3. Equipment shapes drawn on P&ID images automatically link to the LOTO point through the equipment
                """;
    }

    private String getDualFormInstructions(Map<String, String> formContext) {
        StringBuilder sb = new StringBuilder();
        sb.append("""
                DUAL FORM CONTEXT:
                This is a dual-form view where two LOTO points (Unit 01 and Unit 02) are edited side-by-side.
                This plant has two identical units — most equipment exists in both units and needs matching LOTO points.

                Counterpart rules:
                - Tag number prefix swaps between units: 01 <-> 02 (e.g., 01-VCND377 counterpart is 02-VCND377)
                - Description text: transform unit references (U1 <-> U2, Unit 1 <-> Unit 2, #1 <-> #2)
                - Value-select fields (isoPos, normPos, eqType, location) are typically identical between counterparts
                - Zero energy: same template phrase, but equipment references swap to counterpart unit equipment

                After filling fields, guide the user to use the Sync controls (center column) to copy fields
                to the other unit with automatic unit-specific text transformations.

                WHY counterparts exist: In a dual-unit power plant, both units have identical equipment layouts.
                Each isolation point needs a LOTO point in both units. Linking them as counterparts ensures
                they stay synchronized and makes maintenance of both units consistent.
                """);

        if (formContext != null) {
            String panelSide = formContext.getOrDefault("panelSide", "");
            String sourceUnit = formContext.getOrDefault("sourceUnit", "");
            String targetUnit = formContext.getOrDefault("targetUnit", "");
            String counterpartExists = formContext.getOrDefault("counterpartExists", "false");

            if ("counterpart".equals(panelSide)) {
                sb.append(String.format("""

                        You are filling the COUNTERPART panel (Unit %s).
                        The primary LOTO point is for Unit %s.
                        Make sure tag numbers start with "%s-" prefix.
                        Transform any unit-specific text to reference Unit %s.
                        """, sourceUnit, targetUnit, sourceUnit, sourceUnit));
            } else if ("primary".equals(panelSide)) {
                sb.append(String.format("""

                        You are filling the PRIMARY panel (Unit %s).
                        The counterpart is for Unit %s. Counterpart %s.
                        Make sure tag numbers start with "%s-" prefix.
                        """, sourceUnit, targetUnit,
                        "true".equals(counterpartExists) ? "exists" : "does not exist yet",
                        sourceUnit));

                if (!"true".equals(counterpartExists)) {
                    sb.append("After filling the primary, guide the user to create a counterpart using the 'Create New' button on the right panel.\n");
                }
            }
        }

        return sb.toString();
    }

    /**
     * Extract guidance keys from raw AI response before post-processing.
     */
    private List<String> extractGuidanceFromRaw(Map<String, Object> rawValues) {
        List<String> guidance = new ArrayList<>();
        for (String key : GUIDANCE_KEYS) {
            Object value = rawValues.remove(key);
            if (value instanceof String text && !text.isBlank()) {
                guidance.add(text);
            }
        }
        return guidance;
    }

    /**
     * Build additional guidance based on resolved field values and context.
     */
    private List<String> buildGuidance(Map<String, Object> resolvedValues,
                                        AgentFormFillRequest request,
                                        Map<String, List<Value>> optionsMap) {
        List<String> guidance = new ArrayList<>();
        String formType = request.getFormType();

        if (!"lotoPoint".equals(formType) && !"lotoPointDual".equals(formType)) {
            return guidance;
        }

        // Tag breakdown
        Object tagObj = resolvedValues.get("tagNumber");
        if (tagObj instanceof String tag && !tag.isBlank()) {
            String breakdown = buildTagBreakdown(tag, optionsMap);
            if (breakdown != null) {
                guidance.add(breakdown);
            }
        }

        // Breaker-specific location guidance
        Object eqTypeObj = resolvedValues.get("eqType");
        if (eqTypeObj instanceof Long eqTypeId) {
            List<Value> eqTypes = optionsMap.getOrDefault("eqType", List.of());
            for (Value v : eqTypes) {
                if (v.getId().equals(eqTypeId)) {
                    String alias = v.getAlias() != null ? v.getAlias().toUpperCase() : "";
                    if (alias.equals("BKR") || alias.equals("DISC")) {
                        if (!resolvedValues.containsKey("specificLocation")) {
                            guidance.add("For breakers/disconnects, set Specific Location to: LOCATION > BUS > BREAKER (e.g., \"MVB SWITCHGEAR 1 CUBICLE 9B\")");
                        }
                    }
                    break;
                }
            }
        }

        // Dual form counterpart tips
        if ("lotoPointDual".equals(formType) && request.getFormContext() != null) {
            String panelSide = request.getFormContext().getOrDefault("panelSide", "");
            String counterpartExists = request.getFormContext().getOrDefault("counterpartExists", "false");

            if ("primary".equals(panelSide) && !"true".equals(counterpartExists)) {
                guidance.add("After filling this form, create a counterpart for the other unit using the 'Create New' button on the right panel. The counterpart will auto-populate with matching data.");
            } else if (!resolvedValues.isEmpty()) {
                guidance.add("Use the Sync controls in the center column to copy fields to the other unit. Text fields will automatically transform unit references (U1/U2).");
            }
        }

        return guidance;
    }

    /**
     * Build a human-readable tag number breakdown.
     */
    private String buildTagBreakdown(String tagNumber, Map<String, List<Value>> optionsMap) {
        try {
            String tag = tagNumber.trim().toUpperCase();
            int dashIdx = tag.indexOf('-');
            if (dashIdx < 1 || dashIdx >= tag.length() - 1) return null;

            String unitPart = tag.substring(0, dashIdx);
            String remainder = tag.substring(dashIdx + 1);

            // Strip trailing suffix
            int lastDash = remainder.lastIndexOf('-');
            if (lastDash > 0 && remainder.length() - lastDash <= 3) {
                remainder = remainder.substring(0, lastDash);
            }

            StringBuilder breakdown = new StringBuilder();
            breakdown.append(tag).append(": ");

            // Unit
            if ("01".equals(unitPart) || "02".equals(unitPart) || "00".equals(unitPart)) {
                breakdown.append("Unit ").append(unitPart);
            }

            // Match eqType prefix
            List<Value> eqTypes = optionsMap.getOrDefault("eqType",
                    valueService.getValuesByCategoryAlias("eqType"));
            Map<String, Value> eqPrefixMap = new LinkedHashMap<>();
            for (Value v : eqTypes) {
                if (v.getAlias() != null && !v.getAlias().isBlank()) {
                    eqPrefixMap.put(v.getAlias().trim().toUpperCase(), v);
                }
            }
            List<String> eqPrefixes = new ArrayList<>(eqPrefixMap.keySet());
            eqPrefixes.sort((a, b) -> b.length() - a.length());

            String afterEqType = remainder;
            for (String prefix : eqPrefixes) {
                if (remainder.startsWith(prefix)) {
                    breakdown.append(", ").append(prefix).append(" = ").append(eqPrefixMap.get(prefix).getName());
                    afterEqType = remainder.substring(prefix.length());
                    break;
                }
            }

            // Match system prefix
            if (!afterEqType.isEmpty()) {
                try {
                    List<Value> systems = valueService.getValuesByCategoryAlias("system");
                    for (Value v : systems) {
                        if (v.getAlias() != null && !v.getAlias().isBlank()) {
                            String sysPrefix = v.getAlias().trim().toUpperCase();
                            if (afterEqType.startsWith(sysPrefix)) {
                                breakdown.append(", ").append(sysPrefix).append(" = ").append(v.getName());
                                break;
                            }
                        }
                    }
                } catch (Exception ignored) {}
            }

            return breakdown.toString();
        } catch (Exception e) {
            return null;
        }
    }

    /**
     * Post-process AI response: resolve text values to IDs for value-select fields,
     * run tag number enrichment for LOTO points.
     */
    private Map<String, Object> postProcess(Map<String, Object> rawValues,
                                             AgentFormFillRequest request,
                                             Map<String, List<Value>> optionsMap) {
        Map<String, Object> resolved = new LinkedHashMap<>();

        // Build field type lookup
        Map<String, AgentFormFillRequest.FieldSpec> fieldMap = new LinkedHashMap<>();
        for (AgentFormFillRequest.FieldSpec field : request.getFields()) {
            fieldMap.put(field.getName(), field);
        }

        for (Map.Entry<String, Object> entry : rawValues.entrySet()) {
            String fieldName = entry.getKey();
            Object value = entry.getValue();

            AgentFormFillRequest.FieldSpec fieldSpec = fieldMap.get(fieldName);
            if (fieldSpec == null) continue; // Skip unknown fields (including guidance keys already removed)

            if ("value-select".equals(fieldSpec.getType()) && value instanceof String textValue) {
                // Resolve text to Value ID
                List<Value> options = optionsMap.get(fieldName);
                Long resolvedId = resolveTextToValueId(textValue, options);
                if (resolvedId != null) {
                    resolved.put(fieldName, resolvedId);
                }
            } else {
                // Pass through text, boolean, number values directly
                resolved.put(fieldName, value);
            }
        }

        // For LOTO points: enrich from tag number if present
        String formType = request.getFormType();
        if ("lotoPoint".equals(formType) || "lotoPointDual".equals(formType)) {
            enrichLotoPointFromTag(resolved, optionsMap);
        }

        return resolved;
    }

    /**
     * Match AI's text response against available Value options.
     * Tries exact match, then contains match, then alias match.
     */
    private Long resolveTextToValueId(String text, List<Value> options) {
        if (text == null || text.isBlank() || options == null) return null;

        String search = text.trim().toLowerCase();

        // 1. Exact name match
        for (Value v : options) {
            if (v.getName() != null && v.getName().toLowerCase().equals(search)) {
                return v.getId();
            }
        }

        // 2. Alias match
        for (Value v : options) {
            if (v.getAlias() != null && v.getAlias().toLowerCase().equals(search)) {
                return v.getId();
            }
        }

        // 3. Contains match on name
        for (Value v : options) {
            if (v.getName() != null && v.getName().toLowerCase().contains(search)) {
                return v.getId();
            }
        }

        // 4. Contains match on alias
        for (Value v : options) {
            if (v.getAlias() != null && v.getAlias().toLowerCase().contains(search)) {
                return v.getId();
            }
        }

        log.warn("[FormFill] Could not resolve '{}' to any option", text);
        return null;
    }

    /**
     * For LOTO points: parse tag number to enrich fields that AI might have missed.
     * Only sets fields not already in the resolved map.
     */
    private void enrichLotoPointFromTag(Map<String, Object> resolved, Map<String, List<Value>> optionsMap) {
        Object tagObj = resolved.get("tagNumber");
        if (!(tagObj instanceof String tagNumber) || tagNumber.isBlank()) return;

        try {
            String tag = tagNumber.trim().toUpperCase();
            int dashIdx = tag.indexOf('-');
            if (dashIdx < 1 || dashIdx >= tag.length() - 1) return;

            // Parse unit
            String unitPart = tag.substring(0, dashIdx);
            if (!resolved.containsKey("unit") &&
                    (unitPart.equals("01") || unitPart.equals("02") || unitPart.equals("00"))) {
                resolved.put("unit", unitPart);
            }

            String remainder = tag.substring(dashIdx + 1);
            // Strip trailing suffix (e.g., -JG)
            int lastDash = remainder.lastIndexOf('-');
            if (lastDash > 0 && remainder.length() - lastDash <= 3) {
                remainder = remainder.substring(0, lastDash);
            }

            // Match eqType prefix
            List<Value> eqTypes = optionsMap.getOrDefault("eqType",
                    valueService.getValuesByCategoryAlias("eqType"));

            Map<String, Value> eqPrefixMap = new LinkedHashMap<>();
            for (Value v : eqTypes) {
                if (v.getAlias() != null && !v.getAlias().isBlank()) {
                    eqPrefixMap.put(v.getAlias().trim().toUpperCase(), v);
                }
            }

            List<String> eqPrefixes = new ArrayList<>(eqPrefixMap.keySet());
            eqPrefixes.sort((a, b) -> b.length() - a.length());

            String afterEqType = remainder;
            for (String prefix : eqPrefixes) {
                if (remainder.startsWith(prefix)) {
                    if (!resolved.containsKey("eqType")) {
                        resolved.put("eqType", eqPrefixMap.get(prefix).getId());
                        log.info("[FormFill] Tag enrichment: eqType={}", eqPrefixMap.get(prefix).getName());
                    }
                    afterEqType = remainder.substring(prefix.length());
                    break;
                }
            }

            // Match system prefix → infer location
            if (!afterEqType.isEmpty() && !resolved.containsKey("location")) {
                List<Value> systems = valueService.getValuesByCategoryAlias("system");
                Map<String, Value> sysPrefixMap = new LinkedHashMap<>();
                for (Value v : systems) {
                    if (v.getAlias() != null && !v.getAlias().isBlank()) {
                        sysPrefixMap.put(v.getAlias().trim().toUpperCase(), v);
                    }
                }

                List<String> sysPrefixes = new ArrayList<>(sysPrefixMap.keySet());
                sysPrefixes.sort((a, b) -> b.length() - a.length());

                for (String prefix : sysPrefixes) {
                    if (afterEqType.startsWith(prefix)) {
                        Value matchedSystem = sysPrefixMap.get(prefix);
                        // Try to infer location from system name
                        List<Value> locations = optionsMap.getOrDefault("location",
                                valueService.getValuesByCategoryAlias("location"));
                        Long locationId = inferLocationFromSystemName(matchedSystem.getName(), locations);
                        if (locationId != null) {
                            resolved.put("location", locationId);
                            log.info("[FormFill] Tag enrichment: location inferred from system '{}'", matchedSystem.getName());
                        }
                        break;
                    }
                }
            }
        } catch (Exception e) {
            log.warn("[FormFill] Tag enrichment failed for '{}': {}", tagObj, e.getMessage());
        }
    }

    private Long inferLocationFromSystemName(String systemName, List<Value> locations) {
        if (systemName == null || systemName.isBlank()) return null;
        String search = systemName.trim().toLowerCase();

        for (Value loc : locations) {
            if (loc.getName() == null) continue;
            String locName = loc.getName().toLowerCase();
            if (search.contains(locName) || locName.contains(search)) {
                return loc.getId();
            }
        }
        for (Value loc : locations) {
            if (loc.getAlias() == null) continue;
            String locAlias = loc.getAlias().toLowerCase();
            if (search.contains(locAlias) || locAlias.contains(search)) {
                return loc.getId();
            }
        }
        return null;
    }

    private String buildSummaryMessage(Map<String, Object> fieldValues,
                                        List<AgentFormFillRequest.FieldSpec> fields) {
        if (fieldValues.isEmpty()) {
            return "Could not extract any values from your input.";
        }

        int count = fieldValues.size();
        return "Filled " + count + " field" + (count == 1 ? "" : "s") + " from your description.";
    }
}
