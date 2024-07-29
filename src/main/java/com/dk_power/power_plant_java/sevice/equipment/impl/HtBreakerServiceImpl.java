package com.dk_power.power_plant_java.sevice.equipment.impl;

import com.dk_power.power_plant_java.dto.equipment.HtBreakerDto;
import com.dk_power.power_plant_java.entities.equipment.HtBreaker;
import com.dk_power.power_plant_java.mappers.equipment.HtBreakerMapper;
import com.dk_power.power_plant_java.repository.equipment.HtBreakerRepo;
import com.dk_power.power_plant_java.sevice.equipment.HtBreakerService;
import org.hibernate.SessionFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class HtBreakerServiceImpl implements HtBreakerService {
    private final HtBreakerMapper htBreakerMapper;
    private final HtBreakerRepo htBreakerRepo;
    private final SessionFactory sessionFactory;

    public HtBreakerServiceImpl(HtBreakerMapper htBreakerMapper, HtBreakerRepo htBreakerRepo, SessionFactory sessionFactory) {
        this.htBreakerMapper = htBreakerMapper;
        this.htBreakerRepo = htBreakerRepo;
        this.sessionFactory = sessionFactory;
    }

    @Override
    public HtBreaker getEntity() {
        return new HtBreaker();
    }

    @Override
    public HtBreakerDto getDto() {
        return new HtBreakerDto();
    }

    @Override
    public HtBreakerRepo getRepo() {
        return htBreakerRepo;
    }

    @Override
    public HtBreakerMapper getMapper() {
        return htBreakerMapper;
    }

    @Override
    public SessionFactory getSessionFactory() {
        return sessionFactory;
    }
}
