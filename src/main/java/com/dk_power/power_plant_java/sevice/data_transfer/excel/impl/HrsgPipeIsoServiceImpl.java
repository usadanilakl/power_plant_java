package com.dk_power.power_plant_java.sevice.data_transfer.excel.impl;

import com.dk_power.power_plant_java.dto.data_transfer.HrsgPipeIsoDto;
import com.dk_power.power_plant_java.entities.data_transfer.HrsgPipeIso;
import com.dk_power.power_plant_java.mappers.UniversalMapper;
import com.dk_power.power_plant_java.repository.data_transfer.HrsgPipeIsoRepo;
import com.dk_power.power_plant_java.sevice.data_transfer.excel.HrsgPipeIsoService;
import org.hibernate.SessionFactory;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Service
public class HrsgPipeIsoServiceImpl implements HrsgPipeIsoService {

    private final UniversalMapper universalMapper;
    private final HrsgPipeIsoRepo hrsgPipeIsoRepo;
    private final SessionFactory sessionFactory;

    public HrsgPipeIsoServiceImpl(UniversalMapper universalMapper, HrsgPipeIsoRepo hrsgPipeIsoRepo, SessionFactory sessionFactory) {
        this.universalMapper = universalMapper;
        this.hrsgPipeIsoRepo = hrsgPipeIsoRepo;
        this.sessionFactory = sessionFactory;
    }

    @Override
    public HrsgPipeIso getEntity() {
        return new HrsgPipeIso();
    }

    @Override
    public HrsgPipeIsoDto getDto() {
        return new HrsgPipeIsoDto();
    }

    @Override
    public HrsgPipeIsoRepo getRepo() {
        return hrsgPipeIsoRepo;
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
