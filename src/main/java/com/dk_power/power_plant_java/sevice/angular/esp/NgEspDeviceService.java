package com.dk_power.power_plant_java.sevice.angular.esp;

import com.dk_power.power_plant_java.dto.esp.EspDeviceDto;
import com.dk_power.power_plant_java.entities.esp.EspDevice;
import com.dk_power.power_plant_java.mappers.esp.EspDeviceMapper;
import com.dk_power.power_plant_java.repository.esp.EspDeviceRepo;
import com.dk_power.power_plant_java.sevice.angular.base.NgCrudService;
import jakarta.persistence.EntityManager;
import lombok.RequiredArgsConstructor;
import org.hibernate.SessionFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional
public class NgEspDeviceService implements NgCrudService<EspDevice, EspDeviceDto, EspDeviceRepo, EspDeviceMapper> {
    private final EspDeviceRepo espDeviceRepo;
    private final EspDeviceMapper espDeviceMapper;
    private final SessionFactory sessionFactory;
    private final EntityManager entityManager;

    @Override
    public EspDeviceRepo getRepo() {
        return espDeviceRepo;
    }

    @Override
    public EspDeviceMapper getMapper() {
        return espDeviceMapper;
    }

    @Override
    public SessionFactory getSessionFactory() {
        return sessionFactory;
    }

    @Override
    public EspDeviceDto getDto() {
        return new EspDeviceDto();
    }

    @Override
    public EspDevice getEntity() {
        return new EspDevice();
    }

    @Override
    public EspDevice toEntity(EspDeviceDto dto) {
        return espDeviceMapper.convertToEntity(dto);
    }

    @Override
    public EspDeviceDto toDto(EspDevice entity) {
        return espDeviceMapper.convertToDto(entity);
    }

    @Override
    public Class<EspDevice> getEntityClass() {
        return EspDevice.class;
    }

    public EntityManager getEntityManager() {
        return entityManager;
    }
}
