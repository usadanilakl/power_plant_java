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
        out.add(formService.saveTemplate(gtInletInspection()));
        out.add(formService.saveTemplate(chemLabInventory()));
        out.add(formService.saveTemplate(dieselFirePumpTest()));
        out.add(formService.saveTemplate(electricFirePumpTest()));
        out.add(formService.saveTemplate(pivAndDelugeValveInspection()));
        out.add(formService.saveTemplate(emergencyDieselGeneratorTest()));
        out.add(formService.saveTemplate(sdiTest()));
        out.add(formService.saveTemplate(roProbeMonthlyPm()));
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

        // Portable (non-plumbed) eyewashes — no flow test; just confirm solution level and cleanliness.
        f.section("Portable eyewashes — TCP battery rooms (not plumbed: check solution level & cleanliness only)")
                .radio("pe_u1_tcp_level", "Unit 1 TCP battery room — solution level", false, "Full", "Low / refill")
                .radio("pe_u1_tcp_clean", "Unit 1 TCP battery room — clean, sealed & uncontaminated", false, "OK", "Not OK")
                .text("pe_u1_tcp_comments", "Unit 1 TCP battery room — comments")
                .radio("pe_u2_tcp_level", "Unit 2 TCP battery room — solution level", false, "Full", "Low / refill")
                .radio("pe_u2_tcp_clean", "Unit 2 TCP battery room — clean, sealed & uncontaminated", false, "OK", "Not OK")
                .text("pe_u2_tcp_comments", "Unit 2 TCP battery room — comments");

        f.section("Sign-off")
                .textarea("discrepancies", "Discrepancies & corrective action taken", "worklog")
                .number("time_on_task", "Time on task", "hrs", "laborhours")
                .textarea("notes", "Notes", "worklog");

        return MaximoFormTemplateDto.builder()
                .formKey("EMERGENCY_EYEWASH_SAFETY_SHOWER")
                .formName("Emergency Eyewash & Safety Shower Inspection (SMP-06)")
                .description("Weekly (steps 1-9) / Annual (steps 1-10) inspection per ANSI Z358.1-1998. Verify each of the "
                        + "17 fixed units plus the 2 portable eyewashes in the Unit 1 / Unit 2 TCP battery rooms (portable "
                        + "units aren't flow-tested — just confirm solution level & cleanliness). Shower: flushing-pattern "
                        + "dia >= 20 in and delivery >= 20 gpm (75.7 L/min). Eyewash: flow >= 0.4 gpm (1.5 L/min). Document "
                        + "discrepancies and notify the shift supervisor to generate work orders for needed corrections.")
                .matchDescriptionContains("safety shower")
                .active(true)
                .fieldsJson(toJson(f.build()))
                .build();
    }

    /**
     * From procedures/pm/gt-inlet.pdf — Camfil GT inlet air filter-house maintenance (M501JAC /
     * OM-CA15354). A single inspection checklist covering the manual's intervals: log the filter
     * differential pressures, then run the monthly visual inspection (required). Six-month and annual
     * checks are on the same form but optional — mark them N/A on a run where they aren't due.
     */
    private MaximoFormTemplateDto gtInletInspection() {
        Fields f = new Fields();

        f.section("Filter differential pressure (log current readings)")
                .number("dp_pulse", "Pulse (pre-)filter DP — max 4.0\" WG / 1000 Pa", "in WG", "reading")
                .number("dp_hepa", "HEPA / fine-filter DP — max 2.4\" WG / 600 Pa", "in WG", "reading");

        f.section("Monthly inspection")
                .radio("m_media", "Filter media — no damage / loose fixtures; correct position & gasket seal; "
                        + "filters similar color & appearance", true, "OK", "Not OK", "N/A")
                .radio("m_gutters", "Rain gutters & drains — no blockage or water accumulation", true, "OK", "Not OK", "N/A")
                .radio("m_doors", "Filter house doors — proper sealing & operation", true, "OK", "Not OK", "N/A")
                .radio("m_birdscreen", "Bird screen at filter-house inlet — no blockage", true, "OK", "Not OK", "N/A")
                .radio("m_flanges", "All flange connections — no damage; tight", true, "OK", "Not OK", "N/A")
                .radio("m_cladding", "External insulation & cladding — no damage", true, "OK", "Not OK", "N/A");

        f.section("Six-month inspection (mark N/A on a monthly run)")
                .radio("s_plenum", "Clean-air plenum — no degradation or moisture build-up", false, "OK", "Not OK", "N/A")
                .radio("s_joints", "Internal gasketed joints — no air/moisture ingress or gasket displacement", false, "OK", "Not OK", "N/A");

        f.section("Annual inspection (mark N/A if not due)")
                .radio("y_corrosion", "All surfaces checked for corrosion; repaired if needed", false, "OK", "Not OK", "N/A");

        f.section("Sign-off")
                .checkbox("filters_replaced", "Filters replaced this visit (3-yr interval, or earlier if needed). "
                        + "Filters are disposable — replace, never clean.", false)
                .textarea("findings", "Findings / corrective action (describe any 'Not OK')", "worklog")
                .number("time_on_task", "Time on task", "hrs", "laborhours")
                .textarea("notes", "Notes", "worklog");

        return MaximoFormTemplateDto.builder()
                .formKey("GT_INLET_INSPECTION")
                .formName("GT Inlet Filter House Inspection")
                .description("Camfil GT inlet air filter-house PM (M501JAC / OM-CA15354). Log filter differential "
                        + "pressure (pulse max 4.0\" WG / 1000 Pa; HEPA max 2.4\" WG / 600 Pa) and complete the monthly "
                        + "inspection: filter media/gaskets, rain gutters & drains, filter-house doors, bird screen, "
                        + "flange connections, and external insulation/cladding. Six-month (clean-air plenum, internal "
                        + "gasketed joints) and annual (corrosion) checks are on the same form — mark N/A when not due. "
                        + "Filters are disposable and cannot be cleaned.")
                .matchDescriptionContains("inlet")
                .active(true)
                .fieldsJson(toJson(f.build()))
                .build();
    }

    /**
     * Chemistry lab reagent & test inventory (from the plant's "Reagent and Test Inventory Order Form"
     * spreadsheet). One card per reagent: In stock (filled monthly) + Target level + Include-in-reorder.
     * A "Reorder settings" section holds the vendor email, CC list, PO number and ship-to — those and the
     * target levels carry forward from the previous run (nothing here is re-typed each month unless changed).
     * Reorder is convention-driven: any field named {@code <key>__instock} makes the form reorder-capable;
     * need = target - in-stock, and included reagents with need &gt; 0 go on the vendor email (see
     * ChemInventoryReorderService). The completed inventory PDF attaches to the WO as usual.
     */
    private MaximoFormTemplateDto chemLabInventory() {
        Fields f = new Fields();

        f.section("Reorder settings (set once - carried forward each month)")
                .text("cfg_email_to", "Vendor email (e.g. orders@hach.com)")
                .text("cfg_email_cc", "CC (comma-separated email addresses)")
                .text("cfg_po_number", "PO number (e.g. J25-3573)")
                .textarea("cfg_ship_to", "Ship-to / billing address", null);

        // {reagent (Hach #), size ; field key ; sheet's target level (guidance only)}
        String[][] reagents = {
                {"Iron", "FerroZine Iron Reagent (230149), 500 mL", "ferrozine", "5"},
                {"Free & Total Chlorine", "DPD Free Chlorine Powder Pillows (2105569), 100 packets", "dpd_free", "5"},
                {"Free & Total Chlorine", "DPD Total Chlorine Powder Pillows (2105669), 100 packets", "dpd_total", "5"},
                {"ULR Silica", "Molybdate 3 Reagent Solution (199532), 100 mL", "molybdate3", "5"},
                {"ULR Silica", "Citric Acid Reagent Solution (2254232), 100 mL", "citric_acid", "5"},
                {"ULR Silica", "Amino Acid F Reagent (2386442), 100 mL", "amino_acid_f", "5"},
                {"Standards", "pH 4.0 Standard (2283449), 500 mL", "ph4", "3"},
                {"Standards", "pH 7.0 Standard (2283549), 500 mL", "ph7", "3"},
                {"Standards", "pH 10.0 Standard (2283649), 500 mL", "ph10", "3"},
                {"Standards", "1000 mS Conductivity Standard (1440026), 500 mL", "cond1000", "2"},
                {"Standards", "1.0 mg/L Iron Standard (13949), 500 mL", "iron_std", "2"},
                {"Standards", "1.0 mg/L Silica Standard (110649), 500 mL", "silica_std", "2"},
                {"pH Storage", "pH Storage Solution (2756549), 500 mL", "ph_storage", "3"},
                {"Silica Analyzer Kits", "Silica Analyzer reagent - Yellow", "kit_yellow", "5"},
                {"Silica Analyzer Kits", "Silica Analyzer reagent - Blue", "kit_blue", "5"},
                {"Silica Analyzer Kits", "Silica Analyzer reagent - Green", "kit_green", "5"},
                {"Silica Analyzer Kits", "Silica Analyzer reagent - Red", "kit_red", "5"},
                {"Silica Analyzer Kits", "Silica Analyzer reagent - Powder", "kit_powder", "5"},
        };
        for (String[] r : reagents) {
            String category = r[0], reagent = r[1], key = r[2], target = r[3];
            // Section header = reagent alone (the reorder email uses it verbatim). Category noted on the field.
            f.section(reagent)
                    .number(key + "__instock", "In stock (" + category + ")", null, null)
                    .number(key + "__desired", "Target level - reorder when stock is below this (sheet: " + target + ")", null, null)
                    .checkbox(key + "__include", "Include in the reorder email", false);
        }

        f.section("Sign-off")
                .number("time_on_task", "Time on task", "hrs", "laborhours")
                .textarea("notes", "Notes", "worklog");

        return MaximoFormTemplateDto.builder()
                .formKey("CHEM_LAB_INVENTORY")
                .formName("Chemistry Lab Reagent & Test Inventory")
                .description("Monthly chemistry-lab reagent & test inventory (Hach order form). Set the reorder "
                        + "settings once (vendor email, CC, PO number, ship-to) and the target level for each reagent - "
                        + "they carry forward each month. Fill in the current in-stock count for every reagent; the "
                        + "completed inventory attaches to the work order as a PDF. Before closing, if any included "
                        + "reagent is below its target the app offers to email the reorder to the vendor and attaches "
                        + "that order summary to the work order.")
                .matchDescriptionContains("inventory")
                .active(true)
                .fieldsJson(toJson(f.build()))
                .build();
    }

    /**
     * From procedures/pm/diesel-fire-pump-test.xlsx — "Diesel Fire Pump Weekly Inspection and Test" (NFPA 25).
     * A no-flow (churn) run: pre-op pump-house and fire-pump checks, diesel-engine checks, then operational
     * readings taken while the pump runs its 30-minute timer. Every verification is required — the WO can't be
     * completed until the full weekly test is recorded; readings capture the run's actual values.
     */
    private MaximoFormTemplateDto dieselFirePumpTest() {
        Fields f = new Fields();

        f.section("Pre-operation — Pump house checks")
                .radio("ph_heat", "Building heat > 40°F", true, "OK", "Not OK")
                .radio("ph_louvers", "Louvers operational", true, "OK", "Not OK")
                .radio("ph_no_water", "No water on floor", true, "OK", "Not OK")
                .radio("ph_coupling_guard", "Coupling guard in place", true, "OK", "Not OK");

        f.section("Pre-operation — Fire pump proper checks")
                .radio("fp_valves_open", "Suction / discharge / bypass valves OPEN", true, "OK", "Not OK")
                .radio("fp_no_leaks", "No leaks in pipes", true, "OK", "Not OK")
                .radio("fp_gauges_ok", "Suction / discharge gauges okay", true, "OK", "Not OK")
                .radio("fp_flowtest_shut", "Water-flow test valves SHUT", true, "OK", "Not OK")
                .radio("fp_hose_shut", "Water-to-hose connection SHUT", true, "OK", "Not OK");

        f.section("Diesel engine checks")
                .radio("de_fuel", "Fuel tank > 2/3 full", true, "OK", "Not OK")
                .radio("de_batt_voltage", "Battery voltages are okay", true, "OK", "Not OK")
                .radio("de_charger_no_alarm", "Battery charger — no alarm lights", true, "OK", "Not OK")
                .radio("de_oil_level", "Oil level is okay", true, "OK", "Not OK")
                .radio("de_batt_terminals", "Battery terminals okay", true, "OK", "Not OK")
                .radio("de_jacket_heater", "Water-jacket heater is okay", true, "OK", "Not OK")
                .radio("de_selector_auto", "Controller selector switch in AUTO", true, "OK", "Not OK")
                .radio("de_charge_current", "Battery charging current okay", true, "OK", "Not OK")
                .number("de_run_hours", "Engine run time (hour meter)", "hrs", "reading")
                .radio("de_cooling_level", "Cooling water level okay", true, "OK", "Not OK")
                .radio("de_electrolyte_level", "Electrolyte water level okay", true, "OK", "Not OK");

        f.section("Operational checks (pump running)")
                .number("op_suction_psi", "Suction pressure", "psi", "reading")
                .number("op_discharge_psi", "Discharge pressure", "psi", "reading")
                .radio("op_packing_discharge", "Pump packing has slight discharge (adjust as needed)", true, "OK", "Adjusted", "Not OK")
                .radio("op_noise_vibration", "Check for unusual noise or vibration", true, "None", "Present")
                .radio("op_overheating", "Packing boxes, bearings & pump casing — no overheating", true, "OK", "Not OK")
                .radio("op_exhaust_clear", "No opacity or plume from exhaust stack during operation", true, "OK", "Not OK")
                .radio("op_cranking_time", "Cranking-to-full-speed time okay", true, "OK", "Not OK")
                .number("op_oil_pressure", "Engine oil pressure", "psi", "reading")
                .number("op_engine_rpm", "Engine speed", "rpm", "reading")
                .number("op_water_temp", "Engine water temperature", "°F", "reading")
                .number("op_oil_temp", "Engine oil temperature", "°F", "reading")
                .radio("op_cooling_flow", "Cooling water flow indication okay", true, "OK", "Not OK");

        f.section("Sign-off")
                .radio("shutoff_verified", "After the 30-minute timer, verified the pump shut off and all pumps returned to AUTO",
                        true, "Yes", "No")
                .textarea("findings", "Findings — describe any 'Not OK' / 'Present'; leave blank if all good", null)
                .number("time_on_task", "Time on task", "hrs", "laborhours")
                .textarea("notes", "Notes / actions taken (WOs generated, adjustments made, etc.)", "worklog");

        return MaximoFormTemplateDto.builder()
                .formKey("DIESEL_FIRE_PUMP_TEST")
                .formName("Diesel Fire Pump Weekly Inspection & Test")
                .description("Weekly no-flow (churn) inspection and test of the diesel fire pump (NFPA 25). "
                        + "Complete the pre-operation pump-house and fire-pump checks and the diesel-engine checks, "
                        + "then run the pump and record the operational readings. Procedure: (1) In the Diesel Fire "
                        + "Pump Building, before starting verify oil level; jacket heater on & engine warm; battery "
                        + "chargers & voltage ok; cooling water valves lined up normal; raw water level & valves lined "
                        + "up to the pump. (2) Notify the Control Room you are starting the Diesel Fire Pump. "
                        + "(3) Press the spigot icon on the controller to start the pump and the 30-minute timer. "
                        + "(4) With the pump running, ensure good oil pressure and coolant flow. (5) Monitor water flow "
                        + "through the overspeed relief valve (should be none) and the engine heat exchanger. (6) After "
                        + "the 30-minute timer completes, verify the diesel fire pump shuts off. (7) Notify the Control "
                        + "Room the test is complete and all pumps are back in AUTO.")
                .matchDescriptionContains("diesel fire pump")
                .active(true)
                .fieldsJson(toJson(f.build()))
                .build();
    }

    /**
     * From procedures/pm/electric-fire-pump-test.xlsx — "Electric & Jockey Fire Pump Monthly Inspection and
     * Test" (NFPA 25). Pre-op pump-house and fire-pump checks, jockey/electric controller checks with at-rest
     * phase voltage, then operational readings (under-load phase voltage/current, pressures) taken while the
     * motor runs its 10-minute timer. All verifications required; readings capture the run's actual values.
     */
    private MaximoFormTemplateDto electricFirePumpTest() {
        Fields f = new Fields();

        f.section("Pre-operation — Pump house checks")
                .radio("ph_heat", "Building heat > 40°F", true, "OK", "Not OK")
                .radio("ph_louvers", "Louvers operational", true, "OK", "Not OK")
                .radio("ph_no_water", "No water on floor", true, "OK", "Not OK")
                .radio("ph_coupling_guard", "Coupling guard in place", true, "OK", "Not OK");

        f.section("Pre-operation — Fire pump proper checks")
                .radio("fp_valves_open", "Suction / discharge valves OPEN", true, "OK", "Not OK")
                .radio("fp_no_leaks", "No leaks in pipes", true, "OK", "Not OK")
                .radio("fp_gauges_ok", "Suction / discharge gauges okay", true, "OK", "Not OK")
                .radio("fp_flowtest_shut", "Water-flow test valves SHUT", true, "OK", "Not OK")
                .radio("fp_hose_shut", "Water-to-hose connection SHUT", true, "OK", "Not OK");

        f.section("Fire pump checks (at rest)")
                .radio("jc_jockey_on", "Jockey pump controller ON & okay", true, "OK", "Not OK")
                .radio("jc_electric_on", "Electric fire pump controller ON, no alarms", true, "OK", "Not OK")
                .radio("jc_space_heater", "Space heater is ON / motor warm", true, "OK", "Not OK")
                .number("rest_pv_a", "Phase voltage A", "V", "reading")
                .number("rest_pv_b", "Phase voltage B", "V", "reading")
                .number("rest_pv_c", "Phase voltage C", "V", "reading")
                .number("rest_system_psi", "System pressure", "psi", "reading");

        f.section("Operational checks (pump running)")
                .number("op_suction_psi", "Suction pressure", "psi", "reading")
                .number("op_discharge_psi", "Discharge pressure", "psi", "reading")
                .radio("op_packing_discharge", "Pump packing has slight discharge (adjust as needed)", true, "OK", "Adjusted", "Not OK")
                .radio("op_noise_vibration", "Check for unusual noise or vibration", true, "None", "Present")
                .radio("op_overheating", "Packing boxes, bearings & pump casing — no overheating", true, "OK", "Not OK")
                .radio("op_ramp_time", "Motor ramp-to-full-speed time okay", true, "OK", "Not OK")
                .radio("op_relief_flow", "Slight flow verified on relief valve", true, "OK", "Not OK")
                .number("op_pv_a", "Phase voltage A (under load)", "V", "reading")
                .number("op_pv_b", "Phase voltage B (under load)", "V", "reading")
                .number("op_pv_c", "Phase voltage C (under load)", "V", "reading")
                .number("op_pc_a", "Phase current A", "A", "reading")
                .number("op_pc_b", "Phase current B", "A", "reading")
                .number("op_pc_c", "Phase current C", "A", "reading")
                .number("op_system_psi", "System pressure", "psi", "reading")
                .number("op_starting_current", "Starting current, highest phase", "A", "reading");

        f.section("Sign-off")
                .radio("shutoff_verified", "Verified the fire pump shut down automatically after 10 minutes and all pumps returned to AUTO",
                        true, "Yes", "No")
                .textarea("findings", "Findings — describe any 'Not OK' / 'Present'; leave blank if all good", null)
                .number("time_on_task", "Time on task", "hrs", "laborhours")
                .textarea("notes", "Notes / actions taken (WOs generated, adjustments made, etc.)", "worklog");

        return MaximoFormTemplateDto.builder()
                .formKey("ELECTRIC_FIRE_PUMP_TEST")
                .formName("Electric & Jockey Fire Pump Monthly Inspection & Test")
                .description("Monthly no-flow (churn) inspection and test of the electric and jockey fire pumps "
                        + "(NFPA 25). Complete the pre-operation pump-house and fire-pump checks and the controller "
                        + "checks (record at-rest phase voltage and system pressure), then run the pump and record the "
                        + "operational readings (under-load phase voltage/current, pressures, starting current). "
                        + "Procedure: (1) Perform pre-operation checks. (2) Verify raw water tank level and isolation "
                        + "valves are at proper level and positions. (3) Start the jockey pump by slowly bleeding off "
                        + "pressure at the jockey pump controller sensing lines. (4) Close the sensing lines and verify "
                        + "the jockey pump stops. (5) Start the electric fire pump by depressing the spigot icon "
                        + "pushbutton on the controller. (6) Observe the motor coming up to speed and record the max "
                        + "current. (7) Monitor slight water flow through the relief valve. (8) Record the operational "
                        + "checks. (9) Verify the fire pump shuts down automatically after 10 minutes.")
                .matchDescriptionContains("electric fire pump")
                .active(true)
                .fieldsJson(toJson(f.build()))
                .build();
    }

    /**
     * From procedures/pm/piv-and-deluge-valve-inspection.xlsx — "PIV &amp; Deluge Valve Inspection" (monthly).
     * Two checklists: (1) the 13 Post Indicator Valves — spin each freely (a couple turns closed, then back
     * open), verify no leaks and correct position; (2) the deluge/isolation valves — verify each is in its
     * locked-open position. Every check is required. Any 'Not OK' is noted here and a Service Request raised.
     */
    private MaximoFormTemplateDto pivAndDelugeValveInspection() {
        Fields f = new Fields();

        // {tag + location} — the "Checked OK" column becomes a required radio, plus a per-PIV comments field.
        String[] pivs = {
                "FPS-664 (West Admin door)",
                "FPS-648 (West Admin door)",
                "FPS-610 (U2 East Turbine bldg. door)",
                "FPS-665 (West Fire Pump House)",
                "FPS-662 (West Fire Pump House)",
                "FPS-660 (West Fire Pump House)",
                "FPS-611 (Warehouse #2)",
                "FPS-613 (Warehouse #2)",
                "FPS-828 (North of Aux Boiler Bldg.)",
                "FPS-661 (South of Gas Compressor)",
                "FPS-663 (West U1 filter house)",
                "FPS-602 (U1 East Turbine Bldg. door)",
                "FPS-659 (U2 North of ACC)",
        };
        f.section("Post Indicator Valves — spin freely (a couple turns closed, then back open), no leaks, correct position");
        for (int i = 0; i < pivs.length; i++) {
            int n = i + 1;
            f.radio("piv" + n + "_ok", n + ". " + pivs[i], true, "OK", "Not OK")
                    .text("piv" + n + "_cmt", n + ". Comments / repairs");
        }

        // {sheet item #, group, valve/location detail} — each verified in its LOCKED OPEN position.
        String[][] deluge = {
                {"14", "Diesel Fire Pump", "Tank Supply 00-VFPS635"},
                {"15", "Diesel Fire Pump", "Suction ISO 00-VFPS803"},
                {"16", "Diesel Fire Pump", "Discharge ISO 00-VFPS804"},
                {"17", "Fire Pump Recirc", "HDR back to Tank 00-VFPS656"},
                {"18", "Electric Fire Pump", "Tank Supply 00-VFPS680"},
                {"19", "Electric Fire Pump", "Suction ISO 00-VFPS801"},
                {"20", "Electric Fire Pump", "Discharge ISO 00-VFPS802"},
                {"21", "Jockey Pump", "Suction ISO 00-VFPS809"},
                {"22", "Jockey Pump", "Discharge ISO 00-VFPS810"},
                {"23", "Aux Boiler Deluge ISO", "ISO 00-IDV-FPS828"},
                {"24", "Admin Building Zone #1", "Manual ISO"},
                {"25", "Admin Building Zone #2", "Manual ISO"},
                {"26", "Unit 1 Turbine Building Zone 1", "Turbine building ground 00-VFPS800"},
                {"27", "Unit 1 Turbine Building Zone 2", "ST/GT lube oil tank 00-VFPS801"},
                {"28", "Unit 1 Turbine Building Zone 3", "ST/Gen coupling 00-VPFS-802"},
                {"29", "Unit 2 Turbine Building Zone 1", "Turbine building ground 00-VFPS814"},
                {"30", "Unit 2 Turbine Building Zone 2", "ST/GT lube oil tank 00-VFPS815"},
                {"31", "Unit 2 Turbine Building Zone 3", "ST/Gen coupling 00-VPFS-816"},
                {"32", "Warehouse #2", "Fire panel outside Warehouse #2 (key in box on East wall inside)"},
                {"33", "Warehouse #3", "Fire panel outside Warehouse #3 (key in box on East wall inside)"},
        };
        f.section("Deluge & isolation valves — verify each is LOCKED OPEN");
        for (String[] d : deluge) {
            f.radio("del" + d[0] + "_ok", d[0] + ". " + d[1] + " — " + d[2] + " (locked open)", true, "OK", "Not OK");
        }

        f.section("Sign-off")
                .textarea("findings", "Findings — describe any 'Not OK' (position, leak, or won't spin); leave blank if all good", null)
                .checkbox("sr_submitted", "Service Request submitted for any repairs needed", false)
                .number("time_on_task", "Time on task", "hrs", "laborhours")
                .textarea("notes", "Notes", "worklog");

        return MaximoFormTemplateDto.builder()
                .formKey("PIV_DELUGE_VALVE_INSPECTION")
                .formName("PIV & Deluge Valve Inspection")
                .description("Monthly inspection to ensure the Post Indicator Valves (PIVs) function and the deluge / "
                        + "isolation valves are open. For each of the 13 PIVs: spin it freely (a couple turns closed, "
                        + "then back open), verify it is not leaking and is in the correct position for normal "
                        + "operation. For each deluge / isolation valve (items 14-33): verify it is in its LOCKED OPEN "
                        + "position. Every check is required. Note any 'Not OK' and submit a Service Request for the "
                        + "repair.")
                .matchDescriptionContains("deluge")
                .active(true)
                .fieldsJson(toJson(f.build()))
                .build();
    }

    /**
     * From procedures/pm/emergency diesel generator test.xlsx — "Emergency Diesel Generator Monthly Inspection
     * and Test". Pre-operation panel/controller checks, diesel-engine checks, then operational readings taken
     * while the generator runs. Every verification is required; readings capture the run's actual values.
     */
    private MaximoFormTemplateDto emergencyDieselGeneratorTest() {
        Fields f = new Fields();

        f.section("Pre-operation checks")
                .radio("pre_heat", "Building heat set > 50°F", true, "OK", "Not OK")
                .radio("pre_louvers", "Louvers operational", true, "OK", "Not OK")
                .radio("pre_hmi_local", "HMI selected on local panel", true, "OK", "Not OK")
                .radio("pre_relay_reset", "Generator trip / shutdown relay reset", true, "OK", "Not OK")
                .radio("pre_switch_auto", "Kohler local switch in AUTO", true, "OK", "Not OK")
                .radio("pre_system_ready", "\"System Ready\" illuminated on engine panel", true, "OK", "Not OK");

        f.section("Diesel engine checks")
                .radio("de_fuel", "Fuel tank > 70% full", true, "OK", "Not OK")
                .radio("de_batt_voltage", "Battery voltages are okay", true, "OK", "Not OK")
                .radio("de_charger_no_alarm", "Battery charger — no alarm lights", true, "OK", "Not OK")
                .radio("de_oil_level", "Oil level is okay", true, "OK", "Not OK")
                .radio("de_batt_terminals", "Battery terminals okay", true, "OK", "Not OK")
                .radio("de_batt_liquid", "Battery liquid level okay", true, "OK", "Not OK");

        f.section("Operational checks (generator running)")
                .number("op_oil_pressure", "Engine oil pressure", "psi", "reading")
                .number("op_coolant_temp", "Engine coolant temperature", "°F", "reading")
                .number("op_battery_vdc", "Battery voltage", "VDC", "reading")
                .radio("op_noise_vibration", "Check for unusual noise or vibration", true, "None", "Present")
                .radio("op_filters", "Engine filters free of debris", true, "OK", "Not OK")
                .text("op_stop_time", "Stop time")
                .number("op_run_hrs", "Run hours (hour meter)", "hrs", "reading")
                .radio("op_exhaust_clear", "No opacity or plume from exhaust stack during operation", true, "OK", "Not OK");

        f.section("Sign-off")
                .textarea("findings", "Findings — describe any 'Not OK' / 'Present'; leave blank if all good", null)
                .number("time_on_task", "Time on task", "hrs", "laborhours")
                .textarea("notes", "Notes / actions taken (WOs generated, adjustments made, etc.)", "worklog");

        return MaximoFormTemplateDto.builder()
                .formKey("EMERGENCY_DIESEL_GENERATOR_TEST")
                .formName("Emergency Diesel Generator Monthly Inspection & Test")
                .description("Monthly inspection and test of the emergency diesel generator. Complete the "
                        + "pre-operation checks (building heat > 50°F, louvers, HMI on local panel, trip/shutdown "
                        + "relay reset, Kohler switch in AUTO, \"System Ready\" illuminated) and the diesel-engine "
                        + "checks (fuel > 70%, battery voltages/terminals/liquid level, charger no alarms, oil "
                        + "level), then run the generator and record the operational readings: engine oil pressure, "
                        + "coolant temperature, battery VDC, unusual noise/vibration, engine filters free of debris, "
                        + "stop time and run hours, and no opacity/plume from the exhaust stack during operation.")
                .matchDescriptionContains("diesel generator")
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
    /**
     * SDI (Silt Density Index, ASTM D4189) test with the portable filter kit. The operator confirms the setup,
     * then times how long it takes to collect the sample volume at the start (Tᵢ, clean filter) and again after
     * the test interval T (typically 15 min) once the membrane has fouled (T_f). The app calculates the plugging
     * factor and SDI — the formula is shown on the form for reference. Pressure is held at 30 psi throughout.
     */
    private MaximoFormTemplateDto sdiTest() {
        Fields f = new Fields();

        f.section("Before you start — you'll run the test TWICE (before and after the Sand Filter)")
                .checkbox("sdi_pressure_set", "Feed pressure regulator set to 30 psi (2.1 bar) — hold constant through BOTH tests", true)
                .checkbox("sdi_cylinder", "Graduated cylinder ready; a FRESH 0.45 µm / 47 mm membrane will be used for EACH of the two tests", true)
                .number("sdi_volume_ml", "Volume collected each sample (same for all samples, usually 500)", "mL", "reading");

        // ── TEST 1 — before the sand filter (inlet) ──
        f.section("TEST 1 — BEFORE the Sand Filter (inlet sample)")
                .checkbox("sdi_pre_filter", "Fresh membrane installed (grid side up, no wrinkles, handled with tweezers)", true)
                .checkbox("sdi_pre_point", "Sampling the Sand Filter INLET (upstream); all air bled; 30 psi held", true)
                .timer("sdi_pre_ti", "Initial sample Tᵢ — tap Start as it begins filling, Stop at the volume", true)
                .timerWait("sdi_pre_tf", "Final sample T_f — Start/Stop after the 15-min prompt", true, "sdi_pre_ti", 15, "sdi_pre_t")
                .numberReq("sdi_pre_t", "Test time T (min) — auto-filled when you start the final sample; edit if needed", "min", "reading");
        f.computed("sdi_pre_plugging", "Plugging factor %P (before)", "(1 - sdi_pre_ti / sdi_pre_tf) * 100", "%",
                        "%P = (1 − Tᵢ / T_f) × 100   —  should be ≤ 75% for a valid test.")
                .computed("sdi_pre_value", "SDI — before the Sand Filter", "(1 - sdi_pre_ti / sdi_pre_tf) * 100 / sdi_pre_t", null,
                        "SDI = (1 − Tᵢ / T_f) × 100 ÷ T   (Tᵢ, T_f in seconds; T in minutes).");

        // ── TEST 2 — after the sand filter (outlet) ──
        f.section("TEST 2 — AFTER the Sand Filter (outlet sample) · install a NEW membrane")
                .checkbox("sdi_post_filter", "Fresh membrane installed (grid side up, no wrinkles, handled with tweezers)", true)
                .checkbox("sdi_post_point", "Sampling the Sand Filter OUTLET (downstream); all air bled; 30 psi held", true)
                .timer("sdi_post_ti", "Initial sample Tᵢ — tap Start as it begins filling, Stop at the volume", true)
                .timerWait("sdi_post_tf", "Final sample T_f — Start/Stop after the 15-min prompt", true, "sdi_post_ti", 15, "sdi_post_t")
                .numberReq("sdi_post_t", "Test time T (min) — auto-filled when you start the final sample; edit if needed", "min", "reading");
        f.computed("sdi_post_plugging", "Plugging factor %P (after)", "(1 - sdi_post_ti / sdi_post_tf) * 100", "%",
                        "%P = (1 − Tᵢ / T_f) × 100   —  should be ≤ 75% for a valid test.")
                .computed("sdi_post_value", "SDI — after the Sand Filter", "(1 - sdi_post_ti / sdi_post_tf) * 100 / sdi_post_t", null,
                        "SDI = (1 − Tᵢ / T_f) × 100 ÷ T. Typical RO-feed target: SDI ≤ 3–5.");

        f.section("Result — Sand Filter performance")
                .computed("sdi_reduction", "SDI removed by the Sand Filter (before − after)",
                        "(1 - sdi_pre_ti / sdi_pre_tf) * 100 / sdi_pre_t - (1 - sdi_post_ti / sdi_post_tf) * 100 / sdi_post_t", null,
                        "= SDI(before) − SDI(after). Positive = the sand filter lowered the fouling potential; "
                        + "near-zero or negative means the filter isn't helping — note it below.");

        f.section("Sign-off")
                .number("sdi_time_on_task", "Time on task", "hrs", "laborhours")
                .textarea("sdi_notes", "Notes / observations (membrane lot #s, sample points, any anomalies)", "worklog");

        return MaximoFormTemplateDto.builder()
                .formKey("SDI_TEST")
                .formName("SDI (Silt Density Index) Test — Sand Filter (before & after)")
                .description("Silt Density Index (ASTM D4189) run TWICE with the portable filter kit — once on the Sand "
                        + "Filter inlet (before) and once on the outlet (after) — to measure how much silt the sand filter "
                        + "removes. For each test install a FRESH 0.45 µm / 47 mm membrane, hold 30 psi, and time how long "
                        + "it takes to collect the sample volume at the start (Tᵢ) and again after the interval T (usually "
                        + "15 min) once the membrane has fouled (T_f). The app calculates each SDI = (1 − Tᵢ/T_f) × 100 ÷ T "
                        + "and the before−after reduction. Hold 30 psi throughout both tests.")
                .matchDescriptionContains("sdi")
                .active(true)
                .fieldsJson(toJson(f.build()))
                .build();
    }

    /**
     * From the paper "R.O. PROBE MONTHLY PM" sheet. Two RO trains (ALPHA, BRAVO); for each of seven analyzer
     * points the operator records the installed PROBE reading and a handheld SAMPLE reading, and the app shows
     * the difference. Each point has a per-row "Max Delta" tolerance — if the probe and the sample differ by more
     * than that, the probe needs calibration and the operator writes a Service Request (noted at the bottom).
     * Same seven points on both trains, only the AIT-DWT tag numbers differ.
     */
    private MaximoFormTemplateDto roProbeMonthlyPm() {
        Fields f = new Fields();

        // {measurement, ALPHA tag suffix, BRAVO tag suffix, Max Delta}. Units are intentionally omitted (the paper
        // shows none); the Max Delta and the SR instruction live in each computed row's note.
        String[][] rows = {
                {"Inlet pH",                         "801", "810", "0.5"},
                {"Inlet Conductivity",               "803", "812", "500"},
                {"Interstage pH",                    "807", "816", "0.5"},
                {"1st Pass Concentrate Conductivity","805", "814", "400"},
                {"1st Pass Permeate Conductivity",   "804", "815", "10"},
                {"2nd Pass Concentrate Conductivity","808", "817", "50"},
                {"2nd Pass Permeate Conductivity",   "809", "818", "1.5"},
        };
        addProbeTrain(f, "ALPHA", "a", rows, 1);
        addProbeTrain(f, "BRAVO", "b", rows, 2);

        f.section("Sign-off")
                .number("time_on_task", "Time on task", "hrs", "laborhours")
                .textarea("notes", "Notes — list any reading that exceeded its Max Delta and the Service Request "
                        + "number you raised to calibrate that probe", "worklog");

        return MaximoFormTemplateDto.builder()
                .formKey("RO_PROBE_MONTHLY_PM")
                .formName("R.O. Probe Monthly PM")
                .description("Monthly check of the ALPHA and BRAVO reverse-osmosis analyzer probes against a handheld "
                        + "sample at seven points each (Inlet pH, Inlet Conductivity, Interstage pH, 1st-Pass "
                        + "Concentrate & Permeate Conductivity, 2nd-Pass Concentrate & Permeate Conductivity). For every "
                        + "AIT-DWT tag, enter the probe reading and the sample reading; the app shows the difference. If "
                        + "the difference is greater than that row's Max Delta, write a Service Request to calibrate the "
                        + "probe and record the SR number in the notes.")
                .matchDescriptionContains("probe")
                .active(true)
                .fieldsJson(toJson(f.build()))
                .build();
    }

    /**
     * One RO train (ALPHA or BRAVO) of the probe PM: the same seven probe-vs-sample points, using the tag-suffix
     * column {@code tagCol} (1 = ALPHA, 2 = BRAVO). Each point = a Probe input, a Sample input (both logged to the
     * WO worklog as READING lines), and a computed Probe−Sample difference whose note carries the Max Delta + the
     * "write a Service Request" instruction. Field names are prefixed per train so ALPHA/BRAVO never collide.
     */
    private void addProbeTrain(Fields f, String section, String prefix, String[][] rows, int tagCol) {
        f.section(section);
        for (String[] r : rows) {
            String measurement = r[0];
            String tag = "AIT-DWT-" + r[tagCol];
            String maxDelta = r[3];
            String base = prefix + "_" + r[tagCol];
            f.number(base + "_probe", measurement + " — Probe (" + tag + ")", null, "reading")
                    .number(base + "_sample", measurement + " — Sample (" + tag + ")", null, "reading")
                    .computed(base + "_delta", "Δ Probe − Sample (" + tag + ")",
                            base + "_probe - " + base + "_sample", null,
                            "Max Delta " + maxDelta + " — if the probe and sample differ by more than " + maxDelta
                                    + ", write a Service Request to calibrate this probe.");
        }
    }

    private static final class Fields {
        private final List<Map<String, Object>> list = new ArrayList<>();
        private String section;

        Fields section(String s) { this.section = s; return this; }

        Fields checkbox(String name, String label, boolean required) { return add(name, label, "checkbox", null, null, required); }
        Fields text(String name, String label) { return add(name, label, "text", null, null, false); }
        Fields textarea(String name, String label, String target) { return add(name, label, "textarea", null, target, false); }
        Fields number(String name, String label, String unit, String target) { return add(name, label, "number", unit, target, false); }
        Fields numberReq(String name, String label, String unit, String target) { return add(name, label, "number", unit, target, true); }

        /** Built-in stopwatch: Start/Stop records the elapsed SECONDS into the field value (fed to computed
         *  fields). Timestamp-based in the app, so it survives the screen locking / the app backgrounding. */
        Fields timer(String name, String label, boolean required) {
            Map<String, Object> m = base(name, label, "timer");
            m.put("unit", "sec");
            if (required) m.put("required", true);
            list.add(m);
            return this;
        }

        /** A stopwatch that also shows a "time since {@code afterField} started → take the sample at N min" prompt,
         *  and (optionally) auto-fills the measured interval MINUTES into {@code fillInto} when this timer starts. */
        Fields timerWait(String name, String label, boolean required, String afterField, int minutes, String fillInto) {
            Map<String, Object> m = base(name, label, "timer");
            m.put("unit", "sec");
            if (required) m.put("required", true);
            Map<String, Object> w = new LinkedHashMap<>();
            w.put("field", afterField);
            w.put("minutes", minutes);
            if (fillInto != null) w.put("fillInto", fillInto);
            m.put("waitAfter", w);
            list.add(m);
            return this;
        }

        /** Read-only calculated field. {@code formula} is an arithmetic expression over other field names,
         *  evaluated in the app (the computed result is written back into the submission); {@code note} is the
         *  human-readable formula shown on the form for the operator's reference. */
        Fields computed(String name, String label, String formula, String unit, String note) {
            Map<String, Object> m = base(name, label, "computed");
            m.put("formula", formula);
            if (unit != null) m.put("unit", unit);
            if (note != null) m.put("note", note);
            list.add(m);
            return this;
        }

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
