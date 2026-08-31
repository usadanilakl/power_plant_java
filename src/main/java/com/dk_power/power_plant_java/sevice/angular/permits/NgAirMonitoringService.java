package com.dk_power.power_plant_java.sevice.angular.permits;

import com.dk_power.power_plant_java.dto.permits.AirTestDto;
import com.dk_power.power_plant_java.dto.permits.MonitoredAreaDto;
import com.dk_power.power_plant_java.entities.permits.AirTest;
import com.dk_power.power_plant_java.entities.permits.ConfinedSpace;
import com.dk_power.power_plant_java.entities.permits.HotWork;
import com.dk_power.power_plant_java.entities.permits.MonitoredArea;
import com.dk_power.power_plant_java.entities.permits.WorkArea;
import com.dk_power.power_plant_java.repository.permits.AirTestRepo;
import com.dk_power.power_plant_java.repository.permits.MonitoredAreaRepo;
import jakarta.persistence.EntityManager;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.Instant;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

/**
 * The air-monitoring list: which places need testing, and what they last read.
 *
 * <h2>The list is derived, then edited</h2>
 *
 * Every open Confined Space and Hot Work permit puts its place on the list, because those are the
 * two permit types that imply an atmosphere worth watching. Deriving it is the whole point — a list
 * somebody has to remember to add to is a list that will be missing the space nobody thought of.
 *
 * <p>On top of that, authorised users add, remove and edit entries. Two asymmetric rules keep the
 * derivation from fighting them:
 *
 * <ul>
 *   <li>A <b>manual removal is remembered</b>. Regeneration runs repeatedly, so without this an
 *       entry somebody deliberately took off would come back on the next pass and they would have
 *       to remove it again, forever, until the permit closed.</li>
 *   <li>A <b>manual addition is never auto-removed</b>. Nothing about a permit closing proves the
 *       space stopped needing monitoring, and the cost of the two mistakes is not symmetrical.</li>
 * </ul>
 *
 * <h2>Closing, not deleting</h2>
 *
 * When a source permit closes, its entry is switched off rather than deleted, so the tests taken
 * against it stay reachable. An air reading is a record of what the atmosphere was at a moment;
 * deleting the place it belonged to would orphan it.
 */
@Slf4j
@Service
@Transactional
@RequiredArgsConstructor
public class NgAirMonitoringService {

    /** Permit states that mean the work is over, so the place no longer needs watching. */
    private static final Set<String> FINISHED =
            Set.of("closed", "expired", "processed", "cancelled", "canceled");

    static final String SOURCE_CONFINED_SPACE = "CONFINED_SPACE";
    static final String SOURCE_HOT_WORK = "HOT_WORK";
    static final String SOURCE_MANUAL = "MANUAL";

    /** Re-test interval when an area does not set its own. One shift. */
    private static final int DEFAULT_INTERVAL_HOURS = 12;

    private final EntityManager entityManager;
    private final MonitoredAreaRepo monitoredAreaRepo;
    private final AirTestRepo airTestRepo;

    /**
     * Field-injected and @Lazy, NOT a constructor argument.
     *
     * <p>The dependency is genuinely circular: the publisher reads this service to build the
     * snapshot, and this service asks the publisher to refresh it after a write. As a constructor
     * parameter that cannot be resolved — and @Lazy does not help there, because Lombok does not
     * copy the annotation onto the generated constructor parameter without a lombok.config saying
     * so, which this project does not have. On the field Spring applies it directly and injects a
     * proxy, which is what breaks the cycle. Same shape as NgWorkAreaService's FieldChangeTracker.
     */
    @org.springframework.beans.factory.annotation.Autowired
    @org.springframework.context.annotation.Lazy
    private WorkAreaGitHubPublisher publisher;

    private final com.dk_power.power_plant_java.config.SyncConfig syncConfig;

    @org.springframework.beans.factory.annotation.Autowired
    @org.springframework.context.annotation.Lazy
    private com.dk_power.power_plant_java.sevice.sync.CentralSyncService centralSyncService;

    /**
     * Kill switch for the automatic derivation. Same warning as the other sweeps: the hub guard is
     * isHubMode() || !isServerAvailable(), and serverAvailable starts false, so a test instance with
     * sync disabled ARMS this rather than disabling it.
     */
    @org.springframework.beans.factory.annotation.Value("${permits.air-monitoring.derive.enabled:true}")
    private boolean derivationEnabled;

