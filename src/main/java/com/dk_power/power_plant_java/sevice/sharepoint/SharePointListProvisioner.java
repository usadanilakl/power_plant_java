package com.dk_power.power_plant_java.sevice.sharepoint;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.*;

@Service
@RequiredArgsConstructor
@Slf4j
public class SharePointListProvisioner {

    private final SharePointCertificateAccess spAccess;

    private static final int TEXT = 2;
    private static final int NOTE = 3;
    private static final int LOOKUP = 7;
    private static final int BOOLEAN = 8;

    // ====================== Status check ======================

    public List<Map<String, Object>> checkAllStatuses() {
        List<Map<String, Object>> statuses = new ArrayList<>();
        for (ListDefinition def : getAllListDefinitions()) {
            Map<String, Object> entry = new LinkedHashMap<>();
            entry.put("title", def.title);
            entry.put("fieldCount", def.fields.size());
            try {
                entry.put("exists", spAccess.listExists(def.title));
                entry.put("error", null);
            } catch (Exception e) {
                entry.put("exists", false);
                entry.put("error", e.getMessage());
            }
            statuses.add(entry);
        }
        return statuses;
    }

    // ====================== Provision single ======================

    public Map<String, Object> provisionSingle(String listTitle) {
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("title", listTitle);

        ListDefinition def = getAllListDefinitions().stream()
                .filter(d -> d.title.equals(listTitle))
                .findFirst()
                .orElse(null);

        if (def == null) {
            result.put("success", false);
            result.put("error", "Unknown list title: " + listTitle);
            return result;
        }

        try {
            boolean alreadyExisted = spAccess.listExists(def.title);
            if (!alreadyExisted) {
                spAccess.createList(def.title);
            }

            List<String> addedFields = ensureFields(def);
            List<String> indexedFields = ensureIndexes(def);

            log.info("[SP-Provision] {} list '{}' with {} new fields, {} new indexes",
                    alreadyExisted ? "Updated" : "Created", def.title, addedFields.size(), indexedFields.size());
            result.put("success", true);
            result.put("alreadyExisted", alreadyExisted);
            result.put("fieldsAdded", addedFields);
            result.put("fieldsIndexed", indexedFields);
            result.put("message", (alreadyExisted ? "Updated" : "Created") + " with " + addedFields.size() + " new fields, " + indexedFields.size() + " new indexes");
        } catch (Exception e) {
            log.error("[SP-Provision] Failed to provision '{}': {}", def.title, e.getMessage());
            result.put("success", false);
            result.put("error", e.getMessage());
        }
        return result;
    }

    // ====================== Provision all ======================

    public Map<String, Object> provisionAll() {
        List<String> created = new ArrayList<>();
        List<String> updated = new ArrayList<>();
        Map<String, String> errors = new LinkedHashMap<>();

        for (ListDefinition def : getAllListDefinitions()) {
            try {
                if (spAccess.listExists(def.title)) {
                    List<String> addedFields = ensureFields(def);
                    List<String> indexedFields = ensureIndexes(def);
                    log.info("[SP-Provision] Updated list '{}' with {} new fields, {} new indexes", def.title, addedFields.size(), indexedFields.size());
                    updated.add(def.title);
                } else {
                    spAccess.createList(def.title);
                    ensureFields(def);
                    ensureIndexes(def);
                    log.info("[SP-Provision] Created list '{}' with {} fields", def.title, def.fields.size());
                    created.add(def.title);
                }
            } catch (Exception e) {
                log.error("[SP-Provision] Failed to provision '{}': {}", def.title, e.getMessage());
                errors.put(def.title, e.getMessage());
            }
        }

        Map<String, Object> summary = new LinkedHashMap<>();
        summary.put("created", created);
        summary.put("updated", updated);
        summary.put("errors", errors);
        summary.put("totalCreated", created.size());
        summary.put("totalUpdated", updated.size());
        summary.put("totalErrors", errors.size());
        return summary;
    }

    // ====================== List definitions ======================

