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


}