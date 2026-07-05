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
        log.info("[MaximoForms] seeded {} procedure form(s)", out.size());
        return out;
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

    /** Load a seed reference photo from the classpath and return it as a base64 data URL (null if missing). */
    private String img(String fileName) {
        try (InputStream in = new ClassPathResource("procedures/sand-filter/" + fileName).getInputStream()) {
            byte[] bytes = in.readAllBytes();
            return "data:image/jpeg;base64," + Base64.getEncoder().encodeToString(bytes);
        } catch (Exception e) {
            log.warn("[MaximoForms] seed image {} missing: {}", fileName, e.getMessage());
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
