package com.dk_power.power_plant_java.sevice.maximo;

import com.dk_power.power_plant_java.dto.maximo.MaximoFormTemplateDto;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Service;

import java.io.InputStream;
import java.util.ArrayList;
import java.util.Base64;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Seeds curated electronic task-form templates from the plant's paper procedures (in {@code procedures/}).
 * Each seed is an upsert by {@code formKey} (idempotent — re-seeding refreshes the fields without duplicating).
 * Triggered from the Form Builder's "Seed procedure forms" button.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class MaximoFormSeeder {

    private final MaximoFormService formService;
    private final ObjectMapper objectMapper;

    /** Seed all curated procedure forms; returns the saved templates. */
    public List<MaximoFormTemplateDto> seedProcedureForms() {
        List<MaximoFormTemplateDto> out = new ArrayList<>();
        out.add(formService.saveTemplate(roSandFilterBackflush()));
        out.add(formService.saveTemplate(emergencyEyewashSafetyShower()));
        out.add(formService.saveTemplate(monthlyAedCheck()));
        log.info("[MaximoForms] seeded {} procedure form(s)", out.size());
        return out;
    }

    /**
     * From procedures/pm/AED.pdf — "Monthly AED Check". The plant has four AEDs; this PM walks the
     * inspector through all four locations in order (Admin Building → U1 Turbine Building → U1 HRSG →
     * U2 HRSG). Each location repeats the same 5 external/internal indicator checks, and every check is
     * REQUIRED — so the work order cannot be completed until all four AEDs have been inspected.
     */
    private MaximoFormTemplateDto monthlyAedCheck() {
        Fields f = new Fields();

        // Shared indicator reference (embedded once at the top — not per location, to keep the form lean).
        f.section("Reference — how to read the AED indicators")
                .image("ref_external", "EXTERNAL: the Rescue-Ready STATUS light (should be GREEN) and the Pad "
                        + "Expiration window.", img("aed", "external-indicators.png"))
                .image("ref_internal", "INTERNAL: battery-capacity LEDs (adequate charge); Service indicator "
                        + "(wrench — must be OFF); Pad-connection indicator (must be OFF).",
                        img("aed", "internal-indicators.png"));

        // The four AED locations, walked in order. Same checklist per location; all checks required.
        String[][] locations = {
                {"1. Admin Building", "admin"},
                {"2. U1 Turbine Building", "u1turb"},
                {"3. U1 HRSG", "u1hrsg"},
                {"4. U2 HRSG", "u2hrsg"},
        };
        for (String[] loc : locations) {
            String title = loc[0];
            String p = loc[1];
            f.section(title)
                    .radio(p + "_status_green", "External — Status / Rescue-Ready indicator is GREEN", true, "Yes", "No")
                    .radio(p + "_not_expired", "External — Pads & battery NOT expired "
                            + "(order a replacement 2 months before the expiration date)", true, "Yes", "No")
                    .radio(p + "_charge_ok", "Internal — Adequate charge (battery LEDs)", true, "Yes", "No")
                    .radio(p + "_service_off", "Internal — Service indicator (wrench) is OFF", true, "Yes", "No")
                    .radio(p + "_padconn_off", "Internal — Pad-connection indicator is OFF", true, "Yes", "No")
                    .textarea(p + "_findings", "Findings — describe any 'No' answer (reference the user manual "
                            + "for abnormal indicators); leave blank if all good", null);
        }

        f.section("Sign-off")
                .number("time_on_task", "Time on task", "hrs", "laborhours")
                .textarea("notes", "Overall notes / actions taken (batteries or pads ordered, WOs generated, etc.)", "worklog");

        return MaximoFormTemplateDto.builder()
                .formKey("MONTHLY_AED_CHECK")
                .formName("Monthly AED Check")
                .description("Monthly inspection of all four plant AEDs, in order: Admin Building, U1 Turbine Building, "
                        + "U1 HRSG, U2 HRSG. For each: Status/Rescue-Ready indicator GREEN; pads & battery not expired "
                        + "(order replacements 2 months early); adequate charge; Service indicator OFF; Pad-connection "
                        + "indicator OFF. Every check is required — the work order cannot be completed until all four "
                        + "AEDs have been inspected. Note any abnormal indicator and reference the AED user manual.")
                .matchDescriptionContains("aed")
                .active(true)
                .fieldsJson(toJson(f.build()))
                .build();
    }

    /** From procedures/pm/sand-filter-backflush.pdf — "RO Sand Filter Operation/Backflush". */
    private MaximoFormTemplateDto roSandFilterBackflush() {
        Fields f = new Fields();

        f.section("Preparation")
                .image("img_valves", "Sand filter valves: TOP row = inlets, BOTTOM = outlets (both stay OPEN). "
                        + "Inlet VSWS-001JG, outlet VSWS-002JG, bypass VSWS-003JG (stays CLOSED).", img("valves.jpg"))
                .checkbox("ros_hand_off", "RO's put in HAND OFF (before backflush)", true)
                .checkbox("sump_checked", "Sump level checked - room to dump dirty water (~2 ft per vessel)", true)
                .radio("inlet_valve_open", "Inlet valve VSWS-001JG OPEN", true, "OK", "Not OK")
                .radio("outlet_valve_open", "Outlet valve VSWS-002JG OPEN", true, "OK", "Not OK")
                .radio("bypass_valve_closed", "Bypass valve VSWS-003JG CLOSED", true, "OK", "Not OK")
                .image("img_reject", "Trailer reject line valve 00-VDWT603 - normally CLOSED; OPEN while backflushing.",
                        img("reject-valve.jpg"))
                .checkbox("reject_line_open", "Trailer reject line valve 00-VDWT603 OPENED", false);

        f.section("Readings (max 100 psi; DP triggers backflush at 10 psi)")
                .image("img_gauges", "Gauges: LEFT = inlet, RIGHT = outlet. Pressure must NEVER exceed 100 psi.",
                        img("gauges.jpg"))
                .number("inlet_pressure", "Inlet gauge pressure", "psi", "reading")
                .number("outlet_pressure", "Outlet gauge pressure", "psi", "reading")
                .number("dp", "Differential pressure (DP)", "psi", "reading");

        f.section("Backflush controls")
                .image("img_solenoids", "Vessel solenoids: quarter-turn to ON (each labeled per vessel). "
                        + "CAUTION: the hose SLAMS with water when flipped ON - be aware of the force.", img("solenoids.jpg"))
                .image("img_flow_valve", "Upper valve: adjust to hold ~240-250 GPM during backflush.", img("flow-valve.jpg"))
                .image("img_flow_meter", "Flow meter (SW side of the inlet line): read GPM here.", img("flow-meter.jpg"));

        // One vessel at a time - hold 240-250 GPM, >=10 min each (40 min total).
        for (int i = 1; i <= 4; i++) {
            f.section("Backflush - Vessel " + i)
                    .checkbox("vessel" + i + "_done", "Vessel " + i + " backflushed (>= 10 min)", false)
                    .number("vessel" + i + "_minutes", "Vessel " + i + " backflush duration", "min", "reading")
                    .number("vessel" + i + "_gpm", "Vessel " + i + " flow rate (240-250)", "GPM", "reading")
                    .radio("vessel" + i + "_clear", "Vessel " + i + " water clear", false, "Clear", "Not clear");
        }

        f.section("Return to normal")
                .checkbox("valves_normal", "All valves and solenoids returned to normal positions", true)
                .checkbox("reject_line_closed", "Trailer reject line valve 00-VDWT603 CLOSED", true)
                .checkbox("ros_auto", "RO's returned to AUTO", true);

        f.section("Sign-off")
                .number("time_on_task", "Time on task", "hrs", "laborhours")
                .textarea("notes", "Notes / observations", "worklog");

        return MaximoFormTemplateDto.builder()
                .formKey("RO_SAND_FILTER_BACKFLUSH")
                .formName("RO Sand Filter Operation / Backflush")
                .description("Backflush the RO sand filter vessels. ONE VESSEL AT A TIME; hold ~240-250 GPM; "
                        + ">=10 min per vessel (40 min total). Inlet/outlet valves stay open throughout. "
                        + "CAUTION: hose slams when a solenoid is flipped ON - be aware of the force.")
                .matchDescriptionContains("sand filter")
                .active(true)
                .fieldsJson(toJson(f.build()))
                .build();
    }

    /** From procedures/pm/safety shower.pdf — SMP-06 "Emergency Eyewash & Safety Shower Inspection" (Appendix C). */
    private MaximoFormTemplateDto emergencyEyewashSafetyShower() {
        Fields f = new Fields();

        f.section("Procedure checks (weekly, steps 1-9)")
                .radio("s1_clear", "1. Area around unit clear of obstructions / sharp objects", true, "OK", "Not OK")
                .radio("s2_lit", "2. Area is well lighted", true, "OK", "Not OK")
                .radio("s3_sign", "3. Emergency eyewash/shower sign present & visible", true, "OK", "Not OK")
                .radio("s4_flush", "4. Flushed plumbed unit; valve opens in 1 sec & stays open", true, "OK", "Not OK")
                .radio("s5_eyewash", "5. Both eyewash nozzles operate; both eyes flush; pressure will not damage eyes", true, "OK", "Not OK")
                .radio("s6_caps", "6. Eyewash nozzles protected from airborne contaminants (caps in place)", true, "OK", "Not OK")
                .radio("s7_portable", "7. Portable units full, additive per mfr (6mo); pressurized units at proper pressure", true, "OK", "Not OK", "N/A")
                .radio("s8_discrepancies", "8. Discrepancies documented & communicated to shift supervisor (WOs generated)", true, "OK", "None")
                .radio("s9_alarm", "9. Flow-switch alarm comes into control room", true, "OK", "Not OK");

        f.section("Annual measurements (step 10) - ANSI Z358.1")
                .number("shower_pattern_in", "Shower flushing-pattern diameter (min 20)", "in", "reading")
                .number("shower_gpm", "Shower delivery (min 20 gpm / 75.7 L/min)", "gpm", "reading")
                .number("eyewash_gpm", "Eyewash flow (min 0.4 gpm / 1.5 L/min)", "gpm", "reading");

        String[] locations = {
                "Water Treatment Building", "Unit 2 Outside TCP", "Unit 2 SCR Skid", "Unit 2 Chemical Shack",
                "Unit 2 Sample Panel", "Aqueous Ammonia Storage Tank Area East", "Aqueous Ammonia Storage Tank Area West",
                "Aux Boiler Building", "Unit 2 Calcite Filter Platform", "Medium Voltage Enclosure South",
                "Medium Voltage Enclosure North", "Unit 1 Outside TCP", "Unit 1 SCR Skid", "Unit 1 Chemical Shack",
                "Unit 1 Sample Panel", "Unit 1 Calcite Filter Platform", "Switch Yard Enclosure"
        };
        f.section("Units - inspect each (17 locations)");
        for (int i = 0; i < locations.length; i++) {
            int n = i + 1;
            f.radio("unit" + n + "_ok", n + ". " + locations[i], false, "OK", "Not OK", "N/A")
                    .text("unit" + n + "_comments", n + ". Comments");
        }

        f.section("Sign-off")
                .textarea("discrepancies", "Discrepancies & corrective action taken", "worklog")
                .number("time_on_task", "Time on task", "hrs", "laborhours")
                .textarea("notes", "Notes", "worklog");

        return MaximoFormTemplateDto.builder()
                .formKey("EMERGENCY_EYEWASH_SAFETY_SHOWER")
                .formName("Emergency Eyewash & Safety Shower Inspection (SMP-06)")
                .description("Weekly (steps 1-9) / Annual (steps 1-10) inspection per ANSI Z358.1-1998. Verify each of the "
                        + "17 units. Shower: flushing-pattern dia >= 20 in and delivery >= 20 gpm (75.7 L/min). "
                        + "Eyewash: flow >= 0.4 gpm (1.5 L/min). Document discrepancies and notify the shift supervisor "
                        + "to generate work orders for needed corrections.")
                .matchDescriptionContains("safety shower")
                .active(true)
                .fieldsJson(toJson(f.build()))
                .build();
    }

    /** Load a seed reference photo from procedures/sand-filter/ (legacy default dir). */
    private String img(String fileName) {
        return img("sand-filter", fileName);
    }

    /**
     * Load a seed reference image from {@code procedures/<dir>/} on the classpath as a base64 data URL.
     * MIME type is inferred from the extension (png vs jpeg). Returns null (image field then omitted) if
     * the resource is missing, so a missing photo never breaks seeding.
     */
    private String img(String dir, String fileName) {
        try (InputStream in = new ClassPathResource("procedures/" + dir + "/" + fileName).getInputStream()) {
            byte[] bytes = in.readAllBytes();
            String mime = fileName.toLowerCase().endsWith(".png") ? "image/png" : "image/jpeg";
            return "data:" + mime + ";base64," + Base64.getEncoder().encodeToString(bytes);
        } catch (Exception e) {
            log.warn("[MaximoForms] seed image {}/{} missing: {}", dir, fileName, e.getMessage());
            return null;
        }
    }

    private String toJson(List<Map<String, Object>> fields) {
        try {
            return objectMapper.writeValueAsString(fields);
        } catch (Exception e) {
            throw new RuntimeException("Could not serialize seed fields: " + e.getMessage(), e);
        }
    }

    /** Small builder for the JSON field-definition list (matches the frontend MaximoFormFieldDef shape). */
    private static final class Fields {
        private final List<Map<String, Object>> list = new ArrayList<>();
        private String section;

        Fields section(String s) { this.section = s; return this; }

        Fields checkbox(String name, String label, boolean required) { return add(name, label, "checkbox", null, null, required); }
        Fields text(String name, String label) { return add(name, label, "text", null, null, false); }
        Fields textarea(String name, String label, String target) { return add(name, label, "textarea", null, target, false); }
        Fields number(String name, String label, String unit, String target) { return add(name, label, "number", unit, target, false); }

        Fields radio(String name, String label, boolean required, String... options) {
            Map<String, Object> m = base(name, label, "radio-group");
            m.put("options", List.of(options));
            if (required) m.put("required", true);
            list.add(m);
            return this;
        }

        /** Read-only reference photo (caption in the label; base64/URL in imageSrc). No-op if the image is missing. */
        Fields image(String name, String caption, String dataUrl) {
            if (dataUrl == null || dataUrl.isBlank()) return this;
            Map<String, Object> m = base(name, caption, "image");
            m.put("imageSrc", dataUrl);
            list.add(m);
            return this;
        }

        private Fields add(String name, String label, String type, String unit, String target, boolean required) {
            Map<String, Object> m = base(name, label, type);
            if (unit != null) m.put("unit", unit);
            if (target != null) m.put("maximoTarget", target);
            if (required) m.put("required", true);
            list.add(m);
            return this;
        }

        private Map<String, Object> base(String name, String label, String type) {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("name", name);
            m.put("label", label);
            m.put("type", type);
            if (section != null) m.put("section", section);
            return m;
        }

        List<Map<String, Object>> build() { return list; }
    }
}
