package com.dk_power.power_plant_java.sevice.angular.equipment;

import com.dk_power.power_plant_java.dto.equipment.EqBreakerDto;
import com.dk_power.power_plant_java.entities.equipment.EqBreaker;
import com.dk_power.power_plant_java.mappers.equipment.EqBreakerMapper;
import com.dk_power.power_plant_java.repository.equipment.EqBreakerRepo;
import com.dk_power.power_plant_java.sevice.angular.base.NgCrudService;
import jakarta.persistence.EntityManager;
import lombok.RequiredArgsConstructor;
import org.hibernate.SessionFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional
public class NgEqBreakerService implements NgCrudService<EqBreaker, EqBreakerDto, EqBreakerRepo, EqBreakerMapper> {
    private final EqBreakerRepo eqBreakerRepo;
    private final EqBreakerMapper eqBreakerMapper;
    private final SessionFactory sessionFactory;
    private final EntityManager entityManager;

    @Override
    public EqBreakerRepo getRepo() {
        return eqBreakerRepo;
    }

    @Override
    public EqBreakerMapper getMapper() {
        return eqBreakerMapper;
    }

    @Override
    public SessionFactory getSessionFactory() {
        return sessionFactory;
    }

    @Override
    public EqBreakerDto getDto() {
        return new EqBreakerDto();
    }

    @Override
    public EqBreaker getEntity() {
        return new EqBreaker();
    }

    @Override
    public EqBreaker toEntity(EqBreakerDto dto) {
        return eqBreakerMapper.convertToEntity(dto);
    }

    @Override
    public EqBreakerDto toDto(EqBreaker entity) {
        return eqBreakerMapper.convertToDto(entity);
    }

    @Override
    public Class<EqBreaker> getEntityClass() {
        return EqBreaker.class;
    }

    public EntityManager getEntityManager() {
        return entityManager;
    }
}
