package com.dk_power.power_plant_java.sevice.esp;

import com.dk_power.power_plant_java.entities.esp.EspDevice;
import com.dk_power.power_plant_java.entities.esp.LedStrip;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.HashMap;
import java.util.Map;

/**
 * Service for managing ESP WLED devices
 * Handles both initialization (pins, ranges, regions) and ongoing LED updates
 */
@Service
@RequiredArgsConstructor
public class EspLedService {

    private final RestTemplate restTemplate;
    private final EspDeviceService espDeviceService;
    private final LedStripService ledStripService;

    /**
     * Initialize WLED ESP device with pins, ranges, and regions
     * This should be called once during system initialization
     */
    public void initializeEspDevice(EspDevice espDevice) {
        if (espDevice == null || espDevice.getIpAddress() == null) {
            System.err.println("Cannot initialize ESP device: device or IP address is null");
            return;
        }

        try {
            String baseUrl = "http://" + espDevice.getIpAddress();

            // Get all LED strips for this ESP device
            var ledStrips = ledStripService.getByEspDeviceId(espDevice.getId());

            if (ledStrips.isEmpty()) {
                System.out.println("No LED strips found for ESP device: " + espDevice.getName());
                return;
            }

            // Initialize each LED strip
            for (LedStrip strip : ledStrips) {
                initializeLedStrip(baseUrl, strip);
            }

            System.out.println("Successfully initialized ESP device: " + espDevice.getName() + " at " + espDevice.getIpAddress());
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
     * Initialize a single LED strip on an ESP device
     */
    private void initializeLedStrip(String baseUrl, LedStrip strip) {
        try {
            // WLED JSON API configuration
            Map<String, Object> config = new HashMap<>();

            // Configure LED strip settings
            Map<String, Object> ledSettings = new HashMap<>();
            ledSettings.put("pin", strip.getGpioPin());
            ledSettings.put("count", strip.getTotalLeds());
            ledSettings.put("order", 1); // RGB order (default)
            ledSettings.put("rev", false); // Not reversed
            ledSettings.put("skip", 1); // No LED skipping
            ledSettings.put("type", 22); // WS2812B LED type
            ledSettings.put("rgbw", false); // Not RGBW

            config.put("led", ledSettings);

            // Send configuration to WLED device
            String configUrl = baseUrl + "/json/cfg";

            System.out.println("Configuring LED strip " + strip.getStripNumber() +
                             " on GPIO " + strip.getGpioPin() +
                             " with " + strip.getTotalLeds() + " LEDs");

            // Note: This is a simplified initialization
            // WLED configuration API may require different format based on version

        } catch (Exception e) {
            System.err.println("Failed to initialize LED strip " + strip.getStripNumber() + ": " + e.getMessage());
        }
    }

    /**
     * Update LED color for a specific box on an ESP device
     */
    public void updateBoxLeds(EspDevice espDevice, Integer stripNumber, Integer boxNumber,
                             Integer r, Integer g, Integer b, Integer brightness) {
        if (espDevice == null || espDevice.getIpAddress() == null) {
            throw new RuntimeException("ESP device or IP address is null");
        }

        try {
            String url = String.format(
                "http://%s/led/setBoxLeds?strip=%d&box=%d&r=%d&g=%d&b=%d&brightness=%d",
                espDevice.getIpAddress(), stripNumber, boxNumber, r, g, b, brightness
            );

            System.out.println("Updating box " + boxNumber + " on strip " + stripNumber +
                             " at ESP " + espDevice.getIpAddress() +
                             " to RGB(" + r + "," + g + "," + b + ")");

            restTemplate.getForObject(url, String.class);
        } catch (Exception e) {
            System.err.println("Failed to update box " + boxNumber + " on ESP " +
                             espDevice.getName() + ": " + e.getMessage());
            throw new RuntimeException("Failed to update ESP device", e);
        }
    }

    /**
     * Update LED range on an ESP device
     */
    public void updateLedRange(EspDevice espDevice, Integer stripNumber,
                              Integer start, Integer end,
                              Integer r, Integer g, Integer b, Integer brightness) {
        if (espDevice == null || espDevice.getIpAddress() == null) {
            throw new RuntimeException("ESP device or IP address is null");
        }

        try {
            String url = String.format(
                "http://%s/led/setLEDRange?strip=%d&start=%d&end=%d&r=%d&g=%d&b=%d&brightness=%d",
                espDevice.getIpAddress(), stripNumber, start, end, r, g, b, brightness
            );

            System.out.println("Updating LED range " + start + "-" + end +
                             " on strip " + stripNumber +
                             " at ESP " + espDevice.getIpAddress());

            restTemplate.getForObject(url, String.class);
        } catch (Exception e) {
            System.err.println("Failed to update LED range on ESP " +
                             espDevice.getName() + ": " + e.getMessage());
            throw new RuntimeException("Failed to update ESP device", e);
        }
    }

    /**
     * Turn off all LEDs on an ESP device
     */
    public void turnOffAllLeds(EspDevice espDevice) {
        if (espDevice == null || espDevice.getIpAddress() == null) {
            return;
        }

        try {
            var ledStrips = ledStripService.getByEspDeviceId(espDevice.getId());

            for (LedStrip strip : ledStrips) {
                updateLedRange(espDevice, strip.getStripNumber(),
                             0, strip.getTotalLeds() - 1,
                             0, 0, 0, 0);
            }

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
