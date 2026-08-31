package com.dk_power.power_plant_java.sevice.angular.permits;

import com.dk_power.power_plant_java.dto.permits.AirTestDto;
import com.dk_power.power_plant_java.entities.permits.AirTest;
import com.dk_power.power_plant_java.mappers.permits.AirTestMapper;
import com.dk_power.power_plant_java.repository.permits.AirTestRepo;
import com.dk_power.power_plant_java.sevice.angular.base.NgCrudService;
import jakarta.persistence.EntityManager;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.hibernate.SessionFactory;
import org.springframework.stereotype.Service;

/**
 * CRUD + sync plumbing for {@link AirTest}.
 *
 * <p>Exists so the entity can be REGISTERED for sync: {@code ServiceFacade} resolves an inbound
 * change to the service that owns that entity type, so without one here the change would be emitted
 * by every node and applied by none — a silent one-way sync that looks like it is working.
 *
 * <p>The screen-facing behaviour lives in {@code NgAirMonitoringService}; this is the generic half.
 */
@Service
@Transactional
@RequiredArgsConstructor
public class NgAirTestService implements NgCrudService<AirTest, AirTestDto, AirTestRepo, AirTestMapper> {
    private final AirTestRepo repo;
    private final AirTestMapper mapper;
    private final SessionFactory sessionFactory;
    private final EntityManager entityManager;

    @Override public AirTestRepo getRepo() { return repo; }
    @Override public AirTestMapper getMapper() { return mapper; }
    @Override public SessionFactory getSessionFactory() { return sessionFactory; }
    @Override public AirTestDto getDto() { return new AirTestDto(); }
    @Override public AirTest getEntity() { return new AirTest(); }
    @Override public EntityManager getEntityManager() { return entityManager; }
    @Override public Class<AirTest> getEntityClass() { return AirTest.class; }
}
