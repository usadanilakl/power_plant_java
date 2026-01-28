package com.dk_power.power_plant_java.sevice.angular.equipment;

import com.dk_power.power_plant_java.dto.equipment.HtBreakerDto;
import com.dk_power.power_plant_java.entities.equipment.HtBreaker;
import com.dk_power.power_plant_java.mappers.equipment.HtBreakerMapper;
import com.dk_power.power_plant_java.repository.equipment.HtBreakerRepo;
import com.dk_power.power_plant_java.sevice.angular.base.NgCrudService;
import jakarta.persistence.EntityManager;
import lombok.RequiredArgsConstructor;
import org.hibernate.SessionFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional
public class NgHtBreakerService implements NgCrudService<HtBreaker, HtBreakerDto, HtBreakerRepo, HtBreakerMapper> {
    private final HtBreakerRepo htBreakerRepo;
    private final HtBreakerMapper htBreakerMapper;
    private final SessionFactory sessionFactory;
    private final EntityManager entityManager;

    @Override
    public HtBreakerRepo getRepo() {
        return htBreakerRepo;
    }

    @Override
    public HtBreakerMapper getMapper() {
        return htBreakerMapper;
    }

    @Override
    public SessionFactory getSessionFactory() {
        return sessionFactory;
    }

    @Override
    public HtBreakerDto getDto() {
        return new HtBreakerDto();
    }

    @Override
    public HtBreaker getEntity() {
        return new HtBreaker();
    }

    @Override
    public HtBreaker toEntity(HtBreakerDto dto) {
        return htBreakerMapper.convertToEntity(dto);
    }

    @Override
    public HtBreakerDto toDto(HtBreaker entity) {
        return htBreakerMapper.convertToDto(entity);
    }

    @Override
    public Class<HtBreaker> getEntityClass() {
        return HtBreaker.class;
    }

    public EntityManager getEntityManager() {
        return entityManager;
    }
}
