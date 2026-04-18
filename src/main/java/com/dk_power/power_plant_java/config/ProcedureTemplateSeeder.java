package com.dk_power.power_plant_java.config;

import com.dk_power.power_plant_java.entities.scheduler.TaskTemplate;
import com.dk_power.power_plant_java.enums.TaskType;
import com.dk_power.power_plant_java.repository.scheduler.TaskTemplateRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.*;

/**
 * Builds procedure templates from known procedures.
 * Not auto-run — call via REST endpoint (NgTaskTemplateController /seed-procedures).
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class ProcedureTemplateSeeder {

    private final TaskTemplateRepository templateRepo;
    private final ObjectMapper objectMapper;

    /**
     * Seeds all known procedure templates. Skips if already exists by name.
     * Returns list of names that were created.
     */
    public List<String> seedAll() {
        List<String> created = new ArrayList<>();
        seedIfMissing("Gen Purge: 1 — Prerequisites", this::buildPrerequisites, created);
        seedIfMissing("Gen Purge: 2 — Air to CO2", this::buildAirToCo2, created);
        seedIfMissing("Gen Purge: 3 — CO2 to Hydrogen", this::buildCo2ToH2, created);
        seedIfMissing("Gen Purge: 4 — Normal Operations", this::buildNormalOps, created);
        seedIfMissing("Gen Purge: 5 — Hydrogen to CO2", this::buildH2ToCo2, created);
        seedIfMissing("Gen Purge: 6 — CO2 to Air & Depressurize", this::buildCo2ToAir, created);
        return created;
    }

    private void seedIfMissing(String name, java.util.function.Supplier<TaskTemplate> builder, List<String> created) {
        if (!templateRepo.findByName(name).isEmpty()) {
            log.debug("Template '{}' already exists, skipping seed", name);
            return;
        }
        try {
            TaskTemplate t = builder.get();
            templateRepo.save(t);
            created.add(name);
            log.info("Seeded procedure template: '{}'", name);
        } catch (Exception e) {
            log.error("Failed to seed template '{}': {}", name, e.getMessage());
        }
    }

    // === Template 1: Prerequisites ===
    private TaskTemplate buildPrerequisites() {
        List<Map<String, Object>> steps = new ArrayList<>();
        int i = 0;
        steps.add(step(i++, "pre-001", "Complete Appendix A — Pre-Start Valve Lineup",
                "COMPLETE Appendix A, Pre-Start Valve Lineup.", null, null, false, null));
        steps.add(step(i++, "pre-002", "Complete Appendix B — Pre-Start Electrical Lineup",
                "COMPLETE Appendix B, Pre-Start Electrical Lineup.", null, null, false, null));
        steps.add(step(i++, "pre-003", "Verify maintenance work completion",
                "IF any maintenance work has been done, THEN VERIFY: work completed, LO/TO cleared, areas cleared of tools/rags, equipment ready for operation.", null, null, false, null));
        steps.add(step(i++, "pre-004", "Visual inspection of all system components",
                "Prior to startup, PERFORM a visual inspection of all system components.", null, null, false, null));
        steps.add(step(i++, "pre-005", "Verify all alarms cleared",
                "VERIFY all system alarms are cleared and no alarms are out of the scan.", null, null, false, null));
        steps.add(step(i++, "pre-006", "Verify auxiliary systems operating normally",
                "ENSURE the following systems are operating normally: STG Auxiliary Systems, Instrument Air System, Compressed Gas, Closed Cycle Cooling Water, Fire Protection, Lube Oil System.", null, null, false, null));
        return buildTemplate("Gen Purge: 1 — Prerequisites",
                "Initial conditions, valve/electrical lineups, maintenance verification, and system checks before any purge operation.",
                steps);
    }

    // === Template 2: Air to CO2 (includes GGA setup + CO2 purge) ===
    private TaskTemplate buildAirToCo2() {
        List<Map<String, Object>> steps = new ArrayList<>();
        int i = 0;
        steps.add(step(i++, "air-co2-001", "Verify CO2 tank level >85%",
                "ENSURE CO2 mini bulk tank level is >85%.", null, null, false, null));
        steps.add(step(i++, "air-co2-002", "Close Main Generator Vent",
                "CLOSE Main Generator Vent (01/02MKG02AA906).", null, null, false, null));
        steps.add(step(i++, "air-co2-003", "Open air supply valves to H2 distribution pipe",
                "OPEN Air Supply to H2 Distribution Pipe Valve 01/02MKG07AA101.\nOPEN Air Supply to H2 Distribution Pipe Valve 01/02MKG07AA102 to supply instrument air to the generator.",
                "A portable air monitor MUST be present during all purge processes", null, false, null));
        steps.add(step(i++, "air-co2-004", "Manage seal oil system (Lube Oil in service)",
                "If Lube Oil System is in service:\nVERIFY seal oil DP is maintained above 8 psig.\nMONITOR Seal Oil Float Trap & bypass sightglasses as generator pressure increases to ~5psi.\nWhen level in sightglass begins to drop, throttle bypass outlet valve until closed. Do not let level drop below bottom of sightglass.\nWhen generator pressure is at 5 psig, START: Seal Oil Vacuum pumps, Main Seal Oil Pump, Seal Oil Vapor Extractor.",
                null, "Verify seal oil DP maintained above 8 psig at all times", false, null));
        steps.add(step(i++, "air-co2-005", "Manage seal oil system (Lube Oil OFF)",
                "If Lube Oil System is OFF:\nWHEN generator pressure is ~1 psig, THEN START: Seal Oil Vacuum pumps, Main Seal Oil Pump, Seal Oil Vapor Extractor.\nVERIFY seal oil DP is maintained above 8 and below 12 psig — throttle regulator outlet valve if pressure is greater than 12 psig.\nMONITOR Seal Oil Float Trap & bypass sightglasses as generator pressure increases to ~5psi.\nWhen level in sightglass begins to drop, throttle bypass outlet valve until closed.",
                null, "Do not let seal oil DP exceed 12 psig", false, null));
        steps.add(step(i++, "air-co2-006", "Throttle generator vent to maintain 5 psig",
                "THROTTLE Main Generator Vent (01/02MKG02AA906) to maintain generator pressure at 5 psig.\nVERIFY Seal Differential Pressure settles at 8-10 PSID.\nVERIFY float trap is maintaining oil level in center of sight glass.",
                null, null, false, null));
        steps.add(step(i++, "air-co2-007", "Isolate air supply",
                "CLOSE Air Supply to H2 Distribution Pipe Valve 01/02MKG07AA101.\nCLOSE Air Supply to H2 Distribution Pipe Valve 01/02MKG07AA102.\nCLOSE Main Generator Vent (01/02MKG02AA906) IF generator pressure begins to drop below 5psi.\nDETATCH air hose from header labeled Air to Generator TOP.",
                null, null, false, null));
        // GGA Setup
        steps.add(step(i++, "gga-001", "Open GGA sampling inlet valve",
                "OPEN Gas Sampling Inlet Valve (MKG04AA401) at the analyzer.", null, null, false, null));
        steps.add(step(i++, "gga-002", "Set GGA inlet 3-way valve to CAL/PURGE",
                "PLACE H2 Gas Purity Analyzer Inlet 3-Way Valve (01/02MKG04AA301) in the CAL/PURGE position.", null, null, false, null));
        steps.add(step(i++, "gga-003", "Set GGA changeover to VENT",
                "PLACE GGA Changeover Valve (MKG04AA304) in the VENT position at the analyzer.", null, null, false, null));
        steps.add(step(i++, "gga-004", "Configure GGA for Air in CO2 mode",
                "OPEN GGA Vent Stop Valve (01MKG04AA903) at the analyzer.\nADJUST GGA Flow Meter [30.5 ~ 54.9 in³/min (500 ~ 900 mL/min)].\nSET GGA (01/02MKG04CQ101) function to Air in CO2.\nGGA Measuring Mode → Purge Menu → Select Air in CO2 Mode.",
                null, null, false, null));
        // CO2 Purge
        steps.add(step(i++, "co2-purge-001", "Open CO2 supply valves and throttle regulator",
                "OPEN CO2 Inlet Valve (01/02MKG11AA401).\nOPEN CO2 Supply Valve (01/02MKG11AA403).\nTHROTTLE CO2 Manual Pressure Regulating Valve (01/02MKG11AA402) to maintain 10 psi supply pressure.\nDigital flowmeter should read 6,500–7,000 scfm.",
                null, null, false, null));
        steps.add(step(i++, "co2-purge-002", "Configure H2 dryers for CO2 purge",
                "CLOSE Hydrogen Driers inlet valve (01/02MKG03AA101).\nOPEN Hydrogen Dryers CO2 inlet valves (01/02MKG11AA501 and 01/02MKG03AA109).\nTURN ON HYDROGEN driers.\nSWITCH hydrogen dryer towers every 15 minutes.",
                null, null, false, 15));
        steps.add(step(i++, "co2-purge-003", "Monitor and maintain generator pressure at 5 psig",
                "OPERATE CO2 Supply Inlet Valves and vents as needed to maintain generator pressure at 5 psig.", null, null, false, null));
        steps.add(step(i++, "co2-purge-004", "When Air in CO2 <30% — isolate CO2",
                "WHEN concentration of Air in CO2 is less than 30%, THEN SHUT:\n• CO2 Supply Valve (01/02MKG11AA403)\n• CO2 Inlet Valve (01/02MKG11AA401)\n• H2 Distribution Pipe Vent (01/02MKG02AA904)\n• Main Generator Vent (01/02MKG02AA906)\n• Hydrogen Dryers CO2 inlet valves (01/02MKG11AA501 and 01/02MKG03AA109)\nOPEN Hydrogen Dryers inlet valve (01/02MKG03AA101).",
                null, null, true, 120));
        return buildTemplate("Gen Purge: 2 — Air to CO2",
                "Purge air from generator with CO2. Includes seal oil management, GGA analyzer setup, and CO2 purge until Air in CO2 <30%.",
                steps);
    }

    // === Template 3: CO2 to Hydrogen ===
    private TaskTemplate buildCo2ToH2() {
        List<Map<String, Object>> steps = new ArrayList<>();
        int i = 0;
        steps.add(step(i++, "co2-h2-001", "Verify H2 supply available (670 m³ / 23,661 ft³)",
                "ENSURE 670 m³ (23,661 ft³) of H2 is available for purge from CO2 to H2 and to pressurize the generator to 42 psig.",
                "A portable air monitor MUST be present during all purge processes", null, false, null));
        steps.add(step(i++, "co2-h2-002", "Set GGA to H2 in CO2 mode",
                "SET H2 Gas Purity Analyzer (01/02MKG04CQ101) to H2 in CO2.", null, null, false, null));
        steps.add(step(i++, "co2-h2-003", "Open hydrogen supply valves",
                "OPEN the hydrogen supply valves outside turbine bldg: (VCMG103/113 for U1 OR VCMG103/213 for U2).", null, null, false, null));
        steps.add(step(i++, "co2-h2-004", "Throttle open H2 pressure regulator bypass",
                "THROTTLE OPEN H2 Pressure Regulator Bypass (01/02MKG02AA104).", null, null, false, null));
        steps.add(step(i++, "co2-h2-005", "Open CO2 distribution pipe vent",
                "OPEN the CO2 Distribution Pipe Vent (01/02MKG02AA905).", null, null, false, null));
        steps.add(step(i++, "co2-h2-006", "Throttle generator vent to maintain 5-10 psig",
                "THROTTLE OPEN Main Generator Vent (01/02MKG02AA906) to maintain generator pressure at 5-10 psig.", null, null, false, null));
        steps.add(step(i++, "co2-h2-007", "Configure H2 dryers for H2 purge (vent mode)",
                "CLOSE H2 Dryer outlet (MKG03AA105).\nOPEN H2 Dryer vents (MKG03AA901/902).", null, null, false, null));
        steps.add(step(i++, "co2-h2-008", "Switch H2 dryer towers every 15 min",
                "SWITCH Hydrogen Dryer towers every 15 minutes.", null, null, false, 15));
        steps.add(step(i++, "co2-h2-009", "Monitor purge until complete (~2 hours)",
                "Continuously MONITOR the purge until complete (~2 hours).", null, null, false, 120));
        steps.add(step(i++, "co2-h2-010", "When H2 in CO2 ≥95% — isolate vents",
                "WHEN concentration of H2 in CO2 is 95%, THEN SHUT:\n• CO2 Distribution Pipe Vent (01/02MKG02AA905)\n• Main Generator Vent (01/02MKG02AA906)\nOPEN H2 Dryer outlet (MKG03AA105).\nCLOSE H2 Dryer vents (MKG03AA901/902).",
                null, null, true, null));
        steps.add(step(i++, "co2-h2-011", "Reposition GGA valves for generator fan pressure",
                "PLACE H2 Gas Purity Analyzer Inlet 3-Way Valve (01/02MKG04AA301) in the GENERATOR FAN PRESSURE position.\nCLOSE Gas Sampling Inlet Valve (MKG04AA401) at the analyzer.",
                null, null, false, null));
        steps.add(step(i++, "co2-h2-012", "Pressurize generator to 35-40 psi",
                "PRESSURIZE Generator to 35-40 psi THEN CLOSE H2 Pressure Regulator Bypass (01/02MKG02AA104).\nOPEN 01/02MKG02AA101 H2 Press reg Iso.\nOPEN 01/02MKG02AA103 H2 Press reg outlet.",
                null, null, false, null));
        steps.add(step(i++, "co2-h2-013", "Monitor pressure to PCV setpoint 42 psig (~1.5 hrs)",
                "MONITOR generator pressure to ensure it stops increasing at generator PCV setpoint of 42 psig (~1.5 hours).\nReturn GGA (01/02MKG04CQ101) function to H2 in Air.",
                null, null, true, 90));
        steps.add(step(i++, "co2-h2-014", "GGA final positioning at FSNL",
                "LEAVE GGA Changeover Valve (MKG04AA304) in the VENT position and GGA Vent Stop Valve (01MKG04AA903) OPEN until unit is at FSNL.\nWHEN unit is at FSNL, THEN place GGA Changeover Valve (MKG04AA304) in the GENERATOR FAN SUCTION position and CLOSE GGA Vent Stop Valve (01MKG04AA903).",
                null, null, false, null));
        return buildTemplate("Gen Purge: 3 — CO2 to Hydrogen",
                "Purge CO2 with hydrogen, pressurize generator to 42 psig. Monitor until H2 purity ≥95%, then pressurize to operating pressure.",
                steps);
    }

    // === Template 4: Normal Operations ===
    private TaskTemplate buildNormalOps() {
        List<Map<String, Object>> steps = new ArrayList<>();
        steps.add(step(0, "normal-001", "Verify generator gas pressure 42 PSIG",
                "VERIFY Generator Gas Pressure Normal 42 PSIG.", null, null, false, null));
        steps.add(step(1, "normal-002", "Verify generator gas purity 98–99.9%",
                "VERIFY Generator Gas Purity 98–99.9%.", null, null, false, null));
        steps.add(step(2, "normal-003", "Verify valve positions",
                "VERIFY valves in proper position.", null, null, false, null));
        steps.add(step(3, "normal-004", "Verify hydrogen control cabinet",
                "VERIFY hydrogen control cabinet operating normally.", null, null, false, null));
        steps.add(step(4, "normal-005", "Check seal oil drain float trap sight glass",
                "CHECK sight glass on seal oil drain system float trap.", null, null, false, null));
        return buildTemplate("Gen Purge: 4 — Normal Operations",
                "Daily checks during normal operation: gas pressure, purity, valve positions, H2 cabinet, and seal oil system.",
                steps);
    }

    // === Template 5: Hydrogen to CO2 ===
    private TaskTemplate buildH2ToCo2() {
        List<Map<String, Object>> steps = new ArrayList<>();
        int i = 0;
        steps.add(step(i++, "h2-co2-001", "Verify CO2 supply available (>85% in tank)",
                "ENSURE 375 m³ (13,243 ft³) of CO2 is available for purge (>85% in mini bulk tank).\nENSURE 120 psi after regulator off tank outside building.",
                "A portable air monitor MUST be present during all purge processes", null, false, null));
        steps.add(step(i++, "h2-co2-002", "Configure GGA for H2 in CO2 measurement",
                "PLACE Generator Fan Pressure 3-Way Valve (01/02MKG04AA301) in the Cal/purge position.\nPLACE Generator fan suction (01/02MKG04AA304) to Vent position.\nOPEN Air/H2/CO2 valve (01/02MKG04AA401).\nOPEN H2 Gas Purity Analyzer to Main Generator Vent Stack (01MKG04AA903).\nADJUST GGA Flow Meter [30.5 ~ 54.9 in³/min (500 ~ 900 mL/min)].",
                null, null, false, null));
        steps.add(step(i++, "h2-co2-003", "Set GGA to H2 in CO2 mode",
                "SET H2 Gas Purity Analyzer (01/02MKG04CQ101) to H2 in CO2.", null, null, false, null));
        steps.add(step(i++, "h2-co2-004", "Shut hydrogen supply valves",
                "SHUT the hydrogen supply valves:\n• H2 Pressure Regulator Inlet 01/02MKG02AA101\n• H2 Pressure Regulator Outlet 01/02MKG02AA103",
                null, null, false, null));
        steps.add(step(i++, "h2-co2-005", "Open H2 distribution pipe vent",
                "OPEN H2 Distribution Pipe Vent (01/02MKG02AA904).", null, null, false, null));
        steps.add(step(i++, "h2-co2-006", "Throttle generator vent — monitor pressure decrease",
                "½ turn OPEN THROTTLE Main Generator Vent (01/02MKG02AA906). Monitor generator pressure begin to decrease.",
                null, null, false, null));
        steps.add(step(i++, "h2-co2-007", "Open CO2 supply valves",
                "OPEN CO2 mini bulk tank outlet valve.\nOPEN CO2 Inlet Valve (01/02MKG11AA401).\nOPEN CO2 Supply Valve (01/02MKG11AA403).",
                null, null, false, null));
        steps.add(step(i++, "h2-co2-008", "After ~1 hr, throttle CO2 regulator at 5-10 psig",
                "After ~1 hour, WHEN generator pressure is ~5-10 psig, THEN THROTTLE OPEN CO2 Manual Pressure Regulating Valve (01/02MKG11AA402) to maintain 10 psi to CO2 supply header.\nDO NOT let the pressure drop below 4.5 psig until procedure asks to do so.",
                null, "DO NOT let pressure drop below 4.5 psig", false, 60));
        steps.add(step(i++, "h2-co2-009", "Throttle generator vent to maintain 5-10 psig",
                "THROTTLE Main Generator Vent (01/02MKG02AA906) to maintain generator pressure between 5-10 psig.",
                null, null, false, null));
        steps.add(step(i++, "h2-co2-010", "Configure H2 dryers for CO2 purge",
                "CLOSE Hydrogen Driers inlet valve (01/02MKG03AA101).\nOPEN Hydrogen Dryers CO2 inlet valves (01/02MKG11AA501 and 01/02MKG03AA109).\nSWITCH hydrogen dryer towers every 15 minutes.",
                null, null, false, 15));
        steps.add(step(i++, "h2-co2-011", "Monitor purge until complete",
                "Continuously MONITOR the purge until complete.", null, null, false, 120));
        steps.add(step(i++, "h2-co2-012", "When H2 in CO2 ≤5% — isolate all",
                "WHEN concentration of H2 in CO2 is 5%, THEN SHUT:\n• CO2 Supply Valve (01/02MKG11AA403)\n• CO2 Manual Pressure Regulating Valve (01/02MKG11AA402)\n• CO2 Inlet Valve (01/02MKG11AA401)\n• H2 Distribution Pipe Vent (01/02MKG02AA904)\n• Main Generator Vent (01/02MKG02AA906)\n• Hydrogen Dryers CO2 inlet valves (01/02MKG11AA501 and 01/02MKG03AA109)\nOPEN Hydrogen Driers inlet valve (01/02MKG03AA101).\nOPERATE CO2 inlet Supply Valves and vents as needed to maintain generator pressure at 5 psig.",
                null, null, true, null));
        return buildTemplate("Gen Purge: 5 — Hydrogen to CO2",
                "Shutdown purge: replace hydrogen with CO2. Monitor until H2 in CO2 ≤5%.",
                steps);
    }

    // === Template 6: CO2 to Air & Depressurize ===
    private TaskTemplate buildCo2ToAir() {
        List<Map<String, Object>> steps = new ArrayList<>();
        int i = 0;
        steps.add(step(i++, "co2-air-001", "Set GGA to Air in CO2 mode",
                "SET H2 Gas Purity Analyzer (01/02MKG04CQ101) to Air in CO2.\nATTACH air hose to header labeled Air to Generator TOP.",
                "A portable air monitor MUST be present during all purge processes", null, false, null));
        steps.add(step(i++, "co2-air-002", "Open air supply valves",
                "OPEN Air Supply to H2 Distribution Pipe Valve (01/02MKG07AA101).\nTHROTTLE Air Supply to H2 Distribution Pipe Valve (01/02MKG07AA102).",
                null, null, false, null));
        steps.add(step(i++, "co2-air-003", "Open CO2 vent from bottom of generator",
                "OPEN CO2 Distribution Pipe Vent (01/02MKG02AA905) from bottom of generator.", null, null, false, null));
        steps.add(step(i++, "co2-air-004", "Throttle generator vent to maintain 5 psig",
                "THROTTLE OPEN Main Generator Vent (01/02MKG02AA906) to maintain generator pressure at 5 psig.", null, null, false, null));
        steps.add(step(i++, "co2-air-005", "Configure H2 dryers (vent mode)",
                "CLOSE H2 Dryer outlet (MKG03AA105).\nOPEN H2 Dryer vents (MKG03AA901/902).\nSWITCH hydrogen dryer towers every 15 minutes.",
                null, null, false, 15));
        steps.add(step(i++, "co2-air-006", "When Air in CO2 ≥95% — restore dryers",
                "When Air in CO2 is 95%:\nOPEN H2 Dryer outlet (MKG03AA105).\nCLOSE H2 Dryer vents (MKG03AA901/902).",
                null, null, true, 120));
        // Depressurize
        steps.add(step(i++, "depress-001", "Depressurize generator (rotor must be at standstill)",
                "WHEN Air in CO2 is 95% AND generator rotor is at a standstill, THEN:\nISOLATE Air Supply to H2 Distribution Pipe Valve (01/02MKG07AA101 and 01/02MKG07AA102).\nOPEN CO2 Distribution Pipe Vent (01/02MKG02AA905).\nOPEN H2 Distribution Pipe Vent (01/02MKG02AA904).\nOPEN Main Generator Vent (01/02MKG02AA906).\nTURN OFF Hydrogen Dryer.",
                "DO NOT depressurize generator until off turning gear and oil, <482°F HP metal temperature", null, true, null));
        steps.add(step(i++, "depress-002", "Monitor seal oil float trap during depressurization",
                "MONITOR seal oil float trap as generator pressure decreases.\nWhen generator pressure is below 4 psi, the float trap level will begin to rise.\nSlowly OPEN seal oil float bypass (01/02MKW03AA104) until fully open.\nEnsure bypass sight glass does not go completely empty.",
                null, "Do not let bypass sight glass go completely empty", false, null));
        steps.add(step(i++, "depress-003", "Secure seal oil pumps at <4 psig",
                "If Lube Oil System is in service, at 4 psig seal oil pumps can be turned off (open breaker on emergency seal oil pump first, then shut off main pump).\nIf Lube Oil System is not in service, at <1 psi generator pressure, GO TO TCP AND TURN OFF emergency Seal oil pump breaker.",
                null, null, false, null));
        steps.add(step(i++, "depress-004", "CRO secure main seal oil pump",
                "CRO SECURE Main seal oil pump.\nOPEN breaker after stop command.\nIsolate supply from lube oil system.",
                null, null, true, null));
        return buildTemplate("Gen Purge: 6 — CO2 to Air & Depressurize",
                "Final shutdown phase: purge CO2 with air until ≥95%, then depressurize generator and secure seal oil system.",
                steps);
    }

    private TaskTemplate buildTemplate(String name, String description, List<Map<String, Object>> steps) {
        TaskTemplate t = new TaskTemplate();
        t.setName(name);
        t.setDescription(description);
        t.setTaskType(TaskType.OCCASIONAL);
        try {
            t.setStepTemplatesJson(objectMapper.writeValueAsString(steps));
        } catch (Exception e) {
            throw new RuntimeException("Failed to serialize step templates for " + name, e);
        }
        return t;
    }

    private Map<String, Object> step(int index, String stepKey, String name, String description,
                                     String warning, String caution, boolean requiresSignoff,
                                     Integer expectedDurationMinutes) {
        Map<String, Object> s = new LinkedHashMap<>();
        s.put("stepKey", stepKey);
        s.put("name", name);
        s.put("description", description != null ? description : "");
        s.put("sortOrder", index);
        s.put("prerequisiteStepKeys", List.of());
        s.put("references", List.of());
        s.put("warning", warning != null ? warning : "");
        s.put("caution", caution != null ? caution : "");
        s.put("requiresSignoff", requiresSignoff);
        s.put("expectedDurationMinutes", expectedDurationMinutes);
        return s;
    }
}
