package com.dk_power.power_plant_java.sevice.angular.diagrams;

import com.dk_power.power_plant_java.dto.diagrams.DiagramDto;
import com.dk_power.power_plant_java.entities.diagrams.Diagram;
import com.dk_power.power_plant_java.entities.diagrams.DiagramConnection;
import com.dk_power.power_plant_java.entities.diagrams.DiagramPlacement;
import com.dk_power.power_plant_java.mappers.diagrams.DiagramMapper;
import com.dk_power.power_plant_java.repository.diagrams.DiagramConnectionRepo;
import com.dk_power.power_plant_java.repository.diagrams.DiagramPlacementRepo;
import com.dk_power.power_plant_java.repository.diagrams.DiagramRepo;
import com.dk_power.power_plant_java.sevice.angular.base.NgCrudService;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.persistence.EntityManager;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.hibernate.SessionFactory;
import org.springframework.stereotype.Service;

import java.util.*;

@Slf4j
@Service
@Transactional
@RequiredArgsConstructor
public class NgDiagramService implements NgCrudService<Diagram, DiagramDto, DiagramRepo, DiagramMapper> {
    private final DiagramRepo repo;
    private final DiagramMapper mapper;
    private final DiagramPlacementRepo placementRepo;
    private final DiagramConnectionRepo connectionRepo;
    private final SessionFactory sessionFactory;
    private final EntityManager entityManager;
    private final ObjectMapper objectMapper;

    private static final String FEEDWATER_TEST_NAME = "Seed - Boiler Drum Feedwater Control Test";
    private static final String SEAL_OIL_TEST_NAME = "Seed - Generator Seal Oil System";
    private static final String CV_PATH = "M 0,25 L 20,35 L 0,45 Z M 40,25 L 20,35 L 40,45 Z M 20,35 L 20,15 M 5,15 A 15,15 0 0 1 35,15 Z";
    private static final String PUMP_PATH = "M 20,20 m -15,0 a 15,15 0 1,0 30,0 a 15,15 0 1,0 -30,0 M 0,15 L 5,15 L 5,25 L 0,25 Z M 35,15 L 40,15 L 40,25 L 35,25 Z M 10,20 L 30,20 M 25,15 L 30,20 L 25,25";
    private static final String MANUAL_VALVE_PATH = "M 0,20 L 20,10 L 20,30 Z M 40,20 L 20,10 L 20,30 Z M 20,10 L 20,0 M 14,0 L 26,0";
    private static final String HEAT_EXCHANGER_PATH = "M 5,0 L 5,40 M 35,0 L 35,40 M 5,0 Q 20,-8 35,0 M 5,40 Q 20,48 35,40 M 12,12 L 28,28 M 12,28 L 28,12";
    private static final String GENERATOR_BODY_PATH = "M 20,10 L 140,10 M 20,70 L 140,70 M 20,10 a 10,30 0 0,0 0,60 M 140,10 a 10,30 0 0,1 0,60 M 0,40 L 20,40 M 140,40 L 160,40 M 30,10 L 30,70 M 130,10 L 130,70 M 60,18 Q 80,26 100,18 M 60,62 Q 80,54 100,62 M 70,4 L 90,4 L 90,10 L 70,10 Z";
    private static final String SHAFT_SEAL_PATH = "M 0,25 L 50,25 M 0,35 L 50,35 M 10,15 L 10,45 L 18,45 L 18,15 Z M 32,15 L 32,45 L 40,45 L 40,15 Z M 25,0 L 25,15 M 25,45 L 25,60 M 14,20 L 14,40 M 36,20 L 36,40 M 18,25 L 32,25 M 18,35 L 32,35";
    private static final String DRAIN_POT_PATH = "M 10,5 L 30,5 L 30,40 L 10,40 Z M 0,15 L 10,15 M 30,15 L 40,15 M 20,40 L 20,50 M 17,20 L 17,32 M 15,32 L 19,32 M 15,20 a 2,2 0 0,1 4,0";
    private static final String DETRAINING_TANK_PATH = "M 8,6 L 32,6 M 8,6 a 12,4 0 0,0 0,8 M 32,6 a 12,4 0 0,1 0,8 M 8,14 L 8,44 M 32,14 L 32,44 M 8,44 a 12,4 0 0,0 24,0 M 12,20 L 28,20 M 14,28 L 26,28 M 16,36 L 24,36 M 20,44 L 20,54 M 0,20 L 8,20 M 32,25 L 40,25";
    private static final String FLOAT_TRAP_PATH = "M 8,5 L 32,5 L 32,35 L 8,35 Z M 0,20 L 8,20 M 32,20 L 40,20 M 20,35 L 20,45 M 20,22 m -5,0 a 5,5 0 1,0 10,0 a 5,5 0 1,0 -10,0 M 20,17 L 20,12 L 24,12";
    private static final String EXCITER_PATH = "M 8,8 L 42,8 M 8,32 L 42,32 M 8,8 a 6,12 0 0,0 0,24 M 42,8 a 6,12 0 0,1 0,24 M 0,20 L 8,20 M 42,20 L 50,20 M 20,4 L 30,4 L 30,8 L 20,8 Z";
    private static final String BEARING_PATH = "M 5,8 L 45,8 L 45,42 L 5,42 Z M 0,25 L 5,25 M 45,25 L 50,25 M 25,0 L 25,8 M 25,42 L 25,50 M 12,18 a 13,7 0 0,1 26,0 M 12,32 a 13,7 0 0,0 26,0 M 12,18 L 12,32 M 38,18 L 38,32";
    private static final String VAPOR_EXTRACTOR_PATH = "M 20,20 m -14,0 a 14,14 0 1,0 28,0 a 14,14 0 1,0 -28,0 M 20,8 L 14,18 L 20,20 L 26,18 Z M 20,32 L 14,22 L 20,20 L 26,22 Z M 20,0 L 20,6 M 20,34 L 20,40";
    private static final String FILTER_PATH = "M 20,20 m -15,0 a 15,15 0 1,0 30,0 a 15,15 0 1,0 -30,0 M 10,10 L 30,30 M 10,16 L 24,30 M 16,10 L 30,24 M 10,24 L 24,10 M 10,30 L 30,10 M 16,30 L 30,16 M 0,20 L 5,20 M 35,20 L 40,20";
    private static final String SEAL_DRAIN_TRAY_PATH = "M 0,0 L 80,0 L 80,20 L 0,20 Z M 20,0 L 20,20 M 40,0 L 40,20 M 60,0 L 60,20 M 10,20 L 10,28 M 70,20 L 70,28 M 40,20 L 40,28";
    private static final String VACUUM_TANK_H_PATH = "M 8,8 L 52,8 M 8,32 L 52,32 M 8,8 a 8,12 0 0,0 0,24 M 52,8 a 8,12 0 0,1 0,24 M 30,0 L 30,8 M 20,32 L 20,40 M 40,32 L 40,40 M 25,14 L 25,26 M 23,26 L 27,26 M 23,14 a 2,2 0 0,1 4,0 M 35,14 L 35,26 M 33,26 L 37,26 M 33,14 a 2,2 0 0,1 4,0 M 0,20 L 8,20";
    private static final String CHECK_VALVE_PATH = "M 0,10 L 18,0 L 18,20 Z M 18,0 L 40,10 L 18,20 Z M 8,10 L 18,10";
    private static final String TANK_PATH = "M 8,4 L 32,4 M 8,4 a 12,4 0 0,0 0,8 M 32,4 a 12,4 0 0,1 0,8 M 8,12 L 8,34 M 32,12 L 32,34 M 8,34 a 12,4 0 0,0 24,0";
    private static final String VERTICAL_VESSEL_PATH = "M 10,8 L 30,8 M 10,32 L 30,32 M 10,8 a 10,8 0 0,0 0,24 M 30,8 a 10,8 0 0,1 0,24 M 14,32 L 14,40 M 26,32 L 26,40";

