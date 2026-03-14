package com.dk_power.power_plant_java.sevice.agent;

import com.dk_power.power_plant_java.dto.permits.DailyPermitPackageDto;
import com.dk_power.power_plant_java.dto.permits.loto_point.LotoPointIdDto;
import com.dk_power.power_plant_java.dto.permits.loto_standard.LotoStandardIdDto;
import com.dk_power.power_plant_java.entities.categories.Value;
import com.dk_power.power_plant_java.entities.loto.LotoPoint;
import com.dk_power.power_plant_java.entities.permits.WorkArea;
import com.dk_power.power_plant_java.repository.permits.WorkAreaRepo;
import com.dk_power.power_plant_java.sevice.angular.NgValueService;
import com.dk_power.power_plant_java.sevice.angular.file.NgFileService;
import com.dk_power.power_plant_java.sevice.angular.loto.NgLotoPointService;
import com.dk_power.power_plant_java.sevice.angular.loto.NgLotoStandardService;
import com.dk_power.power_plant_java.sevice.angular.permits.NgDailyPermitPackageService;
import com.dk_power.power_plant_java.sevice.angular.permits.NgJobLogService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
@ConditionalOnProperty(name = "gemini.api.key")
public class AgentActionExecutor {

    private final NgFileService fileService;
    private final NgLotoPointService lotoPointService;
    private final NgLotoStandardService lotoStandardService;
    private final NgDailyPermitPackageService dailyPermitPackageService;
    private final NgValueService valueService;
    private final NgJobLogService jobLogService;
    private final WorkAreaRepo workAreaRepo;

    public Map<String, Object> executeSearch(String functionName, Map<String, Object> args) {
        try {
            return switch (functionName) {
                case "searchFiles" -> searchFiles(args);
                case "searchEquipment" -> searchLotoPoints(args); // legacy: equipment searches now use LOTO points
                case "searchLotoPoints" -> searchLotoPoints(args);
                case "searchPermits" -> searchPermits(args);
                case "getAppHelp" -> getAppHelp(args);
                case "findMatchingJobsForWorkRequest" -> findMatchingJobsForWorkRequest(args);
                default -> Map.of("error", "Unknown function: " + functionName);
            };
        } catch (Exception e) {
            log.error("[Agent] Error executing search: {}({})", functionName, args, e);
            return Map.of("error", e.getMessage());
        }
    }

    public Map<String, Object> executeCreate(String functionName, Map<String, Object> args) {
        try {
            return switch (functionName) {
                case "createLotoPoint" -> createLotoPoint(args);
                case "createLotoStandard" -> createLotoStandard(args);
                case "createDailyPermitPackage" -> createDailyPermitPackage(args);
                default -> Map.of("error", "Unknown create function: " + functionName);
            };
        } catch (Exception e) {
            log.error("[Agent] Error executing create: {}({})", functionName, args, e);
            return Map.of("error", e.getMessage(), "success", false);
        }
    }

    public boolean isWizardAssist(String functionName) {
        return "assistLotoPointCreation".equals(functionName)
                || "assistWorkRequestCreation".equals(functionName);
    }

    public boolean isCreateAction(String functionName) {
        return functionName.startsWith("create");
    }

    public Map<String, Object> executeWizardAssist(String functionName, Map<String, Object> args) {
        try {
            return switch (functionName) {
                case "assistLotoPointCreation" -> assistLotoPointCreation(args);
                case "assistWorkRequestCreation" -> assistWorkRequestCreation(args);
                default -> Map.of("error", "Unknown wizard assist function: " + functionName);
            };
        } catch (Exception e) {
            log.error("[Agent] Error executing wizard assist: {}({})", functionName, args, e);
            return Map.of("error", e.getMessage(), "success", false);
        }
    }

    // ========== SEARCH METHODS ==========

    private Map<String, Object> searchFiles(Map<String, Object> args) {
        String query = (String) args.get("query");
        var results = fileService.complexSearch(query, 0, 10);
        return Map.of(
                "results", results.getContent().stream()
                        .map(f -> {
                            Map<String, Object> m = new LinkedHashMap<>();
                            m.put("id", f.getId());
                            m.put("name", f.getName() != null ? f.getName() : "");
                            m.put("fileNumber", f.getFileNumber() != null ? f.getFileNumber() : "");
                            m.put("fileLink", f.getFileLink() != null ? f.getFileLink() : "");
                            return m;
                        })
                        .toList(),
                "totalCount", results.getTotalElements()
        );
    }

