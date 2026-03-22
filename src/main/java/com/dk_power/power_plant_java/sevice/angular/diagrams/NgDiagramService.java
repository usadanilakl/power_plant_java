package com.dk_power.power_plant_java.sevice.angular.diagrams;

import com.dk_power.power_plant_java.dto.diagrams.DiagramDto;
import com.dk_power.power_plant_java.entities.diagrams.Diagram;
import com.dk_power.power_plant_java.mappers.diagrams.DiagramMapper;
import com.dk_power.power_plant_java.repository.diagrams.DiagramRepo;
import com.dk_power.power_plant_java.sevice.angular.base.NgCrudService;
import jakarta.persistence.EntityManager;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.hibernate.SessionFactory;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@Transactional
@RequiredArgsConstructor
public class NgDiagramService implements NgCrudService<Diagram, DiagramDto, DiagramRepo, DiagramMapper> {
    private final DiagramRepo repo;
    private final DiagramMapper mapper;
    private final SessionFactory sessionFactory;
    private final EntityManager entityManager;

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
}
