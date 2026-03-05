package com.dk_power.power_plant_java.sevice.agent;

import jakarta.annotation.PostConstruct;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;

/**
 * Builds a search vocabulary from actual LotoPoint data at startup.
 * This vocabulary is injected into the Gemini system prompt so the AI
 * knows the exact naming conventions, abbreviations, and tag patterns
 * used in this specific database.
 */
@Slf4j
@Service
@ConditionalOnProperty(name = "gemini.api.key")
public class AgentSearchVocabulary {

    @PersistenceContext
    private EntityManager entityManager;

    private String vocabularyPrompt = "";

    @PostConstruct
    public void buildVocabulary() {
        try {
            List<Object[]> rows = queryLotoPointData();
            if (rows.isEmpty()) {
                log.info("[Agent] No LOTO point data found for vocabulary");
                return;
            }

            // Group by system
            Map<String, List<Object[]>> bySystem = new LinkedHashMap<>();
            for (Object[] row : rows) {
                String system = (String) row[0];
                if (system == null || system.isBlank()) continue;
                bySystem.computeIfAbsent(system.trim(), k -> new ArrayList<>()).add(row);
            }

            // Build vocabulary lines per system
            StringBuilder sb = new StringBuilder();
            sb.append("\nDatabase naming patterns (from actual LOTO point records):\n");

            for (Map.Entry<String, List<Object[]>> entry : bySystem.entrySet()) {
                String system = entry.getKey();
                List<Object[]> systemRows = entry.getValue();

                // Collect unique tag numbers (first 3)
                List<String> tags = systemRows.stream()
                        .map(r -> (String) r[1])
                        .filter(t -> t != null && !t.isBlank())
                        .distinct()
                        .limit(3)
                        .toList();

                // Collect unique descriptions (first 3)
                List<String> descs = systemRows.stream()
                        .map(r -> (String) r[2])
                        .filter(d -> d != null && !d.isBlank())
                        .map(String::trim)
                        .distinct()
                        .limit(3)
                        .toList();

                if (tags.isEmpty() && descs.isEmpty()) continue;

                sb.append("- ").append(system).append(": ");
                if (!tags.isEmpty()) {
                    sb.append("tags [").append(String.join(", ", tags)).append("]");
                }
                if (!descs.isEmpty()) {
                    if (!tags.isEmpty()) sb.append(", ");
                    sb.append("descriptions: ");
                    sb.append(descs.stream()
                            .map(d -> "\"" + d + "\"")
                            .collect(Collectors.joining(", ")));
                }
                sb.append("\n");
            }

            // Word frequency analysis on all descriptions
            Map<String, Integer> wordFreq = new HashMap<>();
            for (Object[] row : rows) {
                String desc = (String) row[2];
                if (desc == null || desc.isBlank()) continue;
                for (String word : desc.trim().toUpperCase().split("\\s+")) {
                    if (word.length() >= 2) {
                        wordFreq.merge(word, 1, Integer::sum);
                    }
                }
            }

            // Top 40 most frequent terms (min 3 occurrences)
            List<String> commonTerms = wordFreq.entrySet().stream()
                    .filter(e -> e.getValue() >= 3)
                    .sorted(Map.Entry.<String, Integer>comparingByValue().reversed())
                    .limit(40)
                    .map(Map.Entry::getKey)
                    .toList();

            if (!commonTerms.isEmpty()) {
                sb.append("\nMost common terms in descriptions: ")
                        .append(String.join(", ", commonTerms))
                        .append("\n");
            }

            // Build abbreviation mappings from frequent terms
            Map<String, String> abbreviations = buildAbbreviationMappings(rows);
            if (!abbreviations.isEmpty()) {
                sb.append("\nCommon abbreviations used in this database:\n");
                for (Map.Entry<String, String> abbr : abbreviations.entrySet()) {
                    sb.append("  ").append(abbr.getKey()).append(" = ").append(abbr.getValue()).append("\n");
                }
            }

            sb.append("\nIMPORTANT: When generating search queries, ALWAYS include variations using these ")
                    .append("abbreviated forms. For example, if a user says 'condensate pump discharge isolation valve', ")
                    .append("include queries like 'CND PUMP DISCH ISO' and 'CND PUMP DISCHARGE ISO'.\n");

            // Equipment type vocabulary from Value entity
            List<Object[]> eqTypes = queryEquipmentTypes();
            if (!eqTypes.isEmpty()) {
                sb.append("\nEquipment types in database (with alternative names/aliases):\n");
                for (Object[] row : eqTypes) {
                    String name = (String) row[0];
                    String alias = (String) row[1];
                    sb.append("  - ").append(name);
                    if (alias != null && !alias.isBlank()) {
                        sb.append(" (aliases: ").append(alias).append(")");
                    }
                    sb.append("\n");
                }
                sb.append("When users search by equipment type, include the type name AND its aliases as query variations.\n");
            }

            vocabularyPrompt = sb.toString();
            log.info("[Agent] Built search vocabulary: {} systems, {} common terms",
                    bySystem.size(), commonTerms.size());

        } catch (Exception e) {
            log.warn("[Agent] Failed to build search vocabulary: {}", e.getMessage());
            vocabularyPrompt = "";
        }
    }

