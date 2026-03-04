package com.dk_power.power_plant_java.sevice.agent;

import com.dk_power.power_plant_java.dto.permits.DailyPermitPackageDto;
import com.dk_power.power_plant_java.dto.permits.loto_point.LotoPointIdDto;
import com.dk_power.power_plant_java.dto.permits.loto_standard.LotoStandardIdDto;
import com.dk_power.power_plant_java.entities.loto.LotoPoint;
import com.dk_power.power_plant_java.sevice.angular.NgEquipmentService;
import com.dk_power.power_plant_java.sevice.angular.file.NgFileService;
import com.dk_power.power_plant_java.sevice.angular.loto.NgLotoPointService;
import com.dk_power.power_plant_java.sevice.angular.loto.NgLotoStandardService;
import com.dk_power.power_plant_java.sevice.angular.permits.NgDailyPermitPackageService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
@ConditionalOnProperty(name = "gemini.api.key")
public class AgentActionExecutor {

    private final NgFileService fileService;
    private final NgEquipmentService equipmentService;
    private final NgLotoPointService lotoPointService;
    private final NgLotoStandardService lotoStandardService;
    private final NgDailyPermitPackageService dailyPermitPackageService;

    public Map<String, Object> executeSearch(String functionName, Map<String, Object> args) {
        try {
            return switch (functionName) {
                case "searchFiles" -> searchFiles(args);
                case "searchEquipment" -> searchEquipment(args);
                case "searchLotoPoints" -> searchLotoPoints(args);
                case "searchPermits" -> searchPermits(args);
                case "getAppHelp" -> getAppHelp(args);
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

    public boolean isCreateAction(String functionName) {
        return functionName.startsWith("create");
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

    private Map<String, Object> searchEquipment(Map<String, Object> args) {
        String query = (String) args.get("query");
        var results = equipmentService.complexSearch(query, 0, 10);
        return Map.of(
                "results", results.getContent().stream()
                        .map(e -> {
                            Map<String, Object> m = new LinkedHashMap<>();
                            m.put("id", e.getId());
                            m.put("tagNumber", e.getTagNumber() != null ? e.getTagNumber() : "");
                            m.put("description", e.getDescription() != null ? e.getDescription() : "");
                            return m;
                        })
                        .toList(),
                "totalCount", results.getTotalElements()
        );
    }

    private Map<String, Object> searchLotoPoints(Map<String, Object> args) {
        String query = (String) args.get("query");
        var results = lotoPointService.complexSearch(query, 0, 10);
        return Map.of(
                "results", results.getContent().stream()
                        .map(lp -> {
                            Map<String, Object> m = new LinkedHashMap<>();
                            m.put("id", lp.getId());
                            m.put("tagNumber", lp.getTagNumber() != null ? lp.getTagNumber() : "");
                            m.put("description", lp.getDescription() != null ? lp.getDescription() : "");
                            m.put("specificLocation", lp.getSpecificLocation() != null ? lp.getSpecificLocation() : "");
                            return m;
                        })
                        .toList(),
                "totalCount", results.getTotalElements()
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
