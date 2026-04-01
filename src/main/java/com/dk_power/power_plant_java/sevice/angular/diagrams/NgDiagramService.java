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
        diagram.setCanvasWidth(2600);
        diagram.setCanvasHeight(1800);
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

        // ══════════════════════════════════════════
        // ROW 1: Generator assembly (top, centered)
        // Layout: [H2 Seal] — [Generator Body] — [Oil Deflector/Air Seal] — [Exciter]
        // ══════════════════════════════════════════

        // 1 - H2-side shaft seal (turbine end, left of generator)
        p.add(symbolPlacement(1, "Shaft Hydrogen Seal", "Hydrogen-side shaft seal. Oil pressure exceeds H2 pressure to prevent leakage.", "vessel",
            json(mapOf("schemaVersion", 1, "volume", 50, "currentLevel", 65, "minLevel", 30, "maxPressure", 80, "sourcePressure", 60)),
            680, 120, 120, 140, "shaft-seal", SHAFT_SEAL_PATH, "#64b5f6"));

        // 2 - Generator body (center)
        p.add(symbolPlacement(2, "Hydrogen Cooled Generator", "Main generator. H2 cooled. Shaft extends both ends through seal assemblies.", "junction",
            json(mapOf("schemaVersion", 1)),
            860, 100, 400, 200, "generator-body", GENERATOR_BODY_PATH, "#90caf9"));

        // 3 - Air-side seal / oil deflector (collector end, right of generator)
        p.add(symbolPlacement(3, "Oil Deflector / Collector Seal", "Collector-end seal. Air side — drain mixes with bearing oil.", "vessel",
            json(mapOf("schemaVersion", 1, "volume", 50, "currentLevel", 55, "minLevel", 25, "maxPressure", 30, "sourcePressure", 15)),
            1320, 120, 120, 140, "shaft-seal", SHAFT_SEAL_PATH, "#81c784"));

        // 4 - Exciter
        p.add(symbolPlacement(4, "Exciter", "Generator exciter, collector end.", "junction",
            json(mapOf("schemaVersion", 1)),
            1500, 150, 100, 80, "exciter", EXCITER_PATH, "#b0bec5"));

        // 5 - Collector end bearing
        p.add(symbolPlacement(5, "Collector End Bearing", "Outboard bearing, collector side.", "junction",
            json(mapOf("schemaVersion", 1)),
            1650, 150, 80, 80, "bearing-housing", BEARING_PATH, "#b0bec5"));

        // ══════════════════════════════════════════
        // ROW 2: Seal oil supply (left side, feeds up to seals)
        // ══════════════════════════════════════════

        // 6 - Seal oil supply source
        p.add(symbolPlacement(6, "Seal Oil Supply", "From bearing oil header. Clean oil supply to seal oil system.", "source",
            json(mapOf("schemaVersion", 1, "sourcePressure", 25, "sourceTemperature", 120, "sourceFlowRate", 800)),
            60, 600, 120, 140, "tank", TANK_PATH, "#80deea"));

        // 7 - AC seal oil pump
        p.add(symbolPlacement(7, "AC Seal Oil Pump", "Primary AC-driven seal oil pump. Normally running.", "pump",
            json(mapOf("schemaVersion", 1, "pumpRunning", true, "pumpDeltaP", 45, "pumpEfficiency", 0.88, "maxFlow", 600, "minInletPressure", 5)),
            280, 540, 90, 90, "centrifugal-pump", PUMP_PATH, "#ffb74d"));

        // 8 - DC seal oil pump (backup)
        p.add(symbolPlacement(8, "DC Seal Oil Pump", "Backup DC-driven pump. Auto-starts on AC failure or low DP.", "pump",
            json(mapOf("schemaVersion", 1, "pumpRunning", false, "pumpDeltaP", 40, "pumpEfficiency", 0.82, "maxFlow", 500, "minInletPressure", 5)),
            280, 700, 90, 90, "centrifugal-pump", PUMP_PATH, "#ffb74d"));

        // 9 - Pump discharge header
        p.add(circlePlacement(9, "Pump Discharge Header", "junction",
            json(mapOf("schemaVersion", 1)),
            460, 620, 24, 24, "#ffffff"));

        // 10 - Pressure regulator (differential pressure control valve)
        p.add(symbolPlacement(10, "DP Regulator", "Differential pressure control valve. Maintains seal oil pressure above H2 pressure.", "valve",
            json(mapOf("schemaVersion", 1, "valvePosition", "throttled", "throttlePercent", 60, "cvCoefficient", 400)),
            560, 600, 70, 90, "cv", CV_PATH, "#8bc34a"));

        // 11 - Seal oil supply header (splits to both seals)
        p.add(circlePlacement(11, "Seal Oil Header", "junction",
            json(mapOf("schemaVersion", 1)),
            720, 620, 24, 24, "#ffffff"));

        // 12 - Pressure gauge on header
        p.add(symbolPlacement(12, "Seal Oil PG", "Pressure gauge on seal oil supply header.", "instrument",
            json(mapOf("schemaVersion", 1, "measuredProperty", "pressure")),
            700, 520, 50, 50, "pressure-indicator", "M 20,2 a 18,18 0 1,0 0,36 a 18,18 0 1,0 0,-36 M 20,20 L 28,8", "#cddc39"));

        // 13 - H2 seal inlet valve (supply goes UP to seal)
        p.add(symbolPlacement(13, "H2 Seal Supply Valve", "Supply isolation valve to hydrogen seal.", "valve",
            json(mapOf("schemaVersion", 1, "valvePosition", "open")),
            710, 360, 60, 50, "manual-valve", MANUAL_VALVE_PATH, "#8bc34a"));

        // 14 - Air seal inlet valve (supply goes UP to seal)
        p.add(symbolPlacement(14, "Air Seal Supply Valve", "Supply isolation valve to collector-end seal.", "valve",
            json(mapOf("schemaVersion", 1, "valvePosition", "open")),
            1350, 360, 60, 50, "manual-valve", MANUAL_VALVE_PATH, "#8bc34a"));

        // ══════════════════════════════════════════
        // ROW 3: Seal oil drain section (below generator)
        // H2 side drains left, air side drains right
        // ══════════════════════════════════════════

        // 15 - H2 seal drain pot (below H2 seal)
        p.add(symbolPlacement(15, "H2 Drain Pot", "Collects H2-side seal oil drain. Float maintains oil seal against H2.", "vessel",
            json(mapOf("schemaVersion", 1, "volume", 80, "currentLevel", 45, "minLevel", 15, "maxPressure", 70, "sourcePressure", 55)),
            700, 860, 80, 100, "drain-pot", DRAIN_POT_PATH, "#7986cb"));

        // 16 - Float trap (below H2 drain pot)
        p.add(symbolPlacement(16, "Float Trap", "Float-operated trap. Allows oil to pass, prevents H2 gas blowthrough.", "valve",
            json(mapOf("schemaVersion", 1, "valvePosition", "open")),
            710, 1020, 60, 70, "float-trap", FLOAT_TRAP_PATH, "#9fa8da"));

        // 17 - Air seal drain pot (below air seal)
        p.add(symbolPlacement(17, "Air Side Drain Pot", "Collects collector-end seal drain. Oil contains entrained air.", "vessel",
            json(mapOf("schemaVersion", 1, "volume", 80, "currentLevel", 50, "minLevel", 15, "maxPressure", 25, "sourcePressure", 10)),
            1350, 860, 80, 100, "drain-pot", DRAIN_POT_PATH, "#a5d6a7"));

        // ══════════════════════════════════════════
        // ROW 4: Return paths
        // Left: H2 path → Vacuum Tank → to main oil tank
        // Right: Air path → Air Detraining → to main oil tank
        // ══════════════════════════════════════════

        // 18 - Seal oil vacuum tank (center, H2 return path)
        p.add(symbolPlacement(18, "Seal Oil Vacuum Tank", "Removes dissolved H2 from seal oil under vacuum. Float controls oil level.", "vessel",
            json(mapOf("schemaVersion", 1, "volume", 2000, "currentLevel", 40, "minLevel", 15, "maxPressure", 15, "sourcePressure", 2)),
            950, 1100, 160, 200, "vertical-vessel", VERTICAL_VESSEL_PATH, "#ce93d8"));

        // 19 - Vacuum breaker (right of vacuum tank)
        p.add(symbolPlacement(19, "Vacuum Breaker", "Prevents excessive vacuum in seal oil vacuum tank.", "valve",
            json(mapOf("schemaVersion", 1, "valvePosition", "closed")),
            1180, 1100, 60, 50, "relief-valve", "M 0,12 L 14,12 L 20,6 L 26,12 L 40,12 M 20,6 L 20,-4 M 14,-4 L 26,-4 M 12,16 L 28,16", "#ef9a9a"));

        // 20 - H2 vent (above vacuum tank, to outside)
        p.add(rectPlacement(20, "To Outside Building (H2 Vent)", "Hydrogen gas vented from vacuum tank to safe area outside.", "sink",
            json(mapOf("schemaVersion", 1)),
            1180, 1020, 140, 40, "#ef9a9a"));

        // 21 - Air detraining section (far left, below bearing drain)
        p.add(symbolPlacement(21, "Air Detraining Section", "Baffled tank removes entrained air from bearing/seal oil before return to reservoir.", "vessel",
            json(mapOf("schemaVersion", 1, "volume", 5000, "currentLevel", 60, "minLevel", 20, "maxPressure", 20, "sourcePressure", 5)),
            100, 1100, 160, 200, "detraining-tank", DETRAINING_TANK_PATH, "#fff59d"));

        // 22 - Bearing oil drain header (junction between air drain path and detraining)
        p.add(circlePlacement(22, "Bearing Oil Drain", "junction",
            json(mapOf("schemaVersion", 1)),
            100, 920, 24, 24, "#ffffff"));

        // ══════════════════════════════════════════
        // ROW 5: Return to main oil tank (bottom)
        // ══════════════════════════════════════════

        // 23 - Main oil tank (bottom center)
        p.add(symbolPlacement(23, "Main Oil Tank", "Main lube/seal oil reservoir. Receives clean oil from both return paths.", "vessel",
            json(mapOf("schemaVersion", 1, "volume", 50000, "currentLevel", 72, "minLevel", 40, "maxPressure", 15, "sourcePressure", 1)),
            500, 1500, 180, 200, "tank", TANK_PATH, "#80deea"));

        // 24 - Sight glass / oil level gauge (on vacuum tank)
        p.add(symbolPlacement(24, "Sight Glass", "Visual oil level indicator on vacuum tank.", "instrument",
            json(mapOf("schemaVersion", 1, "measuredProperty", "flow")),
            1180, 1200, 50, 50, "level-indicator", "M 20,20 m -15,0 a 15,15 0 1,0 30,0 a 15,15 0 1,0 -30,0 M 12,24 L 28,24 M 16,16 L 24,16", "#cddc39"));

        return p;
    }

    private List<Map<String, Object>> buildSealOilConnections() {
        List<Map<String, Object>> c = new ArrayList<>();

        // ─── Supply path ───
        c.add(connection(1, 6, 7, "right", "left", "AC Pump Suction", 8, 20, 0.02, 0));
        c.add(connection(2, 6, 8, "right", "left", "DC Pump Suction", 8, 20, 0.02, 0));
        c.add(connection(3, 7, 9, "right", "left", "AC Pump Discharge", 6, 15, 0.02, 0));
        c.add(connection(4, 8, 9, "right", "bottom", "DC Pump Discharge", 6, 15, 0.02, 0));
        c.add(connection(5, 9, 10, "right", "left", "To Regulator", 6, 12, 0.02, 0));
        c.add(connection(6, 10, 11, "right", "left", "Regulated Supply", 6, 10, 0.02, 0));

        // ─── Pressure gauge tap ───
        c.add(connection(7, 11, 12, "top", "bottom", "PG Tap", 2, 5, 0.01, 0));

        // ─── Header to seal supply valves ───
        c.add(connection(8, 11, 13, "top", "bottom", "H2 Seal Supply", 4, 18, 0.02, 0));
        c.add(connection(9, 11, 14, "right", "bottom", "Air Seal Supply", 4, 18, 0.02, 0));

        // ─── Supply valves UP to seals ───
        c.add(connection(10, 13, 1, "top", "bottom", "To H2 Seal", 4, 8, 0.02, 0));
        c.add(connection(11, 14, 3, "top", "bottom", "To Air Seal", 4, 8, 0.02, 0));

        // ─── Generator shaft connections (visual) ───
        c.add(connection(12, 1, 2, "right", "left", "Turbine End Shaft", 0, 0, 0, 0));
        c.add(connection(13, 2, 3, "right", "left", "Collector End Shaft", 0, 0, 0, 0));
        c.add(connection(14, 3, 4, "right", "left", "To Exciter", 0, 0, 0, 0));
        c.add(connection(15, 4, 5, "right", "left", "To Bearing", 0, 0, 0, 0));

        // ─── Seal drains DOWN to drain pots ───
        c.add(connection(16, 1, 15, "bottom", "top", "H2 Seal Drain", 4, 12, 0.02, 0));
        c.add(connection(17, 3, 17, "bottom", "top", "Air Seal Drain", 4, 12, 0.02, 0));

        // ─── H2 drain path: drain pot → float trap → vacuum tank ───
        c.add(connection(18, 15, 16, "bottom", "top", "H2 Drain to Trap", 4, 8, 0.02, 0));
        c.add(connection(19, 16, 18, "bottom", "top", "To Vacuum Tank", 4, 15, 0.02, 0));

        // ─── Vacuum tank: H2 vent out, oil drain down ───
        c.add(connection(20, 18, 20, "right", "left", "H2 Vent to Outside", 2, 10, 0.01, 0));
        c.add(connection(21, 18, 24, "right", "left", "Sight Glass", 2, 3, 0, 0));
        c.add(connection(22, 18, 23, "bottom", "top", "Vacuum Tank Drain", 4, 15, 0.02, 0));

        // ─── Air drain path: drain pot → bearing drain → detraining → main tank ───
        c.add(connection(23, 17, 22, "bottom", "left", "Air Drain to Bearing Header", 4, 20, 0.02, 0));
        c.add(connection(24, 5, 22, "bottom", "top", "Bearing Oil Drain", 4, 15, 0.02, 0));
        c.add(connection(25, 22, 21, "bottom", "top", "To Air Detraining", 6, 12, 0.02, 0));
        c.add(connection(26, 21, 23, "bottom", "left", "To Main Oil Tank", 6, 15, 0.02, 0));

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
