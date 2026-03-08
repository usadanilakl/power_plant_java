package com.dk_power.power_plant_java.config;

import com.dk_power.power_plant_java.entities.forms.FormContainer;
import com.dk_power.power_plant_java.entities.forms.PrintableForm;
import com.dk_power.power_plant_java.repository.forms.PrintableFormRepo;
import com.dk_power.power_plant_java.sevice.sync.SyncContext;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

@Component
@RequiredArgsConstructor
@Slf4j
public class PermitFormSeeder {

    private final PrintableFormRepo printableFormRepo;
    private final SyncContext syncContext;
    private final SyncConfig syncConfig;

    private static final int M = 20; // margin
    private static final int FW = 776; // full width (816 - 2 * margin)

    @EventListener(ApplicationReadyEvent.class)
    @Transactional
    public void seedForms() {
        // Non-hub machines: clean up any locally-seeded forms (they'll receive hub's forms via sync)
        if (!syncConfig.isHubMode()) {
            cleanupLocalDuplicateForms();
            log.info("Permit form seeder skipped (not hub mode)");
            return;
        }

        // Hub seeds forms WITHOUT syncContext so FieldChanges are created and synced to clients.
        // Existing guards (findByFormTypeAndIsPrimary) prevent re-seeding on subsequent startups.
        try {
            seedEnergizedWorkForm();
            seedVentingForm();
            seedExcavationForm();
            seedLotoForm();
            log.info("Permit form seeder completed");
        } catch (Exception e) {
            log.error("Permit form seeder failed (non-fatal): {}", e.getMessage(), e);
        }
    }

    /**
     * On non-hub machines, remove locally-seeded forms if hub-sourced forms have arrived via sync.
     * This prevents duplicates (same formType but different device-prefixed IDs).
     * Runs inside syncContext since this is local cleanup, not a change to broadcast.
     */
    private void cleanupLocalDuplicateForms() {
        syncContext.executeInSyncContext(() -> {
            try {
                long devicePrefix = syncConfig.getDeviceNumber() * 1_000_000_000L;
                long deviceCeiling = devicePrefix + 1_000_000_000L;

                for (String formType : List.of("EnergizedWorkPermit", "VentingPermit", "ExcavationPermit", "Loto")) {
                    List<PrintableForm> forms = printableFormRepo.findAllByFormType(formType);
                    if (forms.size() <= 1) continue;

                    // Check if any form came from a different device (i.e., hub-synced)
                    boolean hasHubForm = forms.stream()
                        .anyMatch(f -> f.getId() < devicePrefix || f.getId() >= deviceCeiling);

                    if (!hasHubForm) continue;

                    // Soft-delete local forms, keep hub-synced ones
                    for (PrintableForm form : forms) {
                        if (form.getId() >= devicePrefix && form.getId() < deviceCeiling) {
                            form.setDeleted(true);
                            printableFormRepo.save(form);
                            log.info("Cleaned up locally-seeded form: {} #{} (hub-synced form exists)",
                                formType, form.getId());
                        }
                    }
                }
            } catch (Exception e) {
                log.warn("Form cleanup failed (non-fatal): {}", e.getMessage());
            }
        });
    }

    // ========== ENERGIZED WORK PERMIT (1 page) ==========

    private void seedEnergizedWorkForm() {
        if (printableFormRepo.findByFormTypeAndIsPrimary("EnergizedWorkPermit", true).isPresent()) return;

        PrintableForm form = createForm("Energized Electrical Work Permit", "EnergizedWorkPermit");
        int p = 1;
        int y = M;

        // Header
        form.addFormContainer(text(M, y, FW, 30, "Energized Electrical Work Permit", p, bold(18)));
        y += 30;
        form.addFormContainer(text(M, y, FW, 18, "Appendix A", p, centered()));
        y += 24;

        // Work Area
        form.addFormContainer(text(M, y, 100, 20, "Work Area:", p, bold(11)));
        form.addFormContainer(field(120, y, FW - 100, 26, "workArea", "work-area-select", p));
        y += 34;

        // Section 1 header
        form.addFormContainer(text(M, y, 440, 20, "Section 1: To be completed by the Requester", p, bold(11)));
        form.addFormContainer(text(540, y, 100, 20, "WorkOrder:", p, bold(11)));
        form.addFormContainer(field(640, y, 156, 22, "workOrder", "text", p));
        y += 28;

        // 1. Circuit description
        form.addFormContainer(text(M, y, 20, 18, "1.", p, Map.of()));
        form.addFormContainer(text(40, y, 400, 18, "Description of circuit/equipment/job location:", p, Map.of()));
        form.addFormContainer(field(M + 20, y + 18, FW - 20, 40, "circuitDescription", "textarea", p));
        y += 64;

        // 2. Work description
        form.addFormContainer(text(M, y, 20, 18, "2.", p, Map.of()));
        form.addFormContainer(text(40, y, 300, 18, "Description of work to be done:", p, Map.of()));
        form.addFormContainer(field(M + 20, y + 18, FW - 20, 40, "workDescription", "textarea", p));
        y += 64;

        // 3. Justification
        form.addFormContainer(text(M, y, 20, 18, "3.", p, Map.of()));
        form.addFormContainer(text(40, y, 700, 18, "Justification of why the equipment cannot be de-energized or the work deferred:", p, Map.of()));
        form.addFormContainer(field(M + 20, y + 18, FW - 20, 40, "justification", "textarea", p));
        y += 64;

        // Note banner
        form.addFormContainer(text(M, y, FW, 22, "NOTE: Every effort shall be made to de-energize the circuit/equipment", p,
                Map.of("backgroundColor", "#666", "color", "white", "textAlign", "center", "fontWeight", "bold", "fontSize", "10px")));
        y += 28;

        // Requester + Date (labels inline with inputs)
        form.addFormContainer(text(M, y, 70, 22, "Requester:", p, bold(10)));
        form.addFormContainer(field(90, y, 370, 22, "requester", "text", p));
        form.addFormContainer(text(480, y, 40, 22, "Date:", p, bold(10)));
        form.addFormContainer(field(520, y, 256, 22, "requesterDate", "date", p));
        y += 30;

        // Section 2 header
        form.addFormContainer(text(M, y, 600, 18, "Section 2: To be completed by the electrically qualified persons doing the work:", p, bold(10)));
        form.addFormContainer(text(640, y, 136, 18, "Check When Complete", p, bold(9)));
        y += 24;

        // Checklist items
        // 1. Job description
        form.addFormContainer(text(M, y, 20, 18, "1.", p, Map.of()));
        form.addFormContainer(text(40, y, 560, 18, "Detailed job description procedure to be used in performing the above detailed work:", p, Map.of()));
        form.addFormContainer(field(700, y, 24, 24, "checklist.jobDescriptionComplete", "checkbox", p));
        form.addFormContainer(field(40, y + 18, 640, 22, "checklist.jobDescription", "text", p));
        y += 46;

        // 2. Safe work practices
        form.addFormContainer(text(M, y, 20, 18, "2.", p, Map.of()));
        form.addFormContainer(text(40, y, 500, 18, "Description of safe work practices to be employed:", p, Map.of()));
        form.addFormContainer(field(700, y, 24, 24, "checklist.safeWorkPracticesComplete", "checkbox", p));
        form.addFormContainer(field(40, y + 18, 640, 22, "checklist.safeWorkPractices", "text", p));
        y += 46;

        // 3. Shock hazard analysis
        form.addFormContainer(text(M, y, 20, 18, "3.", p, Map.of()));
        form.addFormContainer(text(40, y, 500, 18, "Results of the shock hazard analysis:", p, Map.of()));
        form.addFormContainer(field(40, y + 18, 640, 20, "checklist.shockHazardAnalysis", "text", p));
        y += 42;
        form.addFormContainer(text(60, y, 200, 20, "a. Limited approach boundary", p, Map.of()));
        form.addFormContainer(field(260, y, 416, 20, "checklist.limitedApproachBoundary", "text", p));
        form.addFormContainer(field(700, y, 24, 20, "checklist.limitedApproachBoundaryComplete", "checkbox", p));
        y += 24;
        form.addFormContainer(text(60, y, 210, 20, "b. Restricted approach boundary", p, Map.of()));
        form.addFormContainer(field(270, y, 406, 20, "checklist.restrictedApproachBoundary", "text", p));
        form.addFormContainer(field(700, y, 24, 20, "checklist.restrictedApproachBoundaryComplete", "checkbox", p));
        y += 24;
        form.addFormContainer(text(60, y, 210, 20, "c. Prohibited approach boundary", p, Map.of()));
        form.addFormContainer(field(270, y, 406, 20, "checklist.prohibitedApproachBoundary", "text", p));
        form.addFormContainer(field(700, y, 24, 20, "checklist.prohibitedApproachBoundaryComplete", "checkbox", p));
        y += 26;

        // 4. Flash protection boundary
        form.addFormContainer(text(M, y, 20, 18, "4.", p, Map.of()));
        form.addFormContainer(text(40, y, 400, 18, "Determine the flash protection boundary:", p, Map.of()));
        form.addFormContainer(field(40, y + 18, 640, 20, "checklist.flashProtectionBoundary", "text", p));
        y += 42;
        form.addFormContainer(text(60, y, 440, 20, "a. Available incident energy or arc flash PPE category", p, Map.of()));
        form.addFormContainer(field(500, y, 176, 20, "checklist.incidentEnergy", "text", p));
        form.addFormContainer(field(700, y, 24, 20, "checklist.incidentEnergyComplete", "checkbox", p));
        y += 24;
        form.addFormContainer(text(60, y, 440, 20, "b. Necessary arc flash PPE and protective equipment", p, Map.of()));
        form.addFormContainer(field(500, y, 176, 20, "checklist.arcFlashPpe", "text", p));
        form.addFormContainer(field(700, y, 24, 20, "checklist.arcFlashPpeComplete", "checkbox", p));
        y += 24;
        form.addFormContainer(text(60, y, 200, 20, "c. Arc flash boundary", p, Map.of()));
        form.addFormContainer(field(260, y, 416, 20, "checklist.arcFlashBoundary", "text", p));
        form.addFormContainer(field(700, y, 24, 20, "checklist.arcFlashBoundaryComplete", "checkbox", p));
        y += 26;

        // 5. Means to restrict access
        form.addFormContainer(text(M, y, 20, 18, "5.", p, Map.of()));
        form.addFormContainer(text(40, y, 600, 18, "Means employed to restrict access of unqualified persons from the work area:", p, Map.of()));
        form.addFormContainer(field(700, y, 24, 24, "checklist.meansToRestrictAccessComplete", "checkbox", p));
        form.addFormContainer(field(40, y + 18, 640, 20, "checklist.meansToRestrictAccess", "text", p));
        y += 44;

        // 6. Pre-Job Brief
        form.addFormContainer(text(M, y, 20, 18, "6.", p, Map.of()));
        form.addFormContainer(text(40, y, 600, 18, "Evidence of completion of Pre-Job Brief, including discussion of any job-related hazards:", p, Map.of()));
        form.addFormContainer(field(700, y, 24, 24, "checklist.preJobBriefComplete", "checkbox", p));
        y += 24;

        // 7. Work can be performed safely
        form.addFormContainer(text(M, y, 20, 18, "7.", p, Map.of()));
        form.addFormContainer(text(40, y, 600, 18, "Do you agree the above-described work can be performed safely?", p, Map.of()));
        form.addFormContainer(field(700, y, 80, 24, "workCanBePerformedSafely", "radio", p));
        y += 28;

        // Section 3: Approval
        form.addFormContainer(text(M, y, FW, 18, "Section 3: Approval to perform the work while electrically energized:", p, bold(11)));
        y += 26;

        form.addFormContainer(field(M, y, 420, 22, "qualifiedPersonSignature", "text", p));
        form.addFormContainer(text(M, y + 22, 300, 14, "Electrically Qualified Person Signature", p, Map.of("fontSize", "9px")));
        form.addFormContainer(field(520, y, 256, 22, "qualifiedPersonDate", "date", p));
        form.addFormContainer(text(520, y + 22, 40, 14, "Date", p, Map.of("fontSize", "9px")));
        y += 40;

        form.addFormContainer(field(M, y, 420, 22, "plantManagerSignature", "text", p));
        form.addFormContainer(text(M, y + 22, 200, 14, "Plant Manager", p, Map.of("fontSize", "9px")));
        form.addFormContainer(field(520, y, 256, 22, "plantManagerDate", "date", p));
        form.addFormContainer(text(520, y + 22, 40, 14, "Date", p, Map.of("fontSize", "9px")));
        y += 40;

        // Footer
        form.addFormContainer(text(M, y, FW, 38, "No work on energized equipment shall be performed alone.\nIf the work scope changes, notify the Plant Manager.\nNo modified work scope shall be performed without PRIOR authorization from the Plant Manager", p,
                Map.of("backgroundColor", "#cc0000", "color", "white", "textAlign", "center", "fontSize", "9px")));

        printableFormRepo.save(form);
        log.info("Seeded EnergizedWorkPermit paper form");
    }

