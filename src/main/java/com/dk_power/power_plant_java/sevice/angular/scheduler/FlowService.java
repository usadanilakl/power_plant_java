package com.dk_power.power_plant_java.sevice.angular.scheduler;

import com.dk_power.power_plant_java.dto.scheduler.FlowDto;
import com.dk_power.power_plant_java.entities.scheduler.Flow;
import com.dk_power.power_plant_java.mappers.scheduler.FlowMapper;
import com.dk_power.power_plant_java.repository.scheduler.FlowRepository;
import com.dk_power.power_plant_java.sevice.base_services.CrudService;
import org.hibernate.SessionFactory;

public class FlowService implements CrudService<Flow, FlowDto, FlowRepository, FlowMapper> {
    private final FlowRepository flowRepository;
    private final FlowMapper flowMapper;
    private final SessionFactory sessionFactory;

    public FlowService(FlowRepository flowRepository, FlowMapper flowMapper, SessionFactory sessionFactory) {
        this.flowRepository = flowRepository;
        this.flowMapper = flowMapper;
        this.sessionFactory = sessionFactory;
    }

    @Override
    public Flow getEntity() {
        return new Flow();
    }

    @Override
    public FlowDto getDto() {
        return new FlowDto();
    }

    @Override
    public FlowRepository getRepo() {
        return flowRepository;
    }

    @Override
    public FlowMapper getMapper() {
        return flowMapper;
    }

    @Override
    public SessionFactory getSessionFactory() {
        return sessionFactory;
    }
}