    @Override public DiagramRepo getRepo() { return repo; }
    @Override public DiagramMapper getMapper() { return mapper; }
    @Override public SessionFactory getSessionFactory() { return sessionFactory; }
    @Override public DiagramDto getDto() { return new DiagramDto(); }
    @Override public Diagram getEntity() { return new Diagram(); }
    @Override public EntityManager getEntityManager() { return entityManager; }
    @Override public Class<Diagram> getEntityClass() { return Diagram.class; }

    @Override
    public List<DiagramDto> getAllDtos() {
        return getAll().stream().map(mapper::convertToDto).toList();
    }

    public DiagramDto createDiagram(DiagramDto dto) {
        Diagram entity = mapper.convertToEntity(dto);
        Diagram saved = repo.save(entity);
        return mapper.convertToDto(saved);
    }

    public DiagramDto updateDiagram(String id, DiagramDto dto) {
        dto.setId(Long.parseLong(id));
        Diagram entity = mapper.convertToEntity(dto);
        Diagram saved = repo.save(entity);
        return mapper.convertToDto(saved);
    }

    public DiagramDto getDiagramById(String id) {
        Diagram entity = getEntityById(id);
        return mapper.convertToDto(entity);
    }

    public List<DiagramDto> getByContextFileId(Long contextFileId) {
        return repo.findByContextFileIdOrderByDateModifiedDesc(contextFileId).stream()
            .map(mapper::convertToDto)
            .toList();
    }

    public DiagramDto seedFeedwaterControlScenario() {
        Diagram diagram = repo.findByNameContainingIgnoreCase(FEEDWATER_TEST_NAME).stream()
            .filter(item -> FEEDWATER_TEST_NAME.equalsIgnoreCase(item.getName()))
            .findFirst()
            .orElseGet(Diagram::new);

        diagram.setName(FEEDWATER_TEST_NAME);
        diagram.setDescription("Seeded test loop: unlimited makeup -> makeup CV -> storage tank -> two pumps -> drum feed CV -> boiler drum -> steam demand. Use pumps and valves to hold drum level without draining the storage tank.");
        diagram.setCanvasWidth(2200);
        diagram.setCanvasHeight(1100);
        diagram.setGridSize(20);
        diagram.setShapesJson(buildFeedwaterScenarioJson());
        diagram.setConnectionsJson("");

        Diagram saved = repo.save(diagram);
        return mapper.convertToDto(saved);
    }

    // ─── Seal Oil System Seeder ───

    public DiagramDto seedSealOilScenario() {
        Diagram diagram = repo.findByNameContainingIgnoreCase(SEAL_OIL_TEST_NAME).stream()
            .filter(item -> SEAL_OIL_TEST_NAME.equalsIgnoreCase(item.getName()))
            .findFirst()
            .orElseGet(Diagram::new);

        diagram.setName(SEAL_OIL_TEST_NAME);
        diagram.setDescription("Generator seal oil system: AC/DC pumps feed oil through a pressure regulator to H2-side and air-side generator shaft seals. H2-side drain returns through a vacuum tank. Air-side drain mixes with lube oil and flows through an air detraining tank to the lube oil reservoir.");
        diagram.setCanvasWidth(2400);
        diagram.setCanvasHeight(2000);
        diagram.setGridSize(20);
        diagram.setShapesJson(buildSealOilJson());
        diagram.setConnectionsJson("");

        Diagram saved = repo.save(diagram);
        return mapper.convertToDto(saved);
    }

