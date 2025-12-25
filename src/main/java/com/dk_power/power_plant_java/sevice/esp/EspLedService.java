package com.dk_power.power_plant_java.sevice.esp;

import com.dk_power.power_plant_java.entities.esp.EspDevice;
import com.dk_power.power_plant_java.entities.esp.LedStrip;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

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
     * Calls custom ESP firmware initialization endpoint
     */
    private void initializeLedStrip(String baseUrl, LedStrip strip) {
        try {
            // Call custom ESP firmware initialization endpoint
            // Format: /led/initStrip?strip={stripNumber}&pin={gpioPin}&count={totalLeds}
            String initUrl = String.format(
                "%s/led/initStrip?strip=%d&pin=%d&count=%d",
                baseUrl,
                strip.getStripNumber(),
                strip.getGpioPin(),
                strip.getTotalLeds()
            );

            System.out.println("Initializing LED strip " + strip.getStripNumber() +
                             " on GPIO " + strip.getGpioPin() +
                             " with " + strip.getTotalLeds() + " LEDs at " + baseUrl);

            try {
                String response = restTemplate.getForObject(initUrl, String.class);
                System.out.println("Strip initialization response: " + response);
            } catch (Exception e) {
                System.err.println("ESP may not have /led/initStrip endpoint. Skipping pin configuration.");
                System.err.println("Note: Make sure ESP firmware is configured with correct pins:");
                System.err.println("  Strip " + strip.getStripNumber() + " -> GPIO " + strip.getGpioPin() + " -> " + strip.getTotalLeds() + " LEDs");
            }

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
