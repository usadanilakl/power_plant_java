package com.dk_power.power_plant_java.sevice.esp;

import com.dk_power.power_plant_java.entities.esp.EspDevice;
import com.dk_power.power_plant_java.entities.loto.LotoBox;
import com.dk_power.power_plant_java.repository.loto.LotoBoxRepo;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Service for managing ESP WLED devices using standard WLED JSON API
 * Handles both initialization (segments) and ongoing LED updates
 */
@Service
@RequiredArgsConstructor
public class EspLedService {

    private final RestTemplate restTemplate;
    private final EspDeviceService espDeviceService;
    private final LotoBoxRepo lotoBoxRepo;

    /**
     * Initialize WLED ESP device - creates segments for each LOTO box
     * Note: Pins and LED count must be hardcoded in ESP firmware
     * This creates WLED segments that map to each box's LED range
     */
    public void initializeEspDevice(EspDevice espDevice) {
        if (espDevice == null || espDevice.getIpAddress() == null) {
            System.err.println("Cannot initialize ESP device: device or IP address is null");
            return;
        }

        try {
            String url = "http://" + espDevice.getIpAddress() + "/json/state";

            // Get all LOTO boxes for this ESP device
            List<LotoBox> boxes = lotoBoxRepo.findByEspDeviceId(espDevice.getId());

            if (boxes.isEmpty()) {
                System.out.println("No LOTO boxes found for ESP device: " + espDevice.getName());
                System.out.println("Turning on device with default settings...");

                // Just turn on the device
                Map<String, Object> state = new HashMap<>();
                state.put("on", true);
                state.put("bri", 255);

                HttpHeaders headers = new HttpHeaders();
                headers.setContentType(MediaType.APPLICATION_JSON);
                HttpEntity<Map<String, Object>> request = new HttpEntity<>(state, headers);
                restTemplate.postForObject(url, request, String.class);
                return;
            }

            // Create WLED segments for each box
            List<Map<String, Object>> segments = new ArrayList<>();
            for (LotoBox box : boxes) {
                Map<String, Object> segment = new HashMap<>();
                segment.put("start", box.getRangeStart());
                segment.put("stop", box.getRangeEnd() + 1);  // WLED uses exclusive end
                segment.put("id", box.getNumber());  // Use box number as segment ID

                // Set initial color from database
                List<Integer> color = new ArrayList<>();
                color.add(box.getR());
                color.add(box.getG());
                color.add(box.getB());
                segment.put("col", List.of(color));  // Primary color

                segments.add(segment);

                System.out.println("Creating segment for box " + box.getNumber() +
                                 " (LEDs " + box.getRangeStart() + "-" + box.getRangeEnd() +
                                 ") RGB(" + box.getR() + "," + box.getG() + "," + box.getB() + ")");
            }

            // Build the state object
            Map<String, Object> state = new HashMap<>();
            state.put("on", true);
            state.put("bri", 255);
            state.put("seg", segments);

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            HttpEntity<Map<String, Object>> request = new HttpEntity<>(state, headers);

            restTemplate.postForObject(url, request, String.class);

            System.out.println("Successfully initialized WLED device: " + espDevice.getName() +
                             " with " + segments.size() + " segments");
        } catch (Exception e) {
            System.err.println("Failed to initialize ESP device " + espDevice.getName() + ": " + e.getMessage());
            e.printStackTrace();
        }
    }

    /**
     * Initialize all active ESP devices
     */
    public void initializeAllEspDevices() {
        var activeDevices = espDeviceService.getAllActive();

        System.out.println("Initializing " + activeDevices.size() + " active ESP devices...");

        for (EspDevice device : activeDevices) {
            initializeEspDevice(device);
        }
    }

    /**
     * Update LED color for a specific box on an ESP device using WLED JSON API
     * Uses rangeStart and rangeEnd to set LED colors via individual LED control
     */
    public void updateBoxLeds(EspDevice espDevice, Integer stripNumber, Integer boxNumber,
                             Integer r, Integer g, Integer b, Integer brightness) {
        // This signature is kept for backward compatibility but should not be used
        // The caller should use updateLedRange with actual rangeStart/rangeEnd
        throw new UnsupportedOperationException(
            "updateBoxLeds with boxNumber is deprecated. Use updateLedRange with rangeStart/rangeEnd instead");
    }

