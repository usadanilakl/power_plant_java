package com.dk_power.power_plant_java.sevice.equipment.impl;

import com.dk_power.power_plant_java.dto.equipment.HeatTraceDto;
import com.dk_power.power_plant_java.entities.equipment.Equipment;
import com.dk_power.power_plant_java.entities.equipment.HeatTrace;
import com.dk_power.power_plant_java.entities.equipment.HtBreaker;
import com.dk_power.power_plant_java.mappers.HeatTraceMapper;
import com.dk_power.power_plant_java.repository.equipment.HeatTraceRepo;
import com.dk_power.power_plant_java.sevice.equipment.HeatTraceService;
import com.dk_power.power_plant_java.sevice.equipment.HtBreakerService;
import org.hibernate.SessionFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional
public class HeatTraceServiceImpl implements HeatTraceService {
    private final HeatTraceRepo heatTraceRepo;
    private final HeatTraceMapper heatTraceMapper;
    private final SessionFactory sessionFactory;
    private final HtBreakerService htBreakerService;

    public HeatTraceServiceImpl(HeatTraceRepo heatTraceRepo, HeatTraceMapper heatTraceMapper, SessionFactory sessionFactory, HtBreakerService htBreakerService) {
        this.heatTraceRepo = heatTraceRepo;
        this.heatTraceMapper = heatTraceMapper;
        this.sessionFactory = sessionFactory;
        this.htBreakerService = htBreakerService;
    }

    @Override
    public HeatTrace getEntity() {
        return new HeatTrace();
    }

    @Override
    public HeatTraceDto getDto() {
        return new HeatTraceDto();
    }

    @Override
    public HeatTraceRepo getRepo() {
        return heatTraceRepo;
    }

    @Override
    public HeatTraceMapper getMapper() {
        return heatTraceMapper;
    }

    @Override
    public SessionFactory getSessionFactory() {
        return sessionFactory;
    }




}
