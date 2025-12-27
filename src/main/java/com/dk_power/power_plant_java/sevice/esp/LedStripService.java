package com.dk_power.power_plant_java.sevice.esp;

import com.dk_power.power_plant_java.dto.esp.LedStripDto;
import com.dk_power.power_plant_java.entities.esp.EspDevice;
import com.dk_power.power_plant_java.entities.esp.LedStrip;
import com.dk_power.power_plant_java.mappers.esp.LedStripMapper;
import com.dk_power.power_plant_java.repository.esp.LedStripRepo;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.Set;

@Service
@Transactional
public class LedStripService {

    private final LedStripRepo ledStripRepo;
    private final LedStripMapper ledStripMapper;

    public LedStripService(LedStripRepo ledStripRepo,
                           LedStripMapper ledStripMapper) {
        this.ledStripRepo = ledStripRepo;
        this.ledStripMapper = ledStripMapper;
    }

    /**
     * Get LED strip by ID
     */
    public LedStrip getEntityById(Long id) {
        return ledStripRepo.findById(id).orElse(null);
    }

    /**
     * Get LED strip DTO by ID
     */
    public LedStripDto getDtoById(Long id) {
        LedStrip entity = getEntityById(id);
        return entity != null ? ledStripMapper.convertToDto(entity) : null;
    }

    /**
     * Get all LED strips
     */
    public List<LedStrip> getAll() {
        return ledStripRepo.findAll();
    }

    /**
     * Get all LED strips as DTOs
     */
    public List<LedStripDto> getAllDto() {
        return getAll().stream()
                .map(ledStripMapper::convertToDto)
                .toList();
    }

    /**
     * Get all LED strips for a specific ESP device
     */
    public List<LedStrip> getByEspDeviceId(Long espDeviceId) {
        return ledStripRepo.findByEspDeviceId(espDeviceId);
    }

    /**
     * Get all LED strips as DTOs for a specific ESP device
     */
    public List<LedStripDto> getByEspDeviceIdDto(Long espDeviceId) {
        return getByEspDeviceId(espDeviceId).stream()
                .map(ledStripMapper::convertToDto)
                .toList();
    }

    /**
     * Get LED strip by ESP device ID and strip number
     */
    public Optional<LedStrip> findByEspDeviceIdAndStripNumber(Long espDeviceId, Integer stripNumber) {
        return ledStripRepo.findByEspDeviceIdAndStripNumber(espDeviceId, stripNumber);
    }

    /**
     * Get LED strip by GPIO pin
     */
    public Optional<LedStrip> findByGpioPin(Integer gpioPin) {
        return ledStripRepo.findByGpioPin(gpioPin);
    }

    /**
     * Save LED strip
     */
    public LedStrip save(LedStrip ledStrip) {
        return ledStripRepo.save(ledStrip);
    }

    /**
     * Save LED strip from DTO
     */
    public LedStrip saveFromDto(LedStripDto dto) {
        LedStrip entity = ledStripMapper.convertToEntity(dto);
        return save(entity);
    }

    /**
     * Update LED strip
     */
    public LedStrip update(Long id, LedStripDto dto) {
        LedStrip entity = getEntityById(id);
        if (entity == null) {
            return null;
        }

        if (dto.getStripNumber() != null) {
            entity.setStripNumber(dto.getStripNumber());
        }

        if (dto.getGpioPin() != null) {
            entity.setGpioPin(dto.getGpioPin());
        }

        if (dto.getTotalLeds() != null) {
            entity.setTotalLeds(dto.getTotalLeds());
        }

        if (dto.getDescription() != null) {
            entity.setDescription(dto.getDescription());
        }

        return save(entity);
    }

    /**
     * Delete LED strip by ID
     */
    public void deleteById(Long id) {
        ledStripRepo.deleteById(id);
    }

    /**
     * Count LED strips for a specific ESP device
     */
    public long countByEspDeviceId(Long espDeviceId) {
        return ledStripRepo.countByEspDeviceId(espDeviceId);
    }

    /**
     * Check if LED strip exists by GPIO pin
     */
    public boolean existsByGpioPin(Integer gpioPin) {
        return ledStripRepo.findByGpioPin(gpioPin).isPresent();
    }


}