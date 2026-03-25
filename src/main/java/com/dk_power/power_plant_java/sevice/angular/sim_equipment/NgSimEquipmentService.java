package com.dk_power.power_plant_java.sevice.angular.sim_equipment;

import com.dk_power.power_plant_java.dto.sim_equipment.SimEquipmentDto;
import com.dk_power.power_plant_java.entities.equipment.Equipment;
import com.dk_power.power_plant_java.entities.loto.LotoPoint;
import com.dk_power.power_plant_java.entities.sim_equipment.SimEquipment;
import com.dk_power.power_plant_java.entities.sim_equipment.SimRole;
import com.dk_power.power_plant_java.entities.sim_equipment.SourceEntityType;
import com.dk_power.power_plant_java.mappers.sim_equipment.SimEquipmentMapper;
import com.dk_power.power_plant_java.repository.equipment.EquipmentRepo;
import com.dk_power.power_plant_java.repository.loto.LotoPointRepo;
import com.dk_power.power_plant_java.repository.sim_equipment.SimEquipmentRepo;
import com.dk_power.power_plant_java.sevice.angular.base.NgCrudService;
import jakarta.persistence.EntityManager;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.hibernate.SessionFactory;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
@Transactional
@RequiredArgsConstructor
public class NgSimEquipmentService implements NgCrudService<SimEquipment, SimEquipmentDto, SimEquipmentRepo, SimEquipmentMapper> {
    private final SimEquipmentRepo repo;
    private final SimEquipmentMapper mapper;
    private final SessionFactory sessionFactory;
    private final EntityManager entityManager;
    private final LotoPointRepo lotoPointRepo;
    private final EquipmentRepo equipmentRepo;

    @Override public SimEquipmentRepo getRepo() { return repo; }
    @Override public SimEquipmentMapper getMapper() { return mapper; }
    @Override public SessionFactory getSessionFactory() { return sessionFactory; }
    @Override public SimEquipmentDto getDto() { return new SimEquipmentDto(); }
    @Override public SimEquipment getEntity() { return new SimEquipment(); }
    @Override public EntityManager getEntityManager() { return entityManager; }
    @Override public Class<SimEquipment> getEntityClass() { return SimEquipment.class; }

    @Override
    public List<SimEquipmentDto> getAllDtos() {
        return getAll().stream().map(mapper::convertToDto).toList();
    }

    public SimEquipmentDto createSimEquipment(SimEquipmentDto dto) {
        SimEquipment entity = mapper.convertToEntity(dto);
        SimEquipment saved = repo.save(entity);
        return mapper.convertToDto(saved);
    }

    public SimEquipmentDto updateSimEquipment(String id, SimEquipmentDto dto) {
        dto.setId(Long.parseLong(id));
        SimEquipment entity = mapper.convertToEntity(dto);
        SimEquipment saved = repo.save(entity);
        return mapper.convertToDto(saved);
    }

    public SimEquipmentDto getSimEquipmentById(String id) {
        SimEquipment entity = getEntityById(id);
        return mapper.convertToDto(entity);
    }

    public List<SimEquipmentDto> searchByName(String query) {
        return repo.searchByNameOrDescription(query).stream()
            .map(mapper::convertToDto).toList();
    }

    public Optional<SimEquipmentDto> findBySource(SourceEntityType type, Long id) {
        return repo.findBySourceEntityTypeAndSourceEntityId(type, id)
            .map(mapper::convertToDto);
    }

    /**
     * Idempotent: returns existing SimEquipment if already mapped to this LotoPoint,
     * creates a new one otherwise.
     */
    public SimEquipmentDto fromLotoPoint(Long lotoPointId) {
        // Check if already exists
        Optional<SimEquipment> existing = repo.findBySourceEntityTypeAndSourceEntityId(
            SourceEntityType.LOTO_POINT, lotoPointId
        );
        if (existing.isPresent()) {
            return mapper.convertToDto(existing.get());
        }

        // Create from LotoPoint
        LotoPoint lp = lotoPointRepo.findById(lotoPointId)
            .orElseThrow(() -> new RuntimeException("LotoPoint not found: " + lotoPointId));

        SimEquipment se = new SimEquipment();
        se.setName(lp.getTagNumber());
        se.setDescription(lp.getDescription());
        se.setSimRole(SimRole.VALVE); // default — user can change
        se.setSimParamsJson("{\"schemaVersion\":1,\"valvePosition\":\"open\"}");
        se.setSourceEntityType(SourceEntityType.LOTO_POINT);
        se.setSourceEntityId(lotoPointId);
        se.setDefaultWidth(40);
        se.setDefaultHeight(40);

        SimEquipment saved = repo.save(se);
        return mapper.convertToDto(saved);
    }

    /**
     * Idempotent: returns existing SimEquipment if already mapped to this Equipment,
     * creates a new one otherwise.
     */
    public SimEquipmentDto fromEquipment(Long equipmentId) {
        Optional<SimEquipment> existing = repo.findBySourceEntityTypeAndSourceEntityId(
            SourceEntityType.EQUIPMENT, equipmentId
        );
        if (existing.isPresent()) {
            return mapper.convertToDto(existing.get());
        }

        Equipment equipment = equipmentRepo.findById(equipmentId)
            .orElseThrow(() -> new RuntimeException("Equipment not found: " + equipmentId));

        SimEquipment se = new SimEquipment();
        se.setName(equipment.getTagNumber());
        se.setDescription(equipment.getDescription());
        se.setSymbolId(equipment.getSymbolId());
        se.setSvgPath(equipment.getSvgPath());
        se.setSimRole(equipment.getSymbolId() != null && equipment.getSymbolId().toLowerCase().contains("pump")
            ? SimRole.PUMP
            : SimRole.JUNCTION);
        se.setSimParamsJson("{\"schemaVersion\":1}");
        se.setSourceEntityType(SourceEntityType.EQUIPMENT);
        se.setSourceEntityId(equipmentId);
        se.setDefaultWidth(40);
        se.setDefaultHeight(40);

        SimEquipment saved = repo.save(se);
        return mapper.convertToDto(saved);
    }
}
