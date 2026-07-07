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
     * Initialize LED strips (6 strips total, 3 per ESP on pins 4, 12, 16)
     */
    private Map<String, LedStrip> initializeLedStrips(Map<Integer, EspDevice> espDevices) {
        Map<String, LedStrip> ledStrips = new HashMap<>();
        int[] pins = {4, 12, 16};
        
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
                        newStrip.setTotalLeds(260);
                        newStrip.setDescription("ESP-1 Strip " + stripIndex + " on GPIO " + pins[stripIndex]);
                        return ledStripRepo.save(newStrip);
                    });
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
                        newStrip.setTotalLeds(260);
                        newStrip.setDescription("ESP-2 Strip " + stripIndex + " on GPIO " + pins[stripIndex]);
                        return ledStripRepo.save(newStrip);
                    });
            ledStrips.put(key, strip);
        }
        
        return ledStrips;
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