    private String buildSealOilJson() {
        try {
            Map<String, Object> envelope = new LinkedHashMap<>();
            envelope.put("schemaVersion", 1);
            envelope.put("placements", buildSealOilPlacements());
            envelope.put("connections", buildSealOilConnections());
            return objectMapper.writeValueAsString(envelope);
        } catch (JsonProcessingException e) {
            throw new RuntimeException("Failed to build seal oil scenario JSON", e);
        }
    }

    private List<Map<String, Object>> buildSealOilPlacements() {
        List<Map<String, Object>> p = new ArrayList<>();

        // ══════════════════════════════════════════════════
        // ROW 1 (y~80): Generator with seal ring bearings
        // [Vapor Ext] [Seal Ring Bearing] [Generator] [Seal Ring Bearing] [Vapor Ext]
        // ══════════════════════════════════════════════════

        // 1 - Left vapor extractor + vent
        p.add(symbolPlacement(1, "Vapor Extractor (L)", "Extracts H2 vapor from turbine-end seal area.", "pump",
            json(mapOf("schemaVersion", 1, "pumpRunning", true, "pumpDeltaP", 2, "pumpEfficiency", 0.9, "maxFlow", 200, "minInletPressure", 0)),
            80, 180, 70, 70, "vapor-extractor", VAPOR_EXTRACTOR_PATH, "#66bb6a"));

        p.add(rectPlacement(2, "Vent (L)", "H2 vapor vent to atmosphere — turbine end.", "sink",
            json(mapOf("schemaVersion", 1)),
            70, 80, 90, 40, "#ef9a9a"));

        // 3 - Left seal ring bearing (turbine end)
        p.add(symbolPlacement(3, "Seal Ring Bearing (TE)", "Turbine-end seal ring and bearing assembly.", "vessel",
            json(mapOf("schemaVersion", 1, "volume", 30, "currentLevel", 70, "minLevel", 30, "maxPressure", 80, "sourcePressure", 65)),
            320, 120, 120, 150, "shaft-seal", SHAFT_SEAL_PATH, "#64b5f6"));

        // 4 - Generator body
        p.add(symbolPlacement(4, "Generator", "Hydrogen cooled generator with rotor.", "junction",
            json(mapOf("schemaVersion", 1)),
            560, 80, 450, 240, "generator-body", GENERATOR_BODY_PATH, "#fff176"));

        // 5 - Right seal ring bearing (collector end)
        p.add(symbolPlacement(5, "Seal Ring Bearing (CE)", "Collector-end seal ring and bearing assembly.", "vessel",
            json(mapOf("schemaVersion", 1, "volume", 30, "currentLevel", 65, "minLevel", 30, "maxPressure", 80, "sourcePressure", 65)),
            1130, 120, 120, 150, "shaft-seal", SHAFT_SEAL_PATH, "#64b5f6"));

        // 6 - Right vapor extractor + vent
        p.add(symbolPlacement(6, "Vapor Extractor (R)", "Extracts H2 vapor from collector-end seal area.", "pump",
            json(mapOf("schemaVersion", 1, "pumpRunning", true, "pumpDeltaP", 2, "pumpEfficiency", 0.9, "maxFlow", 200, "minInletPressure", 0)),
            1420, 180, 70, 70, "vapor-extractor", VAPOR_EXTRACTOR_PATH, "#66bb6a"));

        p.add(rectPlacement(7, "Vent (R)", "H2 vapor vent to atmosphere — collector end.", "sink",
            json(mapOf("schemaVersion", 1)),
            1410, 80, 90, 40, "#ef9a9a"));

        // ══════════════════════════════════════════════════
        // ROW 2 (y~380): Seal drain enlargement section
        // ══════════════════════════════════════════════════

        // 8 - Seal drain enlargement section (wide tray spanning under generator)
        p.add(symbolPlacement(8, "Seal Drain Enlargement Section", "Catches oil draining from both seal assemblies. Separates H2-side and air-side flows.", "vessel",
            json(mapOf("schemaVersion", 1, "volume", 200, "currentLevel", 35, "minLevel", 10, "maxPressure", 75, "sourcePressure", 60)),
            450, 400, 480, 80, "seal-drain-tray", SEAL_DRAIN_TRAY_PATH, "#b0bec5"));

        // 9 - Vent (normally closed) — right of drain section
        p.add(symbolPlacement(9, "Vent (Normally Closed)", "Emergency vent on seal drain section. Normally closed.", "valve",
            json(mapOf("schemaVersion", 1, "valvePosition", "closed")),
            980, 400, 60, 50, "manual-valve", MANUAL_VALVE_PATH, "#ef9a9a"));

        p.add(rectPlacement(10, "Vent NC", "Normally closed vent.", "sink",
            json(mapOf("schemaVersion", 1)),
            1060, 400, 60, 40, "#ef9a9a"));

        // ══════════════════════════════════════════════════
        // ROW 3 (y~560): Air detraining (left), Float trap (center), Vacuum tank (right)
        // ══════════════════════════════════════════════════

        // 11 - Air detraining section (left)
        p.add(symbolPlacement(11, "Air Detraining Section", "Removes entrained air from seal/bearing oil. Baffled internals.", "vessel",
            json(mapOf("schemaVersion", 1, "volume", 3000, "currentLevel", 55, "minLevel", 20, "maxPressure", 20, "sourcePressure", 5)),
            250, 600, 160, 160, "detraining-tank", DETRAINING_TANK_PATH, "#fff59d"));

        // 12 - Float trap (center)
        p.add(symbolPlacement(12, "Float Trap", "Float-operated trap between seal drain and vacuum tank. Passes oil, blocks H2 gas.", "valve",
            json(mapOf("schemaVersion", 1, "valvePosition", "open")),
            700, 620, 80, 90, "float-trap", FLOAT_TRAP_PATH, "#9fa8da"));

        // 13 - Check valve before float trap
        p.add(symbolPlacement(13, "Check Valve (FT)", "Prevents backflow into float trap.", "valve",
            json(mapOf("schemaVersion", 1, "valvePosition", "open")),
            580, 640, 60, 40, "check-valve", CHECK_VALVE_PATH, "#8bc34a"));

        // 14 - Vacuum tank (right) — horizontal vessel with floats
        p.add(symbolPlacement(14, "Seal Oil Vacuum Tank", "Removes dissolved H2 from seal oil under vacuum. Float valves control oil level.", "vessel",
            json(mapOf("schemaVersion", 1, "volume", 2000, "currentLevel", 40, "minLevel", 15, "maxPressure", 15, "sourcePressure", 2)),
            1150, 580, 240, 140, "vacuum-tank-horizontal", VACUUM_TANK_H_PATH, "#ce93d8"));

        // 15 - SOVP x2 (seal oil vacuum pump, right of vacuum tank)
        p.add(symbolPlacement(15, "SOVP ×2", "Seal oil vacuum pump (2 installed). Maintains vacuum in vacuum tank.", "pump",
            json(mapOf("schemaVersion", 1, "pumpRunning", true, "pumpDeltaP", 10, "pumpEfficiency", 0.8, "maxFlow", 100, "minInletPressure", 0)),
            1480, 540, 80, 80, "vacuum-pump", "M 20,20 m -15,0 a 15,15 0 1,0 30,0 a 15,15 0 1,0 -30,0 M 0,15 L 5,15 L 5,25 L 0,25 Z M 35,15 L 40,15 L 40,25 L 35,25 Z M 13,12 L 20,28 L 27,12", "#66bb6a"));

        p.add(rectPlacement(16, "Vent (SOVP)", "H2 gas exhaust from vacuum pump.", "sink",
            json(mapOf("schemaVersion", 1)),
            1480, 460, 80, 40, "#ef9a9a"));

        // ══════════════════════════════════════════════════
        // ROW 4 (y~860): Main oil tank (left), Pumps (right), Filter (bottom)
        // ══════════════════════════════════════════════════

        // 17 - Drain pot (below vacuum tank drain)
        p.add(symbolPlacement(17, "Drain Pot", "Collects oil from vacuum tank before return to main tank.", "vessel",
            json(mapOf("schemaVersion", 1, "volume", 100, "currentLevel", 50, "minLevel", 15, "maxPressure", 15, "sourcePressure", 2)),
            1250, 850, 80, 100, "drain-pot", DRAIN_POT_PATH, "#7986cb"));

        // 18 - Sight glass on vacuum tank
        p.add(symbolPlacement(18, "Sight Glass", "Visual oil level indicator.", "instrument",
            json(mapOf("schemaVersion", 1, "measuredProperty", "flow")),
            1430, 700, 50, 50, "level-indicator", "M 20,20 m -15,0 a 15,15 0 1,0 30,0 a 15,15 0 1,0 -30,0 M 12,24 L 28,24 M 16,16 L 24,16", "#cddc39"));

        // 19 - Main oil tank (left, large)
        p.add(symbolPlacement(19, "Main Oil Tank", "Main lube/seal oil reservoir.", "source",
            json(mapOf("schemaVersion", 1, "sourcePressure", 5, "sourceTemperature", 120, "sourceFlowRate", 800)),
            100, 1000, 200, 220, "tank", TANK_PATH, "#80deea"));

        // 20 - MSOP (Main Seal Oil Pump)
        p.add(symbolPlacement(20, "MSOP", "Main Seal Oil Pump. AC driven, normally running.", "pump",
            json(mapOf("schemaVersion", 1, "pumpRunning", true, "pumpDeltaP", 55, "pumpEfficiency", 0.88, "maxFlow", 600, "minInletPressure", 3)),
            1100, 1100, 90, 90, "centrifugal-pump", PUMP_PATH, "#ffb74d"));

        // 21 - ESOP (Emergency Seal Oil Pump)
        p.add(symbolPlacement(21, "ESOP", "Emergency Seal Oil Pump. DC driven, auto-starts on low DP.", "pump",
            json(mapOf("schemaVersion", 1, "pumpRunning", false, "pumpDeltaP", 50, "pumpEfficiency", 0.82, "maxFlow", 500, "minInletPressure", 3)),
            1100, 960, 90, 90, "centrifugal-pump", PUMP_PATH, "#ffb74d"));

        // 22 - Pump discharge header
        p.add(circlePlacement(22, "Pump Header", "junction",
            json(mapOf("schemaVersion", 1)),
            960, 1060, 24, 24, "#ffffff"));

        // 23 - Pressure regulating valve
        p.add(symbolPlacement(23, "Pressure Regulating Valve", "Maintains constant seal oil differential pressure above H2 pressure.", "valve",
            json(mapOf("schemaVersion", 1, "valvePosition", "throttled", "throttlePercent", 60, "cvCoefficient", 400)),
            700, 1180, 70, 90, "cv", CV_PATH, "#8bc34a"));

        // 24 - Check valve after pressure regulator
        p.add(symbolPlacement(24, "Check Valve (PRV)", "Prevents backflow from seal header.", "valve",
            json(mapOf("schemaVersion", 1, "valvePosition", "open")),
            600, 1200, 60, 40, "check-valve", CHECK_VALVE_PATH, "#8bc34a"));

        // 25 - Filter
        p.add(symbolPlacement(25, "Filter", "Oil filter / strainer on return path.", "junction",
            json(mapOf("schemaVersion", 1)),
            200, 1400, 70, 70, "filter", FILTER_PATH, "#b0bec5"));

        // 26 - Check valve before filter
        p.add(symbolPlacement(26, "Check Valve (Filter)", "Check valve upstream of filter.", "valve",
            json(mapOf("schemaVersion", 1, "valvePosition", "open")),
            350, 1420, 60, 40, "check-valve", CHECK_VALVE_PATH, "#8bc34a"));

        // 27 - Seal oil supply header (goes UP from pumps to seals)
        p.add(circlePlacement(27, "Seal Oil Supply Header", "junction",
            json(mapOf("schemaVersion", 1)),
            500, 530, 24, 24, "#ffffff"));

        // 28 - Left supply branch valve to TE seal
        p.add(symbolPlacement(28, "Supply Valve (TE)", "Supply isolation valve to turbine-end seal.", "valve",
            json(mapOf("schemaVersion", 1, "valvePosition", "open")),
            350, 340, 60, 40, "check-valve", CHECK_VALVE_PATH, "#8bc34a"));

        // 29 - Right supply branch valve to CE seal
        p.add(symbolPlacement(29, "Supply Valve (CE)", "Supply isolation valve to collector-end seal.", "valve",
            json(mapOf("schemaVersion", 1, "valvePosition", "open")),
            1150, 340, 60, 40, "check-valve", CHECK_VALVE_PATH, "#8bc34a"));

        return p;
    }