    /**
     * Refresh the PWA's offline copy after anything that changes what a phone should show.
     *
     * <p>{@code PwaSnapshotReconciler} would pick these up within ten minutes anyway, and does so
     * regardless of which path wrote them — but ten minutes is a long time to a technician standing
     * in front of a space wondering why it is not on their list. This is the latency fix; the
     * reconciler is the safety net, and the safety net is the part that must not be relied on for
     * correctness of the common case.
     */
    private void republishSnapshot() {
        try {
            // AFTER the transaction commits, not during it. The publisher is @Async, so calling it
            // inline hands a worker thread a query that runs before this transaction is visible: it
            // would publish the state from BEFORE the write and report success either way.
            if (org.springframework.transaction.support.TransactionSynchronizationManager
                    .isSynchronizationActive()) {
                org.springframework.transaction.support.TransactionSynchronizationManager
                        .registerSynchronization(
                            new org.springframework.transaction.support.TransactionSynchronization() {
                                @Override public void afterCommit() {
                                    publisher.publishMonitoredAreas();
                                }
                            });
                return;
            }
            publisher.publishMonitoredAreas();
        } catch (Exception e) {
            // The snapshot is a convenience. Failing to refresh it must never fail the write that
            // triggered it — the hub still has the authoritative record either way.
            log.warn("[AirMonitoring] Could not refresh the PWA snapshot: {}", e.getMessage());
        }
    }

    // ------------------------------------------------------------------ read

    public List<MonitoredAreaDto> list(boolean includeInactive) {
        List<MonitoredArea> areas = monitoredAreaRepo.findAll().stream()
                .filter(a -> includeInactive || Boolean.TRUE.equals(a.getRequiresMonitoring()))
                .filter(a -> includeInactive || !Boolean.TRUE.equals(a.getManuallyRemoved()))
                .toList();
        if (areas.isEmpty()) return List.of();

        Map<Long, AirTest> newest = newestTestByArea(areas.stream().map(MonitoredArea::getId).toList());
        List<MonitoredAreaDto> out = new ArrayList<>(areas.size());
        for (MonitoredArea area : areas) {
            out.add(toDto(area, newest.get(area.getId())));
        }
        // Overdue first, then longest since a test — the list exists to surface what needs doing.
        out.sort((a, b) -> {
            int byOverdue = Boolean.compare(Boolean.TRUE.equals(b.getOverdue()), Boolean.TRUE.equals(a.getOverdue()));
            if (byOverdue != 0) return byOverdue;
            long ah = a.getHoursSinceLastTest() == null ? Long.MAX_VALUE : a.getHoursSinceLastTest();
            long bh = b.getHoursSinceLastTest() == null ? Long.MAX_VALUE : b.getHoursSinceLastTest();
            return Long.compare(bh, ah);
        });
        return out;
    }

    public List<AirTestDto> testsFor(Long monitoredAreaId) {
        return airTestRepo.findByMonitoredArea_IdOrderByTestedAtDesc(monitoredAreaId).stream()
                .map(NgAirMonitoringService::toDto).toList();
    }

    /**
     * Newest test per area in ONE query rather than per row — the list screen loads every area, and
     * a query each would be a round trip per space on a page that is opened constantly.
     */
    private Map<Long, AirTest> newestTestByArea(List<Long> areaIds) {
        if (areaIds.isEmpty()) return Map.of();
        Map<Long, AirTest> newest = new HashMap<>();
        for (AirTest test : airTestRepo.findRecentForAreas(areaIds)) {
            if (test.getMonitoredArea() == null || test.getMonitoredArea().getId() == null) continue;
            // The query is sorted newest-first, so the first one seen per area wins.
            newest.putIfAbsent(test.getMonitoredArea().getId(), test);
        }
        return newest;
    }

    // ------------------------------------------------------------------ derive

    /**
     * Keep the list in step with the permits without anyone having to press anything.
     *
     * <p>A derived list that only rebuilds when somebody clicks Refresh is not derived: it is a
     * snapshot with a manual step in front of it, and a permit raised at 02:00 stays absent from the
     * field app until the next person happens to open the desktop page. That defeats the point of
     * deriving it at all.
     *
     * <p>Hub-gated like the other sweeps, and for a sharper reason here: ids are device-prefixed, so
     * two nodes deriving the same permit each mint their own row and sync keeps BOTH. One writer
     * avoids the duplicate rather than having to merge it afterwards.
     */
    @org.springframework.scheduling.annotation.Scheduled(fixedDelay = 900000, initialDelay = 180000)
    public void scheduledRefresh() {
        if (!derivationEnabled) return;
        if (!(syncConfig.isHubMode() || !centralSyncService.isServerAvailable())) return;
        try {
            refreshFromPermits();
        } catch (Exception e) {
            log.warn("[AirMonitoring] Scheduled refresh failed: {}", e.getMessage());
        }
    }

