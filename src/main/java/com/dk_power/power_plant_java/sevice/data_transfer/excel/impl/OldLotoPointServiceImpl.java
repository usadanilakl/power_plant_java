package com.dk_power.power_plant_java.sevice.data_transfer.excel.impl;

import com.dk_power.power_plant_java.dto.data_transfer.OldLotoPointDto;
import com.dk_power.power_plant_java.entities.data_transfer.OldLotoPoint;
import com.dk_power.power_plant_java.mappers.UniversalMapper;
import com.dk_power.power_plant_java.repository.data_transfer.OldLotoPointRepo;
import com.dk_power.power_plant_java.sevice.data_transfer.excel.OldLotoPointService;
import org.hibernate.SessionFactory;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Service
public class OldLotoPointServiceImpl implements OldLotoPointService {
    private final OldLotoPointRepo oldLotoPointRepo;
    private final UniversalMapper universalMapper;
    private final SessionFactory sessionFactory;

    public OldLotoPointServiceImpl(OldLotoPointRepo oldLotoPointRepo, UniversalMapper universalMapper, SessionFactory sessionFactory) {
        this.oldLotoPointRepo = oldLotoPointRepo;
        this.universalMapper = universalMapper;
        this.sessionFactory = sessionFactory;
    }

    @Override
    public OldLotoPoint getEntity() {
        return new OldLotoPoint();
    }

    @Override
    public OldLotoPointDto getDto() {
        return new OldLotoPointDto();
    }

    @Override
    public OldLotoPointRepo getRepo() {
        return oldLotoPointRepo;
    }

    @Override
    public UniversalMapper getMapper() {
        return universalMapper;
    }

    @Override
    public SessionFactory getSessionFactory() {
        return sessionFactory;
    }

}