    // ========== VENTING PERMIT (2 pages) ==========

    private void seedVentingForm() {
        if (printableFormRepo.findByFormTypeAndIsPrimary("VentingPermit", true).isPresent()) return;

        PrintableForm form = createForm("Combustible Gas System Venting/Inerting Checklist", "VentingPermit");

        seedVentingPage1(form);
        seedVentingPage2(form);

        printableFormRepo.save(form);
        log.info("Seeded VentingPermit paper form");
    }

    private void seedVentingPage1(PrintableForm form) {
        int p = 1;
        int y = M;

        // Header
        form.addFormContainer(text(M, y, FW, 30, "Combustible Gas System Procedure Checklist", p, bold(16)));
        y += 30;
        form.addFormContainer(text(M, y, FW, 20, "Appendix A", p, centered()));
        y += 28;
        form.addFormContainer(text(M, y, FW, 20, "NAES Combustible Gas System Venting/Inerting Checklist", p, bold(11)));
        y += 28;

        // Work Area
        form.addFormContainer(text(M, y, 100, 20, "Work Area:", p, bold(11)));
        form.addFormContainer(field(120, y, FW - 100, 30, "workArea", "work-area-select", p));
        y += 38;

        // Plant Name
        form.addFormContainer(text(M, y, 90, 20, "Plant Name:", p, bold(10)));
        form.addFormContainer(field(110, y, FW - 90, 24, "plantName", "text", p));
        y += 30;

        // System + Date row
        form.addFormContainer(text(M, y, 60, 20, "System:", p, bold(10)));
        form.addFormContainer(field(80, y, 320, 24, "systemName", "text", p));
        form.addFormContainer(text(420, y, 40, 20, "Date:", p, bold(10)));
        form.addFormContainer(field(460, y, 316, 24, "date", "date", p));
        y += 30;

        // Requesting Individual + Purpose
        form.addFormContainer(text(M, y, 140, 20, "Requesting Individual:", p, bold(10)));
        form.addFormContainer(field(160, y, 240, 24, "requestingIndividual", "text", p));
        form.addFormContainer(text(420, y, 60, 20, "Purpose:", p, bold(10)));
        form.addFormContainer(field(480, y, 296, 24, "purpose", "text", p));
        y += 30;

        // Time commence + conclude
        form.addFormContainer(text(M, y, 190, 20, "Time and Date Operation to Commence:", p, Map.of("fontSize", "10px")));
        form.addFormContainer(field(210, y, 190, 24, "timeCommence", "text", p));
        form.addFormContainer(text(420, y, 190, 20, "Time and Date Operation to Conclude:", p, Map.of("fontSize", "10px")));
        form.addFormContainer(field(610, y, 166, 24, "timeConclude", "text", p));
        y += 30;

        // Individual Issuing
        form.addFormContainer(text(M, y, 200, 20, "Individual Issuing (Name and Initials):", p, Map.of("fontSize", "10px")));
        form.addFormContainer(field(220, y, 556, 24, "individualIssuing", "text", p));
        y += 36;

        // Gas info row
        form.addFormContainer(text(M, y, 65, 20, "Gas type:", p, bold(10)));
        form.addFormContainer(field(85, y, 100, 24, "gasType", "text", p));
        form.addFormContainer(text(195, y, 35, 20, "LEL:", p, bold(10)));
        form.addFormContainer(field(230, y, 60, 24, "lel", "text", p));
        form.addFormContainer(text(300, y, 35, 20, "UEL:", p, bold(10)));
        form.addFormContainer(field(335, y, 60, 24, "uel", "text", p));
        form.addFormContainer(text(405, y, 130, 20, "Calculated Volume:", p, bold(10)));
        form.addFormContainer(field(535, y, 80, 24, "calculatedVolume", "text", p));
        form.addFormContainer(text(625, y, 70, 20, "Pressure:", p, bold(10)));
        form.addFormContainer(field(695, y, 81, 24, "pressure", "text", p));
        y += 32;

        // Gas indicator row
        form.addFormContainer(text(M, y, 155, 20, "Combustible Gas Indicator:", p, bold(10)));
        form.addFormContainer(text(175, y, 60, 20, "Model:", p, Map.of()));
        form.addFormContainer(field(235, y, 130, 24, "gasIndicatorModel", "text", p));
        form.addFormContainer(text(375, y, 55, 20, "Serial #:", p, Map.of()));
        form.addFormContainer(field(430, y, 130, 24, "gasIndicatorSerial", "text", p));
        form.addFormContainer(text(570, y, 105, 20, "Calibration Date:", p, Map.of()));
        form.addFormContainer(field(675, y, 101, 24, "calibrationDate", "date", p));
        y += 36;

        // Documentation checks
        form.addFormContainer(text(M, y, 120, 20, "SDS Provided?", p, Map.of()));
        form.addFormContainer(field(140, y, 24, 24, "sdsProvided", "checkbox", p));
        form.addFormContainer(text(170, y, 50, 20, "Initials:", p, Map.of()));
        form.addFormContainer(field(220, y, 100, 24, "sdsInitials", "text", p));
        form.addFormContainer(text(420, y, 280, 20, "General Arrangement Provided Indicating Barricaded Area?", p, Map.of("fontSize", "9px")));
        form.addFormContainer(field(700, y, 24, 24, "generalArrangementProvided", "checkbox", p));
        form.addFormContainer(text(730, y, 50, 20, "Initials:", p, Map.of()));
        y += 24;
        form.addFormContainer(field(420, y, 100, 24, "generalArrangementInitials", "text", p));
        y += 30;

        form.addFormContainer(text(M, y, 250, 20, "Hazardous Classification Drawing Referenced?", p, Map.of("fontSize", "10px")));
        form.addFormContainer(field(270, y, 24, 24, "hazardousClassificationDrawing", "checkbox", p));
        form.addFormContainer(text(300, y, 50, 20, "Initials:", p, Map.of()));
        form.addFormContainer(field(350, y, 60, 24, "hazardousClassificationInitials", "text", p));
        form.addFormContainer(text(420, y, 250, 20, "P&ID with Valves and Configuration Denoted?", p, Map.of("fontSize", "10px")));
        form.addFormContainer(field(670, y, 24, 24, "pidWithValves", "checkbox", p));
        form.addFormContainer(text(700, y, 50, 20, "Initials:", p, Map.of()));
        form.addFormContainer(field(750, y, 46, 24, "pidInitials", "text", p));
        y += 30;

        // Drawing numbers
        form.addFormContainer(text(M, y, 160, 20, "List Drawing number(s):", p, Map.of()));
        form.addFormContainer(field(180, y, 596, 24, "drawingNumbers", "text", p));
        y += 36;

        // Description section
        form.addFormContainer(text(M, y, 250, 20, "Description of stack and its location:", p, bold(10)));
        form.addFormContainer(text(400, y, 220, 20, "Equipment to be deenergized and LOTO:", p, bold(10)));
        y += 22;
        form.addFormContainer(field(M, y, 370, 60, "stackDescription", "textarea", p));
        form.addFormContainer(field(400, y, 180, 60, "equipmentToBeDeenergized", "textarea", p));
        form.addFormContainer(field(590, y, 186, 60, "lotoDescription", "textarea", p));
        y += 68;

        // Duplicate copies note
        form.addFormContainer(text(M, y, FW, 30, "Duplicate copies of the SDS, General Arrangement, Hazardous Area Classification Drawing and Marked P&IDs are to be maintained in the control room and at the work area during the evolution.", p,
                Map.of("fontSize", "9px", "fontStyle", "italic", "textAlign", "center")));
        y += 36;

        // Communication
        form.addFormContainer(text(M, y, 100, 20, "Communication:", p, bold(10)));
        form.addFormContainer(text(140, y, 100, 20, "Radio Channel:", p, Map.of()));
        form.addFormContainer(field(240, y, 160, 24, "radioChannel", "text", p));
        form.addFormContainer(text(450, y, 100, 20, "Control Room #:", p, Map.of()));
        form.addFormContainer(field(550, y, 226, 24, "controlRoom", "text", p));
        y += 34;

        // Authorization
        form.addFormContainer(text(M, y, 100, 20, "Authorization:", p, bold(11)));
        y += 24;

        // O&M Supervisor
        form.addFormContainer(text(M + 20, y, 180, 20, "O&M Supervisor (or Designee):", p, Map.of()));
        form.addFormContainer(field(220, y, 300, 24, "osmSupervisor", "text", p));
        form.addFormContainer(text(540, y, 40, 20, "Date:", p, Map.of()));
        form.addFormContainer(field(580, y, 196, 24, "osmDate", "date", p));
        y += 30;

        // Plant Manager
        form.addFormContainer(text(M + 20, y, 120, 20, "Plant Manager:", p, Map.of()));
        form.addFormContainer(field(160, y, 360, 24, "plantManager", "text", p));
        form.addFormContainer(text(540, y, 40, 20, "Date:", p, Map.of()));
        form.addFormContainer(field(580, y, 196, 24, "plantManagerDate", "date", p));
        y += 30;

        // Division Director
        form.addFormContainer(text(M + 20, y, 120, 20, "Division Director:", p, Map.of()));
        form.addFormContainer(field(160, y, 360, 24, "divisionDirector", "text", p));
        form.addFormContainer(text(540, y, 40, 20, "Date:", p, Map.of()));
        form.addFormContainer(field(580, y, 196, 24, "divisionDirectorDate", "date", p));
        y += 36;

        // Footer note
        form.addFormContainer(text(M, y, FW, 30, "Operation Director approval and notification to the VP PPO & Director of Safety is only needed if the plant intends to vent quantities greater than de minimis volumes indoors.", p,
                Map.of("fontSize", "8px", "fontStyle", "italic", "textAlign", "center")));
        y += 30;
        form.addFormContainer(text(716, y, 80, 16, "Page 1 of 2", p, Map.of("fontSize", "9px", "textAlign", "right")));
    }

