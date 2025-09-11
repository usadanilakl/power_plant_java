package com.dk_power.power_plant_java.sevice.angular.permits;

import com.dk_power.power_plant_java.dto.permits.DailyPermitPackageDto;
import com.dk_power.power_plant_java.entities.permits.DailyPermitPackage;
import com.dk_power.power_plant_java.mappers.permits.DailyPermitPackageMapper;
import com.dk_power.power_plant_java.repository.permits.DailyPermitPackageRepo;
import com.dk_power.power_plant_java.sevice.angular.base.NgCrudService;
import com.dk_power.power_plant_java.sevice.automation.RedTagAutomationService;
import jakarta.persistence.EntityManager;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.hibernate.SessionFactory;
import org.sikuli.script.FindFailed;
import org.springframework.stereotype.Service;

import java.io.IOException;

@Service
@Transactional
@RequiredArgsConstructor
public class NgDailyPermitPackageService implements NgCrudService<DailyPermitPackage, DailyPermitPackageDto, DailyPermitPackageRepo, DailyPermitPackageMapper> {
    private final SessionFactory sessionFactory;
    private final EntityManager entityManager;
    private final DailyPermitPackageRepo dailyPermitPackageRepo;
    private final DailyPermitPackageMapper dailyPermitPackageMapper;
    private final RedTagAutomationService redTagAutomationService;

    @Override
    public DailyPermitPackageRepo getRepo() {
        return dailyPermitPackageRepo;
    }

    @Override
    public DailyPermitPackageMapper getMapper() {
        return dailyPermitPackageMapper;
    }

    @Override
    public SessionFactory getSessionFactory() {
        return sessionFactory;
    }

    @Override
    public DailyPermitPackageDto getDto() {
        return new DailyPermitPackageDto();
    }

    @Override
    public DailyPermitPackage getEntity() {
        return new DailyPermitPackage();
    }

    @Override
    public EntityManager getEntityManager() {
        return entityManager;
    }

    @Override
    public Class<DailyPermitPackage> getEntityClass() {
        return DailyPermitPackage.class;
    }

    public DailyPermitPackageDto createDailyPermitPackage(DailyPermitPackageDto permitPackageDto) {
        DailyPermitPackage dailyPermitPackage = dailyPermitPackageMapper.convertToEntity(permitPackageDto);
        dailyPermitPackageRepo.save(dailyPermitPackage);
        return dailyPermitPackageMapper.convertToDto(dailyPermitPackage);
    }

    public DailyPermitPackageDto updateDailyPermitPackage(String id, DailyPermitPackageDto permitPackageDto) {
        DailyPermitPackage dailyPermitPackage = dailyPermitPackageMapper.convertToEntity(permitPackageDto);
        dailyPermitPackage.setId(Long.parseLong(id));
        dailyPermitPackageRepo.save(dailyPermitPackage);
        return dailyPermitPackageMapper.convertToDto(dailyPermitPackage);
    }

    public String buildPermits(DailyPermitPackageDto dailyPermitPackageDto) throws FindFailed, IOException, InterruptedException {
        DailyPermitPackage entity = toEntity(dailyPermitPackageDto);
        redTagAutomationService.buildDailyPermitPackage(toDto(entity));
        return "Permits built successfully!";
    }
}
