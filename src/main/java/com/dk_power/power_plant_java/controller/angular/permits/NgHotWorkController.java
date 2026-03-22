package com.dk_power.power_plant_java.controller.angular.permits;

import com.dk_power.power_plant_java.controller.angular.NgApiResponse;
import com.dk_power.power_plant_java.dto.permits.HotWorkDto;
import com.dk_power.power_plant_java.sevice.angular.permits.NgHotWorkService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/ng/hot-works")
@RequiredArgsConstructor
public class NgHotWorkController {

    private final NgHotWorkService ngHotWorkService;

    @GetMapping("/get-all-hot-work")
    public ResponseEntity<NgApiResponse<List<HotWorkDto>>> getAllHotWorkRequests() {
        try {
            List<HotWorkDto> hotWorkRequests = ngHotWorkService.getAllDtos();
            NgApiResponse<List<HotWorkDto>> response = new NgApiResponse<>(hotWorkRequests, "Hot work requests retrieved successfully", LocalDateTime.now());
            return ResponseEntity.ok().contentType(MediaType.APPLICATION_JSON).body(response);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, "Error retrieving hot work requests: " + e.getMessage()));
        }
    }

    @GetMapping
    public ResponseEntity<NgApiResponse<List<HotWorkDto>>> getAllRest() {
        return getAllHotWorkRequests();
    }

    @GetMapping("/get-hot-work-by-id/{id}")
    public ResponseEntity<NgApiResponse<HotWorkDto>> getHotWorkRequestById(@PathVariable String id) {
        try {
            HotWorkDto hotWorkRequest = ngHotWorkService.getDtoById(id);
            if (hotWorkRequest == null) {
                return ResponseEntity.notFound().build();
            }
            NgApiResponse<HotWorkDto> response = new NgApiResponse<>(hotWorkRequest, "Hot work request retrieved successfully", LocalDateTime.now());
            return ResponseEntity.ok().contentType(MediaType.APPLICATION_JSON).body(response);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, "Error retrieving hot work request: " + e.getMessage()));
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<NgApiResponse<HotWorkDto>> getById(@PathVariable String id) {
        return getHotWorkRequestById(id);
    }

    @PostMapping
    public ResponseEntity<NgApiResponse<HotWorkDto>> createHotWorkRequest(@RequestBody HotWorkDto hotWorkDto) {
        try {
            HotWorkDto createdHotWork = ngHotWorkService.createHotWorkRequest(hotWorkDto);
            NgApiResponse<HotWorkDto> response = new NgApiResponse<>(createdHotWork, "Hot work request created successfully", LocalDateTime.now());
            return ResponseEntity.ok().contentType(MediaType.APPLICATION_JSON).body(response);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, "Error creating hot work request: " + e.getMessage()));
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<NgApiResponse<HotWorkDto>> updateHotWorkRequest(@PathVariable String id, @RequestBody HotWorkDto hotWorkDto) {
        try {
            HotWorkDto updatedHotWork = ngHotWorkService.updateHotWorkRequest(id, hotWorkDto);
            NgApiResponse<HotWorkDto> response = new NgApiResponse<>(updatedHotWork, "Hot work request updated successfully", LocalDateTime.now());
            return ResponseEntity.ok().contentType(MediaType.APPLICATION_JSON).body(response);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, "Error updating hot work request: " + e.getMessage()));
        }
    }


    @DeleteMapping("/{id}")
    public ResponseEntity<NgApiResponse<String>> deleteHotWorkRequest(@PathVariable String id) {
        try {
            ngHotWorkService.softDelete(id);
            NgApiResponse<String> response = new NgApiResponse<>("Deleted", "Hot work request deleted successfully", LocalDateTime.now());
            return ResponseEntity.ok().contentType(MediaType.APPLICATION_JSON).body(response);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, "Error deleting hot work request: " + e.getMessage()));
        }
    }

    @PostMapping("/save-all")
    public ResponseEntity<NgApiResponse<List<HotWorkDto>>> saveAll(@RequestBody List<HotWorkDto> requests) {
        try {
            List<HotWorkDto> savedRequests = ngHotWorkService.saveAll(requests);
            NgApiResponse<List<HotWorkDto>> response = new NgApiResponse<>(savedRequests, "Hot work requests saved successfully", LocalDateTime.now());
            return ResponseEntity.ok().contentType(MediaType.APPLICATION_JSON).body(response);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, "Error saving hot work requests: " + e.getMessage()));
        }
    }


}