    private void seedVentingPage2(PrintableForm form) {
        int p = 2;
        int y = M;

        // Header
        form.addFormContainer(text(M, y, FW, 24, "NAES Combustible Gas System Venting/Inerting Checklist", p, bold(13)));
        y += 30;

        // Plant Name + System + Date
        form.addFormContainer(text(M, y, 90, 20, "Plant Name:", p, bold(10)));
        form.addFormContainer(field(110, y, FW - 90, 24, "plantName", "text", p));
        y += 28;
        form.addFormContainer(text(M, y, 60, 20, "System:", p, bold(10)));
        form.addFormContainer(field(80, y, 320, 24, "systemName", "text", p));
        form.addFormContainer(text(420, y, 40, 20, "Date:", p, bold(10)));
        form.addFormContainer(field(460, y, 316, 24, "date", "date", p));
        y += 34;

        // Section header
        form.addFormContainer(text(M, y, FW, 20, "To be Completed by Requesting Individual/Performing Party", p,
                Map.of("fontWeight", "bold", "textAlign", "center", "textDecoration", "underline")));
        y += 28;

        // Column headers
        int labelW = 500;
        int ynCol = 580;
        int initCol = 680;

        // Checklist items
        String[][] items = {
            {"All personnel have read, understand and will comply with the NAES procedure?", "personnelReadProcedure", "personnelReadProcedureInitials"},
            {"Barricade in Place with Description of activity and contact information?", "barricadeInPlace", "barricadeInPlaceInitials"},
            {"Firefighting equipment in place?", "firefightingEquipment", "firefightingEquipmentInitials"},
            {"Prohibited the entry of any spark creating materials from the barricaded area?", "sparkProhibited", "sparkProhibitedInitials"},
            {"Grounding straps installed?", "groundingStrapsInstalled", "groundingStrapsInstalledInitials"},
            {"Combustible gas indicator in place?", "combustibleGasIndicatorInPlace", "combustibleGasIndicatorInPlaceInitials"},
        };

        for (String[] item : items) {
            form.addFormContainer(text(M, y, labelW, 28, item[0], p, Map.of("fontSize", "10px", "borderBottom", "1px solid #ccc")));
            form.addFormContainer(field(ynCol, y, 24, 24, "checklist." + item[1], "checkbox", p));
            form.addFormContainer(text(initCol, y, 50, 20, "Initials:", p, Map.of("fontSize", "9px")));
            form.addFormContainer(field(initCol + 50, y, 66, 24, "checklist." + item[2], "text", p));
            y += 34;
        }

        // LEL percentage item (special)
        form.addFormContainer(text(M, y, 300, 28, "Reached less than 10% of LEL? Indicated percentage:", p, Map.of("fontSize", "10px", "borderBottom", "1px solid #ccc")));
        form.addFormContainer(field(320, y, 100, 24, "checklist.indicatedPercentage", "text", p));
        form.addFormContainer(field(ynCol, y, 24, 24, "checklist.reachedLessThan10PercentLEL", "checkbox", p));
        form.addFormContainer(text(initCol, y, 50, 20, "Initials:", p, Map.of("fontSize", "9px")));
        form.addFormContainer(field(initCol + 50, y, 66, 24, "checklist.reachedLelInitials", "text", p));
        y += 34;

        // Non-sparking tools
        form.addFormContainer(text(M, y, labelW, 28, "Ensured that non-sparking tools are utilized?", p, Map.of("fontSize", "10px", "borderBottom", "1px solid #ccc")));
        form.addFormContainer(field(ynCol, y, 24, 24, "checklist.nonSparkingToolsUsed", "checkbox", p));
        form.addFormContainer(text(initCol, y, 50, 20, "Initials:", p, Map.of("fontSize", "9px")));
        form.addFormContainer(field(initCol + 50, y, 66, 24, "checklist.nonSparkingToolsInitials", "text", p));
        y += 34;

        // Deviations
        form.addFormContainer(text(M, y, labelW, 50, "Understand that any deviations from the plan will require the work to stop IMMEDIATELY and that the activity WILL NOT proceed without approval by the authorizing personnel above?", p,
                Map.of("fontSize", "10px", "borderBottom", "1px solid #ccc")));
        form.addFormContainer(field(ynCol, y + 10, 24, 24, "checklist.deviationsUnderstood", "checkbox", p));
        form.addFormContainer(text(initCol, y + 10, 50, 20, "Initials:", p, Map.of("fontSize", "9px")));
        form.addFormContainer(field(initCol + 50, y + 10, 66, 24, "checklist.deviationsUnderstoodInitials", "text", p));
        y += 64;

        // Personnel names section
        form.addFormContainer(text(M, y, FW, 20, "Names of ALL personnel participating in the activity:", p, bold(10)));
        y += 24;
        form.addFormContainer(field(M, y, FW, 120, "checklist.personnelNames", "textarea", p));
        y += 130;

        // Page footer
        form.addFormContainer(text(716, y, 80, 16, "Page 2 of 2", p, Map.of("fontSize", "9px", "textAlign", "right")));
    }

