package com.dk_power.power_plant_java.sevice.angular.diagrams;

import com.dk_power.power_plant_java.dto.diagrams.DiagramDto;
import com.dk_power.power_plant_java.entities.diagrams.Diagram;
import com.dk_power.power_plant_java.mappers.diagrams.DiagramMapper;
import com.dk_power.power_plant_java.repository.diagrams.DiagramRepo;
import com.dk_power.power_plant_java.sevice.angular.base.NgCrudService;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.persistence.EntityManager;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.hibernate.SessionFactory;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
@Transactional
@RequiredArgsConstructor
public class NgDiagramService implements NgCrudService<Diagram, DiagramDto, DiagramRepo, DiagramMapper> {
    private final DiagramRepo repo;
    private final DiagramMapper mapper;
    private final SessionFactory sessionFactory;
    private final EntityManager entityManager;
    private final ObjectMapper objectMapper;

    private static final String FEEDWATER_TEST_NAME = "Seed - Boiler Drum Feedwater Control Test";
    private static final String CV_PATH = "M 0,25 L 20,35 L 0,45 Z M 40,25 L 20,35 L 40,45 Z M 20,35 L 20,15 M 5,15 A 15,15 0 0 1 35,15 Z";
    private static final String PUMP_PATH = "M 20,20 m -15,0 a 15,15 0 1,0 30,0 a 15,15 0 1,0 -30,0 M 0,15 L 5,15 L 5,25 L 0,25 Z M 35,15 L 40,15 L 40,25 L 35,25 Z M 10,20 L 30,20 M 25,15 L 30,20 L 25,25";
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
}