    private Map<String, Object> searchLotoPoints(Map<String, Object> args) {
        // Support both new "queries" array and legacy single "query" parameter
        List<String> queries = new ArrayList<>();
        Object queriesObj = args.get("queries");
        if (queriesObj instanceof List<?> list) {
            for (Object item : list) {
                String s = String.valueOf(item);
                if (s != null && !s.isBlank()) {
                    queries.add(s.trim());
                }
            }
        }
        // Fallback: legacy single "query" param
        if (queries.isEmpty()) {
            String singleQuery = (String) args.getOrDefault("query", "");
            if (singleQuery != null && !singleQuery.isBlank()) {
                queries.add(singleQuery.trim());
            }
        }

        if (queries.isEmpty()) {
            return Map.of("results", List.of(), "totalCount", 0);
        }

        log.info("[Agent] LOTO point search with {} variations: {}", queries.size(), queries);

        // Run each query variation, deduplicate results by ID
        LinkedHashMap<Long, Map<String, Object>> deduped = new LinkedHashMap<>();
        int maxResults = 20;

        for (String query : queries) {
            if (deduped.size() >= maxResults) break;

            var page = lotoPointService.complexSearch(query, 0, 10);
            for (var lp : page.getContent()) {
                if (deduped.size() >= maxResults) break;
                deduped.computeIfAbsent(lp.getId(), id -> {
                    Map<String, Object> m = new LinkedHashMap<>();
                    m.put("id", lp.getId());
                    m.put("tagNumber", lp.getTagNumber() != null ? lp.getTagNumber() : "");
                    m.put("description", lp.getDescription() != null ? lp.getDescription() : "");
                    m.put("specificLocation", lp.getSpecificLocation() != null ? lp.getSpecificLocation() : "");
                    m.put("unit", lp.getUnit() != null ? lp.getUnit() : "");
                    m.put("system", lp.getSystem() != null ? lp.getSystem() : "");
                    m.put("eqType", lp.getEqType() != null && lp.getEqType().getName() != null ? lp.getEqType().getName() : "");
                    m.put("location", lp.getLocation() != null && lp.getLocation().getName() != null ? lp.getLocation().getName() : "");
                    return m;
                });
            }
        }

        return Map.of(
                "results", new ArrayList<>(deduped.values()),
                "totalCount", deduped.size()
        );
    }

    private Map<String, Object> searchPermits(Map<String, Object> args) {
        var packages = dailyPermitPackageService.getAllDtos();
        String status = (String) args.getOrDefault("status", null);
        String company = (String) args.getOrDefault("companyName", null);
        String person = (String) args.getOrDefault("personName", null);

        var filtered = packages.stream()
                .filter(p -> status == null || (p.getPackageStatus() != null &&
                        p.getPackageStatus().getName() != null &&
                        p.getPackageStatus().getName().toLowerCase().contains(status.toLowerCase())))
                .filter(p -> company == null || (p.getCompanyName() != null &&
                        p.getCompanyName().toLowerCase().contains(company.toLowerCase())))
                .filter(p -> person == null || (p.getPersonName() != null &&
                        p.getPersonName().toLowerCase().contains(person.toLowerCase())))
                .limit(10)
                .toList();

        return Map.of(
                "results", filtered.stream()
                        .map(p -> {
                            Map<String, Object> m = new LinkedHashMap<>();
                            m.put("id", p.getId());
                            m.put("companyName", p.getCompanyName() != null ? p.getCompanyName() : "");
                            m.put("personName", p.getPersonName() != null ? p.getPersonName() : "");
                            m.put("date", p.getDate() != null ? p.getDate() : "");
                            m.put("permitNumber", p.getPermitNumber() != null ? p.getPermitNumber() : "");
                            return m;
                        })
                        .toList(),
                "totalCount", filtered.size()
        );
    }

    // ========== CREATE METHODS ==========

    private Map<String, Object> createLotoPoint(Map<String, Object> args) {
        LotoPointIdDto dto = new LotoPointIdDto();
        dto.setTagNumber((String) args.get("tagNumber"));
        dto.setDescription((String) args.get("description"));
        if (args.containsKey("specificLocation")) {
            dto.setSpecificLocation((String) args.get("specificLocation"));
        }
        LotoPoint created = lotoPointService.processLotoPoint(dto);
        Map<String, Object> result = new HashMap<>();
        result.put("id", created.getId());
        result.put("tagNumber", created.getTagNumber());
        result.put("success", true);
        return result;
    }

