package com.dk_power.power_plant_java.sevice.angular.permits;

import com.dk_power.power_plant_java.dto.permits.EnergizedWorkPermitDto;
import com.dk_power.power_plant_java.entities.permits.EnergizedWorkPermit;
import com.dk_power.power_plant_java.mappers.permits.EnergizedWorkPermitMapper;
import com.dk_power.power_plant_java.repository.permits.EnergizedWorkPermitRepo;
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
public class NgEnergizedWorkPermitService implements NgCrudService<EnergizedWorkPermit, EnergizedWorkPermitDto, EnergizedWorkPermitRepo, EnergizedWorkPermitMapper> {
    private final EnergizedWorkPermitRepo repo;
    private final EnergizedWorkPermitMapper mapper;
    private final PermitNumberGenerator permitNumberGenerator;
    private final SessionFactory sessionFactory;
    private final EntityManager entityManager;
    private final PermitModificationTracker modificationTracker;
    private final NgValueService ngValueService;

    @Override public EnergizedWorkPermitRepo getRepo() { return repo; }
    @Override public EnergizedWorkPermitMapper getMapper() { return mapper; }
    @Override public SessionFactory getSessionFactory() { return sessionFactory; }
    @Override public EnergizedWorkPermitDto getDto() { return new EnergizedWorkPermitDto(); }
    @Override public EnergizedWorkPermit getEntity() { return new EnergizedWorkPermit(); }
    @Override public EntityManager getEntityManager() { return entityManager; }
    @Override public Class<EnergizedWorkPermit> getEntityClass() { return EnergizedWorkPermit.class; }

    @Override
    public EnergizedWorkPermit save(EnergizedWorkPermitDto dto) {
        EnergizedWorkPermit oldEntity = dto.getId() != null ? repo.findById(dto.getId()).orElse(null) : null;
        EnergizedWorkPermit entity = mapper.convertToEntity(dto);
        if (oldEntity == null && entity.getPermitStatus() == null) {
            entity.setPermitStatus(ngValueService.createValue("Permit Status", "Building"));
        }
        EnergizedWorkPermit saved = repo.save(entity);
        if (oldEntity != null) {
            modificationTracker.trackPermitUpdate("EnergizedWorkPermit", saved.getId(), oldEntity, saved);
        }
        return saved;
    }

    public EnergizedWorkPermitDto createPermit(EnergizedWorkPermitDto dto) {
        EnergizedWorkPermit entity = mapper.convertToEntity(dto);
        if (entity.getPermitStatus() == null) {
            entity.setPermitStatus(ngValueService.createValue("Permit Status", "Building"));
        }
        EnergizedWorkPermit saved = repo.save(entity);
        if (saved.getPermitNumber() == null || saved.getPermitNumber().isEmpty()) {
            saved.setPermitNumber(permitNumberGenerator.generate(saved.getDate()));
            saved = repo.save(saved);
        }
        return mapper.convertToDto(saved);
    }

    @Override
    public List<EnergizedWorkPermitDto> getAllDtos() {
        return getAll().stream().map(mapper::convertToDto).toList();
    }

    public EnergizedWorkPermitDto updatePermit(String id, EnergizedWorkPermitDto dto) {
        dto.setId(Long.parseLong(id));
        EnergizedWorkPermit saved = repo.save(mapper.convertToEntity(dto));
        return mapper.convertToDto(saved);
    }

    public List<EnergizedWorkPermitDto> saveAll(List<EnergizedWorkPermitDto> permits) {
        return permits.stream().map(mapper::convertToEntity).map(repo::save).map(mapper::convertToDto).toList();
    }
}
