package com.dk_power.power_plant_java.sevice.loto.loto_box;

import com.dk_power.power_plant_java.dto.permits.loto_box.LedConfigDto;
import com.dk_power.power_plant_java.entities.esp.EspDevice;
import com.dk_power.power_plant_java.entities.esp.LedStrip;
import com.dk_power.power_plant_java.entities.loto.LotoBox;
import com.dk_power.power_plant_java.repository.esp.EspDeviceRepo;
import com.dk_power.power_plant_java.repository.esp.LedStripRepo;
import com.dk_power.power_plant_java.repository.loto.LotoBoxRepo;
import com.dk_power.power_plant_java.sevice.angular.loto.NgLotoBoxService;
import com.dk_power.power_plant_java.sevice.esp.EspLedService;
import org.springframework.context.annotation.Lazy;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class LotoBoxInitializationService {

    private final LotoBoxRepo lotoBoxRepo;
    private final EspDeviceRepo espDeviceRepo;
    private final LedStripRepo ledStripRepo;
    private final EspLedService espLedService;
    private final LockInventorySeedService lockInventorySeedService;
    private final NgLotoBoxService ngLotoBoxService;

    public LotoBoxInitializationService(LotoBoxRepo lotoBoxRepo, EspDeviceRepo espDeviceRepo,
                                        LedStripRepo ledStripRepo, EspLedService espLedService,
                                        LockInventorySeedService lockInventorySeedService,
                                        @Lazy NgLotoBoxService ngLotoBoxService) {
        this.lotoBoxRepo = lotoBoxRepo;
        this.espDeviceRepo = espDeviceRepo;
        this.ledStripRepo = ledStripRepo;
        this.espLedService = espLedService;
        this.lockInventorySeedService = lockInventorySeedService;
        this.ngLotoBoxService = ngLotoBoxService;
    }

    private static final List<LedConfigDto> LED_CONFIGURATIONS = initializeLedConfigurations();

    /**
     * Seed DB only: ESP devices, LED strips, boxes, locks, and reconcile existing LOTOs.
     * Safe to run on every startup — idempotent, no network calls.
     */
    @Transactional
    public void seedLotoBoxData() {
        Map<Integer, EspDevice> espDevices = initializeEspDevices();
        Map<String, LedStrip> ledStrips = initializeLedStrips(espDevices);

        // Clean up invalid boxes (number = 0 or null) that were auto-created by cascade
        List<LotoBox> invalidBoxes = lotoBoxRepo.findAll().stream()
                .filter(b -> b.getNumber() == null || b.getNumber() == 0)
                .toList();
        if (!invalidBoxes.isEmpty()) {
            // Unlink any LOTOs pointing to these invalid boxes first
            for (LotoBox box : invalidBoxes) {
                if (box.getLoto() != null) {
                    box.getLoto().setLotoBox(null);
                    box.setLoto(null);
                }
            }
            lotoBoxRepo.deleteAll(invalidBoxes);
            System.out.println("Cleaned up " + invalidBoxes.size() + " invalid LOTO boxes (number=0)");
        }

        // Create missing boxes and update existing ones with correct LED strip data
        int created = 0;
        int updated = 0;
        for (LedConfigDto config : LED_CONFIGURATIONS) {
            String stripKey = config.getStrip() + "_" + (config.getStrip() < 3 ? 0 : 1);
            LedStrip ledStrip = ledStrips.get(stripKey);

            LotoBox existing = lotoBoxRepo.findByNumber(config.getNumber());
            if (existing == null) {
                LotoBox lotoBox = new LotoBox();
                lotoBox.setNumber(config.getNumber());
                lotoBox.setLedStrip(ledStrip);
                lotoBox.setRangeStart(config.getRangeStart());
                lotoBox.setRangeEnd(config.getRangeEnd());
                lotoBoxRepo.save(lotoBox);
                created++;
            } else {
                // Update LED strip mapping if missing or changed
                boolean changed = false;
                if (existing.getLedStrip() == null || !existing.getLedStrip().getId().equals(ledStrip.getId())) {
                    existing.setLedStrip(ledStrip);
                    changed = true;
                }
                if (existing.getRangeStart() == null || !existing.getRangeStart().equals(config.getRangeStart())) {
                    existing.setRangeStart(config.getRangeStart());
                    changed = true;
                }
                if (existing.getRangeEnd() == null || !existing.getRangeEnd().equals(config.getRangeEnd())) {
                    existing.setRangeEnd(config.getRangeEnd());
                    changed = true;
                }
                if (changed) {
                    lotoBoxRepo.save(existing);
                    updated++;
                }
            }
        }
        if (created > 0 || updated > 0) {
            System.out.println("LOTO boxes: created " + created + ", updated " + updated);
        }

        lockInventorySeedService.seedLockInventory();
        ngLotoBoxService.reconcileExistingLotos();
    }

    /**
     * Full initialization: seed DB + push current state to every ESP as one
     * full LED-array write per device. Only call when ESP controllers are
     * reachable (manual trigger or hub startup).
     */
    @Transactional
    public void initializeLotoBoxesWithEspDevices() {
        seedLotoBoxData();

        System.out.println("Pushing initial LED array to ESP devices...");
        espLedService.syncAllEspDevices();
    }

    /**
     * Comprehensive DB heal that resets every {@code LedStrip.totalLeds /
     * stripNumber / sequence} and every {@code LotoBox.rangeStart / rangeEnd}
     * back to the values in {@link com.dk_power.power_plant_java.sevice.esp.CanonicalLedLayout}.
     *
     * <p>Handles the run-time drift case: {@code LedStrip} and {@code LotoBox}
     * both extend {@code BaseIdEntity} and therefore sync across devices. A
     * stale snapshot pulled from the hub (or another desktop that ran a bad
     * heal) can bump {@code totalLeds} or shift a box's range at runtime,
     * pushing every downstream box's LED range and lighting the wrong LEDs.
     * The startup heal in {@link #seedLotoBoxData()} never catches this because
     * it only runs on boot.
     *
     * <p>The runtime write in {@code EspLedService.syncFullLedArray} is already
     * canonical-pinned so LEDs fire correctly regardless — this endpoint just
     * cleans the DB so the WARN logs stop and other devices stop importing the
     * drifted values.
     *
     * <p>Does NOT touch {@code box.loto} FKs or LED colors — safe to call while
     * live LOTOs are lit.
     *
     * @return one-line summary of how many rows were healed
     */
    @Transactional
    public String healToCanonical() {
        int stripsHealed = 0;
        int boxesHealed = 0;

        // 1. Strips — key by (esp.ipAddress, stripNumber) → canonical totalLeds.
        List<LedStrip> allStrips = ledStripRepo.findAll();
        for (LedStrip s : allStrips) {
            if (s.getEspDevice() == null || s.getStripNumber() == null) continue;
            Integer canonical = com.dk_power.power_plant_java.sevice.esp.CanonicalLedLayout
                    .canonicalStripTotalLeds(s.getEspDevice().getIpAddress(), s.getStripNumber());
            if (canonical == null) continue;
            boolean changed = false;
            if (s.getTotalLeds() == null || !s.getTotalLeds().equals(canonical)) {
                s.setTotalLeds(canonical);
                changed = true;
            }
            // Keep sequence and stripNumber aligned so both sort orders agree.
            if (s.getSequence() == null || !s.getSequence().equals(s.getStripNumber())) {
                s.setSequence(s.getStripNumber());
                changed = true;
            }
            if (changed) {
                ledStripRepo.save(s);
                stripsHealed++;
            }
        }

        // 2. Boxes — key by box.number → canonical rangeStart / rangeEnd.
        List<LotoBox> allBoxes = lotoBoxRepo.findAll();
        for (LotoBox b : allBoxes) {
            if (b.getNumber() == null) continue;
            Integer canonStart = com.dk_power.power_plant_java.sevice.esp.CanonicalLedLayout
                    .canonicalRangeStart(b.getNumber());
            Integer canonEnd = com.dk_power.power_plant_java.sevice.esp.CanonicalLedLayout
                    .canonicalRangeEnd(b.getNumber());
            if (canonStart == null || canonEnd == null) continue;
            boolean changed = false;
            if (b.getRangeStart() == null || !b.getRangeStart().equals(canonStart)) {
                b.setRangeStart(canonStart);
                changed = true;
            }
            if (b.getRangeEnd() == null || !b.getRangeEnd().equals(canonEnd)) {
                b.setRangeEnd(canonEnd);
                changed = true;
            }
            if (changed) {
                lotoBoxRepo.save(b);
                boxesHealed++;
            }
        }

        String msg = "Healed to canonical — strips: " + stripsHealed + ", boxes: " + boxesHealed;
        System.out.println("[LotoBoxInit] " + msg);
        return msg;
    }

    /**
     * Diagnostic snapshot of the LED layout: for every ESP, every strip's DB
     * {@code totalLeds}/{@code stripNumber}/{@code sequence} vs canonical, and
     * for every box its {@code rangeStart}/{@code rangeEnd} vs canonical.
     * Highlights any row where DB drifted from canonical — the operator can
     * see exactly what's off before deciding to run {@link #healToCanonical()}.
     */
    @Transactional(readOnly = true)
    public java.util.Map<String, Object> inspectLedLayout() {
        java.util.Map<String, Object> out = new java.util.LinkedHashMap<>();

        List<java.util.Map<String, Object>> stripRows = new ArrayList<>();
        int stripDrift = 0;
        for (LedStrip s : ledStripRepo.findAll()) {
            String ip = s.getEspDevice() != null ? s.getEspDevice().getIpAddress() : null;
            Integer canonical = com.dk_power.power_plant_java.sevice.esp.CanonicalLedLayout
                    .canonicalStripTotalLeds(ip, s.getStripNumber());
            boolean drifted = canonical != null && (s.getTotalLeds() == null
                    || !s.getTotalLeds().equals(canonical));
            if (drifted) stripDrift++;
            java.util.Map<String, Object> row = new java.util.LinkedHashMap<>();
            row.put("stripId", s.getId());
            row.put("espIp", ip);
            row.put("stripNumber", s.getStripNumber());
            row.put("sequence", s.getSequence());
            row.put("dbTotalLeds", s.getTotalLeds());
            row.put("canonicalTotalLeds", canonical);
            row.put("drifted", drifted);
            stripRows.add(row);
        }

        List<java.util.Map<String, Object>> boxRows = new ArrayList<>();
        int boxDrift = 0;
        for (LotoBox b : lotoBoxRepo.findAll()) {
            Integer canonStart = com.dk_power.power_plant_java.sevice.esp.CanonicalLedLayout
                    .canonicalRangeStart(b.getNumber());
            Integer canonEnd = com.dk_power.power_plant_java.sevice.esp.CanonicalLedLayout
                    .canonicalRangeEnd(b.getNumber());
            boolean drifted = (canonStart != null && (b.getRangeStart() == null
                    || !b.getRangeStart().equals(canonStart)))
                    || (canonEnd != null && (b.getRangeEnd() == null
                    || !b.getRangeEnd().equals(canonEnd)));
            if (drifted) boxDrift++;
            java.util.Map<String, Object> row = new java.util.LinkedHashMap<>();
            row.put("boxNumber", b.getNumber());
            row.put("stripId", b.getLedStrip() != null ? b.getLedStrip().getId() : null);
            row.put("dbRangeStart", b.getRangeStart());
            row.put("dbRangeEnd", b.getRangeEnd());
            row.put("canonicalRangeStart", canonStart);
            row.put("canonicalRangeEnd", canonEnd);
            row.put("drifted", drifted);
            boxRows.add(row);
        }

        out.put("strips", stripRows);
        out.put("boxes", boxRows);
        out.put("stripDriftCount", stripDrift);
        out.put("boxDriftCount", boxDrift);
        return out;
    }

    /**
     * Admin-triggered heal for ESP device rows and LED strip rows. Fixes:
     * <ul>
     *   <li>Missing ESP devices (creates the two known ESPs).</li>
     *   <li>Existing LedStrip rows whose {@code totalLeds} is the historical
     *       wrong value (260 for every strip) instead of the per-strip
     *       [240,237,237,245,245,260] that matches WLED hardware. Sending more
     *       indices than WLED expects returns HTTP 400 and stalls actuation.</li>
     *   <li>{@code sequence} = null on existing rows, which makes the strip-offset
     *       chaining in {@code EspLedService.syncFullLedArray} non-deterministic.</li>
     * </ul>
     * Scoped to strips only: does NOT run the box cleanup or the LOTO reconcile
     * in {@link #seedLotoBoxData}, both of which would reset live LED colors.
     * Exposed via {@code POST /ng/loto-boxes/heal-strips} and driven from the
     * LOTO admin page; run once per node after upgrade.
     */
    @Transactional
    public String healLedStrips() {
        Map<Integer, EspDevice> espDevices = initializeEspDevices();
        Map<String, LedStrip> strips = initializeLedStrips(espDevices);
        StringBuilder summary = new StringBuilder("Heal complete. Strips: ");
        strips.values().stream()
                .sorted((a, b) -> {
                    int c = a.getEspDevice().getName().compareTo(b.getEspDevice().getName());
                    return c != 0 ? c : Integer.compare(a.getStripNumber(), b.getStripNumber());
                })
                .forEach(s -> summary.append(s.getEspDevice().getName())
                        .append("/strip").append(s.getStripNumber())
                        .append("=").append(s.getTotalLeds())
                        .append(" "));
        String msg = summary.toString().trim();
        System.out.println("[LotoBoxInit] " + msg);
        return msg;
    }
    
    /**
     * Initialize ESP devices (2 devices with specific IPs)
     */
    private Map<Integer, EspDevice> initializeEspDevices() {
        Map<Integer, EspDevice> espDevices = new HashMap<>();
        
        // ESP Device 1
        EspDevice esp1 = espDeviceRepo.findByIpAddress("192.168.190.145")
                .orElseGet(() -> {
                    EspDevice device = new EspDevice();
                    device.setIpAddress("192.168.190.145");
                    device.setName("ESP-1");
                    device.setIsActive(true);
                    device.setDescription("Controls strips 0, 1, 2");
                    return espDeviceRepo.save(device);
                });
        espDevices.put(0, esp1);
        
        // ESP Device 2
        EspDevice esp2 = espDeviceRepo.findByIpAddress("192.168.190.146")
                .orElseGet(() -> {
                    EspDevice device = new EspDevice();
                    device.setIpAddress("192.168.190.146");
                    device.setName("ESP-2");
                    device.setIsActive(true);
                    device.setDescription("Controls strips 3, 4, 5");
                    return espDeviceRepo.save(device);
                });
        espDevices.put(1, esp2);
        
        return espDevices;
    }
    
    /**
     * Initialize LED strips (6 strips total, 3 per ESP on pins 4, 12, 16).
     * <p>
     * <b>LED counts are per-strip, NOT uniform.</b> WLED on the actual boxes is
     * configured for 714 LEDs on ESP-1 (240+237+237) and 750 LEDs on ESP-2
     * (245+245+260). Sending more indices than that in one {@code seg.i} payload
     * makes WLED return HTTP 400. Historical bug: this method used to hardcode
     * 260 per strip → 780/ESP → 400 on every actuation. Values here MUST match
     * the reference {@code loto-boxes} project's {@code CONTROLLER_LED_COUNTS}.
     * <p>
     * The self-heal branch below fixes existing DB rows whose totalLeds or
     * sequence are wrong. Without the sequence fix the offset chaining in
     * {@link com.dk_power.power_plant_java.sevice.esp.EspLedService#syncFullLedArray}
     * is non-deterministic across restarts.
     */
    private Map<String, LedStrip> initializeLedStrips(Map<Integer, EspDevice> espDevices) {
        Map<String, LedStrip> ledStrips = new HashMap<>();
        int[] pins = {4, 12, 16};
        int[] esp1LedCounts = {240, 237, 237}; // total 714
        int[] esp2LedCounts = {245, 245, 260}; // total 750

        // ESP-1 strips (0, 1, 2)
        EspDevice esp1 = espDevices.get(0);
        for (int i = 0; i < 3; i++) {
            final int stripIndex = i;
            String key = i + "_0";
            LedStrip strip = ledStripRepo.findByEspDeviceId(esp1.getId()).stream()
                    .filter(s -> s.getStripNumber().equals(stripIndex))
                    .findFirst()
                    .orElseGet(() -> {
                        LedStrip newStrip = new LedStrip();
                        newStrip.setEspDevice(esp1);
                        newStrip.setStripNumber(stripIndex);
                        newStrip.setGpioPin(pins[stripIndex]);
                        newStrip.setTotalLeds(esp1LedCounts[stripIndex]);
                        newStrip.setSequence(stripIndex);
                        newStrip.setDescription("ESP-1 Strip " + stripIndex + " on GPIO " + pins[stripIndex]);
                        return ledStripRepo.save(newStrip);
                    });
            healStrip(strip, esp1LedCounts[stripIndex], stripIndex);
            ledStrips.put(key, strip);
        }

        // ESP-2 strips (3, 4, 5)
        EspDevice esp2 = espDevices.get(1);
        for (int i = 0; i < 3; i++) {
            final int stripIndex = i;
            int stripNum = i + 3;
            String key = stripNum + "_1";
            LedStrip strip = ledStripRepo.findByEspDeviceId(esp2.getId()).stream()
                    .filter(s -> s.getStripNumber().equals(stripIndex))
                    .findFirst()
                    .orElseGet(() -> {
                        LedStrip newStrip = new LedStrip();
                        newStrip.setEspDevice(esp2);
                        newStrip.setStripNumber(stripIndex);
                        newStrip.setGpioPin(pins[stripIndex]);
                        newStrip.setTotalLeds(esp2LedCounts[stripIndex]);
                        newStrip.setSequence(stripIndex);
                        newStrip.setDescription("ESP-2 Strip " + stripIndex + " on GPIO " + pins[stripIndex]);
                        return ledStripRepo.save(newStrip);
                    });
            healStrip(strip, esp2LedCounts[stripIndex], stripIndex);
            ledStrips.put(key, strip);
        }

        return ledStrips;
    }

    private void healStrip(LedStrip strip, int expectedTotalLeds, int expectedSequence) {
        boolean changed = false;
        if (strip.getTotalLeds() == null || strip.getTotalLeds() != expectedTotalLeds) {
            System.out.println("LED strip " + strip.getId() + " totalLeds " + strip.getTotalLeds()
                    + " → " + expectedTotalLeds + " (heal)");
            strip.setTotalLeds(expectedTotalLeds);
            changed = true;
        }
        if (strip.getSequence() == null || strip.getSequence() != expectedSequence) {
            strip.setSequence(expectedSequence);
            changed = true;
        }
        if (changed) ledStripRepo.save(strip);
    }
    
    /**
     * Initialize LED configurations for all 72 boxes
     */
    private static List<LedConfigDto> initializeLedConfigurations() {
        List<LedConfigDto> configs = new ArrayList<>();
        
        // Strip 0 (Boxes 1-12)
        configs.add(new LedConfigDto(1, 0, 0, 17));
        configs.add(new LedConfigDto(2, 0, 20, 37));
        configs.add(new LedConfigDto(3, 0, 40, 57));
        configs.add(new LedConfigDto(4, 0, 60, 77));
        configs.add(new LedConfigDto(5, 0, 80, 97));
        configs.add(new LedConfigDto(6, 0, 100, 117));
        configs.add(new LedConfigDto(7, 0, 120, 137));
        configs.add(new LedConfigDto(8, 0, 140, 157));
        configs.add(new LedConfigDto(9, 0, 160, 177));
        configs.add(new LedConfigDto(10, 0, 180, 197));
        configs.add(new LedConfigDto(11, 0, 202, 219));
        configs.add(new LedConfigDto(12, 0, 222, 240));
        
        // Strip 1 (Boxes 13-24)
        configs.add(new LedConfigDto(13, 1, 0, 17));
        configs.add(new LedConfigDto(14, 1, 21, 37));
        configs.add(new LedConfigDto(15, 1, 41, 57));
        configs.add(new LedConfigDto(16, 1, 60, 77));
        configs.add(new LedConfigDto(17, 1, 82, 98));
        configs.add(new LedConfigDto(18, 1, 100, 117));
        configs.add(new LedConfigDto(19, 1, 120, 137));
        configs.add(new LedConfigDto(20, 1, 140, 156));
        configs.add(new LedConfigDto(21, 1, 158, 175));
        configs.add(new LedConfigDto(22, 1, 177, 194));
        configs.add(new LedConfigDto(23, 1, 197, 214));
        configs.add(new LedConfigDto(24, 1, 217, 237));
        
        // Strip 2 (Boxes 25-36)
        configs.add(new LedConfigDto(25, 2, 0, 17));
        configs.add(new LedConfigDto(26, 2, 20, 37));
        configs.add(new LedConfigDto(27, 2, 40, 57));
        configs.add(new LedConfigDto(28, 2, 60, 77));
        configs.add(new LedConfigDto(29, 2, 80, 97));
        configs.add(new LedConfigDto(30, 2, 100, 117));
        configs.add(new LedConfigDto(31, 2, 120, 137));
        configs.add(new LedConfigDto(32, 2, 139, 156));
        configs.add(new LedConfigDto(33, 2, 159, 176));
        configs.add(new LedConfigDto(34, 2, 178, 195));
        configs.add(new LedConfigDto(35, 2, 197, 214));
        configs.add(new LedConfigDto(36, 2, 217, 237));
        
        // Strip 3 (Boxes 37-48)
        configs.add(new LedConfigDto(37, 3, 0, 24));
        configs.add(new LedConfigDto(38, 3, 28, 43));
        configs.add(new LedConfigDto(39, 3, 46, 63));
        configs.add(new LedConfigDto(40, 3, 65, 83));
        configs.add(new LedConfigDto(41, 3, 85, 103));
        configs.add(new LedConfigDto(42, 3, 105, 123));
        configs.add(new LedConfigDto(43, 3, 125, 143));
        configs.add(new LedConfigDto(44, 3, 145, 163));
        configs.add(new LedConfigDto(45, 3, 165, 182));
        configs.add(new LedConfigDto(46, 3, 184, 201));
        configs.add(new LedConfigDto(47, 3, 203, 220));
        configs.add(new LedConfigDto(48, 3, 222, 245));
        
        // Strip 4 (Boxes 49-60)
        configs.add(new LedConfigDto(49, 4, 0, 17));
        configs.add(new LedConfigDto(50, 4, 20, 37));
        configs.add(new LedConfigDto(51, 4, 43, 57));
        configs.add(new LedConfigDto(52, 4, 62, 81));
        configs.add(new LedConfigDto(53, 4, 83, 100));
        configs.add(new LedConfigDto(54, 4, 102, 120));
        configs.add(new LedConfigDto(55, 4, 123, 140));
        configs.add(new LedConfigDto(56, 4, 142, 160));
        configs.add(new LedConfigDto(57, 4, 162, 180));
        configs.add(new LedConfigDto(58, 4, 182, 200));
        configs.add(new LedConfigDto(59, 4, 202, 220));
        configs.add(new LedConfigDto(60, 4, 222, 245));
        
        // Strip 5 (Boxes 61-72)
        configs.add(new LedConfigDto(61, 5, 0, 27));
        configs.add(new LedConfigDto(62, 5, 30, 47));
        configs.add(new LedConfigDto(63, 5, 50, 69));
        configs.add(new LedConfigDto(64, 5, 72, 90));
        configs.add(new LedConfigDto(65, 5, 92, 110));
        configs.add(new LedConfigDto(66, 5, 112, 130));
        configs.add(new LedConfigDto(67, 5, 136, 154));
        configs.add(new LedConfigDto(68, 5, 157, 177));
        configs.add(new LedConfigDto(69, 5, 177, 197));
        configs.add(new LedConfigDto(70, 5, 199, 217));
        configs.add(new LedConfigDto(71, 5, 220, 237));
        configs.add(new LedConfigDto(72, 5, 245, 260));
        
        return configs;
    }
}