package com.dk_power.power_plant_java.sevice.equipment.impl;

import com.dk_power.power_plant_java.dto.equipment.EqBreakerDto;
import com.dk_power.power_plant_java.entities.data_transfer.RevisedLotoPoints;
import com.dk_power.power_plant_java.entities.equipment.EqBreaker;
import com.dk_power.power_plant_java.mappers.equipment.EqBreakerMapper;
import com.dk_power.power_plant_java.repository.equipment.EqBreakerRepo;
import com.dk_power.power_plant_java.sevice.data_transfer.excel.RevisedLotoPointService;
import com.dk_power.power_plant_java.sevice.equipment.EqBreakerService;
import org.hibernate.SessionFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional
public class EqBreakerServiceImpl implements EqBreakerService {
    private final EqBreakerMapper eqBreakerMapper;
    private final EqBreakerRepo eqBreakerRepo;
    private final SessionFactory sessionFactory;
    private final RevisedLotoPointService revisedLotoPointService;


    public EqBreakerServiceImpl(EqBreakerMapper eqBreakerMapper, EqBreakerRepo eqBreakerRepo, SessionFactory sessionFactory, RevisedLotoPointService revisedLotoPointService) {
        this.eqBreakerMapper = eqBreakerMapper;
        this.eqBreakerRepo = eqBreakerRepo;
        this.sessionFactory = sessionFactory;
        this.revisedLotoPointService = revisedLotoPointService;
    }

    @Override
    public EqBreaker getEntity() {
        return new EqBreaker();
    }

    @Override
    public EqBreakerDto getDto() {
        return new EqBreakerDto();
    }

    @Override
    public EqBreakerRepo getRepo() {
        return eqBreakerRepo;
    }

    @Override
    public EqBreakerMapper getMapper() {
        return eqBreakerMapper;
    }

    @Override
    public SessionFactory getSessionFactory() {
        return sessionFactory;
    }

    @Override
    public EqBreaker convertToEntity(EqBreakerDto dto) {
        return getMapper().convertToEntity(dto);
    }

    @Override
    public EqBreakerDto convertToDto(EqBreaker entity) {
        return getMapper().convertToDto(entity);
    }

    @Override
    public void transferToDb() {
        List<RevisedLotoPoints> all = revisedLotoPointService.getAll().stream().filter(e->e.getTemperature().toLowerCase().trim().equals("checked")).toList();
        for (RevisedLotoPoints p : all) {
            //set panel

        }
        //set breaker
        //set equipment
    }
}
