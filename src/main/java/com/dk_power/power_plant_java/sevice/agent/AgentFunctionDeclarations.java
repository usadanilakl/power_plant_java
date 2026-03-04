package com.dk_power.power_plant_java.sevice.agent;

import com.google.genai.types.FunctionDeclaration;
import com.google.genai.types.Schema;
import com.google.genai.types.Tool;
import com.google.genai.types.Type;

import java.util.List;
import java.util.Map;

public class AgentFunctionDeclarations {

    // ========== SEARCH FUNCTIONS ==========

    public static final FunctionDeclaration SEARCH_FILES = FunctionDeclaration.builder()
            .name("searchFiles")
            .description("Search for engineering files (P&IDs, drawings, documents) by name, file number, system, or type")
            .parameters(Schema.builder()
                    .type(Type.Known.OBJECT)
                    .properties(Map.of(
                            "query", Schema.builder()
                                    .type(Type.Known.STRING)
                                    .description("Search text to match against file name, number, or related systems")
                                    .build()
                    ))
                    .required(List.of("query"))
                    .build())
            .build();

    public static final FunctionDeclaration SEARCH_EQUIPMENT = FunctionDeclaration.builder()
            .name("searchEquipment")
            .description("Search for plant equipment by tag number, description, system, or location")
            .parameters(Schema.builder()
                    .type(Type.Known.OBJECT)
                    .properties(Map.of(
                            "query", Schema.builder()
                                    .type(Type.Known.STRING)
                                    .description("Search text to match against equipment tag number or description")
                                    .build()
                    ))
                    .required(List.of("query"))
                    .build())
            .build();

    public static final FunctionDeclaration SEARCH_LOTO_POINTS = FunctionDeclaration.builder()
            .name("searchLotoPoints")
            .description("Search for LOTO (Lock Out Tag Out) isolation points by tag number, description, or location")
            .parameters(Schema.builder()
                    .type(Type.Known.OBJECT)
                    .properties(Map.of(
                            "query", Schema.builder()
                                    .type(Type.Known.STRING)
                                    .description("Search text to match against LOTO point tag number, description, or location")
                                    .build()
                    ))
                    .required(List.of("query"))
                    .build())
            .build();

    public static final FunctionDeclaration SEARCH_PERMITS = FunctionDeclaration.builder()
            .name("searchPermits")
            .description("Search for daily permit packages by status, company name, or person name")
            .parameters(Schema.builder()
                    .type(Type.Known.OBJECT)
                    .properties(Map.of(
                            "status", Schema.builder()
                                    .type(Type.Known.STRING)
                                    .description("Optional: permit status to filter by")
                                    .build(),
                            "companyName", Schema.builder()
                                    .type(Type.Known.STRING)
                                    .description("Optional: company name to filter by")
                                    .build(),
                            "personName", Schema.builder()
                                    .type(Type.Known.STRING)
                                    .description("Optional: person name to filter by")
                                    .build()
                    ))
                    .build())
            .build();

    // ========== CREATE FUNCTIONS ==========

    public static final FunctionDeclaration CREATE_LOTO_POINT = FunctionDeclaration.builder()
            .name("createLotoPoint")
            .description("Create a new LOTO (Lock Out Tag Out) isolation point. Requires user confirmation before execution.")
            .parameters(Schema.builder()
                    .type(Type.Known.OBJECT)
                    .properties(Map.of(
                            "tagNumber", Schema.builder()
                                    .type(Type.Known.STRING)
                                    .description("Unique tag number for the LOTO point (e.g. '01-HRH-HV-0001')")
                                    .build(),
                            "description", Schema.builder()
                                    .type(Type.Known.STRING)
                                    .description("Description of the LOTO point")
                                    .build(),
                            "specificLocation", Schema.builder()
                                    .type(Type.Known.STRING)
                                    .description("Specific physical location of the isolation point")
                                    .build()
                    ))
                    .required(List.of("tagNumber", "description"))
                    .build())
            .build();

    public static final FunctionDeclaration CREATE_LOTO_STANDARD = FunctionDeclaration.builder()
            .name("createLotoStandard")
            .description("Create a new LOTO standard (a reusable set of LOTO points for a procedure). Requires user confirmation.")
            .parameters(Schema.builder()
                    .type(Type.Known.OBJECT)
                    .properties(Map.of(
                            "name", Schema.builder()
                                    .type(Type.Known.STRING)
                                    .description("Name of the LOTO standard")
                                    .build(),
                            "description", Schema.builder()
                                    .type(Type.Known.STRING)
                                    .description("Description of the LOTO standard procedure")
                                    .build()
                    ))
                    .required(List.of("name"))
                    .build())
            .build();

    public static final FunctionDeclaration CREATE_DAILY_PERMIT_PACKAGE = FunctionDeclaration.builder()
            .name("createDailyPermitPackage")
            .description("Create a new daily permit package for a contractor. Requires user confirmation.")
            .parameters(Schema.builder()
                    .type(Type.Known.OBJECT)
                    .properties(Map.of(
                            "companyName", Schema.builder()
                                    .type(Type.Known.STRING)
                                    .description("Name of the contractor company")
                                    .build(),
                            "personName", Schema.builder()
                                    .type(Type.Known.STRING)
                                    .description("Name of the responsible person")
                                    .build(),
                            "date", Schema.builder()
                                    .type(Type.Known.STRING)
                                    .description("Date for the permit package (MM/dd/yyyy format)")
                                    .build()
                    ))
                    .required(List.of("companyName", "personName", "date"))
                    .build())
            .build();

    // ========== TEACHING FUNCTION ==========

    public static final FunctionDeclaration GET_APP_HELP = FunctionDeclaration.builder()
            .name("getAppHelp")
            .description("Get guidance on how to use a specific feature of the application")
            .parameters(Schema.builder()
                    .type(Type.Known.OBJECT)
                    .properties(Map.of(
                            "topic", Schema.builder()
                                    .type(Type.Known.STRING)
                                    .description("The feature or topic to get help with, e.g. 'LOTO standard', 'permit builder', 'equipment search', 'file management'")
                                    .build()
                    ))
                    .required(List.of("topic"))
                    .build())
            .build();

    public static List<Tool> getAllTools() {
        return List.of(Tool.builder()
                .functionDeclarations(List.of(
                        SEARCH_FILES, SEARCH_EQUIPMENT, SEARCH_LOTO_POINTS, SEARCH_PERMITS,
                        CREATE_LOTO_POINT, CREATE_LOTO_STANDARD, CREATE_DAILY_PERMIT_PACKAGE,
                        GET_APP_HELP
                ))
                .build());
    }
}
