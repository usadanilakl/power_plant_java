package com.dk_power.power_plant_java.sevice.angular.permits;

import com.dk_power.power_plant_java.dto.permits.ConfinedSpaceDto;
import com.dk_power.power_plant_java.entities.permits.ConfinedSpace;
import com.dk_power.power_plant_java.mappers.permits.ConfinedSpaceMapper;
import com.dk_power.power_plant_java.repository.permits.ConfinedSpaceRepo;
import com.dk_power.power_plant_java.sevice.angular.base.NgCrudService;
import jakarta.persistence.EntityManager;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.hibernate.SessionFactory;
import org.springframework.stereotype.Service;

@Service
@Transactional
@RequiredArgsConstructor
public class NgConfinedSpaceService implements NgCrudService<ConfinedSpace, ConfinedSpaceDto, ConfinedSpaceRepo, ConfinedSpaceMapper> {
    private final ConfinedSpaceRepo confinedSpaceRepo;
    private final ConfinedSpaceMapper confinedSpaceMapper;
    private final SessionFactory sessionFactory;
    private final EntityManager entityManager;

    @Override
    public ConfinedSpaceRepo getRepo() {
        return confinedSpaceRepo;
    }

    @Override
    public ConfinedSpaceMapper getMapper() {
        return confinedSpaceMapper;
    }

    @Override
    public SessionFactory getSessionFactory() {
        return sessionFactory;
    }

    @Override
    public ConfinedSpaceDto getDto() {
        return new ConfinedSpaceDto();
    }

    @Override
    public ConfinedSpace getEntity() {
        return new ConfinedSpace();
    }

    @Override
    public EntityManager getEntityManager() {
        return entityManager;
    }

    @Override
    public Class<ConfinedSpace> getEntityClass() {
        return ConfinedSpace.class;
    }
}
