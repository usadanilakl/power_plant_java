package com.dk_power.power_plant_java.sevice.angular.loto;

import com.dk_power.power_plant_java.dto.permits.LotoDto;
import com.dk_power.power_plant_java.entities.loto.Loto;
import com.dk_power.power_plant_java.mappers.LotoMapper;
import com.dk_power.power_plant_java.repository.loto.LotoRepo;
import com.dk_power.power_plant_java.sevice.angular.NgValueService;
import com.dk_power.power_plant_java.sevice.angular.base.NgCrudService;
import com.dk_power.power_plant_java.sevice.loto.LotoService;
import jakarta.persistence.EntityManager;
import lombok.RequiredArgsConstructor;
import org.hibernate.SessionFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
@RequiredArgsConstructor
public class NgLotoService implements NgCrudService<Loto, LotoDto, LotoRepo, LotoMapper> {
    private final LotoMapper mapper;
    private final LotoRepo repo;
    private final EntityManager entityManager;
    private final SessionFactory sessionFactory;
    private final NgValueService ngValueService;

    @Override
    public LotoRepo getRepo() {
        return this.repo;
    }

    @Override
    public LotoMapper getMapper() {
        return this.mapper;
    }

    @Override
    public SessionFactory getSessionFactory() {
        return this.sessionFactory;
    }

    @Override
    public LotoDto getDto() {
        return new LotoDto();
    }

    @Override
    public Loto getEntity() {
        return new Loto();
    }

    @Override
    public EntityManager getEntityManager() {
        return this.entityManager;
    }

    @Override
    public Class<Loto> getEntityClass() {
        return Loto.class;
    }
}
