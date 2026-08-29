package com.dk_power.power_plant_java.config;

import com.dk_power.power_plant_java.entities.forms.FormContainer;
import com.dk_power.power_plant_java.entities.forms.PrintableForm;
import com.dk_power.power_plant_java.sevice.forms.PrintableFormService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

@Component
@RequiredArgsConstructor
@Slf4j
public class PermitFormSeeder {

    // Seeds go through the service, not the repo: PrintableFormService#save demotes any existing
    // primary of the same formType first. Saving via the repo is what produced two IS_PRIMARY=TRUE
    // Loto rows, which makes findByFormTypeAndIsPrimary throw and takes the paper form offline.
    private final PrintableFormService printableFormService;

    /**
     * Paint order for the containers of the form currently being seeded.
     *
     * <p>{@code PrintableForm.formContainers} is a {@code HashSet}, so the order containers reach
     * the browser is arbitrary — NOT the order they were created in. Without an explicit z-index
     * the renderer falls back to DOM order, which means a section-wrapping box can land on top of
     * the fields it surrounds and silently swallow every click inside it: the values still render,
     * but nothing is clickable or fillable. That is exactly how the first Confined Space and Safe
     * Work rebuilds failed. The designer-built masters set a z-index on every container, which is
     * why they have always worked; seeded forms now do the same.
     */
    private int zOrder = 1;

    private FormContainer stack(FormContainer c) {
        Map<String, Object> s = c.getStyleJson() == null
                ? new HashMap<>() : new HashMap<>(c.getStyleJson());
        s.put("zIndex", String.valueOf(zOrder++));
        c.setStyleJson(s);
        return c;
    }

    private static final int M = 20; // margin
    private static final int FW = 776; // full width (816 - 2 * margin)

    // Geometry of the `radio` widget (RadioCheckboxesComponent): two 18px squares, 4px gap.
    // A container using it must be at least RADIO_W wide or the second box is clipped.
    // CheckboxXComponent and RadioCheckboxesComponent both draw an 18px square; the radio draws
    // two with a 4px gap. Containers must add the 2px coloured frame on each side or the widget
    // is squeezed (box-sizing: border-box) and stops lining up with its column header.
    private static final int TICK = 18;              // the widget's square
    private static final int FRAME = 2;              // coloured border, per side
    private static final int TICK_BOX = TICK + 2 * FRAME;        // 22 - one checkbox
    private static final int RADIO_PITCH = TICK + 4;             // 22 - square + gap
    private static final int RADIO_W = TICK * 2 + 4 + 2 * FRAME; // 44 - two squares + gap + frame
    private static final int RADIO_H = TICK + 2 * FRAME;         // 22
    private static final int TICK_GAP = TICK_BOX + 4;            // 26 - box then label

    // The Hot Work form's own legend: teal = filled by the permit issuer,
    // purple = filled by the person performing the work and/or Fire Watch.
    private static final String ISSUER_COLOUR = "#2e7d7d";
    private static final String WORKER_COLOUR = "#7b2f8f";

    /** Available seed types with their default names */
    private static final Map<String, String> SEED_TYPES = Map.ofEntries(
        Map.entry("EnergizedWorkPermit", "Energized Electrical Work Permit"),
        Map.entry("VentingPermit", "Combustible Gas System Venting/Inerting Checklist"),
        Map.entry("ExcavationPermit", "Excavation & Blind Penetrations Permit"),
        Map.entry("Loto", "LOTO Record Sheet"),
        Map.entry("HotWork", "Hot Work Permit"),
        Map.entry("SafeWork", "Safe Work Permit"),
        Map.entry("ConfinedSpace", "Confined Space Permit (SMP-7)"),
        Map.entry("ConfinedSpaceReclassified", "RECLASSIFIED Confined Space Permit (SMP-7)"),
        Map.entry("ConfinedSpaceEntryRecord", "Confined Space Entry/Exit + FME Record (landscape)")
    );

    public Map<String, String> getAvailableSeedTypes() {
        return SEED_TYPES;
    }

    /**
     * Seed a specific form type with a custom name.
     * @return the created PrintableForm
     * @throws IllegalArgumentException if formType is unknown
     */
    @Transactional
    public synchronized PrintableForm seedForm(String formType, String formName) {
        zOrder = 1;
        if (!SEED_TYPES.containsKey(formType)) {
            throw new IllegalArgumentException("Unknown form type: " + formType + ". Available: " + SEED_TYPES.keySet());
        }
        return switch (formType) {
            case "EnergizedWorkPermit" -> seedEnergizedWorkForm(formName);
            case "VentingPermit" -> seedVentingForm(formName);
            case "ExcavationPermit" -> seedExcavationForm(formName);
            case "Loto" -> seedLotoForm(formName);
            case "HotWork" -> seedHotWorkForm(formName);
            case "SafeWork" -> seedSafeWorkForm(formName);
            case "ConfinedSpace" -> seedConfinedSpaceForm(formName, false);
            case "ConfinedSpaceReclassified" -> seedConfinedSpaceForm(formName, true);
            case "ConfinedSpaceEntryRecord" -> seedConfinedSpaceEntryRecordForm(formName);
            default -> throw new IllegalArgumentException("Unknown form type: " + formType);
        };
    }

    // NOTE: an ApplicationReadyEvent listener used to run cleanupLocalDuplicateForms() here on
    // every non-hub boot. It soft-deleted ANY locally-created form of the four seeded types as
    // soon as a foreign-id form of the same type existed — including a form the operator had
    // edited — and did so inside SyncContext, so the deletion was never broadcast and diverged
    // that node permanently. Removed. Duplicate primaries are now handled explicitly and
    // reversibly from Admin -> Forms via PrintableFormMaintenanceService#fixDuplicatePrimaries,
    // which demotes the extra rather than deleting a form, and which does broadcast.

    // ========== ENERGIZED WORK PERMIT (1 page) ==========

    private PrintableForm seedEnergizedWorkForm(String name) {
        PrintableForm form = createForm(name, "EnergizedWorkPermit");
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

        PrintableForm saved = printableFormService.save(form);
        log.info("Seeded EnergizedWorkPermit paper form: {}", name);
        return saved;
    }

    // ========== VENTING PERMIT (2 pages) ==========