    private List<Map<String, Object>> buildSealOilConnections() {
        List<Map<String, Object>> c = new ArrayList<>();

        // ─── Generator shaft (visual) ───
        c.add(connection(1, 3, 4, "right", "left", "TE Shaft", 0, 0, 0, 0));
        c.add(connection(2, 4, 5, "right", "left", "CE Shaft", 0, 0, 0, 0));

        // ─── Vapor extractors vent H2 from seal areas ───
        c.add(connection(3, 3, 1, "left", "right", "H2 Vapor TE", 2, 5, 0.01, 0));
        c.add(connection(4, 1, 2, "top", "bottom", "Vent TE", 2, 3, 0, 0));
        c.add(connection(5, 5, 6, "right", "left", "H2 Vapor CE", 2, 5, 0.01, 0));
        c.add(connection(6, 6, 7, "top", "bottom", "Vent CE", 2, 3, 0, 0));

        // ─── Seal oil drains DOWN from seals to drain tray ───
        c.add(connection(7, 3, 8, "bottom", "top", "TE Seal Drain", 4, 8, 0.02, 0));
        c.add(connection(8, 5, 8, "bottom", "top", "CE Seal Drain", 4, 8, 0.02, 0));

        // ─── Drain tray vent (normally closed) ───
        c.add(connection(9, 8, 9, "right", "left", "Drain Vent", 2, 3, 0.01, 0));
        c.add(connection(10, 9, 10, "right", "left", "To Vent NC", 2, 3, 0, 0));

        // ─── Drain tray to float trap (center path) ───
        c.add(connection(11, 8, 13, "bottom", "left", "Drain to Check Valve", 4, 10, 0.02, 0));
        c.add(connection(12, 13, 12, "right", "left", "To Float Trap", 4, 8, 0.02, 0));

        // ─── Float trap to vacuum tank ───
        c.add(connection(13, 12, 14, "right", "left", "To Vacuum Tank", 4, 12, 0.02, 0));

        // ─── Vacuum tank: SOVP draws vacuum, vent gas out ───
        c.add(connection(14, 14, 15, "right", "left", "To SOVP", 2, 8, 0.01, 0));
        c.add(connection(15, 15, 16, "top", "bottom", "SOVP Exhaust", 2, 5, 0, 0));

        // ─── Vacuum tank oil drain to drain pot ───
        c.add(connection(16, 14, 17, "bottom", "top", "VT Oil Drain", 4, 10, 0.02, 0));
        c.add(connection(17, 14, 18, "right", "left", "Sight Glass", 2, 3, 0, 0));

        // ─── Drain tray to air detraining (left path) ───
        c.add(connection(18, 8, 11, "left", "top", "Air Side Drain", 4, 12, 0.02, 0));

        // ─── Air detraining to main oil tank ───
        c.add(connection(19, 11, 19, "bottom", "top", "Detrained to Tank", 6, 15, 0.02, 0));

        // ─── Drain pot (vacuum tank) returns to main oil tank ───
        c.add(connection(20, 17, 19, "bottom", "right", "VT Return to Tank", 4, 20, 0.02, 0));

        // ─── Main oil tank to pumps ───
        c.add(connection(21, 19, 20, "right", "left", "MSOP Suction", 8, 25, 0.02, 0));
        c.add(connection(22, 19, 21, "right", "left", "ESOP Suction", 8, 25, 0.02, 0));

        // ─── Pumps to header ───
        c.add(connection(23, 20, 22, "top", "right", "MSOP Discharge", 6, 15, 0.02, 0));
        c.add(connection(24, 21, 22, "top", "bottom", "ESOP Discharge", 6, 15, 0.02, 0));

        // ─── Header through PRV and filter to supply ───
        c.add(connection(25, 22, 23, "left", "right", "To PRV", 6, 12, 0.02, 0));
        c.add(connection(26, 23, 24, "left", "right", "PRV Out", 6, 10, 0.02, 0));
        c.add(connection(27, 24, 26, "left", "right", "To Filter CV", 4, 8, 0.02, 0));
        c.add(connection(28, 26, 25, "left", "right", "To Filter", 4, 8, 0.02, 0));

        // ─── Filter return to tank ───
        c.add(connection(29, 25, 19, "left", "bottom", "Filter to Tank", 4, 10, 0.02, 0));

        // ─── Supply header UP to seals ───
        c.add(connection(30, 22, 27, "top", "bottom", "Supply Up", 6, 30, 0.02, 0));
        c.add(connection(31, 27, 28, "left", "bottom", "To TE Seal", 4, 20, 0.02, 0));
        c.add(connection(32, 28, 3, "top", "bottom", "TE Seal Supply", 4, 8, 0.02, 0));
        c.add(connection(33, 27, 29, "right", "bottom", "To CE Seal", 4, 20, 0.02, 0));
        c.add(connection(34, 29, 5, "top", "bottom", "CE Seal Supply", 4, 8, 0.02, 0));

        return c;
    }

