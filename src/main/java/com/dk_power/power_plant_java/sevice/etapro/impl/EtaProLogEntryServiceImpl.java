package com.dk_power.power_plant_java.sevice.etapro.impl;

import com.dk_power.power_plant_java.dto.etapro.EtaProLogEntryDto;
import com.dk_power.power_plant_java.entities.etapro.EtaProLogEntry;
import com.dk_power.power_plant_java.mappers.etapro.EtaProMapper;
import com.dk_power.power_plant_java.repository.etapro.EtaProLogEntryRepo;
import com.dk_power.power_plant_java.sevice.etapro.EtaProLogEntryService;
import lombok.RequiredArgsConstructor;
import org.hibernate.SessionFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
@Transactional
public class EtaProLogEntryServiceImpl implements EtaProLogEntryService {
    private final EtaProLogEntryRepo etaProLogEntryRepo;
    private final EtaProMapper etaProMapper;
    private final SessionFactory sessionFactory;

    @Override
    public EtaProLogEntry getEntity() {
        return new EtaProLogEntry();
    }

    @Override
    public EtaProLogEntryDto getDto() {
        return new EtaProLogEntryDto();
    }

    @Override
    public EtaProLogEntryRepo getRepo() {
        return etaProLogEntryRepo;
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
    public Page<EtaProLogEntry> getRecentPaginated(int page, int pageSize) {
        return etaProLogEntryRepo.findAllByOrderByCreateTimeDesc(PageRequest.of(page - 1, pageSize));
    }

    @Override
    public Page<EtaProLogEntry> getByTimeRangePaginated(LocalDateTime start, LocalDateTime end, int page, int pageSize) {
        return etaProLogEntryRepo.findByCreateTimeBetweenOrderByCreateTimeDesc(
                start, end, PageRequest.of(page - 1, pageSize));
    }
}
