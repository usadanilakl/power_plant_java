package com.dk_power.power_plant_java.sevice.angular.diagrams;

import com.dk_power.power_plant_java.dto.diagrams.DiagramConnectionDto;
import com.dk_power.power_plant_java.entities.diagrams.Diagram;
import com.dk_power.power_plant_java.entities.diagrams.DiagramConnection;
import com.dk_power.power_plant_java.mappers.diagrams.DiagramConnectionMapper;
import com.dk_power.power_plant_java.repository.diagrams.DiagramConnectionRepo;
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
public class NgDiagramConnectionService implements NgCrudService<DiagramConnection, DiagramConnectionDto, DiagramConnectionRepo, DiagramConnectionMapper> {
    private final DiagramConnectionRepo repo;
    private final DiagramConnectionMapper mapper;
    private final DiagramRepo diagramRepo;
    private final SessionFactory sessionFactory;
    private final EntityManager entityManager;

    @Override public DiagramConnectionRepo getRepo() { return repo; }
    @Override public DiagramConnectionMapper getMapper() { return mapper; }
    @Override public SessionFactory getSessionFactory() { return sessionFactory; }
    @Override public DiagramConnectionDto getDto() { return new DiagramConnectionDto(); }
    @Override public DiagramConnection getEntity() { return new DiagramConnection(); }
    @Override public EntityManager getEntityManager() { return entityManager; }
    @Override public Class<DiagramConnection> getEntityClass() { return DiagramConnection.class; }

    @Override
    public List<DiagramConnectionDto> getAllDtos() {
        return getAll().stream().map(mapper::convertToDto).toList();
    }

    public List<DiagramConnectionDto> getByDiagramId(Long diagramId) {
        return repo.findByDiagramIdOrderByLocalIdAsc(diagramId).stream()
            .map(mapper::convertToDto)
            .toList();
    }

    /**
     * Upsert connections for a diagram. Existing connections matched by localId are updated;
     * new connections are inserted; connections no longer in the incoming list are soft-deleted.
     * Preserves stable DB IDs for sync granularity.
     */
    public List<DiagramConnectionDto> bulkSave(Long diagramId, List<DiagramConnectionDto> dtos) {
        Diagram diagram = diagramRepo.findById(diagramId).orElseThrow(
            () -> new RuntimeException("Diagram not found: " + diagramId));

        List<DiagramConnection> existing = repo.findByDiagramIdOrderByLocalIdAsc(diagramId);
        Map<Integer, DiagramConnection> existingByLocalId = new HashMap<>();
        for (DiagramConnection c : existing) {
            if (c.getLocalId() != null) existingByLocalId.put(c.getLocalId(), c);
        }

        Set<Integer> incomingLocalIds = new HashSet<>();
        List<DiagramConnection> saved = new ArrayList<>();

        for (DiagramConnectionDto dto : dtos) {
            Integer localId = dto.getLocalId();
            if (localId != null) incomingLocalIds.add(localId);

            DiagramConnection entity;
            if (localId != null && existingByLocalId.containsKey(localId)) {
                entity = existingByLocalId.get(localId);
                mapper.updateEntity(entity, dto);
            } else {
                entity = mapper.convertToEntity(dto);
                entity.setDiagram(diagram);
            }
            saved.add(repo.save(entity));
        }

        // Soft-delete connections no longer present (including null-localId leftovers)
        for (DiagramConnection c : existing) {
            if (c.getLocalId() == null || !incomingLocalIds.contains(c.getLocalId())) {
                c.setDeleted(true);
                repo.save(c);
            }
        }

        return saved.stream().map(mapper::convertToDto).toList();
    }

    public DiagramConnectionDto updateConnection(Long id, DiagramConnectionDto dto) {
        DiagramConnection existing = repo.findById(id).orElseThrow(
            () -> new RuntimeException("Connection not found: " + id));
        mapper.updateEntity(existing, dto);
        return mapper.convertToDto(repo.save(existing));
    }
}
