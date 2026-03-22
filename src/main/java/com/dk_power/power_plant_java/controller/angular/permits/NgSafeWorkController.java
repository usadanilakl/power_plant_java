package com.dk_power.power_plant_java.controller.angular.permits;

import com.dk_power.power_plant_java.controller.angular.NgApiResponse;
import com.dk_power.power_plant_java.dto.permits.SafeWorkDto;
import com.dk_power.power_plant_java.sevice.angular.permits.NgSafeWorkService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/ng/safe-works")
@RequiredArgsConstructor
public class NgSafeWorkController {

    private final NgSafeWorkService ngSafeWorkService;

    @GetMapping("/get-all-safe-work")
    public ResponseEntity<NgApiResponse<List<SafeWorkDto>>> getAllSafeWorkRequests() {
        try {
            List<SafeWorkDto> safeWorkRequests = ngSafeWorkService.getAllDtos();
            NgApiResponse<List<SafeWorkDto>> response = new NgApiResponse<>(safeWorkRequests, "Safe work requests retrieved successfully", LocalDateTime.now());
            return ResponseEntity.ok().contentType(MediaType.APPLICATION_JSON).body(response);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, "Error retrieving safe work requests: " + e.getMessage()));
        }
    }

    @GetMapping("/get-safe-work-by-id/{id}")
    public ResponseEntity<NgApiResponse<SafeWorkDto>> getSafeWorkRequestById(@PathVariable String id) {
        try {
            SafeWorkDto safeWorkRequest = ngSafeWorkService.getDtoById(id);
            if (safeWorkRequest == null) {
                return ResponseEntity.notFound().build();
            }
            NgApiResponse<SafeWorkDto> response = new NgApiResponse<>(safeWorkRequest, "Safe work request retrieved successfully", LocalDateTime.now());
            return ResponseEntity.ok().contentType(MediaType.APPLICATION_JSON).body(response);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, "Error retrieving safe work request: " + e.getMessage()));
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<NgApiResponse<SafeWorkDto>> getById(@PathVariable String id) {
        return getSafeWorkRequestById(id);
    }

    @PostMapping
    public ResponseEntity<NgApiResponse<SafeWorkDto>> createSafeWorkRequest(@RequestBody SafeWorkDto safeWorkDto) {
        try {
            SafeWorkDto createdSafeWork = ngSafeWorkService.createSafeWork(safeWorkDto);
            NgApiResponse<SafeWorkDto> response = new NgApiResponse<>(createdSafeWork, "Safe work request created successfully", LocalDateTime.now());
            return ResponseEntity.ok().contentType(MediaType.APPLICATION_JSON).body(response);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, "Error creating safe work request: " + e.getMessage()));
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<NgApiResponse<SafeWorkDto>> updateSafeWorkRequest(@PathVariable Long id, @RequestBody SafeWorkDto safeWorkDto) {
        try {
            safeWorkDto.setId(id);
            SafeWorkDto updatedSafeWork = ngSafeWorkService.getMapper().convertToDto(ngSafeWorkService.save(safeWorkDto));
            NgApiResponse<SafeWorkDto> response = new NgApiResponse<>(updatedSafeWork, "Safe work request updated successfully", LocalDateTime.now());
            return ResponseEntity.ok().contentType(MediaType.APPLICATION_JSON).body(response);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, "Error updating safe work request: " + e.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<NgApiResponse<String>> deleteSafeWorkRequest(@PathVariable Long id) {
        try {
            ngSafeWorkService.softDelete(id);
            return ResponseEntity.ok().contentType(MediaType.APPLICATION_JSON)
                    .body(new NgApiResponse<>("Deleted", "Safe work request deleted successfully", LocalDateTime.now()));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, "Error deleting safe work request: " + e.getMessage()));
        }
    }

    @PostMapping("/save-all")
    public ResponseEntity<NgApiResponse<List<SafeWorkDto>>> saveAll(@RequestBody List<SafeWorkDto> requests) {
        try {
            List<SafeWorkDto> savedRequests = ngSafeWorkService.saveAll(requests);
            NgApiResponse<List<SafeWorkDto>> response = new NgApiResponse<>(savedRequests, "Safe work requests saved successfully", LocalDateTime.now());
            return ResponseEntity.ok().contentType(MediaType.APPLICATION_JSON).body(response);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, "Error saving safe work requests: " + e.getMessage()));
        }
    }


}
