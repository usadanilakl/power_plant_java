package com.dk_power.power_plant_java.controller.angular.permits;

import com.dk_power.power_plant_java.controller.angular.NgApiResponse;
import com.dk_power.power_plant_java.dto.permits.ConfinedSpaceDto;
import com.dk_power.power_plant_java.sevice.angular.permits.NgConfinedSpaceService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/ng/confined-spaces")
@RequiredArgsConstructor
public class NgConfinedSpaceController {

    private final NgConfinedSpaceService ngConfinedSpaceService;

    @GetMapping("/get-all-confined-space")
    public ResponseEntity<NgApiResponse<List<ConfinedSpaceDto>>> getConfinedSpaceRequests() {
        try {
            List<ConfinedSpaceDto> confinedSpaceRequests = ngConfinedSpaceService.getAllDtos();
            NgApiResponse<List<ConfinedSpaceDto>> response = new NgApiResponse<>(confinedSpaceRequests, "Confined space requests retrieved successfully", LocalDateTime.now());
            return ResponseEntity.ok().contentType(MediaType.APPLICATION_JSON).body(response);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, "Error retrieving confined space requests: " + e.getMessage()));
        }
    }

    @GetMapping("/get-confined-space-by-id/{id}")
    public ResponseEntity<NgApiResponse<ConfinedSpaceDto>> getConfinedSpaceRequestById(@PathVariable String id) {
        try {
            ConfinedSpaceDto confinedSpaceRequest = ngConfinedSpaceService.getDtoById(id);
            if (confinedSpaceRequest == null) {
                return ResponseEntity.notFound().build();
            }
            NgApiResponse<ConfinedSpaceDto> response = new NgApiResponse<>(confinedSpaceRequest, "Confined space request retrieved successfully", LocalDateTime.now());
            return ResponseEntity.ok().contentType(MediaType.APPLICATION_JSON).body(response);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, "Error retrieving confined space request: " + e.getMessage()));
        }
    }

    @PostMapping
    public ResponseEntity<NgApiResponse<ConfinedSpaceDto>> createConfinedSpaceRequest(@RequestBody ConfinedSpaceDto confinedSpaceDto) {
        try {
            ConfinedSpaceDto createdConfinedSpace = ngConfinedSpaceService.createConfinedSpaceRequest(confinedSpaceDto);
            NgApiResponse<ConfinedSpaceDto> response = new NgApiResponse<>(createdConfinedSpace, "Confined space request created successfully", LocalDateTime.now());
            return ResponseEntity.ok().contentType(MediaType.APPLICATION_JSON).body(response);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, "Error creating confined space request: " + e.getMessage()));
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<NgApiResponse<ConfinedSpaceDto>> updateConfinedSpaceRequest(@PathVariable String id, @RequestBody ConfinedSpaceDto confinedSpaceDto) {
        try {
            ConfinedSpaceDto updatedConfinedSpace = ngConfinedSpaceService.updateConfinedSpaceRequest(id, confinedSpaceDto);
            NgApiResponse<ConfinedSpaceDto> response = new NgApiResponse<>(updatedConfinedSpace, "Confined space request updated successfully", LocalDateTime.now());
            return ResponseEntity.ok().contentType(MediaType.APPLICATION_JSON).body(response);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, "Error updating confined space request: " + e.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<NgApiResponse<Void>> deleteConfinedSpaceRequest(@PathVariable String id) {
        try {
            ngConfinedSpaceService.hardDelete(id);
            NgApiResponse<Void> response = new NgApiResponse<>(null, "Confined space request deleted successfully", LocalDateTime.now());
            return ResponseEntity.ok().contentType(MediaType.APPLICATION_JSON).body(response);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, "Error deleting confined space request: " + e.getMessage()));
        }
    }
}