    // ========== EXCAVATION PERMIT (3 pages) ==========

    private void seedExcavationForm() {
        if (printableFormRepo.findByFormTypeAndIsPrimary("ExcavationPermit", true).isPresent()) return;

        PrintableForm form = createForm("Excavation & Blind Penetrations Permit", "ExcavationPermit");

        seedExcavationPage1(form);
        seedExcavationPage2(form);
        seedExcavationPage3(form);

        printableFormRepo.save(form);
        log.info("Seeded ExcavationPermit paper form");
    }

    private void seedExcavationPage1(PrintableForm form) {
        int p = 1;
        int y = M;

        // Header
        form.addFormContainer(text(M, y, FW, 30, "Excavation & Blind Penetrations Permit", p, bold(16)));
        y += 30;
        form.addFormContainer(text(M, y, FW, 20, "Appendix A", p, centered()));
        y += 28;
        form.addFormContainer(text(M, y, FW, 20, "PERMIT MUST BE POSTED AT JOB SITE", p,
                Map.of("fontWeight", "bold", "textAlign", "center", "color", "#cc0000", "textDecoration", "underline")));
        y += 24;
        form.addFormContainer(text(M, y, FW, 18, "Permit is VALID for one shift not to exceed twelve hours", p,
                Map.of("fontWeight", "bold", "textAlign", "center", "fontSize", "10px")));
        y += 26;

        // Work Area
        form.addFormContainer(text(M, y, 100, 20, "Work Area:", p, bold(11)));
        form.addFormContainer(field(120, y, FW - 100, 30, "workArea", "work-area-select", p));
        y += 38;

        // Permit Issued Date / Time / WO#
        form.addFormContainer(text(M, y, 120, 20, "Permit Issued Date:", p, Map.of()));
        form.addFormContainer(field(140, y, 200, 24, "date", "date", p));
        form.addFormContainer(text(360, y, 40, 20, "Time:", p, Map.of()));
        form.addFormContainer(field(400, y, 120, 24, "time", "text", p));
        form.addFormContainer(text(560, y, 40, 20, "WO#:", p, Map.of()));
        form.addFormContainer(field(600, y, 176, 24, "workOrder", "text", p));
        y += 30;

        // Supervisor + Job Location
        form.addFormContainer(text(M, y, 80, 20, "Supervisor:", p, Map.of()));
        form.addFormContainer(field(100, y, 280, 24, "supervisor", "text", p));
        form.addFormContainer(text(400, y, 90, 20, "Job Location:", p, Map.of()));
        form.addFormContainer(field(490, y, 286, 24, "jobLocation", "text", p));
        y += 30;

        // Supervisor's Phone
        form.addFormContainer(text(M, y, 130, 20, "Supervisor's Phone:", p, Map.of()));
        form.addFormContainer(field(150, y, 626, 24, "supervisorPhone", "text", p));
        y += 30;

        // Location and Description
        form.addFormContainer(text(M, y, 240, 20, "Location and Description of Excavation:", p, Map.of()));
        form.addFormContainer(field(M, y + 20, FW, 50, "excavationDescription", "textarea", p));
        y += 78;

        // Type of Work (checkboxes)
        form.addFormContainer(text(M, y, 100, 20, "Type of Work:", p, bold(10)));
        form.addFormContainer(text(130, y, 80, 20, "Excavation", p, Map.of()));
        form.addFormContainer(field(210, y, 24, 24, "typeOfWork.excavation", "checkbox", p));
        form.addFormContainer(text(244, y, 50, 20, "Boring", p, Map.of()));
        form.addFormContainer(field(294, y, 24, 24, "typeOfWork.boring", "checkbox", p));
        form.addFormContainer(text(328, y, 50, 20, "Drilling", p, Map.of()));
        form.addFormContainer(field(378, y, 24, 24, "typeOfWork.drilling", "checkbox", p));
        form.addFormContainer(text(412, y, 50, 20, "Cutting", p, Map.of()));
        form.addFormContainer(field(462, y, 24, 24, "typeOfWork.cutting", "checkbox", p));
        form.addFormContainer(text(496, y, 120, 20, "Blind Penetration", p, Map.of()));
        form.addFormContainer(field(616, y, 24, 24, "typeOfWork.blindPenetration", "checkbox", p));
        y += 30;

        // Location piping marked
        form.addFormContainer(text(M, y, 280, 20, "Location piping and utilities marked  Yes / No", p, Map.of()));
        form.addFormContainer(field(300, y, 80, 24, "locationPipingMarked", "radio", p));
        y += 34;

        // Supervisor's Approval
        form.addFormContainer(text(M, y, FW, 30, "I have inspected the work area, pre-job planning check list, and have reviewed the plan for the excavation, a pre-job briefing, and hereby authorize the work to begin.", p, Map.of("fontSize", "9px")));
        y += 34;
        form.addFormContainer(text(M, y, 150, 20, "Supervisor's Approval:", p, Map.of()));
        form.addFormContainer(text(170, y, 65, 20, "Signature:", p, Map.of()));
        form.addFormContainer(field(235, y, 230, 24, "supervisor", "text", p));
        form.addFormContainer(text(480, y, 40, 20, "Date:", p, Map.of()));
        form.addFormContainer(field(520, y, 120, 24, "supervisorApprovalDate", "date", p));
        form.addFormContainer(text(650, y, 40, 20, "Time:", p, Map.of()));
        form.addFormContainer(field(690, y, 86, 24, "supervisorApprovalTime", "text", p));
        y += 32;

        // Permit Closed
        form.addFormContainer(text(M, y, 100, 20, "Permit Closed:", p, bold(10)));
        form.addFormContainer(text(130, y, 40, 20, "Date:", p, Map.of()));
        form.addFormContainer(field(170, y, 100, 24, "permitClosedDate", "date", p));
        form.addFormContainer(text(280, y, 40, 20, "Time:", p, Map.of()));
        form.addFormContainer(field(320, y, 80, 24, "permitClosedTime", "text", p));
        form.addFormContainer(text(420, y, 80, 20, "Job Status:", p, Map.of()));
        form.addFormContainer(field(500, y, 24, 24, "jobStatusComplete", "checkbox", p));
        form.addFormContainer(text(530, y, 80, 20, "Complete", p, Map.of()));
        y += 36;

        // Site Inspections header
        form.addFormContainer(text(M, y, FW, 22, "Site Inspections", p, Map.of("fontWeight", "bold", "textAlign", "center")));
        y += 24;

        // Inspections table (form-array)
        {
            FormContainer c = new FormContainer();
            c.setContentType("formField");
            Map<String, Object> faContent = new HashMap<>();
            faContent.put("name", "inspectionsJson");
            faContent.put("type", "form-array");
            faContent.put("fields", List.of(
                Map.of("name", "date", "label", "Date", "type", "date"),
                Map.of("name", "time", "label", "Time", "type", "text"),
                Map.of("name", "inspector", "label", "Inspector", "type", "text"),
                Map.of("name", "comments", "label", "Comments", "type", "text")
            ));
            c.setContentJson(faContent);
            c.setPositionJson(Map.of("x", M, "y", y));
            c.setSizeJson(Map.of("width", FW, "height", 160));
            c.setPageNumber(p);
            c.setLocked(true);
            c.setStyleJson(paperStyle());
            form.addFormContainer(c);
        }
        y += 168;

        // Job Completed
        form.addFormContainer(text(M, y, FW, 22, "Job Completed", p, Map.of("fontWeight", "bold", "textAlign", "center")));
        y += 28;

        form.addFormContainer(text(M, y, 200, 20, "Supervisor Field Inspection:", p, Map.of()));
        form.addFormContainer(text(230, y, 50, 20, "Name:", p, Map.of()));
        form.addFormContainer(field(280, y, 190, 24, "supervisorFieldInspectionName", "text", p));
        form.addFormContainer(text(480, y, 40, 20, "Date:", p, Map.of()));
        form.addFormContainer(field(520, y, 120, 24, "supervisorFieldInspectionDate", "date", p));
        form.addFormContainer(text(650, y, 40, 20, "Time:", p, Map.of()));
        form.addFormContainer(field(690, y, 86, 24, "supervisorFieldInspectionTime", "text", p));
    }

