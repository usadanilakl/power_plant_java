package com.dk_power.power_plant_java.sevice.angular.permits;

import com.dk_power.power_plant_java.dto.permits.SafeWorkDto;
import com.dk_power.power_plant_java.entities.permits.SafeWork;
import com.dk_power.power_plant_java.mappers.permits.SafeWorkMapper;
import com.dk_power.power_plant_java.repository.permits.SafeWorkRepo;
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
public class NgSafeWorkService implements NgCrudService<SafeWork, SafeWorkDto, SafeWorkRepo, SafeWorkMapper> {
    private final SafeWorkRepo safeWorkRepo;
    private final SafeWorkMapper safeWorkMapper;
    private final PermitNumberGenerator permitNumberGenerator;
    private final SessionFactory sessionFactory;
    private final EntityManager entityManager;
    private final PermitModificationTracker modificationTracker;
    private final NgValueService ngValueService;

    @Override
    public SafeWorkRepo getRepo() {
        return safeWorkRepo;
    }

    @Override
    public SafeWorkMapper getMapper() {
        return safeWorkMapper;
    }

    @Override
    public SessionFactory getSessionFactory() {
        return sessionFactory;
    }

    @Override
    public SafeWorkDto getDto() {
        return new SafeWorkDto();
    }

    @Override
    public SafeWork getEntity() {
        return new SafeWork();
    }

    @Override
    public EntityManager getEntityManager() {
        return entityManager;
    }

    @Override
    public Class<SafeWork> getEntityClass() {
        return SafeWork.class;
    }

    @Override
    public SafeWork save(SafeWorkDto dto) {
        SafeWork oldEntity = dto.getId() != null ? safeWorkRepo.findById(dto.getId()).orElse(null) : null;
        SafeWork sw = safeWorkMapper.convertToEntity(dto);
        if (oldEntity == null && isUnset(sw.getPermitStatus())) {
            sw.setPermitStatus(ngValueService.createValue("Permit Status", "Building"));
        }
        SafeWork saved = safeWorkRepo.save(sw);
        if (oldEntity != null) {
            modificationTracker.trackPermitUpdate("SafeWork", saved.getId(), oldEntity, saved);
        }
        return saved;
    }

    public SafeWorkDto createSafeWork(SafeWorkDto safeWorkDto) {
        SafeWork safeWork = safeWorkMapper.convertToEntity(safeWorkDto);
        if (isUnset(safeWork.getPermitStatus())) {
            safeWork.setPermitStatus(ngValueService.createValue("Permit Status", "Building"));
        }
        SafeWork saved = safeWorkRepo.save(safeWork);
        if (saved.getPermitNumber() == null || saved.getPermitNumber().isEmpty()) {
            saved.setPermitNumber(permitNumberGenerator.generate(saved.getDate()));
            saved = safeWorkRepo.save(saved);
        }
        return safeWorkMapper.convertToDto(saved);
    }

    @Override
    public List<SafeWorkDto> getAllDtos() {
        return getAll().stream().map(safeWorkMapper::convertToDto).toList();
    }

    public List<SafeWorkDto> saveAll(List<SafeWorkDto> permits) {
        return permits.stream().map(this::save).map(saved -> {
            if (saved.getPermitNumber() == null || saved.getPermitNumber().isEmpty()) {
                saved.setPermitNumber(permitNumberGenerator.generate(saved.getDate()));
                saved = safeWorkRepo.save(saved);
            }
            return safeWorkMapper.convertToDto(saved);
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

    /**
     * Use the hand-written mapper, not the generic ModelMapper in NgCrudService#toDto.
     *
     * <p>Without this, get-by-id (which goes through toDto) and get-all (which calls
     * safeWorkMapper.convertToDto directly) returned the SAME permit in two DIFFERENT shapes —
     * the generic path carries fields the hand mapper drops and vice versa. A printable-form cell
     * verified against one endpoint could therefore be silently wrong when the permit was opened
     * the other way.
     */
    @Override
    public SafeWorkDto toDto(SafeWork entity) {
        return safeWorkMapper.convertToDto(entity);
    }
}