    private Map<String, Object> createLotoStandard(Map<String, Object> args) {
        LotoStandardIdDto dto = new LotoStandardIdDto();
        dto.setName((String) args.get("name"));
        if (args.containsKey("description")) {
            dto.setDescription((String) args.get("description"));
        }
        var created = lotoStandardService.createStandard(dto);
        Map<String, Object> result = new HashMap<>();
        result.put("id", created.getId());
        result.put("name", created.getName());
        result.put("success", true);
        return result;
    }

    private Map<String, Object> createDailyPermitPackage(Map<String, Object> args) {
        DailyPermitPackageDto dto = new DailyPermitPackageDto();
        dto.setCompanyName((String) args.get("companyName"));
        dto.setPersonName((String) args.get("personName"));
        dto.setDate((String) args.get("date"));
        var created = dailyPermitPackageService.createDailyPermitPackage(dto);
        Map<String, Object> result = new HashMap<>();
        result.put("id", created.getId());
        result.put("companyName", created.getCompanyName());
        result.put("permitNumber", created.getPermitNumber() != null ? created.getPermitNumber() : "");
        result.put("success", true);
        return result;
    }

    // ========== WIZARD ASSIST ==========

    private Map<String, Object> assistLotoPointCreation(Map<String, Object> args) {
        Map<String, Object> resolvedData = new LinkedHashMap<>();
        resolvedData.put("description", args.getOrDefault("description", null));
        resolvedData.put("tagNumber", args.getOrDefault("tagNumber", null));
        resolvedData.put("unit", args.getOrDefault("unit", null));
        resolvedData.put("specificLocation", args.getOrDefault("specificLocation", null));

        // Resolve dropdown values from AI-extracted text
        resolvedData.put("eqType", resolveValue((String) args.get("equipmentType"), "eqType"));
        resolvedData.put("normPos", resolveValue((String) args.get("normalPosition"), "normPos"));
        resolvedData.put("isoPos", resolveValue((String) args.get("isolatedPosition"), "isoPos"));
        resolvedData.put("location", resolveValue((String) args.get("location"), "location"));

        // Deterministic enrichment from tag number — fills in fields the AI missed
        String tagNumber = (String) resolvedData.get("tagNumber");
        if (tagNumber != null && !tagNumber.isBlank()) {
            enrichFromTagNumber(tagNumber, resolvedData);
        }

        // Load all available options for each dropdown category
        Map<String, Object> availableOptions = new LinkedHashMap<>();
        availableOptions.put("eqType", loadValueOptions("eqType"));
        availableOptions.put("normPos", loadValueOptions("normPos"));
        availableOptions.put("isoPos", loadValueOptions("isoPos"));
        availableOptions.put("location", loadValueOptions("location"));
        availableOptions.put("zeroEnergyTemplate", loadValueOptions("zeroEnergyTemplate"));

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("flowType", "loto");
        result.put("resolvedData", resolvedData);
        result.put("availableOptions", availableOptions);
        result.put("success", true);

        log.info("[Agent] LOTO point creation assist — resolved: {}", resolvedData);
        return result;
    }