    private void seedExcavationPage2(PrintableForm form) {
        int p = 2;
        int y = M;

        // Header
        form.addFormContainer(text(M, y, FW, 28, "Excavation & Blind Penetration Checklist", p, bold(14)));
        y += 28;
        form.addFormContainer(text(M, y, FW, 20, "Appendix B", p, centered()));
        y += 30;

        // Facility Name + Date
        form.addFormContainer(text(M, y, 140, 20, "Facility Name/Location:", p, bold(10)));
        form.addFormContainer(field(160, y, 350, 24, "facilityName", "text", p));
        form.addFormContainer(text(530, y, 40, 20, "Date:", p, bold(10)));
        form.addFormContainer(field(570, y, 206, 24, "date", "date", p));
        y += 34;

        // Competent Person
        form.addFormContainer(text(M, y, 120, 20, "Competent Person:", p, Map.of()));
        form.addFormContainer(field(140, y, 636, 24, "competentPerson", "text", p));
        y += 28;

        // Soil Type / Depth / Width
        form.addFormContainer(text(M, y, 70, 20, "Soil Type:", p, Map.of()));
        form.addFormContainer(field(90, y, 150, 24, "soilType", "text", p));
        form.addFormContainer(text(260, y, 110, 20, "Excavation Depth:", p, Map.of()));
        form.addFormContainer(field(370, y, 120, 24, "excavationDepth", "text", p));
        form.addFormContainer(text(510, y, 110, 20, "Excavation Width:", p, Map.of()));
        form.addFormContainer(field(620, y, 156, 24, "excavationWidth", "text", p));
        y += 28;

        // Protective System
        form.addFormContainer(text(M, y, 180, 20, "Type of Protective System Used:", p, Map.of()));
        form.addFormContainer(field(200, y, 576, 24, "protectiveSystemType", "text", p));
        y += 34;

        // Instruction
        form.addFormContainer(text(M, y, FW, 18, "Indicate for each item: Yes – No – or N/A for not applicable:", p,
                Map.of("textAlign", "center", "fontSize", "10px")));
        y += 22;

        // Checklist columns
        int labelW = 560;
        int yesX = 580;
        int noX = 640;
        int naX = 700;

        // === 1. General Information ===
        form.addFormContainer(text(M, y, labelW, 22, "1. General Information:", p, bold(10)));
        form.addFormContainer(text(yesX, y, 40, 22, "Yes", p, bold(9)));
        form.addFormContainer(text(noX, y, 40, 22, "No", p, bold(9)));
        form.addFormContainer(text(naX, y, 40, 22, "N/A", p, bold(9)));
        y += 24;

        String[][] generalInfo = {
            {"A. Is excavation less than 4 ft. in depth?", "lessThan4Ft"},
            {"B. Is there a potential for a cave-in?", "caveInPotential"},
            {"C. Is excavation deeper than 4 ft. in depth?", "deeperThan4Ft"},
            {"D. Is sloping used as your protective system?", "slopingUsed"},
        };
        y = addChecklistSection(form, generalInfo, y, p, labelW, yesX);

        // === 2. Inspection of Jobsite ===
        form.addFormContainer(text(M, y, labelW, 22, "2. Inspection of Jobsite:", p, bold(10)));
        form.addFormContainer(text(yesX, y, 40, 22, "Yes", p, bold(9)));
        form.addFormContainer(text(noX, y, 40, 22, "No", p, bold(9)));
        form.addFormContainer(text(naX, y, 40, 22, "N/A", p, bold(9)));
        y += 24;

        String[][] jobsite = {
            {"A. Excavations inspected by a competent person daily before the start of work.", "dailyInspection"},
            {"B. Competent person has the authority to remove employees from the excavation.", "competentPersonAuthority"},
            {"C. Surface encumbrances removed or supported.", "surfaceEncumbrances"},
            {"D. Employees protected from loose rock or soil that could pose a hazard.", "looseRockProtection"},
            {"E. Hard hats and safety glasses worn by all employees.", "hardHats"},
            {"F. Spoils, materials set back at least 2 ft. from the edge of the excavation.", "spoilsSetBack"},
            {"G. Adequate barriers provided at all excavations, wells, pits, shafts, etc.", "adequateBarriers"},
            {"H. (skipped)", ""},
            {"I. Employees required to stand away from vehicles being loaded or unloaded.", "standAwayFromVehicles"},
            {"J. Warning system established when mobile equipment is operating near the edge.", "warningSystem"},
            {"K. Employees prohibited from going under suspended loads.", "noSuspendedLoads"},
        };
        // Filter out "H. (skipped)"
        for (String[] item : jobsite) {
            if (item[1].isEmpty()) continue;
            form.addFormContainer(text(M, y, labelW, 24, item[0], p, Map.of("fontSize", "9px", "borderBottom", "1px solid #eee")));
            form.addFormContainer(field(yesX, y, FW - yesX, 24, "checklist." + item[1], "select", p));
            y += 26;
        }

        // === 3. Utilities ===
        form.addFormContainer(text(M, y, labelW, 22, "3. Utilities:", p, bold(10)));
        form.addFormContainer(text(yesX, y, 40, 22, "Yes", p, bold(9)));
        form.addFormContainer(text(noX, y, 40, 22, "No", p, bold(9)));
        form.addFormContainer(text(naX, y, 40, 22, "N/A", p, bold(9)));
        y += 24;

        String[][] utilities = {
            {"A. Location of utilities marked.", "utilitiesMarked"},
            {"B. Prior to the use of equipment, underground utilities located by hand digging.", "handDigging"},
            {"C. Underground utilities are protected, supported, or removed when excavation is open.", "utilitiesProtected"},
        };
        y = addChecklistSection(form, utilities, y, p, labelW, yesX);

        // === 4. Means of Access and Egress ===
        form.addFormContainer(text(M, y, labelW, 22, "4. Means of Access and Egress:", p, bold(10)));
        form.addFormContainer(text(yesX, y, 40, 22, "Yes", p, bold(9)));
        form.addFormContainer(text(noX, y, 40, 22, "No", p, bold(9)));
        form.addFormContainer(text(naX, y, 40, 22, "N/A", p, bold(9)));
        y += 24;

        String[][] access = {
            {"A. Travel distance to means of egress no greater than 25 ft. in excavations 4 ft. or more.", "egressDistance"},
            {"B. Straight ladders used in excavations extend at least 3 ft. above the edge of the trench.", "laddersExtend"},
        };
        y = addChecklistSection(form, access, y, p, labelW, yesX);
    }

