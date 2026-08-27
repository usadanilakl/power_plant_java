package com.dk_power.power_plant_java.sevice.angular.loto;

import com.dk_power.power_plant_java.dto.SearchCriteria;
import com.dk_power.power_plant_java.dto.permits.loto_box.LotoBoxDto;
import com.dk_power.power_plant_java.entities.esp.EspDevice;
import com.dk_power.power_plant_java.entities.esp.LedStrip;
import com.dk_power.power_plant_java.entities.loto.Loto;
import com.dk_power.power_plant_java.entities.loto.LotoBox;
import com.dk_power.power_plant_java.mappers.permits.loto_box.LotoBoxMapper;
import com.dk_power.power_plant_java.repository.loto.LockRepo;
import com.dk_power.power_plant_java.repository.loto.LotoBoxRepo;
import com.dk_power.power_plant_java.repository.loto.LotoRepo;
import com.dk_power.power_plant_java.sevice.angular.base.NgCrudService;
import com.dk_power.power_plant_java.sevice.esp.EspRefreshDispatcher;
import com.dk_power.power_plant_java.sevice.esp.LedStripService;
import com.dk_power.power_plant_java.sevice.esp.LotoStatusColorMapping;

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
    private final LedStripService ledStripService;
    private final EspRefreshDispatcher espRefreshDispatcher;
    private final LotoRepo lotoRepo;
    private final LockRepo lockRepo;

    public NgLotoBoxService(LotoBoxRepo lotoBoxRepo, SessionFactory sessionFactory,
                           EntityManager entityManager, LotoBoxMapper lotoBoxMapper,
                           LedStripService ledStripService,
                           EspRefreshDispatcher espRefreshDispatcher, LotoRepo lotoRepo,
                           LockRepo lockRepo) {
        this.lotoBoxRepo = lotoBoxRepo;
        this.sessionFactory = sessionFactory;
        this.entityManager = entityManager;
        this.lotoBoxMapper = lotoBoxMapper;
        this.ledStripService = ledStripService;
        this.espRefreshDispatcher = espRefreshDispatcher;
        this.lotoRepo = lotoRepo;
        this.lockRepo = lockRepo;
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
     * Route a full-array refresh for the ESP that owns this box through
     * {@link EspRefreshDispatcher} — hub-first with local fallback. See its
     * javadoc for the flow; the short version is that user clicks don't have
     * to wait for the leader-based queue to promote a desktop.
     * <p>
     * The dispatcher (and the queue it may enqueue into) dedupes per ESP, so
     * calling this in a tight loop (e.g. from {@link #syncAllBoxesToEsp})
     * doesn't produce a burst of ESP posts.
     */
    private void updateEspDevice(LotoBox box) {
        espRefreshDispatcher.dispatch(box);
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

    /**
     * Moves an existing LOTO from its current box to {@code newBoxNumber}
     * atomically:
     * <ol>
     *   <li>frees the old box (unlink LOTO, repaint to Closed);</li>
     *   <li>releases the old locks (per {@link com.dk_power.power_plant_java.sevice.loto.loto_box.LotoAssignmentService#releaseLocks});</li>
     *   <li>links the new box to the LOTO + auto-assigns locks based on the LOTO's point count;</li>
     *   <li>paints the new box with the LOTO's CURRENT permit status colour
     *       (Active LOTOs stay Active-colored, not reset to Building).</li>
     * </ol>
     *
     * <p>Fills the gap where the LOTO form had no way to correct an
     * auto-assigned box without manually editing box_number — which left the
     * old box still linked in the DB and both boxes lit at once. Callers should
     * check the LOTO is CA-editable before invoking.
     */
    public LotoBox changeBox(com.dk_power.power_plant_java.sevice.loto.loto_box.LotoAssignmentService assignmentService,
                             Loto loto, Integer newBoxNumber) {
        if (loto == null) throw new IllegalArgumentException("LOTO required");
        if (newBoxNumber == null || newBoxNumber <= 0) {
            throw new IllegalArgumentException("New box number required");
        }
        LotoBox current = loto.getLotoBox();
        if (current != null && newBoxNumber.equals(current.getNumber())) {
            // Heal a stale scalar left by older direct-update paths even when
            // the relationship already points at the requested physical box.
            if (!newBoxNumber.equals(loto.getBoxNumber())) {
                loto.setBoxNumber(newBoxNumber);
                lotoRepo.save(loto);
            }
            return current; // no-op
        }
        LotoBox target = lotoBoxRepo.findByNumber(newBoxNumber);
        if (target == null) {
            throw new RuntimeException("LotoBox not found with number: " + newBoxNumber);
        }
        if (target.getLoto() != null && !target.getLoto().getId().equals(loto.getId())) {
            throw new RuntimeException("LotoBox " + newBoxNumber + " is already assigned to LOTO "
                    + target.getLoto().getPermitNumber());
        }

        // 1. Release old locks (returns every lock currently on the LOTO to inventory).
        assignmentService.releaseLocks(loto);

        // 2. Unlink and repaint the old box. releaseBox handles paint-to-Closed
        //    + save + ESP refresh so the old LED goes dark before we light the new one.
        if (current != null) {
            releaseBox(current);
        }

        // 3. Link the new box.
        target.setLoto(loto);
        loto.setLotoBox(target);
        loto.setBoxNumber(target.getNumber());
        lotoBoxRepo.save(target);
        lotoRepo.save(loto);

        // 4. Re-assign locks against the new box based on the LOTO's current point count.
        int pointCount = loto.getLotoPointDtos() != null ? loto.getLotoPointDtos().size() : 0;
        if (pointCount > 0) {
            // autoAssign would pick its OWN box — but the LOTO is already linked
            // to `target`, so its box-picking path is skipped by the ≤5 branch
            // if pointCount ≤ 5 (finds a no-set box and links it — wrong).
            // Instead: pull locks directly from the target's home + singles for
            // the remainder, mirroring assignWithSet but with the target we chose.
            java.util.List<com.dk_power.power_plant_java.entities.loto.Lock> setLocks =
                    lockRepoFor(target).findAvailableLocksByHomeBox(target.getNumber());
            int setLocksToUse = Math.min(setLocks.size(), pointCount);
            for (int i = 0; i < setLocksToUse; i++) {
                com.dk_power.power_plant_java.entities.loto.Lock lock = setLocks.get(i);
                lock.setLoto(loto);
                lockRepoFor(target).save(lock);
            }
            int remaining = pointCount - setLocksToUse;
            if (remaining > 0) {
                java.util.List<com.dk_power.power_plant_java.entities.loto.Lock> singles =
                        lockRepoFor(target).findAvailableSingleLocks();
                if (singles.size() < remaining) {
                    throw new RuntimeException("Not enough single locks to move LOTO to box "
                            + newBoxNumber + ". Need " + remaining + ", have " + singles.size());
                }
                for (int i = 0; i < remaining; i++) {
                    com.dk_power.power_plant_java.entities.loto.Lock lock = singles.get(i);
                    lock.setLoto(loto);
                    lockRepoFor(target).save(lock);
                }
            }
        }

        // 5. Paint the new box with the LOTO's CURRENT status (not Building).
        String status = loto.getPermitStatus() != null ? loto.getPermitStatus().getName() : "Building";
        updateBoxColorForStatus(target, status);

        return target;
    }

    /** Cached lock-repo accessor. Kept as a helper so the change-box branch stays tidy. */
    private com.dk_power.power_plant_java.repository.loto.LockRepo lockRepoFor(LotoBox unused) {
        return lockRepo;
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
