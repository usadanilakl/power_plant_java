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

    public static final FunctionDeclaration SEARCH_LOTO_POINTS = FunctionDeclaration.builder()
            .name("searchLotoPoints")
            .description("Search for LOTO isolation points or equipment (valves, pumps, breakers, etc.) " +
                    "by tag number, description, system, or location. " +
                    "IMPORTANT: Always provide multiple search query variations to handle abbreviations.")
            .parameters(Schema.builder()
                    .type(Type.Known.OBJECT)
                    .properties(Map.of(
                            "queries", Schema.builder()
                                    .type(Type.Known.ARRAY)
                                    .items(Schema.builder().type(Type.Known.STRING).build())
                                    .description("Array of search query variations. Always include: " +
                                            "(1) the original user phrase, " +
                                            "(2) abbreviated forms using database naming conventions, " +
                                            "(3) key individual terms. " +
                                            "Example: user says 'boiler feed pump discharge valve' -> " +
                                            "[\"boiler feed pump discharge valve\", \"BFP DISCH VLV\", \"BFP DISCH\", \"BFP\", \"boiler feed pump\"]")
                                    .build()
                    ))
                    .required(List.of("queries"))
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

    // ========== WIZARD ASSIST FUNCTIONS ==========

    public static final FunctionDeclaration ASSIST_LOTO_POINT_CREATION = FunctionDeclaration.builder()
            .name("assistLotoPointCreation")
            .description("Help the user create a new LOTO point through a conversational flow. " +
                    "Extract as many fields as possible from the user's natural language request. " +
                    "All parameters are optional — provide whatever can be inferred from context. " +
                    "Prefer this function when the user describes equipment in detail (type, position, location). " +
                    "Use createLotoPoint only for quick creates with just a tag number and description.")
            .parameters(Schema.builder()
                    .type(Type.Known.OBJECT)
                    .properties(Map.of(
                            "tagNumber", Schema.builder()
                                    .type(Type.Known.STRING)
                                    .description("Tag number if mentioned (e.g. '01-HRH-HV-0001')")
                                    .build(),
                            "description", Schema.builder()
                                    .type(Type.Known.STRING)
                                    .description("Equipment description (e.g. 'CND PMP DISCH VLV')")
                                    .build(),
                            "unit", Schema.builder()
                                    .type(Type.Known.STRING)
                                    .description("Plant unit: '01' or '02'")
                                    .build(),
                            "specificLocation", Schema.builder()
                                    .type(Type.Known.STRING)
                                    .description("Specific physical location text")
                                    .build(),
                            "equipmentType", Schema.builder()
                                    .type(Type.Known.STRING)
                                    .description("Equipment type name to resolve (e.g. 'HV', 'MV', 'CB', 'AOV', 'MOV')")
                                    .build(),
                            "normalPosition", Schema.builder()
                                    .type(Type.Known.STRING)
                                    .description("Normal operating position (e.g. 'OPEN', 'CLOSED', 'ON', 'OFF')")
                                    .build(),
                            "isolatedPosition", Schema.builder()
                                    .type(Type.Known.STRING)
                                    .description("Isolated position (e.g. 'CLOSED', 'OPEN', 'OFF', 'RACKED OUT')")
                                    .build(),
                            "location", Schema.builder()
                                    .type(Type.Known.STRING)
                                    .description("General location name to resolve (e.g. 'Turbine Hall', 'Boiler Area')")
                                    .build()
                    ))
                    .build())
            .build();

    public static final FunctionDeclaration ASSIST_WORK_REQUEST_CREATION = FunctionDeclaration.builder()
            .name("assistWorkRequestCreation")
            .description("Help a contractor create a work request from a natural language description. " +
                    "Extract location, equipment, work type indicators (hot work, confined space, LOTO), " +
                    "company info, and scheduling details. " +
                    "Use this when a user describes work they need to perform at the plant.")
            .parameters(Schema.builder()
                    .type(Type.Known.OBJECT)
                    .properties(Map.of(
                            "workScope", Schema.builder()
                                    .type(Type.Known.STRING)
                                    .description("The work to be performed, extracted from user description")
                                    .build(),
                            "company", Schema.builder()
                                    .type(Type.Known.STRING)
                                    .description("Contractor company name if mentioned")
                                    .build(),
                            "location", Schema.builder()
                                    .type(Type.Known.STRING)
                                    .description("Location/area description (e.g. 'cooling tower', 'turbine hall', 'boiler area')")
                                    .build(),
                            "affectedEquipment", Schema.builder()
                                    .type(Type.Known.STRING)
                                    .description("Equipment mentioned (e.g. 'pipes', 'BFP', 'condenser')")
                                    .build(),
                            "isHotWorkRequired", Schema.builder()
                                    .type(Type.Known.BOOLEAN)
                                    .description("True if welding, cutting, grinding, brazing, soldering, open flame, or spark-producing work mentioned")
                                    .build(),
                            "isLotoRequired", Schema.builder()
                                    .type(Type.Known.BOOLEAN)
                                    .description("True if energy isolation, lockout, tagout, de-energize, or electrical work mentioned")
                                    .build(),
                            "isConfinedSpaceEntryRequired", Schema.builder()
                                    .type(Type.Known.BOOLEAN)
                                    .description("True if confined space, vessel entry, tank entry, manhole, or duct entry mentioned")
                                    .build(),
                            "dateOfWork", Schema.builder()
                                    .type(Type.Known.STRING)
                                    .description("Date of work if mentioned (MM/dd/yyyy format)")
                                    .build(),
                            "requestedBy", Schema.builder()
                                    .type(Type.Known.STRING)
                                    .description("Person requesting the work if mentioned")
                                    .build(),
                            "foremanName", Schema.builder()
                                    .type(Type.Known.STRING)
                                    .description("Foreman name if mentioned")
                                    .build()
                    ))
                    .build())
            .build();

    public static final FunctionDeclaration FIND_MATCHING_JOBS = FunctionDeclaration.builder()
            .name("findMatchingJobsForWorkRequest")
            .description("Find existing open jobs that match a work request to avoid creating duplicates. " +
                    "Use this when an operator asks to process a work request or create a job. " +
                    "Returns scored matches based on company, location, work area, and date overlap.")
            .parameters(Schema.builder()
                    .type(Type.Known.OBJECT)
                    .properties(Map.of(
                            "workRequestId", Schema.builder()
                                    .type(Type.Known.STRING)
                                    .description("The ID of the work request to find matching jobs for")
                                    .build()
                    ))
                    .required(List.of("workRequestId"))
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
                        SEARCH_FILES, SEARCH_LOTO_POINTS, SEARCH_PERMITS,
                        CREATE_LOTO_POINT, CREATE_LOTO_STANDARD, CREATE_DAILY_PERMIT_PACKAGE,
                        ASSIST_LOTO_POINT_CREATION, ASSIST_WORK_REQUEST_CREATION,
                        FIND_MATCHING_JOBS, GET_APP_HELP
                ))
                .build());
    }
}
