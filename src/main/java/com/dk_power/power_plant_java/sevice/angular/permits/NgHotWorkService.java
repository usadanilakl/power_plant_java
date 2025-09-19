package com.dk_power.power_plant_java.sevice.angular.permits;

import com.dk_power.power_plant_java.dto.permits.HotWorkDto;
import com.dk_power.power_plant_java.entities.permits.HotWork;
import com.dk_power.power_plant_java.mappers.permits.HotWorkMapper;
import com.dk_power.power_plant_java.repository.permits.HotWorkRepo;
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

    public HotWorkDto createHotWorkRequest(HotWorkDto hotWorkDto) {
        HotWork entity = toEntity(hotWorkDto);
        return toDto(save(entity));
    }

    public HotWorkDto updateHotWorkRequest(String id, HotWorkDto hotWorkDto) {
        HotWork entity = getEntityById(id);
        entity.setMeasures(hotWorkDto.getMeasures());
        return toDto(save(entity));
    }

    public List<HotWorkDto> saveAll(List<HotWorkDto> permits) {
        return permits.stream().map(hotWorkMapper::convertToEntity).map(hotWorkRepo::save).map(hotWorkMapper::convertToDto).toList();
    }
}