    /**
     * Rebuild the derived entries from the open permits.
     *
     * <p>Idempotent, and safe to run as often as you like: an entry is matched to its source permit
     * by (type, permit id), so a second pass updates rather than duplicates.
     */
    public Map<String, Object> refreshFromPermits() {
        int added = 0;
        int reactivated = 0;
        int retired = 0;
        Set<Long> liveConfinedSpaceIds = new java.util.HashSet<>();
        Set<Long> liveHotWorkIds = new java.util.HashSet<>();

        for (ConfinedSpace cs : openConfinedSpaces()) {
            liveConfinedSpaceIds.add(cs.getId());
            int result = upsert(SOURCE_CONFINED_SPACE, cs.getId(),
                    firstNonBlank(cs.getSpace(), areaName(cs.getWorkArea()), "Confined space #" + cs.getId()),
                    cs.getSpace(), cs.getWorkArea());
            if (result == 1) added++;
            else if (result == 2) reactivated++;
        }
        for (HotWork hw : openHotWorks()) {
            liveHotWorkIds.add(hw.getId());
            int result = upsert(SOURCE_HOT_WORK, hw.getId(),
                    firstNonBlank(hw.getLocation(), areaName(hw.getWorkArea()), "Hot work #" + hw.getId()),
                    null, hw.getWorkArea());
            if (result == 1) added++;
            else if (result == 2) reactivated++;
        }

        // Derived entries whose permit is no longer open stop needing monitoring. Manual entries are
        // untouched: nothing about a permit closing says a space somebody added by hand is fine now.
        for (MonitoredArea area : monitoredAreaRepo.findByRequiresMonitoringTrue()) {
            if (SOURCE_MANUAL.equals(area.getSourceType()) || area.getSourcePermitId() == null) continue;
            boolean stillLive = SOURCE_CONFINED_SPACE.equals(area.getSourceType())
                    ? liveConfinedSpaceIds.contains(area.getSourcePermitId())
                    : liveHotWorkIds.contains(area.getSourcePermitId());
            if (!stillLive) {
                area.setRequiresMonitoring(Boolean.FALSE);
                monitoredAreaRepo.save(area);
                retired++;
            }
        }

        Map<String, Object> out = new LinkedHashMap<>();
        out.put("added", added);
        out.put("reactivated", reactivated);
        out.put("retired", retired);
        out.put("liveConfinedSpaces", liveConfinedSpaceIds.size());
        out.put("liveHotWorks", liveHotWorkIds.size());
        log.info("air-monitoring.refresh added={} reactivated={} retired={}", added, reactivated, retired);
        republishSnapshot();
        return out;
    }

    /** @return 0 unchanged, 1 created, 2 reactivated. */
    private int upsert(String sourceType, Long permitId, String name, String spaceName, WorkArea workArea) {
        MonitoredArea existing = surviving(sourceType, permitId);

        if (existing == null) {
            MonitoredArea area = new MonitoredArea();
            area.setSourceType(sourceType);
            area.setSourcePermitId(permitId);
            area.setName(name);
            area.setSpaceName(spaceName);
            area.setWorkArea(workArea);
            area.setRequiresMonitoring(Boolean.TRUE);
            area.setManuallyRemoved(Boolean.FALSE);
            monitoredAreaRepo.save(area);
            return 1;
        }

        // Somebody took it off deliberately. The sweep does not overrule that.
        if (Boolean.TRUE.equals(existing.getManuallyRemoved())) return 0;

        if (!Boolean.TRUE.equals(existing.getRequiresMonitoring())) {
            existing.setRequiresMonitoring(Boolean.TRUE);
            monitoredAreaRepo.save(existing);
            return 2;
        }
        return 0;
    }

    /**
     * The one entry for this permit, collapsing any duplicates onto the smallest id.
     *
     * <p>Duplicates are possible even with hub-gated derivation: a client that ran the sweep while
     * the hub was unreachable mints its own row, and sync then keeps both. Smallest id wins because
     * every node computes that identically, the same deterministic-survivor rule the Category/Value
     * dedup uses. Losers are retired rather than deleted so their readings stay reachable.
     */
    private MonitoredArea surviving(String sourceType, Long permitId) {
        List<MonitoredArea> all = monitoredAreaRepo
                .findBySourceTypeAndSourcePermitIdOrderByIdAsc(sourceType, permitId);
        if (all.isEmpty()) return null;
        MonitoredArea winner = all.get(0);
        for (int i = 1; i < all.size(); i++) {
            MonitoredArea loser = all.get(i);
            if (Boolean.TRUE.equals(loser.getRequiresMonitoring())) {
                loser.setRequiresMonitoring(Boolean.FALSE);
                monitoredAreaRepo.save(loser);
                log.info("[AirMonitoring] Collapsed duplicate area {} onto {} for {} #{}",
                        loser.getId(), winner.getId(), sourceType, permitId);
            }
            // A removal on EITHER copy is a decision, and it has to survive the collapse.
            if (Boolean.TRUE.equals(loser.getManuallyRemoved())
                    && !Boolean.TRUE.equals(winner.getManuallyRemoved())) {
                winner.setManuallyRemoved(Boolean.TRUE);
                winner.setRequiresMonitoring(Boolean.FALSE);
                monitoredAreaRepo.save(winner);
            }
        }
        return winner;
    }

