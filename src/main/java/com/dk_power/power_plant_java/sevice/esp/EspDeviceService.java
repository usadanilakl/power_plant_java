package com.dk_power.power_plant_java.sevice.esp;

import com.dk_power.power_plant_java.dto.esp.EspDeviceDto;
import com.dk_power.power_plant_java.entities.esp.EspDevice;
import com.dk_power.power_plant_java.mappers.esp.EspDeviceMapper;
import com.dk_power.power_plant_java.repository.esp.EspDeviceRepo;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
@Transactional
public class EspDeviceService {

    private final EspDeviceRepo espDeviceRepo;
    private final EspDeviceMapper espDeviceMapper;

    public EspDeviceService(EspDeviceRepo espDeviceRepo,
                            EspDeviceMapper espDeviceMapper) {
        this.espDeviceRepo = espDeviceRepo;
        this.espDeviceMapper = espDeviceMapper;
    }

    /**
     * Get ESP device by ID
     */
    public EspDevice getEntityById(Long id) {
        return espDeviceRepo.findById(id).orElse(null);
    }

    /**
     * Get ESP device DTO by ID
     */
    public EspDeviceDto getDtoById(Long id) {
        EspDevice entity = getEntityById(id);
        return entity != null ? espDeviceMapper.convertToDto(entity) : null;
    }

    /**
     * Get all ESP devices
     */
    public List<EspDevice> getAll() {
        return espDeviceRepo.findAll();
    }

    /**
     * Get all ESP devices as DTOs
     */
    public List<EspDeviceDto> getAllDto() {
        return getAll().stream()
                .map(espDeviceMapper::convertToDto)
                .toList();
    }

    /**
     * Get all active ESP devices
     */
    public List<EspDevice> getAllActive() {
        return espDeviceRepo.findAllActive();
    }

    /**
     * Get all active ESP devices as DTOs
     */
    public List<EspDeviceDto> getAllActiveDto() {
        return getAllActive().stream()
                .map(espDeviceMapper::convertToDto)
                .toList();
    }

    /**
     * Find ESP device by IP address
     */
    public Optional<EspDevice> findByIpAddress(String ipAddress) {
        return espDeviceRepo.findByIpAddress(ipAddress);
    }

    /**
     * Find ESP device by name
     */
    public Optional<EspDevice> findByName(String name) {
        return espDeviceRepo.findByName(name);
    }

    /**
     * Save ESP device
     */
    public EspDevice save(EspDevice espDevice) {
        return espDeviceRepo.save(espDevice);
    }

    /**
     * Save ESP device from DTO
     */
    public EspDevice saveFromDto(EspDeviceDto dto) {
        EspDevice entity = espDeviceMapper.convertToEntity(dto);
        return save(entity);
    }

    /**
     * Update ESP device
     */
    public EspDevice update(Long id, EspDeviceDto dto) {
        EspDevice entity = getEntityById(id);
        if (entity == null) {
            return null;
        }

        if (dto.getIpAddress() != null) {
            entity.setIpAddress(dto.getIpAddress());
        }

        if (dto.getName() != null) {
            entity.setName(dto.getName());
        }

        if (dto.getIsActive() != null) {
            entity.setIsActive(dto.getIsActive());
        }

        if (dto.getDescription() != null) {
            entity.setDescription(dto.getDescription());
        }

        return save(entity);
    }

    /**
     * Delete ESP device by ID
     */
    public void deleteById(Long id) {
        espDeviceRepo.deleteById(id);
    }

    /**
     * Check if ESP device exists by IP address
     */
    public boolean existsByIpAddress(String ipAddress) {
        return espDeviceRepo.findByIpAddress(ipAddress).isPresent();
    }

    /**
     * Check if ESP device exists by name
     */
    public boolean existsByName(String name) {
        return espDeviceRepo.findByName(name).isPresent();
    }

    /**
     * Count total active ESP devices
     */
    public long countActive() {
        return espDeviceRepo.countActive();
    }
}