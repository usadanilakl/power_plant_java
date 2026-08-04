package com.dk_power.power_plant_java.sevice.angular.permits;

import com.dk_power.power_plant_java.dto.permits.HotWorkDto;
import com.dk_power.power_plant_java.entities.permits.HotWork;
import com.dk_power.power_plant_java.mappers.permits.HotWorkMapper;
import com.dk_power.power_plant_java.repository.permits.HotWorkRepo;
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
public class NgHotWorkService implements NgCrudService<HotWork, HotWorkDto, HotWorkRepo, HotWorkMapper> {
    private final SessionFactory sessionFactory;
    private final EntityManager entityManager;
    private final HotWorkRepo hotWorkRepo;
    private final HotWorkMapper hotWorkMapper;
    private final PermitNumberGenerator permitNumberGenerator;
    private final PermitModificationTracker modificationTracker;
    private final NgValueService ngValueService;

    @Override
    public HotWorkRepo getRepo() {
        return hotWorkRepo;
    }

    @Override
    public HotWorkMapper getMapper() {
        return hotWorkMapper;
    }

    @Override
    public SessionFactory getSessionFactory() {
        return sessionFactory;
    }

    @Override
    public HotWorkDto getDto() {
        return new HotWorkDto();
    }

    @Override
    public HotWork getEntity() {
        return new HotWork();
    }

    @Override
    public EntityManager getEntityManager() {
        return entityManager;
    }

    @Override
    public Class<HotWork> getEntityClass() {
        return HotWork.class;
    }

    /** A client-side placeholder Value (`new ValueDto()`) arrives with id 0, not null. */
    private boolean isUnset(com.dk_power.power_plant_java.entities.categories.Value v) {
        return v == null || v.getId() == null || v.getId() == 0L;
    }

    @Override
    public HotWork save(HotWorkDto dto) {
        HotWork oldEntity = dto.getId() != null ? hotWorkRepo.findById(dto.getId()).orElse(null) : null;
        HotWork hotWork = hotWorkMapper.convertToEntity(dto);
        if (oldEntity == null && isUnset(hotWork.getPermitStatus())) {
            hotWork.setPermitStatus(ngValueService.createValue("Permit Status", "Building"));
        }
        HotWork saved = hotWorkRepo.save(hotWork);
        if (oldEntity != null) {
            modificationTracker.trackPermitUpdate("HotWork", saved.getId(), oldEntity, saved);
        }
        return saved;
    }

    public HotWorkDto createHotWorkRequest(HotWorkDto hotWorkDto) {
        HotWork entity = toEntity(hotWorkDto);
        // Unlike its siblings this path uses the generic ModelMapper-based toEntity(), which DOES
        // map permitStatus — and the Angular DTO defaults it to `new ValueDto()`, i.e. id 0. That
        // placeholder is non-null, so a plain `== null` guard was skipped and the subsequent
        // merge() blew up with "Unable to find Value with id 0". Treat id 0/null as "no status".
        if (isUnset(entity.getPermitStatus())) {
            entity.setPermitStatus(ngValueService.createValue("Permit Status", "Building"));
        }
        HotWork saved = save(entity);
        if (saved.getPermitNumber() == null || saved.getPermitNumber().isEmpty()) {
            saved.setPermitNumber(permitNumberGenerator.generate(saved.getDate()));
            saved = hotWorkRepo.save(saved);
        }
        return toDto(saved);
    }

    public HotWorkDto updateHotWorkRequest(String id, HotWorkDto hotWorkDto) {
        HotWork entity = getEntityById(id);
        entity.setMeasures(hotWorkDto.getMeasures());
        return toDto(save(entity));
    }

    @Override
    public List<HotWorkDto> getAllDtos() {
        return getAll().stream().map(hotWorkMapper::convertToDto).toList();
    }

    public List<HotWorkDto> saveAll(List<HotWorkDto> permits) {
        return permits.stream().map(this::save).map(saved -> {
            if (saved.getPermitNumber() == null || saved.getPermitNumber().isEmpty()) {
                saved.setPermitNumber(permitNumberGenerator.generate(saved.getDate()));
                saved = hotWorkRepo.save(saved);
            }
            return hotWorkMapper.convertToDto(saved);
        }).toList();
    }
}
