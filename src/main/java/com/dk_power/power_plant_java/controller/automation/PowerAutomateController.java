package com.dk_power.power_plant_java.controller.automation;

import com.dk_power.power_plant_java.clients.PowerAutomateClient;
import com.dk_power.power_plant_java.controller.angular.NgApiResponse;
import com.dk_power.power_plant_java.dto.permits.NgWorkRequestDto;
import com.dk_power.power_plant_java.dto.permits.WorkRequestDto;
import com.dk_power.power_plant_java.entities.permits.WorkRequest;
import com.dk_power.power_plant_java.mappers.permits.WorkRequestMapper;
import com.dk_power.power_plant_java.sevice.angular.permits.NgWorkRequestService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/power-automate")
public class PowerAutomateController {

    private final PowerAutomateClient powerAutomateClient;
    private final NgWorkRequestService workRequestService;
    private final WorkRequestMapper workRequestMapper;

    @GetMapping("/get-all")
    public ResponseEntity<NgApiResponse<List<WorkRequestDto>>> getAllRequests() {
        try {
            List<WorkRequestDto> allRequests = powerAutomateClient.getAllRequests();
            return ResponseEntity.ok(
                    new NgApiResponse<>(allRequests, "Successfully got all items from SharePoint")
            );
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(
                    new NgApiResponse<>(null, "Failed to get all requests from SharePoint: " + e.getMessage())
            );
        }
    }

    @GetMapping("/get-all-active")
    public ResponseEntity<NgApiResponse<List<WorkRequestDto>>> getAllActiveRequests() {
        try {
            List<WorkRequestDto> allRequests = workRequestService.getAndCombineLocalAndSharepointRequests();
            return ResponseEntity.ok(
                    new NgApiResponse<>(allRequests, "Successfully got all items from SharePoint")
            );
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(
                    new NgApiResponse<>(null, "Failed to get all requests from SharePoint: " + e.getMessage())
            );
        }
    }

    @GetMapping("/get-all-by-status/{status}")
    public ResponseEntity<NgApiResponse<List<WorkRequestDto>>> getAllByStatus(@PathVariable String status) {
        try {
            List<WorkRequestDto> allRequests = workRequestService.getAllDtosByStatus(status);
            return ResponseEntity.ok(
                    new NgApiResponse<>(allRequests, "Successfully got all requests with status '" + status + "' from local DB")
            );
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(
                    new NgApiResponse<>(null, "Failed to get all requests with status: "+status+" with error: " + e.getMessage())
            );
        }
    }

    @GetMapping("/process/{sharepointId}")
    public ResponseEntity<NgApiResponse<WorkRequestDto>> processRequest(@PathVariable String sharepointId) {
        try {
            WorkRequestDto workRequestDto = workRequestService.completeWorkRequestBySharepointId(sharepointId);
            return ResponseEntity.ok(
                    new NgApiResponse<>(workRequestDto, "Successfully processed request")
            );
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(
                    new NgApiResponse<>(null, "Failed to get all requests from SharePoint: " + e.getMessage())
            );
        }
    }

    @GetMapping("/get-by-id/{id}")
    public ResponseEntity<NgApiResponse<WorkRequestDto>> getById(@PathVariable Long id) {
        try {
            WorkRequestDto requestById = workRequestService.getDtoById(id);
            return ResponseEntity.ok(
                    new NgApiResponse<>(requestById, "Successfully got work request by id")
            );
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(
                    new NgApiResponse<>(null, "Failed to get work request by id: " + e.getMessage())
            );
        }
    }
}
