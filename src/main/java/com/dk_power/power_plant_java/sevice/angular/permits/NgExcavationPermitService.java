package com.dk_power.power_plant_java.sevice.angular.permits;

import com.dk_power.power_plant_java.dto.permits.ExcavationPermitDto;
import com.dk_power.power_plant_java.entities.permits.ExcavationPermit;
import com.dk_power.power_plant_java.mappers.permits.ExcavationPermitMapper;
import com.dk_power.power_plant_java.repository.permits.ExcavationPermitRepo;
import com.dk_power.power_plant_java.sevice.angular.NgValueService;
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
public class NgExcavationPermitService implements NgCrudService<ExcavationPermit, ExcavationPermitDto, ExcavationPermitRepo, ExcavationPermitMapper> {
    private final ExcavationPermitRepo repo;
    private final ExcavationPermitMapper mapper;
    private final PermitNumberGenerator permitNumberGenerator;
    private final SessionFactory sessionFactory;
    private final EntityManager entityManager;
    private final PermitModificationTracker modificationTracker;
    private final NgValueService ngValueService;

    @Override public ExcavationPermitRepo getRepo() { return repo; }
    @Override public ExcavationPermitMapper getMapper() { return mapper; }
    @Override public SessionFactory getSessionFactory() { return sessionFactory; }
    @Override public ExcavationPermitDto getDto() { return new ExcavationPermitDto(); }
    @Override public ExcavationPermit getEntity() { return new ExcavationPermit(); }
    @Override public EntityManager getEntityManager() { return entityManager; }
    @Override public Class<ExcavationPermit> getEntityClass() { return ExcavationPermit.class; }

    @Override
    public ExcavationPermit save(ExcavationPermitDto dto) {
        ExcavationPermit oldEntity = dto.getId() != null ? repo.findById(dto.getId()).orElse(null) : null;
        ExcavationPermit entity = mapper.convertToEntity(dto);
        if (oldEntity == null && entity.getPermitStatus() == null) {
            entity.setPermitStatus(ngValueService.createValue("Permit Status", "Building"));
        }
        ExcavationPermit saved = repo.save(entity);
        if (oldEntity != null) {
            modificationTracker.trackPermitUpdate("ExcavationPermit", saved.getId(), oldEntity, saved);
        }
        return saved;
    }

    public ExcavationPermitDto createPermit(ExcavationPermitDto dto) {
        ExcavationPermit entity = mapper.convertToEntity(dto);
        if (entity.getPermitStatus() == null) {
            entity.setPermitStatus(ngValueService.createValue("Permit Status", "Building"));
        }
        ExcavationPermit saved = repo.save(entity);
        if (saved.getPermitNumber() == null || saved.getPermitNumber().isEmpty()) {
            saved.setPermitNumber(permitNumberGenerator.generate(saved.getDate()));
            saved = repo.save(saved);
        }
        return mapper.convertToDto(saved);
    }

    @Override
    public List<ExcavationPermitDto> getAllDtos() {
        return getAll().stream().map(mapper::convertToDto).toList();
    }

    public ExcavationPermitDto updatePermit(String id, ExcavationPermitDto dto) {
        dto.setId(Long.parseLong(id));
        ExcavationPermit saved = repo.save(mapper.convertToEntity(dto));
        return mapper.convertToDto(saved);
    }

    public List<ExcavationPermitDto> saveAll(List<ExcavationPermitDto> permits) {
        return permits.stream().map(this::save).map(saved -> {
            if (saved.getPermitNumber() == null || saved.getPermitNumber().isEmpty()) {
                saved.setPermitNumber(permitNumberGenerator.generate(saved.getDate()));
                saved = repo.save(saved);
            }
            return mapper.convertToDto(saved);
        }).toList();
    }
}