    private List<ListDefinition> getAllListDefinitions() {
        return List.of(
                list("Safe Work Permits",
                        text("PwaId"), text("Date"), text("Time"), text("CompanyPerson"),
                        text("LocationOfWork"), text("SpecialInstructions"), text("RequestedBy"), text("Status")),

                list("Hot Work Permits",
                        text("PwaId"), text("Date"), text("Foreman"), text("FireWatch"),
                        text("MeterModel"), text("MeterNum"), text("SpecialInstructions"),
                        text("LocationOfWork"), text("Status")),

                list("Confined Space Permits",
                        text("PwaId"), text("Date"), text("Time"), text("SpaceToBeEntered"),
                        text("IssuedTo"), text("Duration"), text("MeterModel"), text("MeterNum"),
                        bool("Calibrated"), text("Status")),

                list("LOTO Permits",
                        text("PwaId"), text("EquipmentSystem"), text("LotoRequestor"),
                        text("Date"), text("BoxNumber"), text("Status")),

                list("Work Requests",
                        text("PwaId"), text("DateOfWork"), text("WorkRequestedBy"), text("Company"),
                        text("LocationOfWork"), text("AffectedEquipment"),
                        bool("IsLOTORequired"), bool("IsHotWorkRequired"), bool("IsConfinedSpaceEntryRequired"),
                        text("ForemanName"), text("FireWatchName"), text("SpaceToBeEntered"),
                        text("Status"), text("SubmitterName"), text("SubmitterEmail"),
                        text("MainWorkScope"), text("WorkAreaName"),
                        text("SubmitterPhone"), text("SubmitterCompany"), text("TimeSubmitted")),

                list("JHA",
                        text("PwaId"), text("JobName"), text("Applicability"), text("AnalysisBy"),
                        text("ReviewedBy"), text("ApprovedBy"), text("Date"), text("PPE"),
                        text("LOTO"), text("ConfinedSpace"), text("HazCom"),
                        text("HandAndPowerTools"), text("SpecialTools"), text("WorkRequestSharepointId"),
                        text("SubmitterName"), text("SubmitterEmail"), text("SubmitterPhone"),
                        text("SubmitterCompany"), text("TimeSubmitted"), text("Status"),
                        note("JobSteps")),

                list("Energized Work Permits",
                        text("PwaId"), text("Date"), text("Time"), text("LocationOfWork"),
                        text("IssuedTo"), text("WorkOrder"), note("CircuitDescription"),
                        note("WorkDescription"), note("Justification"), text("Requester"),
                        text("RequesterDate"), text("QualifiedPersonSignature"),
                        text("QualifiedPersonDate"), text("PlantManagerSignature"),
                        text("PlantManagerDate"), bool("WorkCanBePerformedSafely"), text("Status")),

                list("Excavation Permits",
                        text("PwaId"), text("Date"), text("Time"), text("LocationOfWork"),
                        text("IssuedTo"), text("Supervisor"), text("JobLocation"),
                        text("SupervisorPhone"), note("ExcavationDescription"), text("WorkOrder"),
                        bool("LocationPipingMarked"), text("FacilityName"), text("CompetentPerson"),
                        text("SoilType"), text("ExcavationDepth"), text("ExcavationWidth"),
                        text("ProtectiveSystemType"), text("Status")),

                list("Venting Permits",
                        text("PwaId"), text("Date"), text("Time"), text("LocationOfWork"),
                        text("IssuedTo"), text("PlantName"), text("SystemName"),
                        text("RequestingIndividual"), note("Purpose"), text("TimeCommence"),
                        text("TimeConclude"), text("GasType"), text("LEL"), text("UEL"),
                        text("CalculatedVolume"), text("Pressure"), text("GasIndicatorModel"),
                        text("GasIndicatorSerial"), text("CalibrationDate"), text("Status")),

                list("Instrumentation",
                        text("PwaId"), text("Tag Number"), text("Description"), text("Vendor"),
                        text("Location"), text("Type"), text("CurrentStatus"),
                        text("LastUpdatedDate"), text("LastUpdatedTime"), text("LastUpdatedBy"),
                        note("LastComment")),

                list("Instrumentation Log",
                        text("PwaId"), text("Tag Number"), lookup("InstrumentId", "Instrumentation", "ID"),
                        text("Description"), text("Status"), text("Date"), text("Time"),
                        text("Name"), note("Comment")),

                list("Field Lists",
                        text("PwaId"), text("ListType"), text("Status"), text("Location"),
                        text("SpecificLocation"), note("Notes"), text("DateObserved"),
                        text("EquipmentTag"),
                        text("SubmitterName"), text("SubmitterEmail"), text("SubmitterPhone")),

                list("Inventory",
                        text("PwaId"), text("ItemType"), text("Status"), text("Location"),
                        text("SerialNumber"), text("Manufacturer"), text("Model"),
                        note("Description"), text("QrToken"),
                        text("CurrentLocation"), text("CurrentHolderName"), text("CurrentHolderEmail"),
                        text("SubmitterName"), text("SubmitterEmail"), text("SubmitterPhone")),

                list("Inventory Usage",
                        text("PwaId"), text("InventoryItemId"), text("QrToken"),
                        text("UserName"), text("UserEmail"),
                        text("Location"), text("Purpose"), note("Comments"),
                        text("EventType"), text("ScannedAt"), text("ReturnedAt")),

                list("SDS",
                        text("PwaId"), note("Names"), note("Locations"), text("Status"),
                        text("BookNumber"), text("Section"), note("Notes"),
                        text("ProcessedByName"), text("ProcessedByEmail"),
                        text("SubmitterName"), text("SubmitterEmail"), text("SubmitterPhone"))
        );
    }

