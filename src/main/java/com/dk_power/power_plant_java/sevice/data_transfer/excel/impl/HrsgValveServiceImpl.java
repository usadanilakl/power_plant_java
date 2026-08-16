package com.dk_power.power_plant_java.sevice.data_transfer.excel.impl;

import com.dk_power.power_plant_java.dto.data_transfer.HrsgValveDto;
import com.dk_power.power_plant_java.entities.data_transfer.HrsgValve;
import com.dk_power.power_plant_java.mappers.UniversalMapper;
import com.dk_power.power_plant_java.repository.data_transfer.HrsgValveRepo;
import com.dk_power.power_plant_java.sevice.data_transfer.excel.HrsgValveService;
import org.hibernate.SessionFactory;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Service
public class HrsgValveServiceImpl implements HrsgValveService {

    private final UniversalMapper universalMapper;
    private final HrsgValveRepo hrsgValveRepo;
    private final SessionFactory sessionFactory;

    public HrsgValveServiceImpl(UniversalMapper universalMapper, HrsgValveRepo hrsgValveRepo, SessionFactory sessionFactory) {
        this.universalMapper = universalMapper;
        this.hrsgValveRepo = hrsgValveRepo;
        this.sessionFactory = sessionFactory;
    }

    @Override
    public HrsgValve getEntity() {
        return new HrsgValve();
    }

    @Override
    public HrsgValveDto getDto() {
        return new HrsgValveDto();
    }

    @Override
    public HrsgValveRepo getRepo() {
        return hrsgValveRepo;
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
