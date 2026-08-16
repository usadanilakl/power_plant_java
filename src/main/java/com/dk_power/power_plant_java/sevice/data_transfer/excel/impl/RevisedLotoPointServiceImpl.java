package com.dk_power.power_plant_java.sevice.data_transfer.excel.impl;

import com.dk_power.power_plant_java.dto.data_transfer.RevisedLotoPointsDto;
import com.dk_power.power_plant_java.entities.data_transfer.RevisedLotoPoints;
import com.dk_power.power_plant_java.mappers.UniversalMapper;
import com.dk_power.power_plant_java.repository.data_transfer.RevisedPointRepo;
import com.dk_power.power_plant_java.sevice.data_transfer.excel.RevisedLotoPointService;
import org.hibernate.SessionFactory;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Service
public class RevisedLotoPointServiceImpl implements RevisedLotoPointService {
    private final RevisedPointRepo revisedPointRepo;
    private final UniversalMapper universalMapper;
    private final SessionFactory sessionFactory;

    public RevisedLotoPointServiceImpl(RevisedPointRepo revisedPointRepo, UniversalMapper universalMapper, SessionFactory sessionFactory) {
        this.revisedPointRepo = revisedPointRepo;
        this.universalMapper = universalMapper;
        this.sessionFactory = sessionFactory;
    }

    @Override
    public RevisedLotoPoints getEntity() {
        return new RevisedLotoPoints();
    }

    @Override
    public RevisedLotoPointsDto getDto() {
        return new RevisedLotoPointsDto();
    }

    @Override
    public RevisedPointRepo getRepo() {
        return revisedPointRepo;
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