    // ====================== Indexing ======================

    private static final int MAX_INDEXES_PER_LIST = 20;

    // High-priority fields to index first (most commonly filtered/sorted)
    private static final List<String> HIGH_PRIORITY_FIELDS = List.of(
            "PwaId", "Status", "CurrentStatus"
    );

    // Medium-priority: date-related fields (commonly used in range queries)
    private static final List<String> MEDIUM_PRIORITY_FIELDS = List.of(
            "Date", "DateOfWork", "DateObserved", "TimeSubmitted",
            "LastUpdatedDate", "RequesterDate", "CalibrationDate"
    );

    private List<String> ensureIndexes(ListDefinition def) {
        List<String> newlyIndexed = new ArrayList<>();

        // Collect indexable fields: TEXT and BOOLEAN only (NOTE can't be indexed, LOOKUP is auto-indexed)
        List<FieldDef> indexable = def.fields.stream()
                .filter(f -> f.typeKind == TEXT || f.typeKind == BOOLEAN)
                .toList();

        // Sort by priority: high → medium → rest
        List<FieldDef> sorted = new ArrayList<>(indexable);
        sorted.sort(Comparator.comparingInt(f -> priority(f.name)));

        // Count existing indexes once upfront to avoid repeated API calls
        int existingCount = 0;
        boolean modifiedIndexed = spAccess.isFieldIndexed(def.title, "Modified");
        if (modifiedIndexed) existingCount++;

        Set<String> alreadyIndexed = new HashSet<>();
        for (FieldDef f : sorted) {
            if (spAccess.isFieldIndexed(def.title, f.name)) {
                alreadyIndexed.add(f.name);
                existingCount++;
            }
        }

        // Index the built-in Modified column first (best for incremental sync)
        if (!modifiedIndexed && existingCount < MAX_INDEXES_PER_LIST) {
            if (spAccess.indexField(def.title, "Modified")) {
                newlyIndexed.add("Modified");
                existingCount++;
            }
        }

        // Index custom fields in priority order
        for (FieldDef field : sorted) {
            if (existingCount >= MAX_INDEXES_PER_LIST) {
                log.warn("[SP-Provision] Index limit ({}) reached for '{}', skipping remaining fields",
                        MAX_INDEXES_PER_LIST, def.title);
                break;
            }
            if (alreadyIndexed.contains(field.name)) {
                continue;
            }
            if (spAccess.indexField(def.title, field.name)) {
                newlyIndexed.add(field.name);
                existingCount++;
            }
        }

        return newlyIndexed;
    }

    private int priority(String fieldName) {
        if (HIGH_PRIORITY_FIELDS.contains(fieldName)) return 0;
        if (MEDIUM_PRIORITY_FIELDS.contains(fieldName)) return 1;
        return 2;
    }

    // ====================== Helpers ======================

    private record FieldDef(String name, int typeKind, String lookupListTitle, String lookupFieldName) {}
    private record ListDefinition(String title, List<FieldDef> fields) {}

    private static FieldDef text(String name) { return new FieldDef(name, TEXT, null, null); }
    private static FieldDef note(String name) { return new FieldDef(name, NOTE, null, null); }
    private static FieldDef bool(String name) { return new FieldDef(name, BOOLEAN, null, null); }
    private static FieldDef lookup(String name, String targetListTitle, String targetFieldName) {
        return new FieldDef(name, LOOKUP, targetListTitle, targetFieldName);
    }

    private void addField(String listTitle, FieldDef field) {
        if (field.typeKind == LOOKUP) {
            spAccess.addLookupFieldToList(listTitle, field.name, field.lookupListTitle, field.lookupFieldName);
        } else {
            spAccess.addFieldToList(listTitle, field.name, field.typeKind);
        }
    }

    private List<String> ensureFields(ListDefinition def) {
        List<String> addedFields = new ArrayList<>();
        for (FieldDef field : def.fields) {
            if (spAccess.fieldExists(def.title, field.name)) {
                continue;
            }
            addField(def.title, field);
            spAccess.addFieldToDefaultView(def.title, field.name);
            addedFields.add(field.name);
        }
        return addedFields;
    }

    private static ListDefinition list(String title, FieldDef... fields) {
        return new ListDefinition(title, List.of(fields));
    }
}