    private void seedExcavationPage3(PrintableForm form) {
        int p = 3;
        int y = M;

        int labelW = 560;
        int yesX = 580;
        int noX = 640;
        int naX = 700;

        // === 5. Wet Conditions ===
        form.addFormContainer(text(M, y, labelW, 22, "5. Wet Conditions:", p, bold(10)));
        form.addFormContainer(text(yesX, y, 40, 22, "Yes", p, bold(9)));
        form.addFormContainer(text(noX, y, 40, 22, "No", p, bold(9)));
        form.addFormContainer(text(naX, y, 40, 22, "N/A", p, bold(9)));
        y += 24;

        String[][] wetConditions = {
            {"A. Precautions have been taken to protect employees from the accumulation of water.", "precautionsForWater"},
            {"B. Diversion ditches or other suitable means used to prevent surface water.", "diversionDitches"},
            {"C. Inspections have been made after every rainstorm or other hazard-increasing occurrence.", "inspectionAfterRain"},
        };
        y = addChecklistSection(form, wetConditions, y, p, labelW, yesX);

        // === 6. Hazardous Atmosphere ===
        form.addFormContainer(text(M, y, FW, 36, "6. Hazardous Atmosphere:\nThe atmosphere within the excavation must be tested where there is a reasonable possibility of an oxygen deficiency, combustible or other harmful contaminant exposure.", p,
                Map.of("fontWeight", "bold", "fontSize", "9px")));
        form.addFormContainer(text(yesX, y, 40, 22, "Yes", p, bold(9)));
        form.addFormContainer(text(noX, y, 40, 22, "No", p, bold(9)));
        form.addFormContainer(text(naX, y, 40, 22, "N/A", p, bold(9)));
        y += 40;

        String[][] hazardous = {
            {"A. Atmosphere tested when there is a reasonable possibility of oxygen deficiency.", "atmosphereTested"},
            {"B. Oxygen content is between 19.5% and 23.5%.", "oxygenDeficiency"},
            {"C. Oxygen content is below 19.5% or toxic gas from building up to 20% of PEL.", "lowOxygen"},
            {"D. Combustible gas is below 10% of LEL.", "combustibleGas"},
            {"E. Emergency Equipment readily available where a hazardous atmosphere exists.", "emergencyEquipment"},
            {"F. Ventilation provided to prevent atmosphere that is dangerous.", "ventilationProvided"},
            {"G. Attendant provided when a permit-required confined space exists.", "attendantProvided"},
            {"H. Atmospheric monitoring conducted at prescribed intervals.", "atmosphericMonitoring"},
            {"I. Safety equipment inspected and operable at prescribed intervals.", "safetyEquipment"},
            {"J. Means to evacuate employees when that atmosphere exists safely.", "evacuationWarning"},
        };
        y = addChecklistSection(form, hazardous, y, p, labelW, yesX);

        // === 7. Support Systems ===
        form.addFormContainer(text(M, y, labelW, 22, "7. Support Systems:", p, bold(10)));
        form.addFormContainer(text(yesX, y, 40, 22, "Yes", p, bold(9)));
        form.addFormContainer(text(noX, y, 40, 22, "No", p, bold(9)));
        form.addFormContainer(text(naX, y, 40, 22, "N/A", p, bold(9)));
        y += 24;

        String[][] support = {
            {"A. Support system designed by competent person or professional engineer.", "supportSystemDesigned"},
            {"B. Materials and equipment in good condition.", "materialsGoodCondition"},
            {"C. Members of support systems securely connected.", "membersSecured"},
            {"D. Timbered excavations: uprights, stringers and braces are in place.", "timberedExcavations"},
            {"E. Backfill progression from the bottom of the trench.", "backfillProgression"},
            {"F. Removal of support systems from the bottom.", "removalFromBottom"},
        };
        y = addChecklistSection(form, support, y, p, labelW, yesX);
    }

    // ========== HELPER METHODS ==========

    // ========== LOTO (3 pages) ==========

    private void seedLotoForm() {
        if (printableFormRepo.findByFormTypeAndIsPrimary("Loto", true).isPresent()) return;

        PrintableForm form = createForm("LOTO Record Sheet", "Loto");
        seedLotoPage1(form);
        seedLotoPage2(form);
        seedLotoPage3(form);
        printableFormRepo.save(form);
        log.info("Seeded LOTO form (3 pages)");
    }

