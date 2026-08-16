package com.dk_power.power_plant_java.sevice.data_transfer.excel.impl;

import com.dk_power.power_plant_java.dto.data_transfer.KiewitPipeIsoDto;
import com.dk_power.power_plant_java.entities.data_transfer.KiewitPipeIso;
import com.dk_power.power_plant_java.mappers.UniversalMapper;
import com.dk_power.power_plant_java.repository.data_transfer.KiewitPipeIsoRepo;
import com.dk_power.power_plant_java.sevice.data_transfer.excel.KiewitPipeIsoService;
import org.hibernate.SessionFactory;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Service
public class KiewitPipeIsoServiceImpl implements KiewitPipeIsoService {

    private final UniversalMapper universalMapper;
    private final KiewitPipeIsoRepo kiewitPipeIsoRepo;
    private final SessionFactory sessionFactory;

    public KiewitPipeIsoServiceImpl(UniversalMapper universalMapper, KiewitPipeIsoRepo kiewitPipeIsoRepo, SessionFactory sessionFactory) {
        this.universalMapper = universalMapper;
        this.kiewitPipeIsoRepo = kiewitPipeIsoRepo;
        this.sessionFactory = sessionFactory;
    }

    @Override
    public KiewitPipeIso getEntity() {
        return new KiewitPipeIso();
    }

    @Override
    public KiewitPipeIsoDto getDto() {
        return new KiewitPipeIsoDto();
    }

    @Override
    public KiewitPipeIsoRepo getRepo() {
        return kiewitPipeIsoRepo;
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
