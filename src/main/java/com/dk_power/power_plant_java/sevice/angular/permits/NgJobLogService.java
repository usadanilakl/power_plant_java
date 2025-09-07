package com.dk_power.power_plant_java.sevice.angular.permits;

import com.dk_power.power_plant_java.dto.permits.JobLogDto;
import com.dk_power.power_plant_java.entities.permits.JobLog;
import com.dk_power.power_plant_java.mappers.permits.JobLogMapper;
import com.dk_power.power_plant_java.repository.permits.JobLogRepo;
import com.dk_power.power_plant_java.sevice.angular.base.NgCrudService;
import jakarta.persistence.EntityManager;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.hibernate.SessionFactory;
import org.springframework.stereotype.Service;

@Service
@Transactional
@RequiredArgsConstructor
public class NgJobLogService implements NgCrudService<JobLog, JobLogDto, JobLogRepo, JobLogMapper> {
    private final SessionFactory sessionFactory;
    private final EntityManager entityManager;
    private final JobLogRepo jobLogRepo;
    private final JobLogMapper jobLogMapper;

    @Override
    public JobLogRepo getRepo() {
        return jobLogRepo;
    }

    @Override
    public JobLogMapper getMapper() {
        return jobLogMapper;
    }

    @Override
    public SessionFactory getSessionFactory() {
        return sessionFactory;
    }

    @Override
    public JobLogDto getDto() {
        return new JobLogDto();
    }

    @Override
    public JobLog getEntity() {
        return new JobLog();
    }

    @Override
    public EntityManager getEntityManager() {
        return entityManager;
    }

    @Override
    public Class<JobLog> getEntityClass() {
        return JobLog.class;
    }
}