    private List<ConfinedSpace> openConfinedSpaces() {
        return entityManager.createQuery(
                        "SELECT DISTINCT e FROM ConfinedSpace e LEFT JOIN FETCH e.workArea "
                                + "LEFT JOIN e.permitStatus s "
                                + "WHERE (s IS NULL OR LOWER(s.name) NOT IN :done) "
                                + "AND (e.deleted IS NULL OR e.deleted = false)", ConfinedSpace.class)
                .setParameter("done", FINISHED)
                .getResultList();
    }

    private List<HotWork> openHotWorks() {
        return entityManager.createQuery(
                        "SELECT DISTINCT e FROM HotWork e LEFT JOIN FETCH e.workArea "
                                + "LEFT JOIN e.permitStatus s "
                                + "WHERE (s IS NULL OR LOWER(s.name) NOT IN :done) "
                                + "AND (e.deleted IS NULL OR e.deleted = false)", HotWork.class)
                .setParameter("done", FINISHED)
                .getResultList();
    }

    // ------------------------------------------------------------------ write

    public MonitoredAreaDto save(MonitoredAreaDto dto) {
        MonitoredArea area = dto.getId() != null && dto.getId() != 0
                ? monitoredAreaRepo.findById(dto.getId()).orElseGet(MonitoredArea::new)
                : new MonitoredArea();

        if (area.getSourceType() == null) area.setSourceType(SOURCE_MANUAL);
        area.setName(dto.getName());
        area.setSpaceName(dto.getSpaceName());
        area.setNotes(dto.getNotes());
        area.setTestIntervalHours(dto.getTestIntervalHours());
        if (dto.getRequiresMonitoring() != null) area.setRequiresMonitoring(dto.getRequiresMonitoring());
        if (dto.getWorkAreaId() != null) {
            area.setWorkArea(entityManager.find(WorkArea.class, dto.getWorkAreaId()));
        }
        MonitoredArea saved = monitoredAreaRepo.save(area);
        republishSnapshot();
        return toDto(saved, newestTestByArea(List.of(saved.getId())).get(saved.getId()));
    }

    /**
     * Take an area off the list.
     *
     * <p>Flagged, not deleted, and the flag is what stops {@link #refreshFromPermits()} putting a
     * derived entry straight back on the next pass. Its tests stay reachable either way.
     */
    public void remove(Long id) {
        monitoredAreaRepo.findById(id).ifPresent(area -> {
            area.setManuallyRemoved(Boolean.TRUE);
            area.setRequiresMonitoring(Boolean.FALSE);
            monitoredAreaRepo.save(area);
            republishSnapshot();
        });
    }

    /** Put a removed area back, and let the sweep manage it again. */
    public void restore(Long id) {
        monitoredAreaRepo.findById(id).ifPresent(area -> {
            area.setManuallyRemoved(Boolean.FALSE);
            area.setRequiresMonitoring(Boolean.TRUE);
            monitoredAreaRepo.save(area);
            republishSnapshot();
        });
    }

