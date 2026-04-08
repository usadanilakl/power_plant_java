package com.dk_power.power_plant_java.sevice.etapro.impl;

import com.dk_power.power_plant_java.dto.etapro.EtaProReadingDto;
import com.dk_power.power_plant_java.entities.etapro.EtaProReading;
import com.dk_power.power_plant_java.mappers.etapro.EtaProMapper;
import com.dk_power.power_plant_java.repository.etapro.EtaProReadingRepo;
import com.dk_power.power_plant_java.sevice.etapro.EtaProReadingService;
import lombok.RequiredArgsConstructor;
import org.hibernate.SessionFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class EtaProReadingServiceImpl implements EtaProReadingService {
    private final EtaProReadingRepo etaProReadingRepo;
    private final EtaProMapper etaProMapper;
    private final SessionFactory sessionFactory;

    @Override
    public EtaProReading getEntity() {
        return new EtaProReading();
    }

    @Override
    public EtaProReadingDto getDto() {
        return new EtaProReadingDto();
    }

    @Override
    public EtaProReadingRepo getRepo() {
        return etaProReadingRepo;
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
    public List<EtaProReading> getByPointAndTimeRange(String pointId, LocalDateTime start, LocalDateTime end) {
        return etaProReadingRepo.findByPointIdAndReadingTimeBetweenOrderByReadingTimeAsc(pointId, start, end);
    }

    @Override
    public Page<EtaProReading> getByPointPaginated(String pointId, int page, int pageSize) {
        return etaProReadingRepo.findByPointIdOrderByReadingTimeDesc(pointId, PageRequest.of(page - 1, pageSize));
    }

    @Override
    public Page<EtaProReading> getByTimeRangePaginated(LocalDateTime start, LocalDateTime end, int page, int pageSize) {
        return etaProReadingRepo.findByReadingTimeBetweenOrderByReadingTimeDesc(start, end, PageRequest.of(page - 1, pageSize));
    }

    @Override
    public List<EtaProReading> getLatestPerPoint() {
        return etaProReadingRepo.findLatestPerPoint();
    }

    @Override
    public List<EtaProReading> getBySessionId(String sessionId) {
        return etaProReadingRepo.findByScrapeSessionId(sessionId);
    }
}