    // ─── Feedwater Scenario Builders ───

    private String buildFeedwaterScenarioJson() {
        try {
            Map<String, Object> envelope = new LinkedHashMap<>();
            envelope.put("schemaVersion", 1);
            envelope.put("placements", buildPlacements());
            envelope.put("connections", buildConnections());
            return objectMapper.writeValueAsString(envelope);
        } catch (JsonProcessingException e) {
            throw new RuntimeException("Failed to build seeded diagram JSON", e);
        }
    }

    private List<Map<String, Object>> buildPlacements() {
        List<Map<String, Object>> placements = new ArrayList<>();

        placements.add(symbolPlacement(1, "Unlimited Makeup", "Source with effectively unlimited supply into the storage tank.", "source",
            json(mapOf("schemaVersion", 1, "sourcePressure", 60, "sourceTemperature", 90, "sourceFlowRate", 2600)),
            90, 330, 90, 180, "vertical-vessel", VERTICAL_VESSEL_PATH, "#6ec6ff"));

        placements.add(symbolPlacement(2, "Tank Makeup CV", "Makeup valve limiting fresh water into the storage tank.", "valve",
            json(mapOf("schemaVersion", 1, "valvePosition", "throttled", "throttlePercent", 55, "cvCoefficient", 1400)),
            250, 390, 70, 90, "cv", CV_PATH, "#8bc34a"));

        placements.add(symbolPlacement(3, "Feedwater Storage Tank", "Large storage tank with active makeup so level should stay healthy.", "vessel",
            json(mapOf("schemaVersion", 1, "volume", 250000, "currentLevel", 78, "minLevel", 25, "maxPressure", 250, "sourcePressure", 18)),
            430, 290, 150, 180, "tank", TANK_PATH, "#80deea"));

        placements.add(symbolPlacement(4, "Boiler Feed Pump A", "Primary feed pump. Start this first.", "pump",
            json(mapOf("schemaVersion", 1, "pumpRunning", false, "pumpDeltaP", 140, "pumpEfficiency", 0.9, "maxFlow", 1700, "minInletPressure", 5)),
            740, 310, 90, 90, "centrifugal-pump", PUMP_PATH, "#ffb74d"));

        placements.add(symbolPlacement(5, "Boiler Feed Pump B", "Standby / assist feed pump.", "pump",
            json(mapOf("schemaVersion", 1, "pumpRunning", false, "pumpDeltaP", 140, "pumpEfficiency", 0.9, "maxFlow", 1700, "minInletPressure", 5)),
            740, 470, 90, 90, "centrifugal-pump", PUMP_PATH, "#ffb74d"));

        placements.add(circlePlacement(6, "Pump Discharge Header", "junction",
            json(mapOf("schemaVersion", 1)),
            930, 405, 24, 24, "#ffffff"));

        placements.add(symbolPlacement(7, "Drum Feed CV", "Main control valve to the boiler drum.", "valve",
            json(mapOf("schemaVersion", 1, "valvePosition", "throttled", "throttlePercent", 45, "cvCoefficient", 1600)),
            1050, 390, 70, 90, "cv", CV_PATH, "#8bc34a"));

        placements.add(symbolPlacement(8, "Boiler Drum", "Target vessel. Operator should hold this level steady.", "vessel",
            json(mapOf("schemaVersion", 1, "volume", 22000, "currentLevel", 45, "minLevel", 30, "maxPressure", 2500, "sourcePressure", 120)),
            1240, 270, 130, 220, "vertical-vessel", VERTICAL_VESSEL_PATH, "#90caf9"));

        placements.add(symbolPlacement(9, "Steam Demand Valve", "Fixed outlet demand from the drum.", "valve",
            json(mapOf("schemaVersion", 1, "valvePosition", "throttled", "throttlePercent", 35, "cvCoefficient", 900)),
            1450, 390, 70, 90, "cv", CV_PATH, "#ef9a9a"));

        placements.add(rectPlacement(10, "Steam Demand Sink", "Sink representing evaporation / steam demand from the drum.", "sink",
            json(mapOf("schemaVersion", 1)),
            1605, 385, 120, 70, "#ce93d8"));

        return placements;
    }

