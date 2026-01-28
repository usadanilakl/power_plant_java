package com.dk_power.power_plant_java.sevice.angular.equipment;

import com.dk_power.power_plant_java.dto.equipment.HighlightDto;
import com.dk_power.power_plant_java.entities.equipment.Highlight;
import com.dk_power.power_plant_java.mappers.equipment.HighlightMapper;
import com.dk_power.power_plant_java.repository.equipment.HighlightRepo;
import com.dk_power.power_plant_java.sevice.angular.base.NgCrudService;
import jakarta.persistence.EntityManager;
import lombok.RequiredArgsConstructor;
import org.hibernate.SessionFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional
public class NgHighlightService implements NgCrudService<Highlight, HighlightDto, HighlightRepo, HighlightMapper> {
    private final HighlightRepo highlightRepo;
    private final HighlightMapper highlightMapper;
    private final SessionFactory sessionFactory;
    private final EntityManager entityManager;

    @Override
    public HighlightRepo getRepo() {
        return highlightRepo;
    }

    @Override
    public HighlightMapper getMapper() {
        return highlightMapper;
    }

    @Override
    public SessionFactory getSessionFactory() {
        return sessionFactory;
    }

    @Override
    public HighlightDto getDto() {
        return new HighlightDto();
    }

    @Override
    public Highlight getEntity() {
        return new Highlight();
    }

    @Override
    public Highlight toEntity(HighlightDto dto) {
        return highlightMapper.convertToEntity(dto);
    }

    @Override
    public HighlightDto toDto(Highlight entity) {
        return highlightMapper.convertToDto(entity);
    }

    @Override
    public Class<Highlight> getEntityClass() {
        return Highlight.class;
    }

    public EntityManager getEntityManager() {
        return entityManager;
    }
}
