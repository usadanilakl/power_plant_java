package com.dk_power.power_plant_java.sevice.esp;

import com.dk_power.power_plant_java.entities.esp.EspDevice;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.HashMap;
import java.util.Map;

/**
 * Service for managing ESP WLED devices using standard WLED JSON API
 * Handles both initialization and ongoing LED updates
 */
@Service
@RequiredArgsConstructor
public class EspLedService {

    private final RestTemplate restTemplate;
    private final EspDeviceService espDeviceService;

    /**
     * Initialize WLED ESP device - turns on the device and sets initial brightness
     * Note: Pins must be hardcoded in ESP firmware. This only initializes the WLED state.
     */
    public void initializeEspDevice(EspDevice espDevice) {
        if (espDevice == null || espDevice.getIpAddress() == null) {
            System.err.println("Cannot initialize ESP device: device or IP address is null");
            return;
        }

        try {
            String url = "http://" + espDevice.getIpAddress() + "/json/state";

            // Initialize WLED device: turn on and set brightness
            Map<String, Object> state = new HashMap<>();
            state.put("on", true);
            state.put("bri", 255);  // Full brightness

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            HttpEntity<Map<String, Object>> request = new HttpEntity<>(state, headers);

            restTemplate.postForObject(url, request, String.class);

            System.out.println("Successfully initialized WLED device: " + espDevice.getName() + " at " + espDevice.getIpAddress());
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
     * Sets individual LED colors using the segment "i" property
     */
    public void updateLedRange(EspDevice espDevice, Integer stripNumber,
                              Integer start, Integer end,
                              Integer r, Integer g, Integer b, Integer brightness) {
        if (espDevice == null || espDevice.getIpAddress() == null) {
            throw new RuntimeException("ESP device or IP address is null");
        }

        try {
            String url = "http://" + espDevice.getIpAddress() + "/json/state";

            // Build the individual LED color array using WLED JSON API
            // Format: [startIndex, "RRGGBB", startIndex2, "RRGGBB", ...]
            String hexColor = String.format("%02X%02X%02X", r, g, b);

            // Create array for setting LEDs: [start, color, start+1, color, ..., end, color]
            java.util.List<Object> ledArray = new java.util.ArrayList<>();
            for (int i = start; i <= end; i++) {
                ledArray.add(i);
                ledArray.add(hexColor);
            }

            // Build WLED state JSON
            Map<String, Object> segment = new HashMap<>();
            segment.put("i", ledArray);  // Individual LED colors

            Map<String, Object> state = new HashMap<>();
            state.put("seg", segment);
            state.put("bri", brightness);

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            HttpEntity<Map<String, Object>> request = new HttpEntity<>(state, headers);

            System.out.println("Updating LED range " + start + "-" + end +
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
}