    private List<Map<String, Object>> buildConnections() {
        List<Map<String, Object>> connections = new ArrayList<>();
        connections.add(connection(1, 1, 2, "right", "left", "Makeup Supply", 10, 30, 0.02, 0));
        connections.add(connection(2, 2, 3, "right", "left", "Tank Makeup", 10, 25, 0.02, 0));
        connections.add(connection(3, 3, 4, "right", "left", "Pump A Suction", 14, 18, 0.015, 0));
        connections.add(connection(4, 3, 5, "right", "left", "Pump B Suction", 14, 18, 0.015, 0));
        connections.add(connection(5, 4, 6, "right", "left", "Pump A Discharge", 10, 20, 0.02, 0));
        connections.add(connection(6, 5, 6, "right", "bottom", "Pump B Discharge", 10, 20, 0.02, 0));
        connections.add(connection(7, 6, 7, "right", "left", "Feed Header", 12, 22, 0.02, 0));
        connections.add(connection(8, 7, 8, "right", "left", "Drum Feed", 12, 26, 0.02, 0));
        connections.add(connection(9, 8, 9, "right", "left", "Steam Outlet", 8, 20, 0.03, 0));
        connections.add(connection(10, 9, 10, "right", "left", "Steam Demand", 8, 18, 0.03, 0));
        return connections;
    }

