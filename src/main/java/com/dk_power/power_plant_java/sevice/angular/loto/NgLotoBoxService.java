package com.dk_power.power_plant_java.sevice.angular.loto;

import com.dk_power.power_plant_java.dto.SearchCriteria;
import com.dk_power.power_plant_java.dto.permits.loto_box.LotoBoxDto;
import com.dk_power.power_plant_java.entities.esp.EspDevice;
import com.dk_power.power_plant_java.entities.esp.LedStrip;
import com.dk_power.power_plant_java.entities.loto.LotoBox;
import com.dk_power.power_plant_java.mappers.permits.loto_box.LotoBoxMapper;
import com.dk_power.power_plant_java.repository.loto.LotoBoxRepo;
import com.dk_power.power_plant_java.sevice.angular.base.NgCrudService;
import com.dk_power.power_plant_java.sevice.esp.EspLedService;
import com.dk_power.power_plant_java.sevice.esp.LedStripService;

import jakarta.persistence.EntityManager;
import org.hibernate.SessionFactory;
import org.springframework.data.domain.Page;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;

@Service
@Transactional
public class NgLotoBoxService implements NgCrudService<LotoBox, LotoBoxDto, LotoBoxRepo, LotoBoxMapper> {
    private final LotoBoxRepo lotoBoxRepo;
    private final SessionFactory sessionFactory;
    private final EntityManager entityManager;
    private final LotoBoxMapper lotoBoxMapper;
    private final EspLedService espLedService;
    private final LedStripService ledStripService;

    public NgLotoBoxService(LotoBoxRepo lotoBoxRepo, SessionFactory sessionFactory,
                           EntityManager entityManager, LotoBoxMapper lotoBoxMapper,
                           EspLedService espLedService, LedStripService ledStripService) {
        this.lotoBoxRepo = lotoBoxRepo;
        this.sessionFactory = sessionFactory;
        this.entityManager = entityManager;
        this.lotoBoxMapper = lotoBoxMapper;
        this.espLedService = espLedService;
        this.ledStripService = ledStripService;
    }

    @Override
    public LotoBoxRepo getRepo() {
        return this.lotoBoxRepo;
    }

    @Override
    public LotoBoxMapper getMapper() {
        return this.lotoBoxMapper;
    }

    @Override
    public SessionFactory getSessionFactory() {
        return this.sessionFactory;
    }

    @Override
    public LotoBoxDto getDto() {
        return new LotoBoxDto();
    }

    @Override
    public LotoBox getEntity() {
        return new LotoBox();
    }

    @Override
    public EntityManager getEntityManager() {
        return this.entityManager;
    }

    @Override
    public Class<LotoBox> getEntityClass() {
        return LotoBox.class;
    }

    public Optional<LotoBox> findById(Long id) {
        return lotoBoxRepo.findById(id);
    }

    public Optional<LotoBoxDto> findDtoById(Long id) {
        return findById(id).map(lotoBoxMapper::convertToDto);
    }

    public Page<LotoBoxDto> complexSearch(String searchString, int page, int size) {
        Map<String, String> searchCriteria = new HashMap<>();
        searchCriteria.put("number", searchString);
        // Add other search criteria fields as needed
        SearchCriteria sc = new SearchCriteria();
        sc.setFilters(searchCriteria);
        return complexSearch(sc, page, size, "number", "asc", false);
    }

    @Override
    public LotoBoxDto toDto(LotoBox entity) {
        return this.lotoBoxMapper.convertToDto(entity);
    }

    @Override
    public LotoBox toEntity(LotoBoxDto dto) {
        return this.lotoBoxMapper.convertToEntity(dto);
    }

    /**
     * Get all LOTO boxes with their current LED color state
     */
    public List<LotoBoxDto> getAllBoxes() {
        List<LotoBox> boxes = lotoBoxRepo.findAll();
        return boxes.stream()
                .map(lotoBoxMapper::convertToDto)
                .toList();
    }

    /**
     * Update LED color for a specific box
     * Saves to database and updates ESP device
     */
    public LotoBoxDto updateBoxLedColor(Long boxId, Integer r, Integer g, Integer b, Integer brightness) {
        LotoBox box = lotoBoxRepo.findById(boxId)
                .orElseThrow(() -> new RuntimeException("LotoBox not found with id: " + boxId));

        // Update database
        box.setR(r);
        box.setG(g);
        box.setB(b);
        box.setBrightness(brightness);
        lotoBoxRepo.save(box);

        // Update ESP device
        updateEspDevice(box);

        return lotoBoxMapper.convertToDto(box);
    }

    /**
     * Update LED color for a specific box by box number
     */
    public LotoBoxDto updateBoxLedColorByNumber(Integer boxNumber, Integer r, Integer g, Integer b, Integer brightness) {
        LotoBox box = lotoBoxRepo.findByNumber(boxNumber);
        if (box == null) {
            throw new RuntimeException("LotoBox not found with number: " + boxNumber);
        }

        // Update database
        box.setR(r);
        box.setG(g);
        box.setB(b);
        box.setBrightness(brightness);
        lotoBoxRepo.save(box);

        // Update ESP device
        updateEspDevice(box);

        return lotoBoxMapper.convertToDto(box);
    }

    /**
     * Update ESP device with box LED color using EspLedService
     */
    private void updateEspDevice(LotoBox box) {
        try {
            if (box.getLedStrip() != null && box.getLedStrip().getEspDevice() != null) {
                espLedService.updateLedRange(
                    box.getLedStrip().getEspDevice(),
                    null,  // stripNumber not used in standard WLED API
                    box.getRangeStart(),
                    box.getRangeEnd(),
                    box.getR(),
                    box.getG(),
                    box.getB(),
                    box.getBrightness()
                );
            }
        } catch (Exception e) {
            // Log error but don't fail the database save
            System.err.println("Failed to update ESP device for box " + box.getNumber() + ": " + e.getMessage());
        }
    }

    /**
     * Sync all boxes to ESP device using current database state
     */
    public void syncAllBoxesToEsp() {
        List<LotoBox> boxes = lotoBoxRepo.findAll();
        boxes.forEach(this::updateEspDevice);
    }
    /**
     * Calculates the absolute starting LED index for a given strip on an ESP device.
     * The calculation is based on the sequence of strips ordered by their GPIO pin number.
     * @param box The LotoBox for which to calculate the absolute range.
     * @return A map containing the absolute 'start' and 'end' of the LED range, or null if calculation is not possible.
     */
        public Map<String,Integer> getAbsoluteLedRange(LotoBox box) {
        if (box == null || box.getLedStrip() == null) return null;

        LedStrip currentStrip = box.getLedStrip();
        EspDevice esp = currentStrip.getEspDevice();

        if (esp == null) return null;

        List<LedStrip> ledStrips = ledStripService.getByEspDeviceId(esp.getId());
        ledStrips.sort(Comparator.comparing(LedStrip::getSequence));

        int offset = 0;
        for (LedStrip strip : ledStrips) {
            if (strip.getId().equals(currentStrip.getId())) {
                break;
            }
            offset += strip.getTotalLeds();
        }

        Map<String, Integer> absoluteRange = new HashMap<>();
        absoluteRange.put("start", offset + box.getRangeStart());
        absoluteRange.put("end", offset + box.getRangeEnd());

        return absoluteRange;
    }
}