    private void seedLotoPage1(PrintableForm form) {
        int p = 1;
        int y = M;

        // Header
        form.addFormContainer(text(M, y, FW, 24, "Jackson Generation", p, bold(14)));
        y += 22;
        form.addFormContainer(text(M, y, FW, 20, "SMP-3: Hazardous Energy Control Program (LOTO)", p,
                Map.of("textAlign", "center", "fontSize", "11px")));
        y += 20;
        form.addFormContainer(text(M, y, FW, 22, "LOTO Record Sheet", p,
                Map.of("textAlign", "center", "fontWeight", "bold", "fontSize", "13px")));
        y += 28;

        // General Information red header bar
        form.addFormContainer(text(M, y, FW, 22, "General Information", p,
                Map.of("fontWeight", "bold", "fontSize", "11px", "backgroundColor", "#e53935", "color", "white", "paddingLeft", "6px")));
        y += 26;

        // Equipment/System + Index # + Box #
        form.addFormContainer(text(M, y, 120, 20, "Equipment/System:", p, Map.of("fontSize", "10px")));
        form.addFormContainer(field(140, y, 380, 24, "equipmentSystem", "text", p));
        form.addFormContainer(text(530, y, 50, 20, "Index #", p, Map.of("fontSize", "10px")));
        form.addFormContainer(field(580, y, 100, 24, "name", "text", p));
        form.addFormContainer(text(690, y, 40, 20, "Box #", p, Map.of("fontSize", "10px")));
        form.addFormContainer(field(730, y, 66, 24, "boxNumber", "number", p));
        y += 28;

        // LOTO Requestor + Date
        form.addFormContainer(text(M, y, 110, 20, "LOTO Requestor:", p, Map.of("fontSize", "10px")));
        form.addFormContainer(field(130, y, 400, 24, "lotoRequestor", "text", p));
        form.addFormContainer(text(540, y, 40, 20, "Date:", p, Map.of("fontSize", "10px")));
        form.addFormContainer(field(580, y, 216, 24, "date", "date", p));
        y += 28;

        // Reason for LOTO
        form.addFormContainer(text(M, y, 120, 20, "Reason for LOTO:", p, Map.of("fontSize", "10px")));
        form.addFormContainer(field(140, y, FW - 120, 24, "workScope", "text", p));
        y += 32;

        // LOTO Approved By / Date / Time
        form.addFormContainer(text(M, y, 120, 20, "LOTO Approved By:", p, bold(10)));
        form.addFormContainer(field(140, y, 240, 24, "approvedBy", "text", p));
        form.addFormContainer(text(390, y, 40, 20, "Date:", p, Map.of("fontSize", "10px")));
        form.addFormContainer(field(430, y, 120, 24, "approvedDate", "date", p));
        form.addFormContainer(text(560, y, 40, 20, "Time:", p, Map.of("fontSize", "10px")));
        form.addFormContainer(field(600, y, 196, 24, "approvedTime", "text", p));
        y += 32;

        // Tagged\Locked by / # Tags Placed / Time / Date
        form.addFormContainer(text(M + 10, y, 120, 20, "Tagged\\Locked by:", p, bold(10)));
        form.addFormContainer(field(150, y, 230, 24, "taggedLockedBy", "text", p));
        form.addFormContainer(text(390, y, 80, 20, "# Tags Placed:", p, bold(10)));
        form.addFormContainer(field(470, y, 60, 24, "tagsPlaced", "number", p));
        form.addFormContainer(text(540, y, 40, 20, "Time:", p, Map.of("fontSize", "10px")));
        form.addFormContainer(field(580, y, 80, 24, "taggedTime", "text", p));
        form.addFormContainer(text(670, y, 40, 20, "Date:", p, Map.of("fontSize", "10px")));
        form.addFormContainer(field(710, y, 86, 24, "taggedDate", "date", p));
        y += 32;

        // Verified By / Points Verified / Time / Date
        form.addFormContainer(text(M + 10, y, 80, 20, "Verified By:", p, bold(10)));
        form.addFormContainer(field(110, y, 270, 24, "verifiedBy", "text", p));
        form.addFormContainer(text(390, y, 100, 20, "Points Verified:", p, bold(10)));
        form.addFormContainer(field(490, y, 40, 24, "pointsVerified", "number", p));
        form.addFormContainer(text(540, y, 40, 20, "Time:", p, Map.of("fontSize", "10px")));
        form.addFormContainer(field(580, y, 80, 24, "verifiedTime", "text", p));
        form.addFormContainer(text(670, y, 40, 20, "Date:", p, Map.of("fontSize", "10px")));
        form.addFormContainer(field(710, y, 86, 24, "verifiedDate", "date", p));
        y += 34;

        // Certification text
        form.addFormContainer(text(M + 10, y, FW - 20, 36, "The above equipment has been properly positioned, locked/tagged, a Safe to Work (Zero Energy) check has been performed and equipment is safe to perform the work described in the Scope of Work above.", p,
                Map.of("fontSize", "9px", "fontWeight", "bold")));
        y += 42;

        // Control Authority Issued / Lock # Placed / Time / Date
        form.addFormContainer(text(M + 10, y, 140, 20, "Control Authority Issued:", p, bold(10)));
        form.addFormContainer(field(170, y, 210, 24, "controlAuthorityIssued", "text", p));
        form.addFormContainer(text(390, y, 80, 20, "Lock # Placed:", p, bold(10)));
        form.addFormContainer(field(470, y, 60, 24, "lockPlaced", "text", p));
        form.addFormContainer(text(540, y, 40, 20, "Time:", p, Map.of("fontSize", "10px")));
        form.addFormContainer(field(580, y, 80, 24, "controlAuthorityTime", "text", p));
        form.addFormContainer(text(670, y, 40, 20, "Date:", p, Map.of("fontSize", "10px")));
        form.addFormContainer(field(710, y, 86, 24, "controlAuthorityDate", "date", p));
        y += 32;

        // Initial Req Released / Date / Transfer Req Acpt / Date
        form.addFormContainer(text(M + 10, y, 130, 20, "Initial Req Released:", p, bold(10)));
        form.addFormContainer(field(150, y, 140, 24, "initialReqReleased", "text", p));
        form.addFormContainer(text(300, y, 40, 20, "Date:", p, Map.of("fontSize", "10px")));
        form.addFormContainer(field(340, y, 100, 24, "initialReqReleasedDate", "date", p));
        form.addFormContainer(text(460, y, 110, 20, "Transfer Req Acpt:", p, bold(10)));
        form.addFormContainer(field(570, y, 120, 24, "transferReqAccepted1", "text", p));
        form.addFormContainer(text(700, y, 40, 20, "Date:", p, Map.of("fontSize", "10px")));
        form.addFormContainer(field(740, y, 56, 24, "transferReqAcceptedDate1", "date", p));
        y += 32;

        // Transfer Req Released / Date / Transfer Req Acpt / Date
        form.addFormContainer(text(M + 10, y, 140, 20, "Transfer Req Released:", p, bold(10)));
        form.addFormContainer(field(160, y, 130, 24, "transferReqReleased", "text", p));
        form.addFormContainer(text(300, y, 40, 20, "Date:", p, Map.of("fontSize", "10px")));
        form.addFormContainer(field(340, y, 100, 24, "transferReqReleasedDate", "date", p));
        form.addFormContainer(text(460, y, 110, 20, "Transfer Req Acpt:", p, bold(10)));
        form.addFormContainer(field(570, y, 120, 24, "transferReqAccepted2", "text", p));
        form.addFormContainer(text(700, y, 40, 20, "Date:", p, Map.of("fontSize", "10px")));
        form.addFormContainer(field(740, y, 56, 24, "transferReqAcceptedDate2", "date", p));
        y += 32;

        // Authorization to Remove LOTO, Requestor / Time / Date
        form.addFormContainer(text(M + 10, y, 260, 20, "Authorization to Remove LOTO, Requestor:", p, bold(10)));
        form.addFormContainer(field(280, y, 260, 24, "authorizationToRemove", "text", p));
        form.addFormContainer(text(550, y, 40, 20, "Time:", p, Map.of("fontSize", "10px")));
        form.addFormContainer(field(590, y, 80, 24, "authRemoveTime", "text", p));
        form.addFormContainer(text(680, y, 40, 20, "Date:", p, Map.of("fontSize", "10px")));
        form.addFormContainer(field(720, y, 76, 24, "authRemoveDate", "date", p));
        y += 32;

        // Control Authority Released / Lock # Removed / Time / Date
        form.addFormContainer(text(M + 10, y, 160, 20, "Control Authority Released:", p, bold(10)));
        form.addFormContainer(field(180, y, 200, 24, "controlAuthorityReleased", "text", p));
        form.addFormContainer(text(390, y, 90, 20, "Lock # Removed:", p, bold(10)));
        form.addFormContainer(field(480, y, 60, 24, "lockRemoved", "text", p));
        form.addFormContainer(text(550, y, 40, 20, "Time:", p, Map.of("fontSize", "10px")));
        form.addFormContainer(field(590, y, 80, 24, "controlReleasedTime", "text", p));
        form.addFormContainer(text(680, y, 40, 20, "Date:", p, Map.of("fontSize", "10px")));
        form.addFormContainer(field(720, y, 76, 24, "controlReleasedDate", "date", p));
        y += 32;

        // Removed By / #Tags Removed / Time / Date
        form.addFormContainer(text(M + 10, y, 80, 20, "Removed By:", p, bold(10)));
        form.addFormContainer(field(110, y, 270, 24, "removedBy", "text", p));
        form.addFormContainer(text(390, y, 90, 20, "#Tags Removed:", p, bold(10)));
        form.addFormContainer(field(480, y, 60, 24, "tagsRemoved", "number", p));
        form.addFormContainer(text(550, y, 40, 20, "Time:", p, Map.of("fontSize", "10px")));
        form.addFormContainer(field(590, y, 80, 24, "removedTime", "text", p));
        form.addFormContainer(text(680, y, 40, 20, "Date:", p, Map.of("fontSize", "10px")));
        form.addFormContainer(field(720, y, 76, 24, "removedDate", "date", p));
        y += 32;

        // All tags removed and equipment ready for service / Time / Date
        form.addFormContainer(text(M + 10, y, 330, 20, "All tags removed and equipment ready for service:", p, bold(10)));
        form.addFormContainer(field(350, y, 190, 24, "allTagsRemovedConfirmation", "text", p));
        form.addFormContainer(text(550, y, 40, 20, "Time:", p, Map.of("fontSize", "10px")));
        form.addFormContainer(field(590, y, 80, 24, "allTagsRemovedTime", "text", p));
        form.addFormContainer(text(680, y, 40, 20, "Date:", p, Map.of("fontSize", "10px")));
        form.addFormContainer(field(720, y, 76, 24, "allTagsRemovedDate", "date", p));
        y += 36;

        // Notes section
        form.addFormContainer(text(M, y, FW, 24, "Notes", p,
                Map.of("fontWeight", "bold", "fontSize", "14px", "textAlign", "center")));
        y += 26;
        form.addFormContainer(field(M, y, FW, 120, "notes", "textarea", p));
    }

