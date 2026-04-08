package com.dk_power.power_plant_java.sevice.etapro.impl;

import com.dk_power.power_plant_java.dto.etapro.EtaProPointDto;
import com.dk_power.power_plant_java.entities.etapro.EtaProPoint;
import com.dk_power.power_plant_java.mappers.etapro.EtaProMapper;
import com.dk_power.power_plant_java.repository.etapro.EtaProPointRepo;
import com.dk_power.power_plant_java.sevice.etapro.EtaProPointService;
import lombok.RequiredArgsConstructor;
import org.hibernate.SessionFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class EtaProPointServiceImpl implements EtaProPointService {
    private final EtaProPointRepo etaProPointRepo;
    private final EtaProMapper etaProMapper;
    private final SessionFactory sessionFactory;

    @Override
    public EtaProPoint getEntity() {
        return new EtaProPoint();
    }

    @Override
    public EtaProPointDto getDto() {
        return new EtaProPointDto();
    }

    @Override
    public EtaProPointRepo getRepo() {
        return etaProPointRepo;
    }

    @Override
    public EtaProMapper getMapper() {
        return etaProMapper;
    }

    @Override
    public SessionFactory getSessionFactory() {
        return sessionFactory;
    }

    @Override
    public List<EtaProPoint> getActivePoints() {
        return etaProPointRepo.findByActiveTrue();
    }

    @Override
    public EtaProPoint getByPointId(String pointId) {
        return etaProPointRepo.findByPointId(pointId).orElse(null);
    }

    @Override
    public List<EtaProPoint> getByCategory(String category) {
        return etaProPointRepo.findByCategory(category);
    }
}
