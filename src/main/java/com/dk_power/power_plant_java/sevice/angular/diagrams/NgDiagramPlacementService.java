package com.dk_power.power_plant_java.sevice.angular.diagrams;

import com.dk_power.power_plant_java.dto.diagrams.DiagramPlacementDto;
import com.dk_power.power_plant_java.entities.diagrams.Diagram;
import com.dk_power.power_plant_java.entities.diagrams.DiagramPlacement;
import com.dk_power.power_plant_java.mappers.diagrams.DiagramPlacementMapper;
import com.dk_power.power_plant_java.repository.diagrams.DiagramPlacementRepo;
import com.dk_power.power_plant_java.repository.diagrams.DiagramRepo;
import com.dk_power.power_plant_java.sevice.angular.base.NgCrudService;
import jakarta.persistence.EntityManager;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.hibernate.SessionFactory;
import org.springframework.stereotype.Service;

import java.util.*;

@Service
@Transactional
@RequiredArgsConstructor
public class NgDiagramPlacementService implements NgCrudService<DiagramPlacement, DiagramPlacementDto, DiagramPlacementRepo, DiagramPlacementMapper> {
    private final DiagramPlacementRepo repo;
    private final DiagramPlacementMapper mapper;
    private final DiagramRepo diagramRepo;
    private final SessionFactory sessionFactory;
    private final EntityManager entityManager;

    @Override public DiagramPlacementRepo getRepo() { return repo; }
    @Override public DiagramPlacementMapper getMapper() { return mapper; }
    @Override public SessionFactory getSessionFactory() { return sessionFactory; }
    @Override public DiagramPlacementDto getDto() { return new DiagramPlacementDto(); }
    @Override public DiagramPlacement getEntity() { return new DiagramPlacement(); }
    @Override public EntityManager getEntityManager() { return entityManager; }
    @Override public Class<DiagramPlacement> getEntityClass() { return DiagramPlacement.class; }

    @Override
    public List<DiagramPlacementDto> getAllDtos() {
        return getAll().stream().map(mapper::convertToDto).toList();
    }

    public List<DiagramPlacementDto> getByDiagramId(Long diagramId) {
        return repo.findByDiagramIdOrderByLocalIdAsc(diagramId).stream()
            .map(mapper::convertToDto)
            .toList();
    }

    /**
     * Upsert placements for a diagram. Existing placements matched by localId are updated;
     * new placements are inserted; placements no longer in the incoming list are soft-deleted.
     * Preserves stable DB IDs for sync granularity.
     */
    public List<DiagramPlacementDto> bulkSave(Long diagramId, List<DiagramPlacementDto> dtos) {
        Diagram diagram = diagramRepo.findById(diagramId).orElseThrow(
            () -> new RuntimeException("Diagram not found: " + diagramId));

        // Index existing placements by localId
        List<DiagramPlacement> existing = repo.findByDiagramIdOrderByLocalIdAsc(diagramId);
        Map<Integer, DiagramPlacement> existingByLocalId = new HashMap<>();
        for (DiagramPlacement p : existing) {
            if (p.getLocalId() != null) existingByLocalId.put(p.getLocalId(), p);
        }

        Set<Integer> incomingLocalIds = new HashSet<>();
        List<DiagramPlacement> saved = new ArrayList<>();

        for (DiagramPlacementDto dto : dtos) {
            Integer localId = dto.getLocalId();
            if (localId != null) incomingLocalIds.add(localId);

            DiagramPlacement entity;
            if (localId != null && existingByLocalId.containsKey(localId)) {
                // Update existing — preserve DB ID
                entity = existingByLocalId.get(localId);
                mapper.updateEntity(entity, dto);
            } else {
                // New placement
                entity = mapper.convertToEntity(dto);
                entity.setDiagram(diagram);
            }
            saved.add(repo.save(entity));
        }

        // Soft-delete placements no longer present (including null-localId leftovers)
        for (DiagramPlacement p : existing) {
            if (p.getLocalId() == null || !incomingLocalIds.contains(p.getLocalId())) {
                p.setDeleted(true);
                repo.save(p);
            }
        }

        return saved.stream().map(mapper::convertToDto).toList();
    }

    public DiagramPlacementDto updatePlacement(Long id, DiagramPlacementDto dto) {
        DiagramPlacement existing = repo.findById(id).orElseThrow(
            () -> new RuntimeException("Placement not found: " + id));
        mapper.updateEntity(existing, dto);
        return mapper.convertToDto(repo.save(existing));
    }
}