    /**
     * Deterministic tag number parsing to enrich resolved data.
     * Tag format: {UNIT}-{EQTYPE_PREFIX}{SYSTEM_PREFIX}{SEQUENCE}
     * Examples: 01-VCND377, 01-MOVCND001, 02-AOVBFW050
     * Only sets fields that are still null in resolvedData.
     */
    private void enrichFromTagNumber(String tagNumber, Map<String, Object> resolvedData) {
        try {
            String tag = tagNumber.trim().toUpperCase();
            int dashIdx = tag.indexOf('-');
            if (dashIdx < 1 || dashIdx >= tag.length() - 1) return;

            // Parse unit from first segment
            String unitPart = tag.substring(0, dashIdx);
            if (resolvedData.get("unit") == null && (unitPart.equals("01") || unitPart.equals("02") || unitPart.equals("00"))) {
                resolvedData.put("unit", unitPart);
            }

            String remainder = tag.substring(dashIdx + 1);
            // Strip trailing -JG or similar suffixes
            int lastDash = remainder.lastIndexOf('-');
            if (lastDash > 0 && remainder.length() - lastDash <= 3) {
                remainder = remainder.substring(0, lastDash);
            }

            // Build prefix maps from database values
            List<Value> eqTypes = valueService.getValuesByCategoryAlias("eqType");
            List<Value> systems = valueService.getValuesByCategoryAlias("system");

            // Build eqType alias→Value map (alias is the prefix, e.g. "V", "MOV")
            Map<String, Value> eqPrefixMap = new LinkedHashMap<>();
            for (Value v : eqTypes) {
                if (v.getAlias() != null && !v.getAlias().isBlank()) {
                    eqPrefixMap.put(v.getAlias().trim().toUpperCase(), v);
                }
            }

            // Build system alias→Value map (alias is the prefix, e.g. "CND", "BFW")
            Map<String, Value> sysPrefixMap = new LinkedHashMap<>();
            for (Value v : systems) {
                if (v.getAlias() != null && !v.getAlias().isBlank()) {
                    sysPrefixMap.put(v.getAlias().trim().toUpperCase(), v);
                }
            }

            // Try to match eqType prefix (longest match first)
            Value matchedEqType = null;
            String afterEqType = remainder;
            List<String> eqPrefixes = new ArrayList<>(eqPrefixMap.keySet());
            eqPrefixes.sort((a, b) -> b.length() - a.length()); // longest first
            for (String prefix : eqPrefixes) {
                if (remainder.startsWith(prefix)) {
                    matchedEqType = eqPrefixMap.get(prefix);
                    afterEqType = remainder.substring(prefix.length());
                    break;
                }
            }

            // Set eqType if not already resolved
            if (resolvedData.get("eqType") == null && matchedEqType != null) {
                resolvedData.put("eqType", valueToMap(matchedEqType));
                log.info("[Agent] Tag parsing: eqType '{}' → {} ({})", matchedEqType.getAlias(), matchedEqType.getName(), matchedEqType.getId());
            }

            // Try to match system prefix from remainder after eqType
            if (!afterEqType.isEmpty()) {
                Value matchedSystem = null;
                List<String> sysPrefixes = new ArrayList<>(sysPrefixMap.keySet());
                sysPrefixes.sort((a, b) -> b.length() - a.length()); // longest first
                for (String prefix : sysPrefixes) {
                    if (afterEqType.startsWith(prefix)) {
                        matchedSystem = sysPrefixMap.get(prefix);
                        break;
                    }
                }

                // Infer location from system name if location is null
                if (resolvedData.get("location") == null && matchedSystem != null) {
                    String systemName = matchedSystem.getName();
                    Map<String, Object> inferredLocation = inferLocationFromText(systemName);
                    if (inferredLocation != null) {
                        resolvedData.put("location", inferredLocation);
                        log.info("[Agent] Tag parsing: inferred location from system '{}'", systemName);
                    }
                }
            }
        } catch (Exception e) {
            log.warn("[Agent] Tag number parsing failed for '{}': {}", tagNumber, e.getMessage());
        }
    }

    /**
     * Try to infer location from text (system name, description, etc.)
     * by matching against known location Values.
     */
    private Map<String, Object> inferLocationFromText(String text) {
        if (text == null || text.isBlank()) return null;
        try {
            List<Value> locations = valueService.getValuesByCategoryAlias("location");
            String search = text.trim().toLowerCase();
            // Check if any location name is contained in the text or vice versa
            for (Value loc : locations) {
                if (loc.getName() == null) continue;
                String locName = loc.getName().toLowerCase();
                if (search.contains(locName) || locName.contains(search)) {
                    return valueToMap(loc);
                }
            }
            // Check aliases
            for (Value loc : locations) {
                if (loc.getAlias() == null) continue;
                String locAlias = loc.getAlias().toLowerCase();
                if (search.contains(locAlias) || locAlias.contains(search)) {
                    return valueToMap(loc);
                }
            }
        } catch (Exception e) {
            log.warn("[Agent] Location inference failed: {}", e.getMessage());
        }
        return null;
    }

    private Map<String, Object> resolveValue(String searchTerm, String categoryAlias) {
        if (searchTerm == null || searchTerm.isBlank()) return null;

        try {
            List<Value> values = valueService.getValuesByCategoryAlias(categoryAlias);
            String search = searchTerm.trim().toLowerCase();

            // 1. Exact match (case-insensitive) on name
            for (Value v : values) {
                if (v.getName() != null && v.getName().toLowerCase().equals(search)) {
                    return valueToMap(v);
                }
            }

            // 2. Alias match — alias contains search term
            for (Value v : values) {
                if (v.getAlias() != null && v.getAlias().toLowerCase().contains(search)) {
                    return valueToMap(v);
                }
            }

            // 3. Contains match — name contains search term
            for (Value v : values) {
                if (v.getName() != null && v.getName().toLowerCase().contains(search)) {
                    return valueToMap(v);
                }
            }
        } catch (Exception e) {
            log.warn("[Agent] Could not resolve value '{}' in category '{}': {}", searchTerm, categoryAlias, e.getMessage());
        }

        return null;
    }

