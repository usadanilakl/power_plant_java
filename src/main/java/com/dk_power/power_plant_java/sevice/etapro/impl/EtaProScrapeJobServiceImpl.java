package com.dk_power.power_plant_java.sevice.etapro.impl;

import com.dk_power.power_plant_java.dto.etapro.EtaProScrapeJobDto;
import com.dk_power.power_plant_java.entities.etapro.EtaProScrapeJob;
import com.dk_power.power_plant_java.mappers.etapro.EtaProMapper;
import com.dk_power.power_plant_java.repository.etapro.EtaProScrapeJobRepo;
import com.dk_power.power_plant_java.sevice.etapro.EtaProScrapeJobService;
import lombok.RequiredArgsConstructor;
import org.hibernate.SessionFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional
public class EtaProScrapeJobServiceImpl implements EtaProScrapeJobService {
    private final EtaProScrapeJobRepo repo;
    private final EtaProMapper mapper;
    private final SessionFactory sessionFactory;

    @Override public EtaProScrapeJob getEntity() { return new EtaProScrapeJob(); }
    @Override public EtaProScrapeJobDto getDto() { return new EtaProScrapeJobDto(); }
    @Override public EtaProScrapeJobRepo getRepo() { return repo; }
    @Override public EtaProMapper getMapper() { return mapper; }
    @Override public SessionFactory getSessionFactory() { return sessionFactory; }
}
