package com.dk_power.power_plant_java.sevice.angular.permits;

import com.dk_power.power_plant_java.dto.permits.VentingPermitDto;
import com.dk_power.power_plant_java.entities.permits.VentingPermit;
import com.dk_power.power_plant_java.mappers.permits.VentingPermitMapper;
import com.dk_power.power_plant_java.repository.permits.VentingPermitRepo;
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
public class NgVentingPermitService implements NgCrudService<VentingPermit, VentingPermitDto, VentingPermitRepo, VentingPermitMapper> {
    private final VentingPermitRepo repo;
    private final VentingPermitMapper mapper;
    private final PermitNumberGenerator permitNumberGenerator;
    private final SessionFactory sessionFactory;
    private final EntityManager entityManager;
    private final PermitModificationTracker modificationTracker;
    private final NgValueService ngValueService;

    @Override public VentingPermitRepo getRepo() { return repo; }
    @Override public VentingPermitMapper getMapper() { return mapper; }
    @Override public SessionFactory getSessionFactory() { return sessionFactory; }
    @Override public VentingPermitDto getDto() { return new VentingPermitDto(); }
    @Override public VentingPermit getEntity() { return new VentingPermit(); }
    @Override public EntityManager getEntityManager() { return entityManager; }
    @Override public Class<VentingPermit> getEntityClass() { return VentingPermit.class; }

    @Override
    public VentingPermit save(VentingPermitDto dto) {
        VentingPermit oldEntity = dto.getId() != null ? repo.findById(dto.getId()).orElse(null) : null;
        VentingPermit entity = mapper.convertToEntity(dto);
        if (oldEntity == null && isUnset(entity.getPermitStatus())) {
            entity.setPermitStatus(ngValueService.createValue("Permit Status", "Building"));
        }
        VentingPermit saved = repo.save(entity);
        if (oldEntity != null) {
            modificationTracker.trackPermitUpdate("VentingPermit", saved.getId(), oldEntity, saved);
        }
        return saved;
    }

    public VentingPermitDto createPermit(VentingPermitDto dto) {
        VentingPermit entity = mapper.convertToEntity(dto);
        if (isUnset(entity.getPermitStatus())) {
            entity.setPermitStatus(ngValueService.createValue("Permit Status", "Building"));
        }
        VentingPermit saved = repo.save(entity);
        if (saved.getPermitNumber() == null || saved.getPermitNumber().isEmpty()) {
            saved.setPermitNumber(permitNumberGenerator.generate(saved.getDate()));
            saved = repo.save(saved);
        }
        return mapper.convertToDto(saved);
    }

    @Override
    public List<VentingPermitDto> getAllDtos() {
        return getAll().stream().map(mapper::convertToDto).toList();
    }

    public VentingPermitDto updatePermit(String id, VentingPermitDto dto) {
        dto.setId(Long.parseLong(id));
        VentingPermit saved = repo.save(mapper.convertToEntity(dto));
        return mapper.convertToDto(saved);
    }

    public List<VentingPermitDto> saveAll(List<VentingPermitDto> permits) {
        return permits.stream().map(this::save).map(saved -> {
            if (saved.getPermitNumber() == null || saved.getPermitNumber().isEmpty()) {
                saved.setPermitNumber(permitNumberGenerator.generate(saved.getDate()));
                saved = repo.save(saved);
            }
            return mapper.convertToDto(saved);
        }).toList();
    }

    /**
     * A client-side placeholder Value arrives with id 0, not null (Angular's BaseDto sets
     * id = data.id || 0). A plain == null guard therefore passes it straight through to merge(),
     * which throws "Unable to find Value with id 0" -- the HotWork create bug. These services are
     * immune today only because their mappers do not copy permitStatus at all; the moment one does,
     * the crash reappears. Guarding now so that mapper work is safe.
     */
    private boolean isUnset(com.dk_power.power_plant_java.entities.categories.Value v) {
        return v == null || v.getId() == null || v.getId() == 0L;
    }
}