    private Map<String, Object> symbolPlacement(
        int id,
        String name,
        String description,
        String role,
        String simParamsJson,
        int x,
        int y,
        int width,
        int height,
        String symbolId,
        String svgPath,
        String color
    ) {
        Map<String, Object> item = new LinkedHashMap<>();
        item.put("id", id);
        item.put("name", name);
        item.put("description", description);
        item.put("simRole", role);
        item.put("simParamsJson", simParamsJson);
        item.put("x", x);
        item.put("y", y);
        item.put("width", width);
        item.put("height", height);
        item.put("type", "symbol");
        item.put("symbolId", symbolId);
        item.put("svgPath", svgPath);
        item.put("originalWidth", 40);
        item.put("originalHeight", 40);
        item.put("color", color);
        item.put("label", name);
        item.put("lineWidth", 2);
        return item;
    }

    private Map<String, Object> circlePlacement(
        int id,
        String name,
        String role,
        String simParamsJson,
        int x,
        int y,
        int width,
        int height,
        String color
    ) {
        Map<String, Object> item = new LinkedHashMap<>();
        item.put("id", id);
        item.put("name", name);
        item.put("simRole", role);
        item.put("simParamsJson", simParamsJson);
        item.put("x", x);
        item.put("y", y);
        item.put("width", width);
        item.put("height", height);
        item.put("type", "circle");
        item.put("color", color);
        item.put("fillColor", "#121212");
        item.put("label", name);
        item.put("lineWidth", 2);
        return item;
    }

    private Map<String, Object> rectPlacement(
        int id,
        String name,
        String description,
        String role,
        String simParamsJson,
        int x,
        int y,
        int width,
        int height,
        String color
    ) {
        Map<String, Object> item = new LinkedHashMap<>();
        item.put("id", id);
        item.put("name", name);
        item.put("description", description);
        item.put("simRole", role);
        item.put("simParamsJson", simParamsJson);
        item.put("x", x);
        item.put("y", y);
        item.put("width", width);
        item.put("height", height);
        item.put("type", "rectangle");
        item.put("color", color);
        item.put("label", name);
        item.put("lineWidth", 2);
        return item;
    }

    private Map<String, Object> connection(
        int id,
        int sourcePlacementId,
        int targetPlacementId,
        String sourceAnchor,
        String targetAnchor,
        String pipeName,
        int diameter,
        int length,
        double frictionFactor,
        double insulationFactor
    ) {
        Map<String, Object> item = new LinkedHashMap<>();
        item.put("id", id);
        item.put("sourcePlacementId", sourcePlacementId);
        item.put("targetPlacementId", targetPlacementId);
        item.put("sourceAnchor", sourceAnchor);
        item.put("targetAnchor", targetAnchor);
        item.put("pipeName", pipeName);
        item.put("pipeParamsJson", json(mapOf(
            "schemaVersion", 1,
            "diameter", diameter,
            "length", length,
            "frictionFactor", frictionFactor,
            "insulationFactor", insulationFactor
        )));
        item.put("lineWidth", 3);
        item.put("color", "#888888");
        return item;
    }

    private Map<String, Object> mapOf(Object... values) {
        Map<String, Object> map = new LinkedHashMap<>();
        for (int i = 0; i < values.length; i += 2) {
            map.put(String.valueOf(values[i]), values[i + 1]);
        }
        return map;
    }

    private String json(Map<String, Object> map) {
        try {
            return objectMapper.writeValueAsString(map);
        } catch (JsonProcessingException e) {
            throw new RuntimeException("Failed to write scenario JSON", e);
        }
    }

    // --- Migration: JSON blobs → normalized entities ---

    public int migrateAllDiagrams() {
        List<Diagram> diagrams = repo.findAll();
        int migrated = 0;
        for (Diagram diagram : diagrams) {
            if (migrateDiagramToEntities(diagram)) migrated++;
        }
        return migrated;
    }

    public boolean migrateDiagramToEntities(Long diagramId) {
        Diagram diagram = repo.findById(diagramId).orElse(null);
        if (diagram == null) return false;
        return migrateDiagramToEntities(diagram);
    }