    private PrintableForm seedVentingForm(String name) {
        PrintableForm form = createForm(name, "VentingPermit");

        seedVentingPage1(form);
        seedVentingPage2(form);

        PrintableForm saved = printableFormService.save(form);
        log.info("Seeded VentingPermit paper form: {}", name);
        return saved;
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

    private PrintableForm seedExcavationForm(String name) {
        PrintableForm form = createForm(name, "ExcavationPermit");

        seedExcavationPage1(form);
        seedExcavationPage2(form);
        seedExcavationPage3(form);

        PrintableForm saved = printableFormService.save(form);
        log.info("Seeded ExcavationPermit paper form: {}", name);
        return saved;
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

    private PrintableForm seedLotoForm(String name) {
        PrintableForm form = createForm(name, "Loto");
        seedLotoPage1(form);
        seedLotoPage2(form);
        seedLotoPage3(form);
        PrintableForm saved = printableFormService.save(form);
        log.info("Seeded LOTO form (3 pages): {}", name);
        return saved;
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

            // Cell border style for table appearance
            Map<String, Object> cell = Map.of("border", "1px solid #ccc");
            Map<String, Object> cellCenter = Map.of("border", "1px solid #ccc", "textAlign", "center");

            // Row 1 (y=0): main fields across columns — tagNumber & lockNumber span full 70px height, centered
            nc.add(nField(id--, rx1, 0, c1w, 70, "tagNumber", "text", cellCenter));
            nc.add(nField(id--, rx2, 0, c2w, 70, "lockNumber", "text", cellCenter));
            nc.add(nField(id--, rx3, 0, c3w, 26, "description", "text", cell));
            nc.add(nField(id--, rx4, 0, c4w, 70, "isoPos", "text", cell));
            nc.add(nField(id--, rx5, 0, c5w, 70, "hungBy", "text", cell));
            nc.add(nField(id--, rx6, 0, c6w, 70, "verifiedBy", "text", cell));
            nc.add(nField(id--, rx7, 0, c7w, 70, "normPos", "text", cell));
            nc.add(nField(id--, rx8, 0, c8w, 70, "removedBy", "text", cell));

            // Row 2 (y=26, h=22): location under EID column
            nc.add(nField(id--, rx3, 26, c3w, 22, "specificLocation", "text", cell));

            // Row 3 (y=48, h=22): EID number under EID column
            nc.add(nField(id--, rx3, 48, c3w, 22, "eidNumber", "text", cell));

            // Row 4 (y=74, h=18): "Zero Energy Verification Method" label + "Completed By" label
            nc.add(nText(id--, 0, 74, rx7, 18, "Zero Energy Verification Method",
                    Map.of("fontSize", "9px", "fontWeight", "bold", "textAlign", "center", "border", "1px solid #ccc", "borderBottom", "none")));
            nc.add(nText(id--, rx7, 74, c7w + c8w, 18, "Completed By",
                    Map.of("fontSize", "9px", "fontWeight", "bold", "textAlign", "center", "border", "1px solid #ccc", "borderBottom", "none")));

            // Row 5 (y=92, h=34): zero energy textarea + completed by field
            nc.add(nField(id--, 0, 92, rx7, 34, "zeroEnergyMethod", "textarea", cell));
            nc.add(nField(id--, rx7, 92, c7w + c8w, 34, "completedBy", "text", cell));

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

    // ================= DESIGNER-GEOMETRY PAPER FORMS =================
    // The forms the operator built by hand in the designer render correctly, and they all use a
    // 7.7 x 10.15in page (739 x 974px at 96dpi) with a distinct construction: a bordered box per
    // SECTION carrying the section title, full-width row bands inside it, underline-only form
    // fields, and a coloured vertical "sider" rail. The first seeded rebuild of Confined Space
    // invented its own 8.5x11 grid instead and looked nothing like the master. These helpers
    // reproduce the designer shape exactly so seeded and hand-built forms are indistinguishable.

    private static final int DW = 739;   // designer page width  (px)
    private static final int DH = 974;   // designer page height (px)
    private static final int DL = 19;    // left edge of the printed frame
    private static final int DR = 737;   // right edge
    private static final int RAIL = 18;  // width of the coloured sider
    private static final int DSX = 36;   // x of a section box (just right of the rail)
    private static final int DSW = 701;  // width of a section box (36 + 701 = 737)

    private PrintableForm designerForm(String name, String formType) {
        PrintableForm f = new PrintableForm();
        f.setName(name);
        f.setFormType(formType);
        f.setIsPrimary(true);
        f.setSize(Map.of("width", 7.7, "height", 10.15));
        return f;
    }

    /**
     * Base style for a designer container.
     *
     * <p>Per-side border widths are ALWAYS written explicitly. {@code FormContainerDto}'s
     * constructor spreads a default of {@code 1px} onto all four sides, so a style that omits a
     * side does not get "no border" — it gets a hairline. Every earlier "why is there a line
     * there" bug in the seeded forms traces back to that.
     */
    private Map<String, Object> dStyle(String top, String right, String bottom, String left) {
        Map<String, Object> s = new HashMap<>();
        s.put("position", "absolute");
        s.put("display", "flex");
        s.put("borderStyle", "solid");
        s.put("borderWidth", "1px");
        s.put("borderColor", "black");
        s.put("borderRadius", "0px");
        s.put("boxSizing", "border-box");
        s.put("backgroundColor", "transparent");
        s.put("borderTopWidth", top);
        s.put("borderRightWidth", right);
        s.put("borderBottomWidth", bottom);
        s.put("borderLeftWidth", left);
        return s;
    }

    private Map<String, Object> dNone()  { return dStyle("0px", "0px", "0px", "0px"); }
    private Map<String, Object> dBox()   { return dStyle("1px", "1px", "1px", "1px"); }
    private Map<String, Object> dUnder() { return dStyle("0px", "0px", "1px", "0px"); }

    private Map<String, Object> dBg(Map<String, Object> s, String colour) {
        s.put("backgroundColor", colour); return s;
    }
    private Map<String, Object> dBold(Map<String, Object> s) { s.put("fontWeight", "bold"); return s; }
    private Map<String, Object> dItalic(Map<String, Object> s) { s.put("fontStyle", "italic"); return s; }
    private Map<String, Object> dMid(Map<String, Object> s) {
        s.put("justifyContent", "center"); s.put("alignItems", "center"); return s;
    }
    private Map<String, Object> dLeft(Map<String, Object> s) {
        s.put("justifyContent", "flex-start"); s.put("alignItems", "center"); return s;
    }
    /** Content style. The designer forms store fontSize as a NUMBER here, not a px string. */
    private Map<String, Object> fs(int size) {
        Map<String, Object> m = new HashMap<>();
        m.put("fontSize", size);
        return m;
    }
    private Map<String, Object> fsPre(int size) {
        Map<String, Object> m = fs(size);
        m.put("whiteSpace", "pre-wrap");
        return m;
    }

    private FormContainer dText(int x, int y, int w, int h, String content, int page,
                                Map<String, Object> style, Map<String, Object> cstyle) {
        FormContainer c = new FormContainer();
        c.setContentType("text");
        c.setContentJson(content);
        c.setPositionJson(Map.of("x", x, "y", y));
        c.setSizeJson(Map.of("width", w, "height", h));
        c.setPageNumber(page);
        c.setLocked(true);
        c.setStyleJson(style);
        if (cstyle != null) c.setContentStyleJson(cstyle);
        return stack(c);
    }

    private FormContainer dField(int x, int y, int w, int h, String name, String type, int page,
                                 Map<String, Object> style, Map<String, Object> cstyle) {
        FormContainer c = new FormContainer();
        c.setContentType("formField");
        Map<String, Object> content = new HashMap<>();
        content.put("name", name);
        content.put("type", type);
        content.put("label", "");
        content.put("options", new ArrayList<>());
        c.setContentJson(content);
        c.setPositionJson(Map.of("x", x, "y", y));
        c.setSizeJson(Map.of("width", w, "height", h));
        c.setPageNumber(page);
        c.setLocked(true);
        c.setStyleJson(style);
        if (cstyle != null) c.setContentStyleJson(cstyle);
        return stack(c);
    }

    /** Light fill the designer masters use behind every operator-fillable cell. */
    private static final String INK = "#dce6f7";

    /** An underlined, lightly filled input — the standard write-on cell. */
    private FormContainer dInput(int x, int y, int w, int h, String name, String type, int page) {
        return dField(x, y, w, h, name, type, page, dBg(dUnder(), INK), fs(12));
    }
    /** A tick box. 18x18 with a full border, matching the designer masters. */
    private FormContainer dTick(int x, int y, String name, int page) {
        return dField(x, y, 18, 18, name, "checkbox", page, dBg(dBox(), INK), fs(12));
    }
    /** A ruled blank with nothing bound behind it. */
    private FormContainer dRule(int x, int y, int w, int h, int page) {
        return dText(x, y, w, h, "", page, dUnder(), fs(12));
    }
    /** A plain label. */
    private FormContainer dLbl(int x, int y, int w, int h, String s, int page) {
        return dText(x, y, w, h, s, page, dLeft(dNone()), fs(12));
    }
    /** A vertical coloured rail. */
    private FormContainer dRail(int y, int h, String label, String bg, String fg, int page) {
        Map<String, Object> st = dMid(dBg(dBox(), bg));
        st.put("color", fg);
        st.put("writingMode", "vertical-rl");
        st.put("transform", "rotate(180deg)");
        st.put("fontWeight", "bold");
        return dText(DL, y, RAIL, h, label, page, st, fs(11));
    }
    /** A bordered section box whose content is its title, sitting top-left. */
    private FormContainer dSection(int x, int y, int w, int h, String title, int page) {
        return dText(x, y, w, h, title, page, dBold(dBox()), fs(15));
    }

    // ========== CONFINED SPACE PERMIT (SMP-7) ==========

    /**
     * Both Confined Space variants come out of this one method. The Permit-Required and
     * RECLASSIFIED sheets are the same document with four differences, so emitting them from a
     * single layout means a fix lands on both and they cannot drift apart. Conditional containers
     * were not an option — the printable-form renderer has no visibility mechanism at all.
     */
    private PrintableForm seedConfinedSpaceForm(String name, boolean reclassified) {
        PrintableForm form = designerForm(name,
                reclassified ? "ConfinedSpaceReclassified" : "ConfinedSpace");
        csPage1(form, reclassified);
        csPage2(form, reclassified);
        PrintableForm saved = printableFormService.save(form);
        log.info("Seeded Confined Space paper form ({}): {}",
                reclassified ? "Reclassified" : "Permit-Required", name);
        return saved;
    }

    private void csPage1(PrintableForm f, boolean rc) {
        int p = 1;

        // --- Title -------------------------------------------------------------------------
        Map<String, Object> title = dMid(dBg(dBox(), rc ? "#ffff00" : "#e8140c"));
        title.put("fontWeight", "bold");
        title.put("color", rc ? "black" : "white");
        f.addFormContainer(dText(DL, 0, DR - DL, 30,
                (rc ? "RECLASSIFIED Confined Space Permit (SMP-7)" : "Confined Space Permit (SMP-7)"),
                p, title, fs(20)));
        f.addFormContainer(dText(DL, 28, DR - DL, 15,
                "Completed permit must be posted on job site - valid only for indicated date & time",
                p, dMid(dBg(dBox(), "#d9d9d9")), fs(12)));

        // --- 1. General information --------------------------------------------------------
        f.addFormContainer(dSection(DSX, 43, DSW, 78, "1. GENERAL INFORMATION", p));
        f.addFormContainer(dText(498, 45, 60, 15, "Permit #:", p, dBold(dLeft(dNone())), fs(12)));
        f.addFormContainer(dInput(560, 45, 175, 15, "permitNumber", "text", p));

        f.addFormContainer(dLbl(38, 63, 130, 15, "Space to be Entered:", p));
        f.addFormContainer(dInput(170, 63, 282, 15, "space", "text", p));
        f.addFormContainer(dLbl(38, 82, 130, 15, "Purpose for Entry:", p));
        f.addFormContainer(dInput(170, 82, 282, 15, "workScope", "textarea", p));
        f.addFormContainer(dLbl(38, 101, 130, 15, "Issued to:", p));
        f.addFormContainer(dInput(170, 101, 282, 15, "issuedTo", "text", p));

        f.addFormContainer(dLbl(498, 63, 80, 15, "Date of Entry:", p));
        f.addFormContainer(dInput(580, 63, 155, 15, "date", "date", p));
        f.addFormContainer(dLbl(498, 82, 70, 15, "Start Time:", p));
        f.addFormContainer(dInput(570, 82, 165, 15, "time", "time", p));
        f.addFormContainer(dLbl(498, 101, 112, 15, "Authorized Duration:", p));
        f.addFormContainer(dInput(612, 101, 123, 15, "duration", "text", p));

        // --- Communication plan / emergency contacts ---------------------------------------
        f.addFormContainer(dText(DSX, 121, 366, 78, "", p, dBox(), null));
        f.addFormContainer(dText(40, 124, 356, 18,
                "Communication Plan:  3-way-radio________, Voice________", p,
                dBold(dLeft(dNone())), fs(12)));
        f.addFormContainer(dText(40, 168, 45, 16, "Other", p, dBold(dLeft(dNone())), fs(12)));
        f.addFormContainer(dRule(86, 168, 306, 16, p));

        f.addFormContainer(dText(402, 121, 335, 78, "", p, dBox(), null));
        f.addFormContainer(dText(406, 124, 325, 17, "Control Room #: 779-242-6151, 779-242-6148",
                p, dBold(dLeft(dNone())), fs(12)));
        f.addFormContainer(dText(406, 143, 325, 17, "Radio: Ch#1 (J-PWR1)", p,
                dBold(dLeft(dNone())), fs(12)));
        f.addFormContainer(dText(406, 162, 325, 17, "Cell Phone #: 815-839-3330", p,
                dBold(dLeft(dNone())), fs(12)));
        f.addFormContainer(dText(406, 181, 45, 16, "Other:", p, dBold(dLeft(dNone())), fs(12)));
        f.addFormContainer(dRule(452, 181, 279, 16, p));

        // --- 2. Hazards | 3. Required precautions ------------------------------------------
        f.addFormContainer(dSection(DSX, 199, 389, 182, "2. HAZARDS", p));
        f.addFormContainer(dText(39, 219, 380, 14,
                "(check hazards - astmospheric hazards must be monitored if checked)", p,
                dLeft(dNone()), fs(10)));
        f.addFormContainer(dSection(425, 199, 312, 182, "3. REQUIRED PRECAUTIONS", p));
        f.addFormContainer(dText(428, 219, 305, 14,
                "Hazard eliminated or isolated by any of the following", p, dLeft(dNone()), fs(10)));

        // Left hazard column
        String[][] hzL = {{"oxygenDeficiency", "Oxygen deficiency or enrichment"},
                          {"flammableGas", "Flammable gases or vapors"},
                          {"combustibleDust", "Combustible dust levels"},
                          {"toxicGas", "Toxic gas or vapors"},
                          {"rotatingEquipment", "Rotating Equipment"},
                          {"electricalShock", "Electrical shock"},
                          {"entrapment", "Entrapment"}};
        int hy = 236;
        for (String[] h : hzL) {
            f.addFormContainer(dTick(41, hy, "hazards." + h[0], p));
            f.addFormContainer(dLbl(63, hy + 1, 200, 16, h[1], p));
            hy += 20;
        }
        // Right hazard column
        String[][] hzR = {{"engulfment", "Engulfment"}, {"heatStress", "Heat Stress"}};
        int hy2 = 236;
        for (String[] h : hzR) {
            f.addFormContainer(dTick(271, hy2, "hazards." + h[0], p));
            f.addFormContainer(dLbl(293, hy2 + 1, 120, 16, h[1], p));
            hy2 += 20;
        }
        f.addFormContainer(dTick(271, hy2, "hazards.other", p));
        f.addFormContainer(dLbl(293, hy2 + 1, 40, 16, "Other", p));
        f.addFormContainer(dInput(334, hy2 + 1, 82, 16, "hazards.otherDescription", "text", p));

        // Precautions: the two permit-number references are TEXT on the POJO, not booleans, so a
        // filled number is the mark. They print as write-in lines, not tick boxes.
        f.addFormContainer(dLbl(428, 236, 105, 15, "Lockout/Tagout (#", p));
        f.addFormContainer(dInput(535, 236, 185, 15, "precautions.lockOutTagOut", "text", p));
        f.addFormContainer(dLbl(722, 236, 12, 15, ")", p));
        f.addFormContainer(dLbl(428, 255, 110, 15, "Hot Work Permit (#", p));
        f.addFormContainer(dInput(540, 255, 180, 15, "precautions.hotWorkPermit", "text", p));
        f.addFormContainer(dLbl(722, 255, 12, 15, ")", p));

        String[][] pr = {{"ventilation", "Ventilation"}, {"blankFlanged", "Blank Flanged"},
                         {"doubleBlockAndBleed", "Double Block & Bleed"}, {"barriers", "Barriers"}};
        int py = 275;
        for (String[] r : pr) {
            f.addFormContainer(dTick(430, py, "precautions." + r[0], p));
            f.addFormContainer(dLbl(452, py + 1, 200, 16, r[1], p));
            py += 20;
        }
        f.addFormContainer(dTick(430, py, "precautions.other", p));
        f.addFormContainer(dLbl(452, py + 1, 40, 16, "Other", p));
        f.addFormContainer(dInput(494, py + 1, 229, 16, "precautions.otherDescription", "text", p));

        // --- 4. Required PPE and equipment -------------------------------------------------
        f.addFormContainer(dSection(DSX, 381, DSW, 104, "4. REQUIRED PPE AND EQUIP.", p));
        f.addFormContainer(dText(290, 383, 160, 16, "- check if required", p, dLeft(dNone()), fs(12)));
        String[][] pe1 = {{"faceShield", "Face Shield"}, {"fcfi", "GCFI"},
                          {"lovVoltageTools", "Low Voltage Tools"},
                          {"explosionProofTools", "Explosion Proof Tools"}};
        String[][] pe2 = {{"nonSparkingTools", "Non-Sparking Tools"}, {"fallProtection", "Fall Protection"},
                          {"retrievalSystem", "Retrieval System"}, {"lifeline", "Lifeline"}};
        String[][] pe3 = {{"personalAtmosphericMeter", "Personal Atmospheric Meter"}, {"tripod", "Tripod"}};
        int ey = 401;
        for (String[] e : pe1) {
            f.addFormContainer(dTick(41, ey, "ppe." + e[0], p));
            f.addFormContainer(dLbl(63, ey + 1, 170, 16, e[1], p));
            ey += 20;
        }
        ey = 401;
        for (String[] e : pe2) {
            f.addFormContainer(dTick(231, ey, "ppe." + e[0], p));
            f.addFormContainer(dLbl(253, ey + 1, 170, 16, e[1], p));
            ey += 20;
        }
        ey = 401;
        for (String[] e : pe3) {
            f.addFormContainer(dTick(417, ey, "ppe." + e[0], p));
            f.addFormContainer(dLbl(439, ey + 1, 200, 16, e[1], p));
            ey += 20;
        }
        f.addFormContainer(dTick(417, ey, "ppe.other", p));
        f.addFormContainer(dLbl(439, ey + 1, 40, 16, "Other", p));
        f.addFormContainer(dInput(481, ey + 1, 242, 16, "ppe.otherDescription", "text", p));

        // --- 5. Atmospheric testing / monitoring -------------------------------------------
        f.addFormContainer(dSection(DSX, 485, DSW, 20, "5. ATMOSPHERIC TESTING/MONITORING", p));
        f.addFormContainer(dText(DSX, 505, DSW, 16,
                "Note: Continuous monitoring required for all Confined Space entries.", p,
                dBold(dItalic(dMid(dBox()))), fs(12)));
        f.addFormContainer(dText(DSX, 521, DSW, 26,
                "Document test results for Permit-Required spaces at 2-hour intervals and prior to each entry after the space has been vacated.\n"
                        + "Document test results for Reclassifed Spaces once per shift.", p,
                dItalic(dMid(dBox())), fsPre(11)));

        int gy = 547, gHdrH = 32, gRowH = 16;
        int[] gx = {36, 185, 334, 416, 498, 580, 662, 737};
        String[] gHdr = {"Atmospheric Survey", "Acceptable Limits", "Initial Test\nResults",
                         "Test Results", "Test Results", "Test Results", "Test Results"};
        // Only the Initial Test Results column is bound: the entity stores one reading set and the
        // master leaves the later four columns blank for hand-entry (DECISIONS.md #15/#47).
        String[][] rows = {
            {"Date",             "",                      "date"},
            {"Meter Make/Model", "",                      "meterModel"},
            {"Meter Serial #",   "",                      "meterNum"},
            {"Meter Cal Date",   "Past 30 Days",          "meterCalDate"},
            {"Meter Bump Test",  "Performed Daily (Y/N)", "meterBumpTest"},
            {"Oxygen",           ">19.5%<23.6%",          "oxygen"},
            {"Flammablility",    "<10% of LFL",           "lel"},
            {"Hydrogen Sulfide", "<10 ppm",               "hydrogenSulfide"},
            {"Carbon Monoxide",  "<35 ppm",               "carbonMonoxide"},
            {"Other",            "",                      "ammonia"},
            {"Time of Sample",   "",                      "timeOfSample"},
            {"Tester Initials",  "",                      "testerInitials"},
        };
        int gridH = gHdrH + rows.length * gRowH;
        for (int i = 0; i < gHdr.length; i++) {
            f.addFormContainer(dText(gx[i], gy, gx[i + 1] - gx[i], gHdrH, gHdr[i], p,
                    dMid(dBox()), fsPre(12)));
        }
        int ry = gy + gHdrH;
        for (String[] r : rows) {
            f.addFormContainer(dText(gx[0], ry, gx[1] - gx[0], gRowH, r[0], p, dMid(dBox()), fs(12)));
            Map<String, Object> lim = dMid(dBox());
            if (r[1].isEmpty()) dBg(lim, "#a6a6a6");
            f.addFormContainer(dText(gx[1], ry, gx[2] - gx[1], gRowH, r[1], p, lim, fs(12)));
            f.addFormContainer(dField(gx[2], ry, gx[3] - gx[2], gRowH, r[2],
                    csFieldType(r[2]), p, dBg(dBox(), INK), fs(12)));
            for (int c = 3; c < 7; c++) {
                f.addFormContainer(dText(gx[c], ry, gx[c + 1] - gx[c], gRowH, "", p, dBox(), null));
            }
            ry += gRowH;
        }

        // --- 6. Entry authorization --------------------------------------------------------
        int s6 = gy + gridH;
        f.addFormContainer(dSection(DSX, s6, DSW, 86, "6. ENTRY AUTHORIZATION", p));
        f.addFormContainer(dText(39, s6 + 20, 694, 18,
                "I certify that conditions in this space are acceptable for entry as long as they remain as discussed in the pre-job briefing.",
                p, dBold(dItalic(dLeft(dNone()))), fs(12)));
        csSignRow(f, s6 + 65, p);

        int railBottom = s6 + 86;

        // --- 7. Reclassification certification (RECLASSIFIED only) -------------------------
        if (rc) {
            int s7 = railBottom;
            f.addFormContainer(dSection(DSX, s7, DSW, 116, "7. RECLASSIFICATION CERTIFICATION", p));
            f.addFormContainer(dText(39, s7 + 19, 694, 56,
                    "I have reviewed this certificate and because all hazards have been eliminated and the atmosphere found to be within "
                            + "acceptable limits without the use of forced air ventilation. I authorize that this space is a reclassified confined space. "
                            + "Cancellation of this certification shall immediately occur if the limit of a hazard is exceeded, the authorized duration is "
                            + "exceeded, or any additional cancellation condition is occurs.",
                    p, dBold(dLeft(dNone())), fsPre(12)));
            csSignRow(f, s7 + 95, p);
            f.addFormContainer(dRail(s7, 116, "REQUIRED", "#ffff00", "black", p));
        }

        // Green rail beside everything that applies to every entry
        f.addFormContainer(dRail(43, railBottom - 43,
                "Required for ALL Confined Space Entries", "#92d050", "black", p));
    }

    private void csPage2(PrintableForm f, boolean rc) {
        int p = 2;

        f.addFormContainer(dText(DL, 0, 489, 20, "CONFINED SPACE:", p, dBold(dLeft(dBox())), fs(13)));
        f.addFormContainer(dInput(162, 2, 343, 16, "space", "text", p));
        f.addFormContainer(dText(507, 0, DR - 507, 20, "PERMIT #:", p, dBold(dLeft(dBox())), fs(13)));
        f.addFormContainer(dInput(584, 2, 150, 16, "permitNumber", "text", p));

        // --- Rescue services + 12. Attendant log -------------------------------------------
        int top = 20;
        f.addFormContainer(dText(DSX, top, DSW, 34, "", p, dBox(), null));
        f.addFormContainer(dText(39, top + 1, 695, 16,
                "RESCUE SERVICES ESTABLISHED & AVAILABLE: ____YES____NO   RESCUE TEAM_________________________, TIME________",
                p, dBold(dLeft(dNone())), fs(12)));
        f.addFormContainer(dText(39, top + 17, 695, 16,
                "CONTACT NAME: ______________________________, CONTACT PHONE #____________________________________________",
                p, dBold(dLeft(dNone())), fs(12)));

        int logTop = top + 34;
        f.addFormContainer(dText(DSX, logTop, DSW, 18, "12. ATTENDANT LOG", p,
                dBold(dLeft(dBox())), fs(13)));
        // Unbound: no attendant collection exists on the entity, so this stays hand-filled.
        int[] ax = {36, 421, 501, 581, 661, 737};
        String[] aHdr = {"Attendant Name (Print)", "Time On Duty", "Time Off Duty",
                         "Time On Duty", "Time Off Duty"};
        int ay = logTop + 18;
        for (int i = 0; i < aHdr.length; i++) {
            f.addFormContainer(dText(ax[i], ay, ax[i + 1] - ax[i], 18, aHdr[i], p, dMid(dBox()), fs(12)));
        }
        ay += 18;
        for (int r = 0; r < 7; r++) {
            for (int i = 0; i < 5; i++) {
                f.addFormContainer(dText(ax[i], ay, ax[i + 1] - ax[i], 18, "", p, dBox(), null));
            }
            ay += 18;
        }
        // The Permit-Required sheet marks the rescue/attendant block REQUIRED in red; the
        // RECLASSIFIED sheet leaves it unmarked.
        if (!rc) f.addFormContainer(dRail(top, ay - top, "REQUIRED", "#e8140c", "white", p));

        // --- Special instructions (OPTIONAL on both) ---------------------------------------
        int siTop = ay + 4;
        f.addFormContainer(dText(DSX, siTop, DSW, 34, "SPECIAL INSTRUCTIONS AND NOTES", p,
                dBold(dLeft(dBox())), fs(13)));
        int sy = siTop + 34;
        for (int r = 0; r < 6; r++) {
            f.addFormContainer(dText(DSX, sy, DSW, 40, "", p, dBg(dBox(), INK), null));
            sy += 40;
        }
        f.addFormContainer(dRail(siTop, sy - siTop, "OPTIONAL", "#2e75b6", "white", p));

        // --- 14. Permit cancelled / closed (REQUIRED on both) ------------------------------
        int cTop = sy + 4;
        f.addFormContainer(dText(DSX, cTop, DSW, 18, "14. PERMIT CANCELED/CLOSED", p,
                dBold(dLeft(dBox())), fs(13)));
        int cy = cTop + 20;
        // The two variants carry different typos on this line. Both are reproduced verbatim:
        // the controlled document is the authority, not the spelling.
        f.addFormContainer(dRule(38, cy, 60, 16, p));
        f.addFormContainer(dLbl(100, cy, 240, 16,
                rc ? "All Personal Exited Space" : "All Personell Excited Space", p));
        f.addFormContainer(dRule(410, cy + 16, 60, 16, p));
        f.addFormContainer(dLbl(472, cy + 16, 262, 16, "Performed Contractor Post Entry Critque", p));
        f.addFormContainer(dRule(38, cy + 16, 60, 16, p));
        f.addFormContainer(dLbl(100, cy + 16, 240, 16, "Space Closed and/or Barricaded", p));

        int ry2 = cy + 40;
        f.addFormContainer(dLbl(38, ry2, 170, 16, "Reason Permit Cancelled/Closed:", p));
        f.addFormContainer(dRule(210, ry2, 524, 16, p));
        csSignRow(f, ry2 + 40, p);
        f.addFormContainer(dLbl(38, ry2 + 44, 70, 16, "Comments:", p));
        f.addFormContainer(dRule(110, ry2 + 44, 624, 16, p));
        f.addFormContainer(dRule(110, ry2 + 62, 624, 16, p));
        f.addFormContainer(dRail(cTop, (ry2 + 80) - cTop, "REQUIRED", "#92d050", "black", p));
    }

    /** Entry Supervisor name / signature / date-time. Repeated in sections 6, 7 and 14. */
    private void csSignRow(PrintableForm f, int y, int page) {
        f.addFormContainer(dText(39, y, 260, 18, "Entry Supervisor Name: (Print)", page,
                dStyle("1px", "0px", "0px", "0px"), fs(12)));
        f.addFormContainer(dText(328, y, 230, 18, "Entry Supervisor Signature: (Sign)", page,
                dStyle("1px", "0px", "0px", "0px"), fs(12)));
        f.addFormContainer(dText(585, y, 150, 18, "Date & Time", page,
                dStyle("1px", "0px", "0px", "0px"), fs(12)));
    }

    /** Widget type for a Confined Space binding, kept in step with ConfinedSpaceDto.toFormFields. */
    private String csFieldType(String key) {
        return switch (key) {
            case "date", "meterCalDate" -> "date";
            case "time", "timeOfSample" -> "time";
            case "workScope" -> "textarea";
            default -> "text";
        };
    }

    /**
     * Page 3 — entry/exit and FME records. Genuinely landscape on the master, so it is its own
     * PrintableForm rather than a rotated portrait page, and is shared by both variants. Entirely
     * hand-filled: no entrant or FME collection exists on the entity.
     */
    private PrintableForm seedConfinedSpaceEntryRecordForm(String name) {
        PrintableForm form = new PrintableForm();
        form.setName(name);
        form.setFormType("ConfinedSpaceEntryRecord");
        form.setIsPrimary(true);
        form.setSize(Map.of("width", 10.15, "height", 7.7));   // landscape twin of the portrait page
        int p = 1;
        int pw = 974, ph = 739;

        int leftRail = 8, midRail = 470;
        int lx0 = leftRail + 22, lx1 = 660;          // left table spans lx0..lx1
        int rx0 = midRail + 22, rx1 = pw - 8;        // right table

        form.addFormContainer(dText(lx0, 6, lx1 - lx0, 18,
                "CONFINED SPACE ENTRY AND EXIT RECORD        SMP-07", p, dMid(dNone()), fs(13)));
        form.addFormContainer(dText(rx0, 6, rx1 - rx0, 18,
                "CONFINED SPACE FME RECORD        STD-MMP-08", p, dMid(dNone()), fs(13)));

        Map<String, Object> att = dLeft(dNone());
        att.put("color", "#cc0000");
        att.put("fontWeight", "bold");
        form.addFormContainer(dText(lx0, 26, lx1 - lx0, 18, "Name of Attendant(s):", p, att, fs(13)));

        int top = 46;
        int[] ecx = {lx0, 330, 430, 530, lx1};
        String[] eHdr = {"Entrant Name", "Company", "Time In", "Time Out"};
        int[] fcx = {rx0, rx1 - 90, rx1};
        String[] fHdr = {"Material/Tool", "Quantity"};
        for (int i = 0; i < eHdr.length; i++) {
            form.addFormContainer(dText(ecx[i], top, ecx[i + 1] - ecx[i], 20, eHdr[i], p,
                    dBold(dMid(dBox())), fs(12)));
        }
        for (int i = 0; i < fHdr.length; i++) {
            form.addFormContainer(dText(fcx[i], top, fcx[i + 1] - fcx[i], 20, fHdr[i], p,
                    dBold(dMid(dBox())), fs(12)));
        }

        int rowH = 40, y = top + 20;
        int nRows = (ph - 34 - y) / rowH;
        for (int r = 0; r < nRows; r++) {
            for (int i = 0; i < 4; i++) {
                form.addFormContainer(dText(ecx[i], y, ecx[i + 1] - ecx[i], rowH, "", p, dBox(), null));
            }
            for (int i = 0; i < 2; i++) {
                form.addFormContainer(dText(fcx[i], y, fcx[i + 1] - fcx[i], rowH, "", p, dBox(), null));
            }
            y += rowH;
        }

        Map<String, Object> r1 = dMid(dBg(dBox(), "#e8140c"));
        r1.put("color", "white"); r1.put("fontWeight", "bold");
        r1.put("writingMode", "vertical-rl"); r1.put("transform", "rotate(180deg)");
        form.addFormContainer(dText(leftRail, top, 20, y - top, "Safety Procedure", p, r1, fs(13)));
        Map<String, Object> r2 = dMid(dBg(dBox(), "#2e9bd6"));
        r2.put("color", "white"); r2.put("fontWeight", "bold");
        r2.put("writingMode", "vertical-rl"); r2.put("transform", "rotate(180deg)");
        form.addFormContainer(dText(midRail, top, 20, y - top, "FME Procedure", p, r2, fs(13)));

        form.addFormContainer(dText(300, y + 6, 160, 16, "Confined Space Permit #:", p,
                dLeft(dNone()), fs(12)));
        form.addFormContainer(dInput(462, y + 6, 200, 16, "permitNumber", "text", p));

        PrintableForm saved = printableFormService.save(form);
        log.info("Seeded Confined Space entry/exit record (landscape): {}", name);
        return saved;
    }

    // ========== SAFE WORK PERMIT (Std SMP-17, Revision 1) ==========

    /**
     * Safe Work Permit, rebuilt on the designer geometry (739 x 974) to match the controlled
     * SMP-17 Rev 1 master. Page 2 is the continuation of the sign on/off roster, which is where
     * the master overflows.
     */
    private PrintableForm seedSafeWorkForm(String name) {
        PrintableForm form = designerForm(name, "SafeWork");
        swPage1(form);
        swPage2(form);
        PrintableForm saved = printableFormService.save(form);
        log.info("Seeded Safe Work paper form: {}", name);
        return saved;
    }

    /** Column x-boundaries of the sign on / sign off roster, shared by both pages. */
    private static final int[] SW_ROSTER = {0, 260, 375, 437, 499, 561, 623, DW};
    private static final String[] SW_ROSTER_HDR = {"Sign and Print Name", "Company", "Sign On\nDate",
            "Sign On\nTime", "Sign Off\nDate", "Sign Off\nTime", "Work\nCompleted"};

    private void swPage1(PrintableForm f) {
        int p = 1;

        // --- Masthead -----------------------------------------------------------------------
        f.addFormContainer(dText(0, 0, 240, 76, "NAES", p, dBold(dMid(dBox())), fs(20)));
        f.addFormContainer(dText(239, 0, DW - 239, 38, "Safety Manual Procedure – 17", p,
                dBold(dLeft(dBox())), fs(15)));
        f.addFormContainer(dText(239, 38, DW - 239, 38, "Safe Work Permit  -  Jackson Generation", p,
                dBold(dLeft(dBox())), fs(15)));

        // --- Issue block --------------------------------------------------------------------
        int[] ix = {0, 120, 239, 618, DW};
        String[] ihdr = {"Date Issued:", "Time Issued:", "Company/Person Performing Work", "Permit Number"};
        for (int i = 0; i < ihdr.length; i++) {
            Map<String, Object> st = (i == 2) ? dMid(dBox()) : dLeft(dBox());
            f.addFormContainer(dText(ix[i], 76, ix[i + 1] - ix[i], 18, ihdr[i], p, st, fs(12)));
        }
        String[][] ifld = {{"date", "date"}, {"time", "time"},
                           {"companyPerson", "text"}, {"permitNumber", "text"}};
        for (int i = 0; i < ifld.length; i++) {
            f.addFormContainer(dField(ix[i], 94, ix[i + 1] - ix[i], 19, ifld[i][0], ifld[i][1], p,
                    dBg(dBox(), INK), fs(12)));
        }

        f.addFormContainer(dText(0, 113, DW, 18, "Specific Location of Work:", p,
                dLeft(dBox()), fs(12)));
        f.addFormContainer(dField(150, 114, DW - 152, 16, "location", "text", p, dBg(dNone(), INK), fs(12)));
        f.addFormContainer(dText(0, 131, DW, 18, "Description Of Work to be Performed:", p,
                dLeft(dBox()), fs(12)));
        f.addFormContainer(dField(212, 132, DW - 214, 16, "workScope", "textarea", p,
                dBg(dNone(), INK), fs(12)));

        // --- IDENTIFY SAFETY HAZARDS --------------------------------------------------------
        f.addFormContainer(dText(0, 149, DW, 10, "", p, dBg(dBox(), "#c6c3c3"), null));
        f.addFormContainer(dText(0, 159, DW, 19, "IDENTIFY SAFETY HAZARDS", p,
                dBold(dMid(dBox())), fs(14)));

        int hzTop = 178, hzH = 195;
        int[] hcx = {0, 244, 494, DW};
        for (int i = 0; i < 3; i++) {
            f.addFormContainer(dText(hcx[i], hzTop, hcx[i + 1] - hcx[i], hzH, "", p, dBox(), null));
        }
        String[][] swH1 = {{"highTemp", "*High Temperature (>140F)"},
                           {"highPressure", "*High Pressure (>100 psi)"},
                           {"hazardousFlammablePipingMaint", "*Hazardous or Flamable Piping Maint."},
                           {"electricalTesting599V", "*Electrical Testing > 599V"},
                           {"energized", "**Energized Electrical Work (>50V)"},
                           {"storedEnergy", "Stored Energy (LOTO)"},
                           {"eyeHazard", "Eye Hazard"},
                           {"egressAccess", "Egress & Access Hazard"},
                           {"ergonomicHazard", "Ergonomic Hazards"}};
        String[][] swH2 = {{"fallingObject", "Falling Object Hazard"},
                           {"highNoise", "High Noise"},
                           {"dustParticulate", "Dust/Particulate"},
                           {"combustibleDust", "Combustible Dust"},
                           {"fireHazard", "Fire/Explosion Hazard"},
                           {"hotSurface", "Hot Surfaces"},
                           {"slippery", "Slip/Trip/Fall Hazards"},
                           {"ventilationRequired", "Ventilation Req’d (Mech/Natural)"},
                           {"lightingRestrictions", "Lighting/Visibility restrictions"},
                           {"exposedRotatingParts", "Exposed Rotating Parts"}};
        String[][] swH3 = {{"chemicalExposure", "Possible Chemical Exposure"},
                           {"liftingHazard", "Lifting Hazard"},
                           {"handTraps", "Hand Traps"},
                           {"heatColdStress", "Heat/Cold Stress"},
                           {"elevatedSurface", "Elevated Work Surface"},
                           {"environmental", "Environmental Concern"}};
        int hy = 181, pitch = 17;
        for (String[] h : swH1) {
            f.addFormContainer(dTick(8, hy, "hazards." + h[0], p));
            f.addFormContainer(dLbl(30, hy + 1, 210, 16, h[1], p));
            hy += pitch;
        }
        f.addFormContainer(dText(4, hy + 2, 236, 14, "* REQUIRES PLANT MANAGER APPROVAL", p,
                dBold(dLeft(dNone())), fs(11)));
        f.addFormContainer(dText(4, hy + 16, 236, 14, "**REQUIRES ENERGIZED ELECTRICAL WP", p,
                dBold(dLeft(dNone())), fs(11)));

        hy = 181;
        for (String[] h : swH2) {
            f.addFormContainer(dTick(252, hy, "hazards." + h[0], p));
            f.addFormContainer(dLbl(274, hy + 1, 216, 16, h[1], p));
            hy += pitch;
        }
        hy = 181;
        for (String[] h : swH3) {
            f.addFormContainer(dTick(502, hy, "hazards." + h[0], p));
            f.addFormContainer(dLbl(524, hy + 1, 210, 16, h[1], p));
            hy += pitch;
        }
        // Column 3 tail: three ticks that each carry a write-in.
        f.addFormContainer(dTick(502, hy, "hazards.weatherHazards", p));
        f.addFormContainer(dLbl(524, hy + 1, 100, 16, "Weather Hazards", p));
        f.addFormContainer(dInput(624, hy + 1, 110, 16, "hazards.weatherHazardDescription", "text", p));
        hy += pitch;
        f.addFormContainer(dTick(502, hy, "hazards.testingTroubleshooting50V", p));
        f.addFormContainer(dLbl(524, hy + 1, 210, 16, "Testing/Troubleshooting>50V", p));
        hy += pitch;
        f.addFormContainer(dLbl(524, hy + 1, 55, 16, "Voltage", p));
        f.addFormContainer(dInput(579, hy + 1, 155, 16, "hazards.voltageDescription", "text", p));
        hy += pitch;
        f.addFormContainer(dTick(502, hy, "hazards.hexavalentChromium", p));
        f.addFormContainer(dLbl(524, hy + 1, 210, 16, "Hexavalent Chromium (Cr(VI))", p));
        hy += pitch;
        f.addFormContainer(dTick(502, hy, "hazards.other", p));
        f.addFormContainer(dLbl(524, hy + 1, 40, 16, "Other", p));
        f.addFormContainer(dInput(564, hy + 1, 170, 16, "hazards.otherDescription", "text", p));

        // --- REQUIRED PERMITS/TESTS/ACTIONS -------------------------------------------------
        int pmTop = hzTop + hzH;                       // 383
        f.addFormContainer(dText(0, pmTop, DW, 10, "", p, dBg(dBox(), "#c6c3c3"), null));
        f.addFormContainer(dText(0, pmTop + 10, DW, 19, "REQUIRED PERMITS/TESTS/ACTIONS", p,
                dBold(dMid(dBox())), fs(14)));
        int pmBox = pmTop + 29, pmH = 96;
        int[] pcx = {0, 304, 502, DW};
        for (int i = 0; i < 3; i++) {
            f.addFormContainer(dText(pcx[i], pmBox, pcx[i + 1] - pcx[i], pmH, "", p, dBox(), null));
        }
        // Column 1: each entry references another permit by number.
        String[][] swP1 = {{"lotoRequired", "LOTO Required #", "permits.lotoDescription"},
                           {"hotWork", "Hot Work Permit #", "permits.hotWorkDescription"},
                           {"confinedSpace", "Confined Space #", "permits.confinedSpaceDescription"},
                           {"excavationPermit", "Excavation Permit", ""},
                           {"energizedPermit", "Energized Electrical WP", "permits.energizedPermitDescription"}};
        int py = pmBox + 3;
        for (String[] r : swP1) {
            f.addFormContainer(dTick(8, py, "permits." + r[0], p));
            f.addFormContainer(dLbl(30, py + 1, 130, 16, r[1], p));
            if (r[2].isEmpty()) {
                // No backing text field exists for the excavation reference on SwPermits, so this
                // one stays a ruled blank rather than being bound to an unrelated slot.
                f.addFormContainer(dRule(162, py + 1, 136, 16, p));
            } else {
                f.addFormContainer(dInput(162, py + 1, 136, 16, r[2], "text", p));
            }
            py += 18;
        }
        String[][] swP2 = {{"ventingPurging", "Venting/Purging Procedure"}, {"jha", "JHA"},
                           {"gasTesting", "Air Monitoring within Safe Limits"}, {"liftPlan", "Lift Plan"}};
        py = pmBox + 3;
        for (String[] r : swP2) {
            f.addFormContainer(dTick(308, py, "permits." + r[0], p));
            f.addFormContainer(dLbl(330, py + 1, 170, 16, r[1], p));
            py += 18;
        }
        String[][] swP3 = {{"confSpaceRescuePlanReview", "Conf. Space Rescue Plan Review"},
                           {"fallRescuePlan", "Fall Rescue Plan"}};
        py = pmBox + 3;
        for (String[] r : swP3) {
            f.addFormContainer(dTick(510, py, "permits." + r[0], p));
            f.addFormContainer(dLbl(532, py + 1, 202, 16, r[1], p));
            py += 18;
        }
        f.addFormContainer(dTick(510, pmBox + 75, "permits.other", p));
        f.addFormContainer(dLbl(532, pmBox + 76, 40, 16, "Other", p));
        f.addFormContainer(dInput(574, pmBox + 76, 160, 16, "permits.otherDescription", "text", p));

        // --- PROTECTIVE EQUIPMENT REQUIRED --------------------------------------------------
        int peTop = pmBox + pmH;                        // 508
        f.addFormContainer(dText(0, peTop, DW, 10, "", p, dBg(dBox(), "#c6c3c3"), null));
        f.addFormContainer(dText(0, peTop + 10, DW, 19, "PROTECTIVE EQUIPMENT REQUIRED", p,
                dBold(dMid(dBox())), fs(14)));
        int peBox = peTop + 29, peH = 124;
        int[] ecx = {0, 165, 320, 505, DW};
        for (int i = 0; i < 4; i++) {
            f.addFormContainer(dText(ecx[i], peBox, ecx[i + 1] - ecx[i], peH, "", p, dBox(), null));
        }
        String[][] swE1 = {{"hardhat", "Hardhat"}, {"safetyGlasses", "Safety Glasses"},
                           {"hearingProtection", "Hearing Protection"}, {"boots", "Protective Footwear"},
                           {"weldingPpe", "Welding PPE"}};
        int ey = peBox + 4;
        for (String[] e : swE1) {
            f.addFormContainer(dTick(8, ey, "ppe." + e[0], p));
            f.addFormContainer(dLbl(30, ey + 1, 130, 16, e[1], p));
            ey += 20;
        }
        // Column 2 pairs two ticks with a "Type" write-in each.
        ey = peBox + 4;
        f.addFormContainer(dTick(173, ey, "ppe.respiratorDustMask", p));
        f.addFormContainer(dLbl(195, ey + 1, 122, 16, "Respirator/Dust Mask", p));
        f.addFormContainer(dLbl(173, ey + 19, 32, 16, "Type", p));
        f.addFormContainer(dInput(205, ey + 19, 110, 16, "ppe.respiratorType", "text", p));
        f.addFormContainer(dTick(173, ey + 38, "ppe.gloves", p));
        f.addFormContainer(dLbl(195, ey + 39, 122, 16, "Protective Gloves", p));
        f.addFormContainer(dLbl(173, ey + 57, 32, 16, "Type", p));
        f.addFormContainer(dInput(205, ey + 57, 110, 16, "ppe.glovesType", "text", p));
        f.addFormContainer(dTick(173, ey + 76, "ppe.gasMonitor", p));
        f.addFormContainer(dLbl(195, ey + 77, 122, 16, "Air Monitor", p));
        f.addFormContainer(dTick(173, ey + 94, "ppe.tyvekSuit", p));
        f.addFormContainer(dLbl(195, ey + 95, 122, 16, "Tyvek Suit", p));

        ey = peBox + 4;
        String[][] swE3 = {{"acidSuit", "Acid Suit/Rainsuit"}, {"barricade", "Barricade/Rope Off"},
                           {"faceShield", "Face Shield/Goggles"}, {"arcFlashPpe", "Arc Flash/Shock PPE"}};
        for (String[] e : swE3) {
            f.addFormContainer(dTick(328, ey, "ppe." + e[0], p));
            f.addFormContainer(dLbl(350, ey + 1, 150, 16, e[1], p));
            ey += 20;
        }
        f.addFormContainer(dLbl(328, ey, 92, 16, "Class/Cal Rating:", p));
        f.addFormContainer(dInput(420, ey, 80, 16, "ppe.classCalRating", "text", p));
        f.addFormContainer(dTick(328, ey + 19, "ppe.gfi", p));
        f.addFormContainer(dLbl(350, ey + 20, 150, 16, "GFCI", p));

        ey = peBox + 4;
        f.addFormContainer(dTick(509, ey, "ppe.purgingVentilation", p));
        f.addFormContainer(dLbl(531, ey + 1, 203, 16, "Purging/Ventilation", p));
        f.addFormContainer(dTick(509, ey + 20, "ppe.fallProtection", p));
        f.addFormContainer(dText(531, ey + 21, 203, 16, "Fall Protection(Restraint/Lanyard/SRL)", p,
                dLeft(dNone()), fs(11)));
        f.addFormContainer(dLbl(509, ey + 40, 88, 16, "Fall Clearance", p));
        f.addFormContainer(dInput(597, ey + 40, 137, 16, "ppe.fallClearance", "text", p));
        f.addFormContainer(dTick(509, ey + 78, "ppe.other", p));
        f.addFormContainer(dLbl(531, ey + 79, 40, 16, "Other", p));
        f.addFormContainer(dInput(573, ey + 79, 161, 16, "ppe.otherDescription", "text", p));

        // --- Special instructions -----------------------------------------------------------
        int siTop = peBox + peH;                        // 649
        f.addFormContainer(dText(0, siTop, DW, 58, "", p, dBox(), null));
        f.addFormContainer(dLbl(4, siTop + 2, 160, 16, "Special Instructions:", p));
        f.addFormContainer(dField(4, siTop + 20, DW - 8, 34, "specialInstructions", "textarea", p,
                dBg(dNone(), INK), fs(12)));

        // --- Authorisation row --------------------------------------------------------------
        int auTop = siTop + 58;                         // 707
        int[] acx = {0, 185, 368, 551, DW};
        f.addFormContainer(dText(acx[0], auTop, acx[1] - acx[0], 54,
                "The work scope has been reviewed, pre-job briefing held, and the work may proceed",
                p, dBold(dMid(dBox())), fsPre(11)));
        String[] au = {"Work Authority", "Plant Manager (as Required)", "Requestor"};
        for (int i = 0; i < au.length; i++) {
            f.addFormContainer(dText(acx[i + 1], auTop, acx[i + 2] - acx[i + 1], 54, "", p, dBox(), null));
            f.addFormContainer(dLbl(acx[i + 1] + 4, auTop + 2, acx[i + 2] - acx[i + 1] - 8, 16, au[i], p));
            f.addFormContainer(dLbl(acx[i + 1] + 4, auTop + 26, 12, 18, "X", p));
            f.addFormContainer(dRule(acx[i + 1] + 18, auTop + 26, acx[i + 2] - acx[i + 1] - 26, 18, p));
        }
        // The Requestor cell is the one signature the record actually stores.
        f.addFormContainer(dField(acx[3] + 18, auTop + 26, acx[4] - acx[3] - 26, 18,
                "requestedBy", "text", p, dBg(dUnder(), INK), fs(12)));

        // --- Sign on / sign off roster ------------------------------------------------------
        int rTop = auTop + 54;                          // 761
        swRoster(f, rTop, 7, p);

        int foot = rTop + 36 + 7 * 18;                  // 923
        f.addFormContainer(dText(0, foot, DW, 18,
                "Safe Work Permit Released.  Work Authority: ______________________________   Date/Time: ______________________",
                p, dBold(dLeft(dBox())), fs(12)));
        f.addFormContainer(dText(0, foot + 20, 400, 14, "Std SMP-17 Form Safe Work Permit      Revision 1",
                p, dLeft(dNone()), fs(11)));
        f.addFormContainer(dText(DW - 120, foot + 20, 116, 14, "1 of 2", p, dMid(dNone()), fs(11)));
    }

    /**
     * Page 2 is the roster continuation. The master overflows the page-1 table, and the operator
     * confirmed the sign on/off table is what carries over.
     */
    private void swPage2(PrintableForm f) {
        int p = 2;
        f.addFormContainer(dText(0, 0, 500, 20, "Safe Work Permit  -  Sign On / Sign Off (continued)",
                p, dBold(dLeft(dBox())), fs(13)));
        f.addFormContainer(dText(500, 0, 120, 20, "Permit Number", p, dLeft(dBox()), fs(12)));
        f.addFormContainer(dField(620, 0, DW - 620, 20, "permitNumber", "text", p,
                dBg(dBox(), INK), fs(12)));

        int rTop = 24;
        int rows = 30;
        swRoster(f, rTop, rows, p);
        int foot = rTop + 36 + rows * 18;
        f.addFormContainer(dText(0, foot + 6, 400, 14, "Std SMP-17 Form Safe Work Permit      Revision 1",
                p, dLeft(dNone()), fs(11)));
        f.addFormContainer(dText(DW - 120, foot + 6, 116, 14, "2 of 2", p, dMid(dNone()), fs(11)));
    }

    /**
     * The sign on / sign off roster. Unbound: {@code PersonnelSignEntry} exists on the package,
     * not on SafeWork, so the paper rows stay hand-filled and the two cannot disagree.
     */
    private void swRoster(PrintableForm f, int top, int rows, int page) {
        for (int i = 0; i < SW_ROSTER_HDR.length; i++) {
            f.addFormContainer(dText(SW_ROSTER[i], top, SW_ROSTER[i + 1] - SW_ROSTER[i], 36,
                    SW_ROSTER_HDR[i], page, dBold(dMid(dBox())), fsPre(12)));
        }
        int y = top + 36;
        for (int r = 0; r < rows; r++) {
            for (int i = 0; i < SW_ROSTER_HDR.length; i++) {
                f.addFormContainer(dText(SW_ROSTER[i], y, SW_ROSTER[i + 1] - SW_ROSTER[i], 18, "",
                        page, dBox(), null));
            }
            // "Work Completed" is a Yes/No pair of ticks, hand-marked per signatory.
            f.addFormContainer(dText(SW_ROSTER[6] + 4, y + 3, 12, 12, "", page, dBg(dBox(), INK), null));
            f.addFormContainer(dText(SW_ROSTER[6] + 18, y + 1, 28, 16, "Yes", page, dLeft(dNone()), fs(11)));
            f.addFormContainer(dText(SW_ROSTER[6] + 56, y + 3, 12, 12, "", page, dBg(dBox(), INK), null));
            f.addFormContainer(dText(SW_ROSTER[6] + 70, y + 1, 28, 16, "No", page, dLeft(dNone()), fs(11)));
            y += 18;
        }
    }

    private FormContainer gid(FormContainer c, String group) {
        c.setGroupId(group);
        String colour = "issuer".equals(group) ? ISSUER_COLOUR
                      : "ops:worker".equals(group) ? WORKER_COLOUR
                      : null;
        if (colour != null) {
            Map<String, Object> s = c.getStyleJson() == null
                    ? new HashMap<>() : new HashMap<>(c.getStyleJson());
            s.remove("borderBottomWidth");
            s.remove("borderBottomStyle");
            s.remove("borderBottomColor");
            // 2px and per-side, because the client DTO injects borderTopWidth/Right/Bottom/Left
            // = 1px defaults; setting only the shorthand leaves those longhands to win and the
            // frame reads as a hairline. The paper's frames are heavy and unmistakably coloured.
            s.put("borderStyle", "solid");
            s.put("borderWidth", "2px");
            s.put("borderColor", colour);
            s.put("borderTopWidth", "2px");
            s.put("borderRightWidth", "2px");
            s.put("borderBottomWidth", "2px");
            s.put("borderLeftWidth", "2px");
            s.put("borderTopColor", colour);
            s.put("borderRightColor", colour);
            s.put("borderBottomColor", colour);
            s.put("borderLeftColor", colour);
            c.setStyleJson(s);
        }
        return c;
    }

    // ========== HOT WORK PERMIT (2 pages) ==========

    /**
     * Hot Work Permit, transcribed from the current paper form (2 pages, portrait).
     *
     * <p>Bindings were verified against {@code HotWorkDto.toFormFields()} — the renderer resolves
     * {@code content.name} against that output, not against the entity. Cells with no backing
     * field are emitted as unbound ruled blanks rather than {@code field()} containers, because a
     * bound control whose path does not resolve silently discards whatever is typed into it.
     *
     * <p>The Y/NA checklist is two columns on paper but {@code HotWorkMeasures} is 12 plain
     * booleans, so the Y column binds and the NA column prints as an empty hand-marked box.
     */
    private PrintableForm seedHotWorkForm(String name) {
        PrintableForm form = createForm(name, "HotWork");
        seedHotWorkPage1(form);
        seedHotWorkPage2(form);
        PrintableForm saved = printableFormService.save(form);
        log.info("Seeded HotWork paper form (2 pages): {}", name);
        return saved;
    }

    private void seedHotWorkPage1(PrintableForm form) {
        int p = 1;
        int y = M;
        String GH = "frozen:header";
        String GI = "issuer";      // teal on the paper: filled by the permit issuer
        String GW = "ops:worker";  // purple on the paper: filled by the performer / fire watch

        form.addFormContainer(text(M, y + 4, 60, 18, "Permit #:", p, bold(9)));
        form.addFormContainer(gid(field(M + 62, y + 4, 190, 18, "permitNumber", "text", p), GH));
        form.addFormContainer(text(300, y, 260, 24, "HOT WORK PERMIT", p, merge(bold(16), centered())));
        form.addFormContainer(text(576, y + 4, 220, 16, "Permit Is Valid for One Shift Only", p,
                merge(bold(9), Map.of("color", "#cc0000", "textDecoration", "underline"))));
        y += 26;

        form.addFormContainer(text(M, y, 70, 20, "Location:", p, merge(small(), bold(9))));
        form.addFormContainer(gid(field(M + 72, y, 500, 20, "location", "text", p), GI));
        form.addFormContainer(text(600, y, 40, 20, "Date", p, merge(small(), bold(9))));
        form.addFormContainer(gid(field(642, y, 154, 20, "date", "date", p), GI));
        y += 24;

        // Work Type - new in the 2026-08-27 revision. "Griding" is the spelling on the paper.
        form.addFormContainer(text(M, y, 80, 20, "Work Type:", p, merge(small(), bold(9))));
        int wx = M + 84;
        String[][] wt = {{"welding", "Welding"}, {"griding", "Griding"}, {"cutting", "Cutting"},
                         {"brazing", "Brazing"}};
        for (String[] t : wt) {
            form.addFormContainer(gid(field(wx, y, TICK_BOX, TICK_BOX, "workType." + t[0], "checkbox", p), GI));
            form.addFormContainer(text(wx + TICK_GAP, y + 2, 62, 18, t[1], p, small()));
            wx += 92;
        }
        form.addFormContainer(gid(field(wx, y, TICK_BOX, TICK_BOX, "workType.other", "checkbox", p), GI));
        form.addFormContainer(text(wx + TICK_GAP, y + 2, 40, 18, "Other", p, small()));
        int otherX = wx + TICK_GAP + 44;
        form.addFormContainer(gid(field(otherX, y, 796 - otherX, TICK_BOX,
                "workType.otherDescription", "text", p), GI));
        y += 26;

        y = sectionBar(form, "HOT WORK PERMIT CHECKLIST", y, p);
        form.addFormContainer(text(M + 4 + FRAME, y, TICK, 14, "Y", p, merge(bold(9), centered())));
        form.addFormContainer(text(M + 4 + FRAME + RADIO_PITCH, y, TICK, 14, "NA", p,
                merge(bold(9), centered())));
        y += 16;

        String[][] checklist = {
            {"measures.flammablesAreSecured", "Remove, cover, or otherwise protect all flammable and combustible materials in area. (35 feet from work area)"},
            {"measures.radiativeHeatPreventiveMeasuresAreTaken", "Walls, roofs, ceilings, pipes, tanks and partitions assessed for conductive or radiated heat and preventive measures taken."},
            {"measures.vesselsArePurged", "Piping/vessels are purged or inerted."},
            {"measures.openingsAreCovered", "Openings in floors or walls covered to contain sparks and hot slag."},
            {"measures.ductVentilationIsSecured", "Ductwork shutdown or otherwise protected to prevent causing a fire at a distant location."},
            {"measures.lockOutIsCompleted", "Necessary equipment de-energized and locked out of service per LOTO requirements."},
            {"measures.communicationIsEstablished", "Communications checked in the area for use in emergency (phones, radios)"},
            {"measures.fireWatchIsAwareOfDuties", "Fire Watch is aware of their duties, is fire extinguisher trained, knows location of fire extinguishers, and emergency procedures"},
            {"measures.fireExtinguisherPresent", "The fire extinguisher immediately available and the backup have been inspected and are suitable for use."},
        };
        for (String[] item : checklist) {
            form.addFormContainer(gid(field(M + 4, y, RADIO_W, RADIO_H, item[0], "radio", p), GI));
            form.addFormContainer(text(M + 70, y, FW - 70, RADIO_H, item[1], p,
                    merge(small(), Map.of("whiteSpace", "normal"))));
            y += 24;
        }
        y += 6;

        int fpTealX = M, fpTealW = 290;
        int fpRedX = M + 292, fpRedW = 290;          // ends at 602, clear of the Date/Time label
        int fpDtX = 606, fpDtW = 76;
        form.addFormContainer(text(fpTealX, y, fpTealW, 22, "Fire Protection System in service", p,
                merge(bold(10), merge(centered(), merge(boxed(),
                        Map.of("backgroundColor", ISSUER_COLOUR, "color", "white"))))));
        form.addFormContainer(text(fpRedX, y, fpRedW, 22, "Fire Protection System NOT in service", p,
                merge(bold(10), merge(centered(), merge(boxed(),
                        Map.of("backgroundColor", "#b32017", "color", "white"))))));
        form.addFormContainer(text(fpDtX, y, fpDtW, 22, "Date/Time:", p, merge(bold(9), boxed())));
        form.addFormContainer(gid(field(fpDtX + fpDtW + 2, y, 796 - (fpDtX + fpDtW + 2), 22,
                "fireProtectionApprovalDateTime", "date", p), GI));
        // Two independently positioned boxes, one centred under each bar - a single radio pair
        // cannot straddle 290px of header.
        form.addFormContainer(gid(field(fpTealX + fpTealW / 2 - TICK_BOX / 2, y + 24, TICK_BOX, TICK_BOX,
                "fireProtectionInService", "checkbox", p), GI));
        form.addFormContainer(gid(field(fpRedX + 8, y + 24, TICK_BOX, TICK_BOX,
                "fireProtectionNotInService", "checkbox", p), GI));
        form.addFormContainer(text(fpRedX + 26, y + 24, fpRedW - 26, 20,
                "Hot work approved(Plant Manager or designee)", p,
                merge(bold(8), merge(centered(), Map.of("color", "#b32017")))));
        y += 50;

        y = sectionBar(form, "INITIAL AIR TEST", y, p);
        form.addFormContainer(text(M, y, 46, 20, "Model:", p, merge(small(), bold(9))));
        form.addFormContainer(gid(field(M + 48, y, 120, 20, "meterModel", "text", p), GI));
        form.addFormContainer(text(M + 172, y, 48, 20, "Serial #", p, merge(small(), bold(9))));
        form.addFormContainer(gid(field(M + 222, y, 84, 20, "meterNum", "text", p), GI));
        form.addFormContainer(text(M + 310, y, 52, 20, "Cal Date", p, merge(small(), bold(9))));
        form.addFormContainer(gid(field(M + 364, y, 104, 20, "meterCalDate", "date", p), GI));
        form.addFormContainer(text(M + 472, y, 36, 20, "Time:", p, merge(small(), bold(9))));
        form.addFormContainer(gid(field(M + 510, y, 62, 20, "timeOfInitialTest", "text", p), GI));
        form.addFormContainer(text(M + 600, y, 46, 20, "Initials:", p, merge(small(), bold(9))));
        form.addFormContainer(gid(field(M + 648, y, 46, 20, "initialTestInitials", "text", p), GI));
        form.addFormContainer(text(M + 698, y, 40, 20, "LEL", p, merge(small(), bold(9))));
        form.addFormContainer(gid(field(M + 738, y, 38, 20, "initialTestResult", "text", p), GI));
        y += 26;

        y = sectionBar(form, "HOT WORK REQUIREMENTS AND APPROVAL SECTION", y, p);
        form.addFormContainer(text(M, y, FW, 18,
                "Note: For open flame winter thawing activities, a fire watch is NOT required. See procedure for requirements.",
                p, merge(bold(9), merge(centered(), Map.of("backgroundColor", "#d9d9d9")))));
        y += 22;
        form.addFormContainer(text(M, y, FW, 16, "CONTINOUS AIR MONITORIN IS MANDATORY", p,
                merge(bold(9), merge(centered(), Map.of("color", "#cc0000")))));
        y += 18;

        int[] cw = {180, 110, 160, 200};
        String[] chdr = {"Model:", "Serial #", "Cal Date", "Logged On Conf. Space Perm."};
        int cx = M;
        for (int i = 0; i < chdr.length; i++) {
            form.addFormContainer(text(cx, y, cw[i], 18, chdr[i], p,
                    merge(bold(8), merge(centered(), merge(boxed(),
                            Map.of("backgroundColor", "#0f7d7d", "color", "white"))))));
            cx += cw[i];
        }
        int fwX = cx;
        int fwW = FW - (cx - M);
        form.addFormContainer(text(fwX, y - 14, fwW, 14, "Fire Watch", p,
                merge(bold(8), centered())));
        int subW = fwW / 3;
        String[] fwLabels = {"1 Hour", "30 Min", "Not Required"};
        for (int i = 0; i < 3; i++) {
            form.addFormContainer(text(fwX + i * subW, y, subW, 18, fwLabels[i], p,
                    merge(bold(8), merge(centered(), merge(boxed(),
                            Map.of("backgroundColor", "#0f7d7d", "color", "white"))))));
        }
        y += 18;
        cx = M;
        form.addFormContainer(gid(field(cx, y, cw[0], 22, "contMeterModel", "text", p), GI)); cx += cw[0];
        form.addFormContainer(gid(field(cx, y, cw[1], 22, "contMeterNum", "text", p), GI)); cx += cw[1];
        form.addFormContainer(gid(field(cx, y, cw[2], 22, "contMeterCalDate", "date", p), GI)); cx += cw[2];
        form.addFormContainer(gid(field(cx + cw[3] / 2 - TICK_BOX / 2, y + 2, TICK_BOX, TICK_BOX,
                "isAirMonitoringRegisteredOnConfinedSpace", "checkbox", p), GI));
        cx += cw[3];
        // Three independently positioned checkboxes, one under each printed column header.
        String[] fwKeys = {"fireWatch1Hour", "fireWatch30Min", "fireWatchNotRequired"};
        for (int i = 0; i < 3; i++) {
            form.addFormContainer(gid(field(fwX + i * subW + subW / 2 - TICK_BOX / 2, y + 2, TICK_BOX, TICK_BOX,
                    fwKeys[i], "checkbox", p), GI));
        }
        y += 28;

        form.addFormContainer(text(M, y, 160, 20, "Person Performing Work:", p, merge(small(), bold(9))));
        form.addFormContainer(gid(field(M + 162, y, 280, 20, "foreman", "text", p), GW));
        form.addFormContainer(text(M + 448, y, 110, 20, "Fire Watch Name", p, merge(small(), bold(9))));
        form.addFormContainer(gid(field(M + 560, y, FW - 560, 20, "fireWatch", "text", p), GW));
        y += 24;
        form.addFormContainer(text(M, y, 120, 20, "Special Instructions:", p, merge(small(), bold(9))));
        form.addFormContainer(gid(field(M + 122, y, FW - 122, 20, "specialInstructions", "textarea", p), GI));
        y += 24;
        form.addFormContainer(text(M, y, 290, 20, "Hot Work Permit Approved (Issuer Signature):", p, bold(9)));
        form.addFormContainer(gid(field(M + 292, y, 250, 20, "issuerSignature", "text", p), GI));
        form.addFormContainer(text(566, y, 40, 20, "Date:", p, bold(9)));
        form.addFormContainer(gid(field(608, y, 90, 20, "approvedDate", "date", p), GI));
        form.addFormContainer(text(702, y, 40, 20, "Time:", p, bold(9)));
        form.addFormContainer(gid(field(744, y, 52, 20, "approvedTime", "text", p), GI));
        y += 26;

        form.addFormContainer(text(M, y, FW, 20, "ACTIVE HOT WORK SECTION", p,
                merge(bold(11), merge(centered(), Map.of("backgroundColor", "#ffff00")))));
        y += 24;
        form.addFormContainer(text(M, y, 160, 20, "ACTUAL HOT WORK", p, bold(10)));
        form.addFormContainer(text(M + 170, y, 90, 20, "Start Time", p, bold(9)));
        form.addFormContainer(gid(field(M + 262, y, 90, 20, "actualStartTime", "text", p), GW));
        form.addFormContainer(text(M + 380, y, 80, 20, "End Time", p, bold(9)));
        form.addFormContainer(gid(field(M + 462, y, 90, 20, "actualEndTime", "text", p), GW));
        y += 26;

        y = sectionBar(form, "HOT WORK PERMIT CANCELLATION AND MONITORING SECTION", y, p);
        form.addFormContainer(text(M, y, FW, 18,
                "Fire Watch/Fire Monitoring (as required by the table below) have been completed and all ignition sources have been extinguished.",
                p, merge(small(), centered())));
        y += 22;

        y = signatureRow(form, y, p, "Requestor Name", "cancelRequestorName",
                "cancelRequestorSignature", "cancelRequestorDate", "cancelRequestorTime", GW);
        y = signatureRow(form, y, p, "FireWatch Name", "cancelFireWatchName",
                "cancelFireWatchSignature", "cancelFireWatchDate", "cancelFireWatchTime", GW);

        form.addFormContainer(text(M, y, FW, 18, "Fire Monitoring Method", p, merge(bold(9), centered())));
        y += 20;
        form.addFormContainer(gid(field(M, y, FW, 22, "fireMonitoringMethod", "text", p), GI));
        y += 26;
        y = signatureRow(form, y, p, "Fire Monitor Name", "fireMonitorName",
                "fireMonitorSignature", "fireMonitorDate", "fireMonitorTime", GI);

        form.addFormContainer(gid(field(M, y, TICK_BOX, TICK_BOX, "workCompleted", "checkbox", p), GW));
        form.addFormContainer(text(M + TICK_GAP, y + 2, FW - TICK_GAP, 18,
                "The Hot Work is completed; the area has been inspected and this permit is closed out.", p, small()));
        y += 22;
        form.addFormContainer(text(M, y, 190, 20, "Hot Work Permit Cancelled:", p, bold(9)));
        form.addFormContainer(gid(field(M + 192, y, 340, 20, "cancelledBy", "text", p), GI));
        form.addFormContainer(text(566, y, 40, 20, "Date:", p, bold(9)));
        form.addFormContainer(gid(field(608, y, 90, 20, "cancelledDate", "date", p), GI));
        form.addFormContainer(text(702, y, 40, 20, "Time:", p, bold(9)));
        form.addFormContainer(gid(field(744, y, 52, 20, "cancelledTime", "text", p), GI));
        y += 26;

        form.addFormContainer(text(M, y, 20, 16, "", p, merge(boxed(), Map.of("backgroundColor", "#0f7d7d"))));
        form.addFormContainer(text(M + 26, y, 300, 16, "Fields filled by the permit issuer.", p, small()));
        y += 18;
        form.addFormContainer(text(M, y, 20, 16, "", p, merge(boxed(), Map.of("backgroundColor", "#7d0f7d"))));
        form.addFormContainer(text(M + 26, y, 420, 16,
                "Fields filled by person performing work and/or Fire Watch.", p, small()));
        y += 20;
        form.addFormContainer(text(M, y, FW, 16,
                "Post Copy at Location - Keep Original in Control Room - Upon Completion, File Original in Binder, Copy May be Destroyed.",
                p, merge(small(), centered())));
    }

    /** name + signature + date + time — the repeated shape in the cancellation section. */
    private int signatureRow(PrintableForm form, int y, int page, String label, String nameKey,
                             String sigKey, String dateKey, String timeKey, String group) {
        form.addFormContainer(text(M, y, 130, 20, label, page, bold(9)));
        form.addFormContainer(gid(field(M + 132, y, 190, 20, nameKey, "text", page), group));
        form.addFormContainer(text(M + 326, y, 70, 20, "Signature", page, bold(9)));
        form.addFormContainer(gid(field(M + 398, y, 180, 20, sigKey, "text", page), group));
        form.addFormContainer(text(M + 582, y, 40, 20, "Date:", page, bold(9)));
        form.addFormContainer(gid(field(M + 624, y, 80, 20, dateKey, "date", page), group));
        form.addFormContainer(text(M + 708, y, 36, 20, "Time:", page, bold(9)));
        form.addFormContainer(gid(field(M + 744, y, 32, 20, timeKey, "text", page), group));
        return y + 24;
    }

    /**
     * Page 2 of the 2026-08-27 revision is purely static reference — the four fire-monitor
     * Time/Reading blocks that used to live here are gone from the paper form.
     */
    private void seedHotWorkPage2(PrintableForm form) {
        int p = 2;
        int y = M + 40;

        form.addFormContainer(text(M, y, FW, 22,
                "Construction and Occupancy Factors for Post-Work Fire Watch and Monitoring Periods", p,
                merge(bold(12), centered())));
        y += 34;

        int railW = 26;
        int labelX = M + railW;
        int labelW = 250;
        int gridX = labelX + labelW;
        int colW = (FW - railW - labelW) / 6;

        form.addFormContainer(text(gridX, y, colW * 6, 22, "Construction Factors", p,
                merge(bold(11), merge(centered(), merge(boxed(),
                        Map.of("backgroundColor", "#000000", "color", "white"))))));
        y += 22;

        String[] groups = {
            "Noncombustible construction, or Class 1, or Class A building materials",
            "Combustible construction without concealed cavities",
            "Combustible construction with unprotected concealed cavities",
        };
        for (int g = 0; g < 3; g++) {
            form.addFormContainer(text(gridX + g * colW * 2, y, colW * 2, 56, groups[g], p,
                    merge(small(), merge(boxed(), Map.of("whiteSpace", "normal")))));
        }
        y += 56;
        for (int g = 0; g < 3; g++) {
            form.addFormContainer(text(gridX + g * colW * 2, y, colW, 20, "Watch", p,
                    merge(bold(9), merge(boxed(), centered()))));
            form.addFormContainer(text(gridX + g * colW * 2 + colW, y, colW, 20, "Monitor", p,
                    merge(bold(9), merge(boxed(), centered()))));
        }
        int gridTop = y;
        y += 20;

        String[][] rows = {
            {"Noncombustible with any combustibles contained within closed equipment (e.g., ignitable liquid within piping)",
             "30 minutes", "0 hours", "1 hour", "3 hours", "1 hour", "5 hours", "62"},
            {"Office, retail or manufacturing with limited combustible loading",
             "1 hour", "1 hour", "1 hour", "3 hours", "1 hour", "5 hours", "44"},
            {"Manufacturing with moderate combustible loading",
             "1 hour", "2 hours", "1 hour", "3 hours", "1 hour", "5 hours", "34"},
            {"Warehousing", "1 hour", "2 hours", "1 hour", "3 hours", "1 hour", "5 hours", "26"},
            {"Exceptions: Occupancies with processing or having bulk storage of combustible materials capable of "
                + "supporting slow-growing fires (e.g., paper, pulp, textile fibers, wood, bark, grain, coal or charcoal)",
             "1 hour", "3 hours", "1 hour", "3 hours", "1 hour", "5 hours", "96"},
        };
        for (String[] row : rows) {
            int h = Integer.parseInt(row[7]);
            form.addFormContainer(text(labelX, y, labelW, h, row[0], p,
                    merge(small(), merge(boxed(), Map.of("whiteSpace", "normal")))));
            for (int c = 0; c < 6; c++) {
                form.addFormContainer(text(gridX + c * colW, y, colW, h, row[c + 1], p,
                        merge(small(), merge(boxed(), centered()))));
            }
            y += h;
        }
        form.addFormContainer(text(M, gridTop, railW, y - gridTop, "Occupancy Factors", p,
                merge(bold(9), merge(boxed(), merge(centered(),
                        Map.of("backgroundColor", "#000000", "color", "white",
                               "writingMode", "vertical-rl", "transform", "rotate(180deg)"))))));
        y += 16;

        form.addFormContainer(text(M, y, 90, 18, "Definitions:", p, bold(10)));
        y += 20;
        form.addFormContainer(text(M, y, FW, 32,
                "Fire Monitor - Provisions implemented to provide early warning of smoldering fire conditions in the hot work "
                        + "area following completion of the established fire watch time period.",
                p, merge(small(), Map.of("whiteSpace", "normal"))));
        y += 36;
        form.addFormContainer(text(M, y, FW, 32,
                "Fire Watch - A person or persons responsible for continuously observing the hot work area, maintaining "
                        + "fire-safe conditions, and responding to emergencies during hot work operations and in the established period following.",
                p, merge(small(), Map.of("whiteSpace", "normal"))));
    }

    // ---- small layout helpers used by the Hot Work layout ----

    /** Full-width inverted section bar. Returns the new y cursor. */
    private int sectionBar(PrintableForm form, String label, int y, int page) {
        form.addFormContainer(text(M, y, FW, 20, label, page,
                merge(bold(11), merge(centered(), Map.of("backgroundColor", "#000000", "color", "white")))));
        return y + 24;
    }

    /** An empty bordered square — a checkbox the operator marks by hand (no backing field). */
    private FormContainer box(int x, int y, int size, int page) {
        return box(x, y, size, size, page);
    }

    private FormContainer box(int x, int y, int w, int h, int page) {
        Map<String, Object> s = new HashMap<>(paperStyle());
        s.put("borderStyle", "solid");
        s.put("borderWidth", "1px");
        s.put("borderColor", "black");
        return text(x, y, w, h, "", page, s);
    }

    /** A ruled blank line — signature or hand-written value with no backing field. */
    private FormContainer blank(int x, int y, int w, int h, int page) {
        return text(x, y, w, h, "", page, underlineStyle());
    }

    private Map<String, Object> small() {
        return new HashMap<>(Map.of("fontSize", "9px"));
    }

    /** Thin cell border, for grid/table cells. */
    private Map<String, Object> boxed() {
        return new HashMap<>(Map.of(
                "borderStyle", "solid", "borderWidth", "1px", "borderColor", "black"));
    }

    /** Right-biased merge of two style maps (both may be immutable). */
    private Map<String, Object> merge(Map<String, Object> a, Map<String, Object> b) {
        Map<String, Object> out = new HashMap<>(a);
        out.putAll(b);
        return out;
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
        return stack(c);
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
        return stack(c);
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

    /**
     * Centres a container's content.
     *
     * <p>NOT {@code textAlign}. The container div is {@code display:flex} and the inner
     * {@code .content-display} div has no width at top level, so it shrink-wraps its text and
     * {@code textAlign} has nothing to centre within — every centred header the seeder ever wrote
     * printed left-aligned. Designer-authored forms use {@code justifyContent}, which is why they
     * look right; the DB shows the split cleanly (seeded forms: 28 textAlign / 0 justifyContent,
     * designer forms: 0 / 267).
     */
    private Map<String, Object> centered() {
        return Map.of("justifyContent", "center", "alignItems", "center");
    }

    /** Nested form field container (for use inside nestedForm definitions) */
    private Map<String, Object> nField(int id, int x, int y, int w, int h, String name, String type) {
        return nField(id, x, y, w, h, name, type, null);
    }

    /** Nested form field container with style (for use inside nestedForm definitions) */
    private Map<String, Object> nField(int id, int x, int y, int w, int h, String name, String type, Map<String, Object> style) {
        return Map.ofEntries(
            Map.entry("id", id),
            Map.entry("contentType", "formField"),
            Map.entry("content", Map.of("name", name, "type", type)),
            Map.entry("position", Map.of("x", x, "y", y)),
            Map.entry("size", Map.of("width", w, "height", h)),
            Map.entry("pageNumber", 1),
            Map.entry("style", style != null ? style : Map.of())
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
