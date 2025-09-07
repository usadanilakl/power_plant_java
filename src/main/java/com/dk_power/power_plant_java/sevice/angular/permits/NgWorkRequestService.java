package com.dk_power.power_plant_java.sevice.angular.permits;

import com.dk_power.power_plant_java.dto.permits.WorkRequestDto;
import com.dk_power.power_plant_java.entities.permits.WorkRequest;
import com.dk_power.power_plant_java.mappers.permits.WorkRequestMapper;
import com.dk_power.power_plant_java.repository.permits.WorkRequestRepo;
import com.dk_power.power_plant_java.sevice.angular.base.NgCrudService;
import jakarta.persistence.EntityManager;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.hibernate.SessionFactory;
import org.springframework.stereotype.Service;

@Service
@Transactional
@RequiredArgsConstructor
public class NgWorkRequestService implements NgCrudService<WorkRequest, WorkRequestDto, WorkRequestRepo, WorkRequestMapper> {
    private final SessionFactory sessionFactory;
    private final EntityManager entityManager;
    private final WorkRequestRepo workRequestRepo;
    private final WorkRequestMapper workRequestMapper;

    @Override
    public WorkRequestRepo getRepo() {
        return workRequestRepo;
    }

    @Override
    public WorkRequestMapper getMapper() {
        return workRequestMapper;
    }

    @Override
    public SessionFactory getSessionFactory() {
        return sessionFactory;
    }

    @Override
    public WorkRequestDto getDto() {
        return new WorkRequestDto();
    }

    @Override
    public WorkRequest getEntity() {
        return new WorkRequest();
    }

    @Override
    public EntityManager getEntityManager() {
        return entityManager;
    }

    @Override
    public Class<WorkRequest> getEntityClass() {
        return WorkRequest.class;
    }
}
