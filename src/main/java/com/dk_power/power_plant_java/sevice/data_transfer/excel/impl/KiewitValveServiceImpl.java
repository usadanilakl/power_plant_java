package com.dk_power.power_plant_java.sevice.data_transfer.excel.impl;

import com.dk_power.power_plant_java.dto.data_transfer.KiewitValveDto;
import com.dk_power.power_plant_java.entities.data_transfer.KiewitValve;
import com.dk_power.power_plant_java.mappers.UniversalMapper;
import com.dk_power.power_plant_java.repository.data_transfer.KiewitValveRepo;
import com.dk_power.power_plant_java.sevice.data_transfer.excel.KiewitValveService;
import org.hibernate.SessionFactory;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Service
public class KiewitValveServiceImpl implements KiewitValveService {

    private final UniversalMapper universalMapper;
    private final KiewitValveRepo kiewitValveRepo;
    private final SessionFactory sessionFactory;

    public KiewitValveServiceImpl(UniversalMapper universalMapper, KiewitValveRepo kiewitValveRepo, SessionFactory sessionFactory) {
        this.universalMapper = universalMapper;
        this.kiewitValveRepo = kiewitValveRepo;
        this.sessionFactory = sessionFactory;
    }

    @Override
    public KiewitValve getEntity() {
        return new KiewitValve();
    }

    @Override
    public KiewitValveDto getDto() {
        return new KiewitValveDto();
    }

    @Override
    public KiewitValveRepo getRepo() {
        return kiewitValveRepo;
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