    /**
     * Record a test.
     *
     * <p>{@code testedAt} is taken from the payload when present, and only defaults to now when it
     * is missing: a reading taken in a basement and synced hours later must keep the moment it was
     * actually taken, or the whole record becomes a lie about when the atmosphere was safe.
     */
    public AirTestDto recordTest(AirTestDto dto) {
        MonitoredArea area = dto.getMonitoredAreaId() == null ? null
                : monitoredAreaRepo.findById(dto.getMonitoredAreaId()).orElse(null);
        if (area == null) {
            throw new IllegalArgumentException("Unknown monitored area " + dto.getMonitoredAreaId());
        }

        // Resolve by the client id FIRST. A retry after a lost response has to update the reading
        // the server already committed, not create a second row for the same test.
        AirTest test = null;
        if (dto.getClientUuid() != null && !dto.getClientUuid().isBlank()) {
            test = airTestRepo.findFirstByClientUuid(dto.getClientUuid()).orElse(null);
        }
        if (test == null && dto.getId() != null && dto.getId() != 0) {
            test = airTestRepo.findById(dto.getId()).orElse(null);
        }
        if (test == null) test = new AirTest();
        if (test.getClientUuid() == null) test.setClientUuid(dto.getClientUuid());

        test.setMonitoredArea(area);
        test.setTestedAt(clampToNow(dto.getTestedAt()));
        test.setTestedBy(dto.getTestedBy());
        test.setMeterModel(dto.getMeterModel());
        test.setMeterSerial(dto.getMeterSerial());
        test.setOxygen(dto.getOxygen());
        test.setLel(dto.getLel());
        test.setHydrogenSulfide(dto.getHydrogenSulfide());
        test.setCarbonMonoxide(dto.getCarbonMonoxide());
        test.setAmmonia(dto.getAmmonia());
        test.setResult(dto.getResult());
        test.setNotes(dto.getNotes());
        AirTest saved = airTestRepo.save(test);
        // The snapshot carries last-tested and overdue, so a reading changes what other phones
        // should be showing, not just this one.
        republishSnapshot();
        return toDto(saved);
    }

    // ------------------------------------------------------------------ mapping

    /**
     * A reading cannot be in the future.
     *
     * <p>A phone with a wrong clock, or a mistyped date, would otherwise become the newest test and
     * mark the area "not overdue" until that future moment passed: the failure mode where the system
     * confidently reports an untested space as fine. Five minutes covers honest clock skew; anything
     * beyond it is recorded as now.
     */
    private static Instant clampToNow(Instant testedAt) {
        Instant now = Instant.now();
        if (testedAt == null) return now;
        return testedAt.isAfter(now.plusSeconds(300)) ? now : testedAt;
    }

    private MonitoredAreaDto toDto(MonitoredArea area, AirTest lastTest) {
        MonitoredAreaDto dto = new MonitoredAreaDto();
        dto.setId(area.getId());
        dto.setName(area.getName());
        dto.setSourceType(area.getSourceType());
        dto.setSourcePermitId(area.getSourcePermitId());
        dto.setSpaceName(area.getSpaceName());
        dto.setRequiresMonitoring(area.getRequiresMonitoring());
        dto.setManuallyRemoved(area.getManuallyRemoved());
        dto.setTestIntervalHours(area.getTestIntervalHours());
        dto.setNotes(area.getNotes());
        if (area.getWorkArea() != null) {
            dto.setWorkAreaId(area.getWorkArea().getId());
            dto.setWorkAreaName(area.getWorkArea().getName());
        }

        int interval = area.getTestIntervalHours() != null && area.getTestIntervalHours() > 0
                ? area.getTestIntervalHours() : DEFAULT_INTERVAL_HOURS;
        if (lastTest != null && lastTest.getTestedAt() != null) {
            dto.setLastTest(toDto(lastTest));
            long hours = Duration.between(lastTest.getTestedAt(), Instant.now()).toHours();
            dto.setHoursSinceLastTest(hours);
            dto.setOverdue(hours >= interval);
        } else {
            // Never tested is the MOST overdue thing on the list. Reporting it as fine because it
            // has no history would be exactly the wrong way round.
            dto.setHoursSinceLastTest(null);
            dto.setOverdue(Boolean.TRUE);
        }
        return dto;
    }

    private static AirTestDto toDto(AirTest test) {
        AirTestDto dto = new AirTestDto();
        dto.setId(test.getId());
        dto.setClientUuid(test.getClientUuid());
        dto.setMonitoredAreaId(test.getMonitoredArea() == null ? null : test.getMonitoredArea().getId());
        dto.setTestedAt(test.getTestedAt());
        dto.setTestedBy(test.getTestedBy());
        dto.setMeterModel(test.getMeterModel());
        dto.setMeterSerial(test.getMeterSerial());
        dto.setOxygen(test.getOxygen());
        dto.setLel(test.getLel());
        dto.setHydrogenSulfide(test.getHydrogenSulfide());
        dto.setCarbonMonoxide(test.getCarbonMonoxide());
        dto.setAmmonia(test.getAmmonia());
        dto.setResult(test.getResult());
        dto.setNotes(test.getNotes());
        return dto;
    }

    private static String areaName(WorkArea workArea) {
        return workArea == null ? null : workArea.getName();
    }

    private static String firstNonBlank(String... values) {
        for (String value : values) {
            if (value != null && !value.isBlank()) return value;
        }
        return null;
    }
}