    @SuppressWarnings("unchecked")
    private boolean migrateDiagramToEntities(Diagram diagram) {
        String shapesJson = diagram.getShapesJson();
        if (shapesJson == null || shapesJson.isBlank()) return false;

        try {
            Map<String, Object> envelope = objectMapper.readValue(shapesJson, new TypeReference<>() {});

            Set<Integer> existingPlacementLocalIds = new HashSet<>();
            for (DiagramPlacement p : placementRepo.findByDiagramIdOrderByLocalIdAsc(diagram.getId())) {
                if (p.getLocalId() != null) existingPlacementLocalIds.add(p.getLocalId());
            }
            Set<Integer> existingConnectionLocalIds = new HashSet<>();
            for (DiagramConnection c : connectionRepo.findByDiagramIdOrderByLocalIdAsc(diagram.getId())) {
                if (c.getLocalId() != null) existingConnectionLocalIds.add(c.getLocalId());
            }

            int placementCount = 0;
            int connectionCount = 0;

            List<Map<String, Object>> placementMaps = (List<Map<String, Object>>) envelope.get("placements");
            if (placementMaps != null) {
                for (Map<String, Object> pm : placementMaps) {
                    Integer localId = intVal(pm.get("id"));
                    if (localId != null && existingPlacementLocalIds.contains(localId)) continue;

                    DiagramPlacement p = new DiagramPlacement();
                    p.setDiagram(diagram);
                    p.setLocalId(localId);
                    p.setSimRole(strVal(pm.get("simRole")));
                    p.setSimParamsJson(strVal(pm.get("simParamsJson")));
                    p.setSimEquipmentId(longVal(pm.get("simEquipmentId")));
                    p.setSourceEntityType(strVal(pm.get("sourceEntityType")));
                    p.setSourceEntityId(longVal(pm.get("sourceEntityId")));
                    p.setX(intVal(pm.get("x")));
                    p.setY(intVal(pm.get("y")));
                    p.setWidth(intVal(pm.get("width")));
                    p.setHeight(intVal(pm.get("height")));
                    p.setRotation(intVal(pm.get("rotation")));
                    p.setColor(strVal(pm.get("color")));
                    p.setFillColor(strVal(pm.get("fillColor")));
                    p.setLineWidth(intVal(pm.get("lineWidth")));
                    p.setLabel(strVal(pm.get("label")));
                    p.setZIndex(intVal(pm.get("zIndex")));
                    p.setLocked(boolVal(pm.get("locked")));
                    p.setGroupId(strVal(pm.get("groupId")));
                    p.setType(strVal(pm.get("type")));
                    p.setSymbolId(strVal(pm.get("symbolId")));
                    p.setSvgPath(strVal(pm.get("svgPath")));
                    p.setOriginalWidth(intVal(pm.get("originalWidth")));
                    p.setOriginalHeight(intVal(pm.get("originalHeight")));
                    p.setText(strVal(pm.get("text")));
                    p.setFontSize(intVal(pm.get("fontSize")));
                    p.setFontFamily(strVal(pm.get("fontFamily")));
                    p.setRadius(intVal(pm.get("radius")));
                    p.setStartX(intVal(pm.get("startX")));
                    p.setStartY(intVal(pm.get("startY")));
                    p.setEndX(intVal(pm.get("endX")));
                    p.setEndY(intVal(pm.get("endY")));
                    p.setName(strVal(pm.get("name")));
                    p.setDescription(strVal(pm.get("description")));
                    placementRepo.save(p);
                    placementCount++;
                }
            }

            List<Map<String, Object>> connectionMaps = (List<Map<String, Object>>) envelope.get("connections");
            if (connectionMaps != null) {
                for (Map<String, Object> cm : connectionMaps) {
                    Integer localId = intVal(cm.get("id"));
                    if (localId != null && existingConnectionLocalIds.contains(localId)) continue;

                    DiagramConnection c = new DiagramConnection();
                    c.setDiagram(diagram);
                    c.setLocalId(localId);
                    c.setSourcePlacementLocalId(intVal(cm.get("sourcePlacementId")));
                    c.setTargetPlacementLocalId(intVal(cm.get("targetPlacementId")));
                    c.setSourceAnchor(strVal(cm.get("sourceAnchor")));
                    c.setTargetAnchor(strVal(cm.get("targetAnchor")));
                    c.setPipeTemplateId(longVal(cm.get("pipeTemplateId")));
                    c.setPipeName(strVal(cm.get("pipeName")));
                    c.setPipeParamsJson(strVal(cm.get("pipeParamsJson")));
                    c.setLineWidth(intVal(cm.get("lineWidth")));
                    c.setColor(strVal(cm.get("color")));
                    c.setLineStyle(strVal(cm.get("lineStyle")));
                    Object waypoints = cm.get("waypoints");
                    if (waypoints != null) {
                        c.setWaypointsJson(objectMapper.writeValueAsString(waypoints));
                    }
                    connectionRepo.save(c);
                    connectionCount++;
                }
            }

            if (placementCount == 0 && connectionCount == 0) {
                log.info("Diagram {} ({}) already fully migrated", diagram.getId(), diagram.getName());
                return false;
            }

            log.info("Migrated diagram {} ({}) — {} new placements, {} new connections",
                diagram.getId(), diagram.getName(), placementCount, connectionCount);
            return true;
        } catch (Exception e) {
            log.error("Failed to migrate diagram {}: {}", diagram.getId(), e.getMessage(), e);
            return false;
        }
    }

    private static String strVal(Object o) { return o != null ? String.valueOf(o) : null; }
    private static Integer intVal(Object o) {
        if (o == null) return null;
        if (o instanceof Number n) return n.intValue();
        try { return Integer.parseInt(String.valueOf(o)); } catch (NumberFormatException e) { return null; }
    }
    private static Long longVal(Object o) {
        if (o == null) return null;
        if (o instanceof Number n) return n.longValue();
        try { return Long.parseLong(String.valueOf(o)); } catch (NumberFormatException e) { return null; }
    }
    private static Boolean boolVal(Object o) {
        if (o == null) return null;
        if (o instanceof Boolean b) return b;
        return Boolean.parseBoolean(String.valueOf(o));
    }
}
