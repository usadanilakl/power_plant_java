package com.dk_power.power_plant_java.sevice.angular.permits;

import com.dk_power.power_plant_java.dto.permits.MonitoredAreaDto;
import com.dk_power.power_plant_java.entities.permits.MonitoredArea;
import com.dk_power.power_plant_java.mappers.permits.MonitoredAreaMapper;
import com.dk_power.power_plant_java.repository.permits.MonitoredAreaRepo;
import com.dk_power.power_plant_java.sevice.angular.base.NgCrudService;
import jakarta.persistence.EntityManager;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.hibernate.SessionFactory;
import org.springframework.stereotype.Service;

/**
 * CRUD + sync plumbing for {@link MonitoredArea}.
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
public class NgMonitoredAreaService implements NgCrudService<MonitoredArea, MonitoredAreaDto, MonitoredAreaRepo, MonitoredAreaMapper> {
    private final MonitoredAreaRepo repo;
    private final MonitoredAreaMapper mapper;
    private final SessionFactory sessionFactory;
    private final EntityManager entityManager;

    @Override public MonitoredAreaRepo getRepo() { return repo; }
    @Override public MonitoredAreaMapper getMapper() { return mapper; }
    @Override public SessionFactory getSessionFactory() { return sessionFactory; }
    @Override public MonitoredAreaDto getDto() { return new MonitoredAreaDto(); }
    @Override public MonitoredArea getEntity() { return new MonitoredArea(); }
    @Override public EntityManager getEntityManager() { return entityManager; }
    @Override public Class<MonitoredArea> getEntityClass() { return MonitoredArea.class; }
}