    private List<Map<String, Object>> loadValueOptions(String categoryAlias) {
        try {
            return valueService.getValuesByCategoryAlias(categoryAlias).stream()
                    .map(this::valueToMap)
                    .toList();
        } catch (Exception e) {
            log.warn("[Agent] Could not load options for category '{}': {}", categoryAlias, e.getMessage());
            return List.of();
        }
    }

    private Map<String, Object> valueToMap(Value v) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("id", v.getId());
        m.put("name", v.getName() != null ? v.getName() : "");
        return m;
    }

    // ========== WORK REQUEST WIZARD ASSIST ==========

    private Map<String, Object> assistWorkRequestCreation(Map<String, Object> args) {
        Map<String, Object> resolvedData = new LinkedHashMap<>();
        resolvedData.put("workScope", args.getOrDefault("workScope", null));
        resolvedData.put("company", args.getOrDefault("company", null));
        resolvedData.put("location", args.getOrDefault("location", null));
        resolvedData.put("affectedEquipment", args.getOrDefault("affectedEquipment", null));
        resolvedData.put("isHotWorkRequired", args.getOrDefault("isHotWorkRequired", null));
        resolvedData.put("isLotoRequired", args.getOrDefault("isLotoRequired", null));
        resolvedData.put("isConfinedSpaceEntryRequired", args.getOrDefault("isConfinedSpaceEntryRequired", null));
        resolvedData.put("dateOfWork", args.getOrDefault("dateOfWork", null));
        resolvedData.put("requestedBy", args.getOrDefault("requestedBy", null));
        resolvedData.put("foremanName", args.getOrDefault("foremanName", null));

        // Resolve location text to a WorkArea
        String locationText = (String) args.get("location");
        Map<String, Object> resolvedWorkArea = resolveWorkArea(locationText);
        resolvedData.put("workArea", resolvedWorkArea);

        // If work area found, load its constant hazards to provide hints
        List<String> hazardHints = new ArrayList<>();
        if (resolvedWorkArea != null) {
            Long workAreaId = ((Number) resolvedWorkArea.get("id")).longValue();
            WorkArea wa = workAreaRepo.findById(workAreaId).orElse(null);
            if (wa != null) {
                if (wa.getConstantHotWorkMeasuresJson() != null && !wa.getConstantHotWorkMeasuresJson().isBlank()) {
                    hazardHints.add("This area has hot work measures pre-configured");
                }
                if (wa.getConstantConfinedSpaceHazardsJson() != null && !wa.getConstantConfinedSpaceHazardsJson().isBlank()) {
                    hazardHints.add("This area has confined space hazards pre-configured");
                }
                if (wa.getConstantHazardsJson() != null && !wa.getConstantHazardsJson().isBlank()) {
                    hazardHints.add("This area has general hazards pre-configured");
                }
            }
        }

        // Load available work areas for selection
        Map<String, Object> availableOptions = new LinkedHashMap<>();
        availableOptions.put("workAreas", workAreaRepo.findAll().stream()
                .map(wa -> {
                    Map<String, Object> m = new LinkedHashMap<>();
                    m.put("id", wa.getId());
                    m.put("name", wa.getName() != null ? wa.getName() : "");
                    m.put("description", wa.getDescription() != null ? wa.getDescription() : "");
                    return m;
                })
                .toList());

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("flowType", "workRequest");
        result.put("resolvedData", resolvedData);
        result.put("availableOptions", availableOptions);
        result.put("hazardHints", hazardHints);
        result.put("success", true);

        log.info("[Agent] Work request creation assist — resolved: {}", resolvedData);
        return result;
    }

    private Map<String, Object> resolveWorkArea(String locationText) {
        if (locationText == null || locationText.isBlank()) return null;

        String search = locationText.trim().toLowerCase();

        // 1. Exact name match
        var exact = workAreaRepo.findFirstByNameIgnoreCase(locationText.trim());
        if (exact.isPresent()) {
            return workAreaToMap(exact.get());
        }

        // 2. Fuzzy match: name or description contains search text
        for (WorkArea wa : workAreaRepo.findAll()) {
            if (wa.getName() != null && wa.getName().toLowerCase().contains(search)) {
                return workAreaToMap(wa);
            }
            if (wa.getDescription() != null && wa.getDescription().toLowerCase().contains(search)) {
                return workAreaToMap(wa);
            }
        }

        // 3. Reverse: search text contains work area name
        for (WorkArea wa : workAreaRepo.findAll()) {
            if (wa.getName() != null && search.contains(wa.getName().toLowerCase())) {
                return workAreaToMap(wa);
            }
        }

        return null;
    }

    private Map<String, Object> workAreaToMap(WorkArea wa) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("id", wa.getId());
        m.put("name", wa.getName() != null ? wa.getName() : "");
        m.put("description", wa.getDescription() != null ? wa.getDescription() : "");
        return m;
    }

    private Map<String, Object> findMatchingJobsForWorkRequest(Map<String, Object> args) {
        String workRequestId = (String) args.get("workRequestId");
        List<Map<String, Object>> matches = jobLogService.findMatchingJobs(workRequestId);
        Map<String, Object> result = new HashMap<>();
        result.put("results", matches);
        result.put("totalCount", matches.size());
        result.put("workRequestId", workRequestId);
        return result;
    }

    // ========== TEACHING ==========

    private Map<String, Object> getAppHelp(Map<String, Object> args) {
        String topic = ((String) args.get("topic")).toLowerCase();
        String helpText = getHelpText(topic);
        return Map.of("helpText", helpText, "topic", topic);
    }

    private String getHelpText(String topic) {
        if (topic.contains("loto") && topic.contains("standard")) {
            return """
                    LOTO Standards are reusable isolation procedures containing an ordered list of LOTO points.
                    Navigate to /loto-standards in the app. Click 'New Standard', give it a name and description.
                    Then add LOTO points to the standard one by one or search for them.
                    Points can be reordered by dragging. Each standard can belong to one or more groups for organization.
                    Standards can be linked across Unit 01 and Unit 02 via the counterpart preview feature.
                    """;
        } else if (topic.contains("loto") && topic.contains("point")) {
            return """
                    LOTO Points represent individual isolation points on equipment (valves, breakers, switches).
                    Navigate to /loto-points. Click 'New' to create a point.
                    Key fields: tag number (e.g. 01-HRH-HV-0001), description, specific location,
                    normal position, isolated position, equipment type, and system.
                    Points can be linked to equipment and appear on P&ID drawings.
                    """;
        } else if (topic.contains("permit")) {
            return """
                    The Permit Builder is at /permit-builder. The workflow is:
                    1. Create a Job Log (groups all work for a job/project)
                    2. Create Daily Permit Packages within the job (one per contractor per day)
                    3. Add individual permits to each package: Safe Work, Hot Work, Confined Space, etc.
                    Permit numbers are auto-generated. Packages can be reissued for new days.
                    """;
        } else if (topic.contains("equipment")) {
            return """
                    Equipment management is at /equipment. Equipment represents physical plant assets
                    (valves, pumps, heat exchangers, breakers, etc.).
                    Each has a tag number (e.g. 01-V-001), description, type, system, location, and vendor.
                    Equipment can be linked to P&ID files and LOTO points.
                    Use search to find equipment by tag number or description.
                    """;
        } else if (topic.contains("file") || topic.contains("pid") || topic.contains("drawing")) {
            return """
                    File management is at /files. Files include P&IDs, single line diagrams (SLDs),
                    vendor drawings, and other engineering documents.
                    Each file has a name, file number, type, vendor, and system.
                    Files can be uploaded as PDFs and linked to equipment.
                    Use search to find files by name, number, or system.
                    """;
        } else if (topic.contains("navigation") || topic.contains("app") || topic.contains("overview")) {
            return """
                    App navigation:
                    - /home - Dashboard with navigation cards
                    - /permit-builder - Permit management (jobs, daily packages, individual permits)
                    - /loto-standards - LOTO isolation procedures
                    - /loto-points - Individual LOTO isolation points
                    - /equipment - Plant equipment management
                    - /files - Engineering files and drawings
                    - /settings - App configuration
                    Use the left sidebar menu for quick navigation within each section.
                    """;
        }
        return "I can help with: LOTO points, LOTO standards, equipment, files, permits, navigation, and general plant operations. What would you like to know about?";
    }
}
