package com.dk_power.power_plant_java.sevice.angular.loto;

import com.dk_power.power_plant_java.dto.SearchCriteria;
import com.dk_power.power_plant_java.dto.permits.loto_box.LotoBoxDto;
import com.dk_power.power_plant_java.entities.esp.EspDevice;
import com.dk_power.power_plant_java.entities.esp.LedStrip;
import com.dk_power.power_plant_java.entities.loto.Loto;
import com.dk_power.power_plant_java.entities.loto.LotoBox;
import com.dk_power.power_plant_java.mappers.permits.loto_box.LotoBoxMapper;
import com.dk_power.power_plant_java.repository.loto.LotoBoxRepo;
import com.dk_power.power_plant_java.repository.loto.LotoRepo;
import com.dk_power.power_plant_java.sevice.angular.base.NgCrudService;
import com.dk_power.power_plant_java.sevice.esp.EspLedService;
import com.dk_power.power_plant_java.sevice.esp.LedStripService;
import com.dk_power.power_plant_java.sevice.esp.LotoStatusColorMapping;
import com.dk_power.power_plant_java.sevice.esp.WledCommandQueueService;

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
    private final WledCommandQueueService wledCommandQueueService;
    private final LotoRepo lotoRepo;

    public NgLotoBoxService(LotoBoxRepo lotoBoxRepo, SessionFactory sessionFactory,
                           EntityManager entityManager, LotoBoxMapper lotoBoxMapper,
                           EspLedService espLedService, LedStripService ledStripService,
                           WledCommandQueueService wledCommandQueueService, LotoRepo lotoRepo) {
        this.lotoBoxRepo = lotoBoxRepo;
        this.sessionFactory = sessionFactory;
        this.entityManager = entityManager;
        this.lotoBoxMapper = lotoBoxMapper;
        this.espLedService = espLedService;
        this.ledStripService = ledStripService;
        this.wledCommandQueueService = wledCommandQueueService;
        this.lotoRepo = lotoRepo;
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
     * Enqueue a full-array refresh for the ESP that owns this box.
     * <p>
     * All ESP writes go through the queue → leader → EspLedService.syncFullLedArray
     * path. Never a direct synchronous HTTP write from here — that path used to
     * exist but it (a) bypassed retries so a momentarily-offline ESP silently
     * lost the update, and (b) caused multi-writer races when several desktops
     * had the same box up on-screen.
     * <p>
     * The queue dedupes per ESP, so calling this in a tight loop (e.g. from
     * {@link #syncAllBoxesToEsp}) enqueues at most one refresh per ESP.
     */
    private void updateEspDevice(LotoBox box) {
        if (box == null || box.getLedStrip() == null || box.getLedStrip().getEspDevice() == null) return;
        wledCommandQueueService.enqueueEspRefresh(box.getLedStrip().getEspDevice().getId());
    }

    /**
     * Set or clear the manual-override flag for a box by box number.
     * <p>
     * When true, {@link #updateBoxColorForStatus} is a no-op for this box — LOTO
     * lifecycle events won't repaint the LED. The current color is preserved,
     * so no ESP write is triggered here either; call {@link #updateBoxLedColorByNumber}
     * separately if the operator also wants to change the color.
     */
    public LotoBoxDto setManualOverrideByNumber(Integer boxNumber, boolean manualOverride) {
        LotoBox box = lotoBoxRepo.findByNumber(boxNumber);
        if (box == null) {
            throw new RuntimeException("LotoBox not found with number: " + boxNumber);
        }
        box.setManualOverride(manualOverride);
        lotoBoxRepo.save(box);
        return lotoBoxMapper.convertToDto(box);
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

    public List<LotoBoxDto> findAvailableBoxes() {
        return lotoBoxRepo.findAvailableBoxes().stream()
                .map(lotoBoxMapper::convertToDto)
                .toList();
    }

    public LotoBox assignBoxToLoto(Loto loto, Integer requestedBoxNumber) {
        LotoBox box;
        if (requestedBoxNumber != null) {
            box = lotoBoxRepo.findByNumber(requestedBoxNumber);
            if (box == null) throw new RuntimeException("LotoBox not found with number: " + requestedBoxNumber);
            if (box.getLoto() != null) throw new RuntimeException("LotoBox " + requestedBoxNumber + " is already assigned");
        } else {
            List<LotoBox> available = lotoBoxRepo.findAvailableBoxes();
            if (available.isEmpty()) throw new RuntimeException("No available LOTO boxes");
            box = available.get(0);
        }
        box.setLoto(loto);
        loto.setLotoBox(box);
        loto.setBoxNumber(box.getNumber());
        updateBoxColorForStatus(box, "Building");
        return box;
    }

    public void releaseBox(LotoBox box) {
        box.setLoto(null);
        updateBoxColorForStatus(box, "Closed");
        lotoBoxRepo.save(box);
    }

    public void updateBoxColorForStatus(LotoBox box, String statusName) {
        // Manual override wins over LOTO-driven color changes. Operator has
        // explicitly claimed the box's color; permit lifecycle events don't
        // clobber it until the operator clears the override.
        if (Boolean.TRUE.equals(box.getManualOverride())) {
            return;
        }
        LotoStatusColorMapping.RgbColor color = LotoStatusColorMapping.getColorForStatus(statusName);
        box.setR(color.r());
        box.setG(color.g());
        box.setB(color.b());
        box.setBrightness(color.brightness());
        lotoBoxRepo.save(box);

        // Queue a full-array refresh for the owning ESP. Dedups against any
        // pending refresh so a burst of status changes coalesces to one POST.
        updateEspDevice(box);
    }

    /**
     * Reconcile all LOTO boxes:
     * 1. Clear all box→loto links
     * 2. For each non-closed LOTO with a boxNumber, re-link to matching box
     * 3. Set LED colors based on current permit status
     */
    public String reconcileExistingLotos() {
        // Step 1: Clear all boxes
        List<LotoBox> allBoxes = lotoBoxRepo.findAll();
        for (LotoBox box : allBoxes) {
            box.setLoto(null);
            box.setR(0); box.setG(0); box.setB(32); box.setBrightness(128); // default closed color
        }
        lotoBoxRepo.saveAll(allBoxes);

        // Step 2: Re-link from LOTO.boxNumber
        List<Loto> allLotos = lotoRepo.findAll();
        int linked = 0;
        for (Loto loto : allLotos) {
            if (loto.getBoxNumber() == null || loto.getBoxNumber() == 0) continue;
            String status = loto.getPermitStatus() != null ? loto.getPermitStatus().getName() : null;
            if ("Closed".equals(status)) continue;

            LotoBox box = lotoBoxRepo.findByNumber(loto.getBoxNumber());
            if (box == null) continue;
            if (box.getLoto() != null) continue; // already taken by another LOTO

            box.setLoto(loto);
            loto.setLotoBox(box);
            lotoBoxRepo.save(box);
            lotoRepo.save(loto);

            if (status != null) {
                updateBoxColorForStatus(box, status);
            }
            linked++;
        }

        String msg = "Reset " + allBoxes.size() + " boxes, linked " + linked + " active LOTOs";
        System.out.println(msg);
        return msg;
    }
}