    private void seedLotoPage2(PrintableForm form) {
        int p = 2;
        int y = M;

        // Tags and Locks red header bar
        form.addFormContainer(text(M, y, FW, 22, "Tags and Locks", p,
                Map.of("fontWeight", "bold", "fontSize", "11px", "backgroundColor", "#e53935", "color", "white", "paddingLeft", "6px")));
        y += 24;

        // Column header row (matching original form table)
        int c1 = M, c1w = 35;          // Tag #
        int c2 = c1 + c1w, c2w = 55;   // Lock #
        int c3 = c2 + c2w, c3w = 260;  // EID to be Tagged/Locked
        int c4 = c3 + c3w, c4w = 80;   // LOTO Position
        int c5 = c4 + c4w, c5w = 70;   // Hung By
        int c6 = c5 + c5w, c6w = 70;   // Verified By
        int c7 = c6 + c6w, c7w = 80;   // Released Position
        int c8 = c7 + c7w;
        int c8w = FW - (c8 - M);       // Removed By (remainder)

        Map<String, Object> hdr = new HashMap<>();
        hdr.put("fontSize", "8px");
        hdr.put("fontWeight", "bold");
        hdr.put("textAlign", "center");
        hdr.put("border", "1px solid #999");
        hdr.put("backgroundColor", "#f5f5f5");

        form.addFormContainer(text(c1, y, c1w, 40, "Tag\n#", p, hdr));
        form.addFormContainer(text(c2, y, c2w, 40, "Lock #", p, hdr));
        form.addFormContainer(text(c3, y, c3w, 40, "EID to be Tagged/Locked\n(Equipment Isolation Device)", p, hdr));
        form.addFormContainer(text(c4, y, c4w, 40, "LOTO\nPosition", p, hdr));
        form.addFormContainer(text(c5, y, c5w, 40, "Hung By", p, hdr));
        form.addFormContainer(text(c6, y, c6w, 40, "Verified\nBy", p, hdr));
        form.addFormContainer(text(c7, y, c7w, 40, "Released\nPosition", p, hdr));
        form.addFormContainer(text(c8, y, c8w, 40, "Removed\nBy", p, hdr));
        y += 42;

        // LOTO Points form-array with custom nestedForm layout
        {
            FormContainer c = new FormContainer();
            c.setContentType("formField");

            // Relative column x-offsets within each nested item (0-based)
            int rx1 = 0, rx2 = c1w, rx3 = c1w + c2w;
            int rx4 = rx3 + c3w, rx5 = rx4 + c4w, rx6 = rx5 + c5w;
            int rx7 = rx6 + c6w, rx8 = rx7 + c7w;

            int id = -1;
            List<Map<String, Object>> nc = new java.util.ArrayList<>();

            // Row 1 (y=0, h=26): main fields across columns
            nc.add(nField(id--, rx1, 0, c1w, 26, "tagNumber", "text"));
            nc.add(nField(id--, rx2, 0, c2w, 26, "lockNumber", "text"));
            nc.add(nField(id--, rx3, 0, c3w, 26, "description", "text"));
            nc.add(nField(id--, rx4, 0, c4w, 70, "isoPos", "text"));
            nc.add(nField(id--, rx5, 0, c5w, 70, "hungBy", "text"));
            nc.add(nField(id--, rx6, 0, c6w, 70, "verifiedBy", "text"));
            nc.add(nField(id--, rx7, 0, c7w, 70, "normPos", "text"));
            nc.add(nField(id--, rx8, 0, c8w, 70, "removedBy", "text"));

            // Row 2 (y=26, h=22): location under EID column
            nc.add(nField(id--, rx3, 26, c3w, 22, "specificLocation", "text"));

            // Row 3 (y=48, h=22): EID number under EID column
            nc.add(nField(id--, rx3, 48, c3w, 22, "eidNumber", "text"));

            // Row 4 (y=74, h=18): "Zero Energy Verification Method" label + "Completed By" label
            nc.add(nText(id--, 0, 74, rx7, 18, "Zero Energy Verification Method",
                    Map.of("fontSize", "9px", "fontWeight", "bold", "textAlign", "center")));
            nc.add(nText(id--, rx7, 74, c7w + c8w, 18, "Completed By",
                    Map.of("fontSize", "9px", "fontWeight", "bold", "textAlign", "center")));

            // Row 5 (y=92, h=34): zero energy textarea + completed by field
            nc.add(nField(id--, 0, 92, rx7, 34, "zeroEnergyMethod", "textarea"));
            nc.add(nField(id--, rx7, 92, c7w + c8w, 34, "completedBy", "text"));

            Map<String, Object> faContent = new HashMap<>();
            faContent.put("name", "lotoPoints");
            faContent.put("type", "form-array");
            faContent.put("fields", List.of(
                Map.of("name", "tagNumber", "label", "Tag #", "type", "text"),
                Map.of("name", "lockNumber", "label", "Lock #", "type", "text"),
                Map.of("name", "description", "label", "EID to be Tagged/Locked", "type", "text"),
                Map.of("name", "specificLocation", "label", "Location", "type", "text"),
                Map.of("name", "eidNumber", "label", "Equipment Isolation Device", "type", "text"),
                Map.of("name", "isoPos", "label", "LOTO Position", "type", "text"),
                Map.of("name", "hungBy", "label", "Hung By", "type", "text"),
                Map.of("name", "verifiedBy", "label", "Verified By", "type", "text"),
                Map.of("name", "normPos", "label", "Released Position", "type", "text"),
                Map.of("name", "removedBy", "label", "Removed By", "type", "text"),
                Map.of("name", "zeroEnergyMethod", "label", "Zero Energy Verification Method", "type", "textarea"),
                Map.of("name", "completedBy", "label", "Completed By", "type", "text")
            ));
            faContent.put("nestedForm", Map.of(
                "formContainers", nc,
                "size", Map.of("width", 8.08, "height", 1.35)
            ));

            c.setContentJson(faContent);
            c.setPositionJson(Map.of("x", M, "y", y));
            c.setSizeJson(Map.of("width", FW, "height", 960));
            c.setPageNumber(p);
            c.setLocked(true);
            c.setStyleJson(paperStyle());
            form.addFormContainer(c);
        }
    }

    private void seedLotoPage3(PrintableForm form) {
        int p = 3;
        int y = M;

        // Header
        form.addFormContainer(text(M, y, FW, 28, "LOTO SIGN-ON/SIGN-OFF SHEET", p,
                Map.of("fontWeight", "bold", "fontSize", "16px", "textAlign", "center")));
        y += 30;

        // LOTO #
        form.addFormContainer(text(M, y, 60, 20, "LOTO #:", p, Map.of("fontSize", "11px")));
        form.addFormContainer(field(80, y, 200, 24, "name", "text", p));
        y += 32;

        // Sign-On/Sign-Off form-array
        {
            FormContainer c = new FormContainer();
            c.setContentType("formField");
            Map<String, Object> faContent = new HashMap<>();
            faContent.put("name", "signOnSignOffJson");
            faContent.put("type", "form-array");
            faContent.put("fields", List.of(
                Map.of("name", "personName", "label", "NAME", "type", "text"),
                Map.of("name", "company", "label", "COMPANY", "type", "text"),
                Map.of("name", "lockNumber", "label", "Lock #", "type", "text"),
                Map.of("name", "signOnDate", "label", "Sign-On Date", "type", "date"),
                Map.of("name", "signOnTime", "label", "Sign-On Time", "type", "text"),
                Map.of("name", "signOffDate", "label", "Sign-Off Date", "type", "date"),
                Map.of("name", "signOffTime", "label", "Sign-Off Time", "type", "text")
            ));
            c.setContentJson(faContent);
            c.setPositionJson(Map.of("x", M, "y", y));
            c.setSizeJson(Map.of("width", FW, "height", 900));
            c.setPageNumber(p);
            c.setLocked(true);
            c.setStyleJson(paperStyle());
            form.addFormContainer(c);
        }
    }

    private int addChecklistSection(PrintableForm form, String[][] items, int startY, int page, int labelW, int fieldX) {
        int y = startY;
        for (String[] item : items) {
            form.addFormContainer(text(M, y, labelW, 24, item[0], page, Map.of("fontSize", "9px", "borderBottom", "1px solid #eee")));
            form.addFormContainer(field(fieldX, y, FW - fieldX, 24, "checklist." + item[1], "select", page));
            y += 26;
        }
        return y;
    }

    private PrintableForm createForm(String name, String formType) {
        PrintableForm form = new PrintableForm();
        form.setName(name);
        form.setFormType(formType);
        form.setIsPrimary(true);
        form.setSize(Map.of("width", 8.5, "height", 11));
        return form;
    }

    private FormContainer text(int x, int y, int w, int h, String content, int page, Map<String, Object> style) {
        FormContainer c = new FormContainer();
        c.setContentType("text");
        c.setContentJson(content);
        c.setPositionJson(Map.of("x", x, "y", y));
        c.setSizeJson(Map.of("width", w, "height", h));
        c.setPageNumber(page);
        c.setLocked(true);
        Map<String, Object> merged = paperStyle();
        if (style != null) merged.putAll(style);
        c.setStyleJson(merged);
        return c;
    }

    private FormContainer field(int x, int y, int w, int h, String name, String type, int page) {
        FormContainer c = new FormContainer();
        c.setContentType("formField");
        Map<String, Object> content = new HashMap<>();
        content.put("name", name);
        content.put("type", type);
        c.setContentJson(content);
        c.setPositionJson(Map.of("x", x, "y", y));
        c.setSizeJson(Map.of("width", w, "height", h));
        c.setPageNumber(page);
        c.setLocked(true);
        if (Set.of("text", "textarea", "date", "number", "work-area-select").contains(type)) {
            c.setStyleJson(underlineStyle());
        } else {
            c.setStyleJson(paperStyle());
        }
        return c;
    }

    private Map<String, Object> paperStyle() {
        Map<String, Object> s = new HashMap<>();
        s.put("borderStyle", "none");
        s.put("borderWidth", "0");
        s.put("backgroundColor", "transparent");
        return s;
    }

    private Map<String, Object> underlineStyle() {
        Map<String, Object> s = paperStyle();
        s.put("borderBottomWidth", "1px");
        s.put("borderBottomStyle", "solid");
        s.put("borderBottomColor", "black");
        return s;
    }

    private Map<String, Object> bold(int fontSize) {
        return Map.of("fontWeight", "bold", "fontSize", fontSize + "px");
    }

    private Map<String, Object> centered() {
        return Map.of("textAlign", "center");
    }

    /** Nested form field container (for use inside nestedForm definitions) */
    private Map<String, Object> nField(int id, int x, int y, int w, int h, String name, String type) {
        return Map.ofEntries(
            Map.entry("id", id),
            Map.entry("contentType", "formField"),
            Map.entry("content", Map.of("name", name, "type", type)),
            Map.entry("position", Map.of("x", x, "y", y)),
            Map.entry("size", Map.of("width", w, "height", h)),
            Map.entry("pageNumber", 1)
        );
    }

    /** Nested text container (for use inside nestedForm definitions) */
    private Map<String, Object> nText(int id, int x, int y, int w, int h, String content, Map<String, Object> style) {
        return Map.ofEntries(
            Map.entry("id", id),
            Map.entry("contentType", "text"),
            Map.entry("content", content),
            Map.entry("position", Map.of("x", x, "y", y)),
            Map.entry("size", Map.of("width", w, "height", h)),
            Map.entry("pageNumber", 1),
            Map.entry("style", style != null ? style : Map.of())
        );
    }
}