    /**
     * Update LED range on an ESP device using WLED JSON API
     * Finds the segment that corresponds to this LED range and updates its color
     */
    public void updateLedRange(EspDevice espDevice, Integer stripNumber,
                              Integer start, Integer end,
                              Integer r, Integer g, Integer b, Integer brightness) {
        if (espDevice == null || espDevice.getIpAddress() == null) {
            throw new RuntimeException("ESP device or IP address is null");
        }

        try {
            String url = "http://" + espDevice.getIpAddress() + "/json/state";

            // Find the box that matches this LED range to get its segment ID
            List<LotoBox> boxes = lotoBoxRepo.findByEspDeviceId(espDevice.getId());
            LotoBox matchingBox = boxes.stream()
                .filter(box -> box.getRangeStart().equals(start) && box.getRangeEnd().equals(end))
                .findFirst()
                .orElse(null);

            if (matchingBox == null) {
                System.err.println("No box found for LED range " + start + "-" + end +
                                 " on ESP " + espDevice.getName());
                System.err.println("Using individual LED control as fallback...");

                // Fallback: use individual LED control
                String hexColor = String.format("%02X%02X%02X", r, g, b);
                List<Object> ledArray = new ArrayList<>();
                for (int i = start; i <= end; i++) {
                    ledArray.add(i);
                    ledArray.add(hexColor);
                }

                Map<String, Object> segment = new HashMap<>();
                segment.put("i", ledArray);

                Map<String, Object> state = new HashMap<>();
                state.put("seg", segment);
                state.put("bri", brightness);

                HttpHeaders headers = new HttpHeaders();
                headers.setContentType(MediaType.APPLICATION_JSON);
                HttpEntity<Map<String, Object>> request = new HttpEntity<>(state, headers);
                restTemplate.postForObject(url, request, String.class);
                return;
            }

            // Update the segment by its ID (which is the box number)
            List<Integer> color = new ArrayList<>();
            color.add(r);
            color.add(g);
            color.add(b);

            Map<String, Object> segment = new HashMap<>();
            segment.put("id", matchingBox.getNumber());  // Target specific segment
            segment.put("col", List.of(color));  // Set primary color

            Map<String, Object> state = new HashMap<>();
            state.put("seg", segment);
            state.put("bri", brightness);

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            HttpEntity<Map<String, Object>> request = new HttpEntity<>(state, headers);

            System.out.println("Updating segment " + matchingBox.getNumber() + " (LEDs " + start + "-" + end + ")" +
                             " at ESP " + espDevice.getIpAddress() +
                             " to RGB(" + r + "," + g + "," + b + ") brightness: " + brightness);

            restTemplate.postForObject(url, request, String.class);
        } catch (Exception e) {
            System.err.println("Failed to update LED range on ESP " +
                             espDevice.getName() + ": " + e.getMessage());
            throw new RuntimeException("Failed to update ESP device", e);
        }
    }

    /**
     * Turn off all LEDs on an ESP device using WLED JSON API
     */
    public void turnOffAllLeds(EspDevice espDevice) {
        if (espDevice == null || espDevice.getIpAddress() == null) {
            return;
        }

        try {
            String url = "http://" + espDevice.getIpAddress() + "/json/state";

            // Simply turn off the device using WLED API
            Map<String, Object> state = new HashMap<>();
            state.put("on", false);

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            HttpEntity<Map<String, Object>> request = new HttpEntity<>(state, headers);

            restTemplate.postForObject(url, request, String.class);

            System.out.println("Turned off all LEDs on ESP device: " + espDevice.getName());
        } catch (Exception e) {
            System.err.println("Failed to turn off LEDs on ESP " + espDevice.getName() + ": " + e.getMessage());
        }
    }

    /**
     * Check if ESP device is reachable
     */
    public boolean isEspDeviceReachable(EspDevice espDevice) {
        if (espDevice == null || espDevice.getIpAddress() == null) {
            return false;
        }

        try {
            String url = "http://" + espDevice.getIpAddress() + "/json/info";
            restTemplate.getForObject(url, String.class);
            return true;
        } catch (Exception e) {
            return false;
        }
    }

