package com.dk_power.power_plant_java.controller.angular.permits;

import com.dk_power.power_plant_java.controller.angular.NgApiResponse;
import com.dk_power.power_plant_java.dto.permits.DailyPermitPackageDto;
import com.dk_power.power_plant_java.sevice.angular.permits.NgDailyPermitPackageService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/ng/daily-permit-packages")
@RequiredArgsConstructor
public class NgDailyPermitPackageController {

    private final NgDailyPermitPackageService ngDailyPermitPackageService;

    @GetMapping
    public ResponseEntity<NgApiResponse<List<DailyPermitPackageDto>>> getAllDailyPermitPackages() {
        try {
            List<DailyPermitPackageDto> packages = ngDailyPermitPackageService.getAllDtos();
            NgApiResponse<List<DailyPermitPackageDto>> response = new NgApiResponse<>(packages, "Daily permit packages retrieved successfully", LocalDateTime.now());
            return ResponseEntity.ok().contentType(MediaType.APPLICATION_JSON).body(response);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, "Error retrieving daily permit packages: " + e.getMessage()));
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<NgApiResponse<DailyPermitPackageDto>> getDailyPermitPackageById(@PathVariable String id) {
        try {
            DailyPermitPackageDto permitPackage = ngDailyPermitPackageService.getDtoById(id);
            if (permitPackage == null) {
                return ResponseEntity.notFound().build();
            }
            NgApiResponse<DailyPermitPackageDto> response = new NgApiResponse<>(permitPackage, "Daily permit package retrieved successfully", LocalDateTime.now());
            return ResponseEntity.ok().contentType(MediaType.APPLICATION_JSON).body(response);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, "Error retrieving daily permit package: " + e.getMessage()));
        }
    }

    @PostMapping
    public ResponseEntity<NgApiResponse<DailyPermitPackageDto>> createDailyPermitPackage(@RequestBody DailyPermitPackageDto permitPackageDto) {
        try {
            DailyPermitPackageDto createdPackage = ngDailyPermitPackageService.createDailyPermitPackage(permitPackageDto);
            NgApiResponse<DailyPermitPackageDto> response = new NgApiResponse<>(createdPackage, "Daily permit package created successfully", LocalDateTime.now());
            return ResponseEntity.ok().contentType(MediaType.APPLICATION_JSON).body(response);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, "Error creating daily permit package: " + e.getMessage()));
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<NgApiResponse<DailyPermitPackageDto>> updateDailyPermitPackage(@PathVariable String id, @RequestBody DailyPermitPackageDto permitPackageDto) {
        try {
            DailyPermitPackageDto updatedPackage = ngDailyPermitPackageService.updateDailyPermitPackage(id, permitPackageDto);
            NgApiResponse<DailyPermitPackageDto> response = new NgApiResponse<>(updatedPackage, "Daily permit package updated successfully", LocalDateTime.now());
            return ResponseEntity.ok().contentType(MediaType.APPLICATION_JSON).body(response);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, "Error updating daily permit package: " + e.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<NgApiResponse<Void>> deleteDailyPermitPackage(@PathVariable String id) {
        try {
            ngDailyPermitPackageService.hardDelete(id);
            NgApiResponse<Void> response = new NgApiResponse<>(null, "Daily permit package deleted successfully", LocalDateTime.now());
            return ResponseEntity.ok().contentType(MediaType.APPLICATION_JSON).body(response);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, "Error deleting daily permit package: " + e.getMessage()));
        }
    }

    @PostMapping("/build-permits")
    public ResponseEntity<NgApiResponse<String>> buildPermits(@RequestBody DailyPermitPackageDto dailyPermitPackageDto) {
        try {
            String result = ngDailyPermitPackageService.buildPermits(dailyPermitPackageDto);
            NgApiResponse<String> response = new NgApiResponse<>(result, "Permits built successfully", LocalDateTime.now());
            return ResponseEntity.ok().contentType(MediaType.APPLICATION_JSON).body(response);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, "Error building permits: " + e.getMessage()));
        }
    }

    @GetMapping("/build-permits/{id}/{whatToBuild}/{permitId}")
    public ResponseEntity<NgApiResponse<String>> buildPermitsById(@PathVariable String id, @PathVariable String whatToBuild, @PathVariable String permitId) {
        try {
            String result = ngDailyPermitPackageService.buildPermitsById(id, whatToBuild, permitId);
            NgApiResponse<String> response = new NgApiResponse<>(result, "Permits built successfully", LocalDateTime.now());
            return ResponseEntity.ok().contentType(MediaType.APPLICATION_JSON).body(response);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, "Error building permits: " + e.getMessage()));
        }
    }

    @PostMapping("/reissue-permits-from/{packageIdToReissue}/to/{targetPackageId}")
    public ResponseEntity<NgApiResponse<DailyPermitPackageDto>> reissuePermits(
            @PathVariable String packageIdToReissue,
            @PathVariable String targetPackageId) {
        try {
            DailyPermitPackageDto dailyPermitPackageDto = ngDailyPermitPackageService.reissuePermits(packageIdToReissue, targetPackageId);
            NgApiResponse<DailyPermitPackageDto> response = new NgApiResponse<>(dailyPermitPackageDto, "Permits reissued successfully", LocalDateTime.now());
            return ResponseEntity.ok().contentType(MediaType.APPLICATION_JSON).body(response);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, "Error reissuing permits: " + e.getMessage()));
        }
    }

    @PostMapping("/reissue-permits-by-work-request-id/{wrId}/")
    public ResponseEntity<NgApiResponse<DailyPermitPackageDto>> reissuePermitsByWorkRequestId(@PathVariable String wrId) {
        try {
            DailyPermitPackageDto dailyPermitPackageDto = ngDailyPermitPackageService.reissuePermitsByWorkRequestId(wrId);
            NgApiResponse<DailyPermitPackageDto> response = new NgApiResponse<>(dailyPermitPackageDto, "Permits reissued successfully", LocalDateTime.now());
            return ResponseEntity.ok().contentType(MediaType.APPLICATION_JSON).body(response);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, "Error reissuing permits: " + e.getMessage()));
        }
    }

    @PostMapping("/{id}/activate")
    public ResponseEntity<NgApiResponse<DailyPermitPackageDto>> activatePackage(@PathVariable String id) {
        try {
            DailyPermitPackageDto result = ngDailyPermitPackageService.activatePackage(id);
            return ResponseEntity.ok().contentType(MediaType.APPLICATION_JSON)
                .body(new NgApiResponse<>(result, "Package activated", LocalDateTime.now()));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, "Error: " + e.getMessage()));
        }
    }

    @PostMapping("/{id}/test")
    public ResponseEntity<NgApiResponse<DailyPermitPackageDto>> putPackageUnderTest(@PathVariable String id) {
        try {
            DailyPermitPackageDto result = ngDailyPermitPackageService.putPackageUnderTest(id);
            return ResponseEntity.ok().contentType(MediaType.APPLICATION_JSON)
                .body(new NgApiResponse<>(result, "Package under test", LocalDateTime.now()));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, "Error: " + e.getMessage()));
        }
    }

    @PostMapping("/{id}/close")
    public ResponseEntity<NgApiResponse<DailyPermitPackageDto>> closePackage(
            @PathVariable String id,
            @RequestBody(required = false) Map<String, Object> closureData) {
        try {
            DailyPermitPackageDto result = ngDailyPermitPackageService.closePackage(id, closureData);
            return ResponseEntity.ok().contentType(MediaType.APPLICATION_JSON)
                .body(new NgApiResponse<>(result, "Package closed", LocalDateTime.now()));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, "Error: " + e.getMessage()));
        }
    }
}
