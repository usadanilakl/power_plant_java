package com.dk_power.power_plant_java.sevice.data_transfer.excel.impl;

import com.dk_power.power_plant_java.dto.data_transfer.BypassDto;
import com.dk_power.power_plant_java.entities.data_transfer.Bypass;
import com.dk_power.power_plant_java.mappers.UniversalMapper;
import com.dk_power.power_plant_java.repository.data_transfer.BypassRepo;
import com.dk_power.power_plant_java.sevice.data_transfer.excel.BypassService;
import org.hibernate.SessionFactory;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Service
public class BypassServiceImpl implements BypassService {
    private final BypassRepo bypassRepo;
    private final UniversalMapper universalMapper;
    private final SessionFactory sessionFactory;

    public BypassServiceImpl(BypassRepo bypassRepo, UniversalMapper universalMapper, SessionFactory sessionFactory) {
        this.bypassRepo = bypassRepo;
        this.universalMapper = universalMapper;
        this.sessionFactory = sessionFactory;
    }

    @Override
    public Bypass getEntity() {
        return new Bypass();
    }

    @Override
    public BypassDto getDto() {
        return new BypassDto();
    }

    @Override
    public BypassRepo getRepo() {
        return bypassRepo;
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
