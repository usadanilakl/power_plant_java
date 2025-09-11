package com.dk_power.power_plant_java.sevice.angular.permits;

import com.dk_power.power_plant_java.dto.permits.SafeWorkDto;
import com.dk_power.power_plant_java.entities.permits.SafeWork;
import com.dk_power.power_plant_java.mappers.permits.SafeWorkMapper;
import com.dk_power.power_plant_java.repository.permits.SafeWorkRepo;
import com.dk_power.power_plant_java.sevice.angular.base.NgCrudService;
import jakarta.persistence.EntityManager;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.hibernate.SessionFactory;
import org.springframework.stereotype.Service;

@Service
@Transactional
@RequiredArgsConstructor
public class NgSafeWorkService implements NgCrudService<SafeWork, SafeWorkDto, SafeWorkRepo, SafeWorkMapper> {
    private final SafeWorkRepo safeWorkRepo;
    private final SafeWorkMapper safeWorkMapper;
    private final SessionFactory sessionFactory;
    private final EntityManager entityManager;
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


    public SafeWorkDto createSafeWork(SafeWorkDto safeWorkDto) {
        SafeWork safeWork = safeWorkMapper.convertToEntity(safeWorkDto);
        return safeWorkMapper.convertToDto(safeWorkRepo.save(safeWork));
    }
}