    public String getVocabularyPrompt() {
        return vocabularyPrompt;
    }

    /**
     * Builds abbreviation mappings by comparing system names (full words) with
     * description terms (often abbreviated). Also includes well-known power plant abbreviations.
     */
    private Map<String, String> buildAbbreviationMappings(List<Object[]> rows) {
        // Well-known power plant abbreviations
        Map<String, String> known = new LinkedHashMap<>();
        known.put("CND", "Condensate");
        known.put("DISCH", "Discharge");
        known.put("ISO", "Isolation");
        known.put("SUCT", "Suction");
        known.put("VLV", "Valve");
        known.put("BFP", "Boiler Feed Pump");
        known.put("BFW", "Boiler Feed Water");
        known.put("STRNR", "Strainer");
        known.put("HTR", "Heater");
        known.put("XFMR", "Transformer");
        known.put("BKR", "Breaker");
        known.put("SW", "Switch");
        known.put("HRH", "Hot Reheat");
        known.put("CRH", "Cold Reheat");
        known.put("FW", "Feedwater");
        known.put("HP", "High Pressure");
        known.put("LP", "Low Pressure");
        known.put("IP", "Intermediate Pressure");
        known.put("STM", "Steam");
        known.put("EXH", "Exhaust");
        known.put("AUX", "Auxiliary");
        known.put("CIRC", "Circulating");
        known.put("CLG", "Cooling");
        known.put("GEN", "Generator");
        known.put("TURB", "Turbine");
        known.put("CRT", "Control Room / Control");
        known.put("EQ", "Equipment");
        known.put("PMP", "Pump");

        // Discover additional abbreviations from data: compare system names to description tokens
        Map<String, Set<String>> descTokens = new HashMap<>();
        for (Object[] row : rows) {
            String system = (String) row[0];
            String desc = (String) row[2];
            if (system == null || desc == null) continue;
            descTokens.computeIfAbsent(system.trim().toUpperCase(), k -> new HashSet<>());
            for (String word : desc.trim().toUpperCase().split("\\s+")) {
                if (word.length() >= 2) {
                    descTokens.get(system.trim().toUpperCase()).add(word);
                }
            }
        }

        // If a system name starts with the same letters as a frequent description token, it's likely an abbreviation
        for (Map.Entry<String, Set<String>> entry : descTokens.entrySet()) {
            String system = entry.getKey();
            for (String token : entry.getValue()) {
                if (token.length() >= 2 && token.length() < system.length()
                        && system.startsWith(token.substring(0, Math.min(3, token.length())))
                        && !known.containsKey(token)) {
                    known.put(token, system.substring(0, 1) + system.substring(1).toLowerCase());
                }
            }
        }

        return known;
    }

    @SuppressWarnings("unchecked")
    private List<Object[]> queryEquipmentTypes() {
        String sql = """
                SELECT v.name, v.alias FROM val_table v
                JOIN category c ON v.category_id = c.id
                WHERE c.name = 'Equipment Type'
                  AND (v.deleted IS NOT TRUE OR v.deleted IS NULL)
                  AND v.name IS NOT NULL AND v.name != ''
                ORDER BY v.name
                """;
        return entityManager.createNativeQuery(sql).getResultList();
    }

    @SuppressWarnings("unchecked")
    private List<Object[]> queryLotoPointData() {
        // Get up to 5 sample rows per system using ROW_NUMBER window function
        String sql = """
                SELECT system, tag_number, description FROM (
                    SELECT system, tag_number, description,
                           ROW_NUMBER() OVER (PARTITION BY system ORDER BY tag_number) as rn
                    FROM loto_point
                    WHERE (deleted IS NOT TRUE OR deleted IS NULL)
                      AND system IS NOT NULL AND system != ''
                ) WHERE rn <= 5
                ORDER BY system, tag_number
                """;
        return entityManager.createNativeQuery(sql).getResultList();
    }
}
