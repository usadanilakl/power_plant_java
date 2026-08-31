package com.dk_power.power_plant_java.sevice.sharepoint;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.*;

/**
 * Brings SharePoint lists up to the shape the code expects.
 *
 * <h2>Re-running this is safe</h2>
 * Every operation is additive and idempotent, by construction:
 * <ul>
 *   <li>a list is created only when {@code listExists} says it is absent;</li>
 *   <li>a field is created only when {@code fieldExists} says it is absent — an existing column is
 *       never altered, retyped or dropped, so its data is untouched;</li>
 *   <li>an index is added only when {@code isFieldIndexed} says it is absent;</li>
 *   <li>each field is attempted in its own try/catch, so one failure cannot abort the rest or
 *       leave a list half-provisioned.</li>
 * </ul>
 * Nothing here deletes or overwrites. Adding a column to a definition below and re-running against
 * a live list adds exactly that column and leaves every existing item's data alone — the new column
 * simply reads empty on rows that predate it.
 *
 * <p><b>The one thing to get right on the consuming side:</b> those pre-existing rows will return
 * an EMPTY value for the new column on the next sync pass, and the field-merge snapshot will see
 * that as a change. Whatever applies the column locally must treat empty as "no opinion", never as
 * "clear the local value" — see {@code WorkRequest.applyDeclaredHazardsEnvelope}.
 */
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

            EnsureFieldsResult fields = ensureFields(def);
            List<String> indexedFields = ensureIndexes(def);

            log.info("[SP-Provision] {} list '{}' with {} new fields ({} failed), {} new indexes",
                    alreadyExisted ? "Updated" : "Created", def.title,
                    fields.added().size(), fields.failed().size(), indexedFields.size());
            result.put("success", true);
            result.put("alreadyExisted", alreadyExisted);
            result.put("fieldsAdded", fields.added());
            result.put("fieldsFailed", fields.failed());
            result.put("fieldsIndexed", indexedFields);
            String fieldsMsg = fields.added().size() + " new fields"
                    + (fields.failed().isEmpty() ? "" : " (" + fields.failed().size() + " failed)");
            result.put("message", (alreadyExisted ? "Updated" : "Created")
                    + " with " + fieldsMsg + ", " + indexedFields.size() + " new indexes");
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

        Map<String, Map<String, String>> fieldFailures = new LinkedHashMap<>();
        for (ListDefinition def : getAllListDefinitions()) {
            try {
                if (spAccess.listExists(def.title)) {
                    EnsureFieldsResult fields = ensureFields(def);
                    List<String> indexedFields = ensureIndexes(def);
                    log.info("[SP-Provision] Updated list '{}' with {} new fields ({} failed), {} new indexes",
                            def.title, fields.added().size(), fields.failed().size(), indexedFields.size());
                    updated.add(def.title);
                    if (!fields.failed().isEmpty()) fieldFailures.put(def.title, fields.failed());
                } else {
                    spAccess.createList(def.title);
                    EnsureFieldsResult fields = ensureFields(def);
                    ensureIndexes(def);
                    log.info("[SP-Provision] Created list '{}' with {} fields ({} failed)",
                            def.title, fields.added().size(), fields.failed().size());
                    created.add(def.title);
                    if (!fields.failed().isEmpty()) fieldFailures.put(def.title, fields.failed());
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
        summary.put("fieldFailures", fieldFailures);
        summary.put("totalCreated", created.size());
        summary.put("totalUpdated", updated.size());
        summary.put("totalErrors", errors.size());
        summary.put("totalFieldFailures", fieldFailures.values().stream().mapToInt(Map::size).sum());
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
                        text("SubmitterPhone"), text("SubmitterCompany"), text("TimeSubmitted"),
                        // The requester's hazard declaration as one JSON envelope. A payload
                        // column, not a queryable one - kept out of the default view because a
                        // wall of JSON makes the list unreadable. See DeclaredHazards for why the
                        // three blocks share a single column.
                        payload("DeclaredHazards"),
                        // Every area the request covers, as one JSON envelope. Same payload-not-
                        // queryable reasoning as DeclaredHazards: SharePoint never reports on an
                        // individual area, and a column per area is not expressible anyway.
                        payload("WorkAreas")),

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
                        text("SubmitterName"), text("SubmitterEmail"), text("SubmitterPhone"),
                        // Maximo picker fields (v1 sends location/assetnum on WO/SR create;
                        // stored in SP too for cross-reference when hub is offline).
                        text("MaximoLocation"), text("MaximoAssetnum"),
                        // Insulation-contractor offline-close mechanism. When the contractor
                        // marks an item complete via PWA→PA→SP (hub unreachable), these three
                        // fields are set. Hub's SP-import polling picks up the change and
                        // triggers Maximo WO COMP via bridge.complete. See project/features/
                        // maximo/field-list-sr.md for the full offline-close flow.
                        bool("ContractorCompleted"), text("ContractorCompletedBy"), text("ContractorCompletedAt")),

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
                        // eBinder identity — must round-trip so push→pull preserves the match key.
                        text("SourceId"), text("Manufacturer"), text("SourceRevisionDate"),
                        text("ProcessedByName"), text("ProcessedByEmail"),
                        text("SubmitterName"), text("SubmitterEmail"), text("SubmitterPhone")),

                list("SDS Audit",
                        text("PwaId"), text("ChemicalSpId"), text("ChemicalLocalUuid"), text("ChemicalName"),
                        text("Action"), note("OldSnapshot"), text("AuditedByName"), text("AuditedByEmail"),
                        text("AuditedAt"), note("Comments"), text("Campaign")),

                list("Qualification Catalog",
                        text("PwaId"), text("QualificationCode"), text("QualificationName"),
                        text("QualificationType"), note("Description"), bool("RequiresExpiration"),
                        text("DefaultValidityMonths"), bool("IsActive"), text("SortOrder"),
                        note("Notes")),

                list("Employees Qualifications",
                        text("PwaId"), text("UserId"), text("UserName"), text("UserEmail"),
                        text("WindowsUsername"), text("Role"), text("QualificationId"),
                        text("QualificationCode"), text("QualificationName"), text("QualificationType"),
                        text("Status"), text("IssuedDate"), text("ExpirationDate"),
                        text("CredentialNumber"), text("Issuer"), note("Notes")),

                // ── Ordering feature (hub-independent cloud ledger — see project/features/ordering) ──
                list("Orders",
                        text("PwaId"), text("OrderDate"), text("OrderedBy"), text("Vendor"),
                        text("CatalogItemKey"), text("PoNumber"), text("Recipient"), text("Cc"),
                        text("Subject"), note("LinesJson"), bool("EmailSent"), note("EmailError"),
                        text("SourceSuggestionId"), text("Status")),

                list("OrderCatalog",
                        text("ItemKey"), text("DisplayName"), text("Vendor"), text("ContactEmail"),
                        text("CcEmails"), note("BodyNote"), text("BlanketPoNumber"), text("Unit"),
                        text("OrderMode"), note("DefaultQtyPresets"), note("TextOptions"), bool("Active"), text("SortOrder")),

                list("OrderSuggestions",
                        text("PwaId"), text("SuggestedAt"), text("CatalogItemKey"), text("Source"),
                        text("RoundQuestionId"), text("Reading"), text("LowLimit"), text("SuggestedQty"),
                        note("Reason"), text("Status"), text("ResultingOrderId"))
        );
    }

    // ====================== Indexing ======================

    private static final int MAX_INDEXES_PER_LIST = 20;

    // High-priority fields to index first (most commonly filtered/sorted)
    private static final List<String> HIGH_PRIORITY_FIELDS = List.of(
            "PwaId", "Status", "CurrentStatus", "UserId", "QualificationId"
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

    private record FieldDef(String name, int typeKind, String lookupListTitle, String lookupFieldName,
                            boolean hideFromDefaultView) {}
    private record ListDefinition(String title, List<FieldDef> fields) {}

    private static FieldDef text(String name) { return new FieldDef(name, TEXT, null, null, false); }
    private static FieldDef note(String name) { return new FieldDef(name, NOTE, null, null, false); }
    private static FieldDef bool(String name) { return new FieldDef(name, BOOLEAN, null, null, false); }
    private static FieldDef lookup(String name, String targetListTitle, String targetFieldName) {
        return new FieldDef(name, LOOKUP, targetListTitle, targetFieldName, false);
    }

    /**
     * A multi-line text column holding machine-readable JSON — created like {@link #note} but kept
     * out of the list's default view. Humans read these through the app, and dropping a serialised
     * blob into the default view pushes every readable column off the screen.
     *
     * <p>Only affects columns this provisioner CREATES. A field already present keeps whatever view
     * configuration it has, because ensureFields skips it entirely.
     */
    private static FieldDef payload(String name) { return new FieldDef(name, NOTE, null, null, true); }

    private void addField(String listTitle, FieldDef field) {
        if (field.typeKind == LOOKUP) {
            spAccess.addLookupFieldToList(listTitle, field.name, field.lookupListTitle, field.lookupFieldName);
        } else {
            spAccess.addFieldToList(listTitle, field.name, field.typeKind);
        }
    }

    /** Result of a per-list ensureFields pass — split into successes and per-field failures so a
     *  single bad field can't hide the rest. {@code failed} is keyed by field name → error message. */
    private record EnsureFieldsResult(List<String> added, Map<String, String> failed) {}

    private EnsureFieldsResult ensureFields(ListDefinition def) {
        List<String> added = new ArrayList<>();
        Map<String, String> failed = new LinkedHashMap<>();
        for (FieldDef field : def.fields) {
            try {
                if (spAccess.fieldExists(def.title, field.name)) continue;
                addField(def.title, field);
                if (!field.hideFromDefaultView) {
                    spAccess.addFieldToDefaultView(def.title, field.name);
                }
                added.add(field.name);
                log.info("[SP-Provision] Added field '{}' to '{}'", field.name, def.title);
            } catch (Exception e) {
                String msg = e.getMessage() != null ? e.getMessage() : e.getClass().getSimpleName();
                failed.put(field.name, msg);
                log.warn("[SP-Provision] Failed to add field '{}' to '{}': {}", field.name, def.title, msg);
            }
        }
        return new EnsureFieldsResult(added, failed);
    }

    private static ListDefinition list(String title, FieldDef... fields) {
        return new ListDefinition(title, List.of(fields));
    }
}