    /**
     * Get ESP device status
     */
    public String getEspDeviceStatus(EspDevice espDevice) {
        if (espDevice == null || espDevice.getIpAddress() == null) {
            return "Device or IP is null";
        }

        try {
            String url = "http://" + espDevice.getIpAddress() + "/json/info";
            return restTemplate.getForObject(url, String.class);
        } catch (Exception e) {
            return "Error: " + e.getMessage();
        }
    }

    /**
     * Generate WLED hardware configuration instructions for an ESP device
     * Returns a formatted string with instructions for manual WLED web UI configuration
     */
    public String generateWledConfigInstructions(EspDevice espDevice) {
        if (espDevice == null) {
            return "No ESP device provided";
        }

        StringBuilder instructions = new StringBuilder();
        instructions.append("═══════════════════════════════════════════════════════════\n");
        instructions.append("  WLED HARDWARE CONFIGURATION INSTRUCTIONS\n");
        instructions.append("  Device: ").append(espDevice.getName()).append("\n");
        instructions.append("  IP: ").append(espDevice.getIpAddress()).append("\n");
        instructions.append("═══════════════════════════════════════════════════════════\n\n");

        instructions.append("⚠️  IMPORTANT: Hardware configuration cannot be done via API.\n");
        instructions.append("    You must configure these settings manually in the WLED web UI.\n\n");

        instructions.append("STEPS:\n");
        instructions.append("1. Open web browser and navigate to:\n");
        instructions.append("   http://").append(espDevice.getIpAddress()).append("/settings\n\n");

        instructions.append("2. Click on 'LED Preferences'\n\n");

        // Get all boxes for this device to find LED strips
        List<LotoBox> boxes = lotoBoxRepo.findByEspDeviceId(espDevice.getId());

        if (boxes.isEmpty()) {
            instructions.append("⚠️  No LOTO boxes found for this device.\n");
            instructions.append("    Cannot generate configuration instructions.\n");
            return instructions.toString();
        }

        // Group boxes by LED strip
        Map<Long, List<LotoBox>> boxesByStrip = boxes.stream()
            .collect(java.util.stream.Collectors.groupingBy(
                box -> box.getLedStrip().getId()
            ));

        instructions.append("3. Configure each LED output as follows:\n\n");

        int outputNumber = 0;
        for (Map.Entry<Long, List<LotoBox>> entry : boxesByStrip.entrySet()) {
            var strip = entry.getValue().get(0).getLedStrip();

            instructions.append("   ───────────────────────────────────────────────────\n");
            instructions.append("   OUTPUT #").append(outputNumber).append("\n");
            instructions.append("   ───────────────────────────────────────────────────\n");
            instructions.append("   LED Type:        ").append(strip.getLedType()).append("\n");
            instructions.append("   Color Order:     ").append(strip.getColorOrder()).append("\n");
            instructions.append("   Data GPIO:       ").append(strip.getGpioPin()).append("\n");
            instructions.append("   Length (LEDs):   ").append(strip.getTotalLeds()).append("\n");
            instructions.append("   mA per LED:      ").append(strip.getMilliampsPerLed()).append(" mA\n");
            instructions.append("   Start:           ").append(strip.getStartLed()).append("\n");
            instructions.append("   Skip First LEDs: ").append(strip.getSkipFirstLeds()).append("\n");
            instructions.append("   Reversed:        ").append(strip.getReversed() ? "✓ Enable" : "✗ Disable").append("\n");
            instructions.append("   Off Refresh:     ").append(strip.getOffRefreshRate()).append(" ms\n\n");

            outputNumber++;
        }

        instructions.append("\n4. Click 'Save' at the bottom of the page\n");
        instructions.append("5. ESP will reboot with new configuration\n");
        instructions.append("6. After reboot, return to this app and click 'Initialize'\n");
        instructions.append("   to create WLED segments for your LOTO boxes\n\n");

        instructions.append("═══════════════════════════════════════════════════════════\n");

        return instructions.toString();
    }
}
