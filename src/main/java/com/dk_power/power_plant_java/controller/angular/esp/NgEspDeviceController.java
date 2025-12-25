package com.dk_power.power_plant_java.controller.angular.esp;

import com.dk_power.power_plant_java.controller.angular.NgApiResponse;
import com.dk_power.power_plant_java.dto.esp.EspDeviceDto;
import com.dk_power.power_plant_java.sevice.esp.EspDeviceService;
import com.dk_power.power_plant_java.sevice.esp.EspLedService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/ng/esp-devices")
@RequiredArgsConstructor
public class NgEspDeviceController {

    private final EspDeviceService espDeviceService;
    private final EspLedService espLedService;

    /**
     * Get all ESP devices
     */
    @GetMapping("/all")
    public ResponseEntity<NgApiResponse<List<EspDeviceDto>>> getAllEspDevices() {
        try {
            List<EspDeviceDto> devices = espDeviceService.getAllDto();
            NgApiResponse<List<EspDeviceDto>> response = new NgApiResponse<>(devices, "ESP devices retrieved successfully");
            return ResponseEntity.ok().contentType(MediaType.APPLICATION_JSON).body(response);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, e.getMessage()));
        }
    }

    /**
     * Get all active ESP devices
     */
    @GetMapping("/active")
    public ResponseEntity<NgApiResponse<List<EspDeviceDto>>> getAllActiveEspDevices() {
        try {
            List<EspDeviceDto> devices = espDeviceService.getAllActiveDto();
            NgApiResponse<List<EspDeviceDto>> response = new NgApiResponse<>(devices, "Active ESP devices retrieved successfully");
            return ResponseEntity.ok().contentType(MediaType.APPLICATION_JSON).body(response);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, e.getMessage()));
        }
    }

    /**
     * Get ESP device by ID
     */
    @GetMapping("/{id}")
    public ResponseEntity<NgApiResponse<EspDeviceDto>> getEspDeviceById(@PathVariable Long id) {
        try {
            EspDeviceDto device = espDeviceService.getDtoById(id);
            if (device == null) {
                return ResponseEntity.notFound().build();
            }
            NgApiResponse<EspDeviceDto> response = new NgApiResponse<>(device, "ESP device retrieved successfully", LocalDateTime.now());
            return ResponseEntity.ok().contentType(MediaType.APPLICATION_JSON).body(response);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, e.getMessage()));
        }
    }

    /**
     * Create new ESP device
     */
    @PostMapping
    public ResponseEntity<NgApiResponse<EspDeviceDto>> createEspDevice(@RequestBody EspDeviceDto deviceDto) {
        try {
            var saved = espDeviceService.saveFromDto(deviceDto);
            EspDeviceDto result = espDeviceService.getDtoById(saved.getId());
            NgApiResponse<EspDeviceDto> response = new NgApiResponse<>(result, "ESP device created successfully");
            return ResponseEntity.ok().contentType(MediaType.APPLICATION_JSON).body(response);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, e.getMessage()));
        }
    }

    /**
     * Update ESP device
     */
    @PutMapping("/{id}")
    public ResponseEntity<NgApiResponse<EspDeviceDto>> updateEspDevice(
            @PathVariable Long id,
            @RequestBody EspDeviceDto deviceDto) {
        try {
            var updated = espDeviceService.update(id, deviceDto);
            if (updated == null) {
                return ResponseEntity.notFound().build();
            }
            EspDeviceDto result = espDeviceService.getDtoById(updated.getId());
            NgApiResponse<EspDeviceDto> response = new NgApiResponse<>(result, "ESP device updated successfully");
            return ResponseEntity.ok().contentType(MediaType.APPLICATION_JSON).body(response);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, e.getMessage()));
        }
    }

    /**
     * Delete ESP device
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<NgApiResponse<String>> deleteEspDevice(@PathVariable Long id) {
        try {
            espDeviceService.deleteById(id);
            NgApiResponse<String> response = new NgApiResponse<>("OK", "ESP device deleted successfully");
            return ResponseEntity.ok().contentType(MediaType.APPLICATION_JSON).body(response);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, e.getMessage()));
        }
    }

    /**
     * Check if ESP device is reachable
     */
    @GetMapping("/{id}/check-connection")
    public ResponseEntity<NgApiResponse<Boolean>> checkEspConnection(@PathVariable Long id) {
        try {
            var device = espDeviceService.getEntityById(id);
            if (device == null) {
                return ResponseEntity.notFound().build();
            }
            boolean reachable = espLedService.isEspDeviceReachable(device);
            String message = reachable ? "ESP device is reachable" : "ESP device is not reachable";
            NgApiResponse<Boolean> response = new NgApiResponse<>(reachable, message);
            return ResponseEntity.ok().contentType(MediaType.APPLICATION_JSON).body(response);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, e.getMessage()));
        }
    }

    /**
     * Get ESP device status/info
     */
    @GetMapping("/{id}/status")
    public ResponseEntity<NgApiResponse<String>> getEspDeviceStatus(@PathVariable Long id) {
        try {
            var device = espDeviceService.getEntityById(id);
            if (device == null) {
                return ResponseEntity.notFound().build();
            }
            String status = espLedService.getEspDeviceStatus(device);
            NgApiResponse<String> response = new NgApiResponse<>(status, "ESP device status retrieved");
            return ResponseEntity.ok().contentType(MediaType.APPLICATION_JSON).body(response);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, e.getMessage()));
        }
    }

    /**
     * Initialize ESP device (configure pins and strips)
     */
    @PostMapping("/{id}/initialize")
    public ResponseEntity<NgApiResponse<String>> initializeEspDevice(@PathVariable Long id) {
        try {
            var device = espDeviceService.getEntityById(id);
            if (device == null) {
                return ResponseEntity.notFound().build();
            }
            espLedService.initializeEspDevice(device);
            NgApiResponse<String> response = new NgApiResponse<>("OK", "ESP device initialized successfully");
            return ResponseEntity.ok().contentType(MediaType.APPLICATION_JSON).body(response);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, e.getMessage()));
        }
    }

    /**
     * Turn off all LEDs on ESP device
     */
    @PostMapping("/{id}/turn-off-leds")
    public ResponseEntity<NgApiResponse<String>> turnOffAllLeds(@PathVariable Long id) {
        try {
            var device = espDeviceService.getEntityById(id);
            if (device == null) {
                return ResponseEntity.notFound().build();
            }
            espLedService.turnOffAllLeds(device);
            NgApiResponse<String> response = new NgApiResponse<>("OK", "All LEDs turned off");
            return ResponseEntity.ok().contentType(MediaType.APPLICATION_JSON).body(response);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, e.getMessage()));
        }
    }

    /**
     * Initialize all active ESP devices
     */
    @PostMapping("/initialize-all")
    public ResponseEntity<NgApiResponse<String>> initializeAllEspDevices() {
        try {
            espLedService.initializeAllEspDevices();
            NgApiResponse<String> response = new NgApiResponse<>("OK", "All ESP devices initialized successfully");
            return ResponseEntity.ok().contentType(MediaType.APPLICATION_JSON).body(response);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, e.getMessage()));
        }
    }
}
