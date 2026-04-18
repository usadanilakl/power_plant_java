package com.dk_power.power_plant_java.sevice.angular.etapro;

import com.dk_power.power_plant_java.dto.etapro.EtaProReportDto;
import com.dk_power.power_plant_java.entities.etapro.EtaProReport;
import com.dk_power.power_plant_java.mappers.etapro.EtaProMapper;
import com.dk_power.power_plant_java.repository.etapro.EtaProReportRepo;
import com.dk_power.power_plant_java.sevice.angular.base.NgCrudService;
import jakarta.persistence.EntityManager;
import lombok.RequiredArgsConstructor;
import org.hibernate.SessionFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class NgEtaProReportService implements NgCrudService<EtaProReport, EtaProReportDto, EtaProReportRepo, EtaProMapper> {
    private final EtaProReportRepo repo;
    private final EtaProMapper mapper;
    private final SessionFactory sessionFactory;
    private final EntityManager entityManager;

    @Override public EtaProReportRepo getRepo() { return repo; }
    @Override public EtaProMapper getMapper() { return mapper; }
    @Override public SessionFactory getSessionFactory() { return sessionFactory; }
    @Override public EntityManager getEntityManager() { return entityManager; }
    @Override public Class<EtaProReport> getEntityClass() { return EtaProReport.class; }
    @Override public EtaProReportDto getDto() { return new EtaProReportDto(); }
    @Override public EtaProReport getEntity() { return new EtaProReport(); }

    @Override
    public List<String> getGlobalSearchColumns() {
        return List.of("name", "description", "category");
    }
}
