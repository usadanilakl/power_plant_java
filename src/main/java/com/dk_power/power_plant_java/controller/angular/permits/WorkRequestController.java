package com.dk_power.power_plant_java.controller.angular.permits;

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
@RequestMapping("/ng/work-requests")
public class WorkRequestController {

    private final NgWorkRequestService workRequestService;
    private final WorkRequestMapper workRequestMapper;


    @GetMapping("/get-all")
    public ResponseEntity<NgApiResponse<List<NgWorkRequestDto>>> getAll() {
        try {
            List<WorkRequest> allRequests = workRequestService.getAll();
            List<NgWorkRequestDto> allDtos = allRequests.stream().map(workRequestMapper::convertToNgDto).toList();
            return ResponseEntity.ok(
                    new NgApiResponse<>(allDtos, "Successfully got all requests from local DB")
            );
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body(
                    new NgApiResponse<>(null, "Failed to get all requests with error: " + e.getMessage())
            );
        }
    }

    @GetMapping("/get-all-by-status/{status}")
    public ResponseEntity<NgApiResponse<List<NgWorkRequestDto>>> getAllByStatus(@PathVariable String status) {
        try {
            List<WorkRequest> allRequests = workRequestService.getAllByStatus(status);
            List<NgWorkRequestDto> allDtos = allRequests.stream().map(workRequestMapper::convertToNgDto).toList();
            return ResponseEntity.ok(
                    new NgApiResponse<>(allDtos, "Successfully got all requests with status '" + status + "' from local DB")
            );
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(
                    new NgApiResponse<>(null, "Failed to get all requests with status: "+status+" with error: " + e.getMessage())
            );
        }
    }

    @GetMapping("/change-status/{id}/{status}")
    public ResponseEntity<NgApiResponse<NgWorkRequestDto>> setStatus(@PathVariable String id, @PathVariable String status){
        try {
            WorkRequestDto workRequestDto = workRequestService.setStatus(id,status);
            NgWorkRequestDto ngWorkRequestDto = workRequestMapper.toNgWorkRequestDto(workRequestDto);
            return ResponseEntity.ok(
                    new NgApiResponse<>(ngWorkRequestDto, "Successfully processed request")
            );
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(
                    new NgApiResponse<>(null, "Failed to get all requests from SharePoint: " + e.getMessage())
            );
        }
    }

    @GetMapping("/process/{sharepointId}")
    public ResponseEntity<NgApiResponse<NgWorkRequestDto>> processRequest(@PathVariable String sharepointId) {
        try {
            WorkRequestDto workRequestDto = workRequestService.completeWorkRequestBySharepointId(sharepointId);
            NgWorkRequestDto ngWorkRequestDto = workRequestMapper.toNgWorkRequestDto(workRequestDto);
            return ResponseEntity.ok(
                    new NgApiResponse<>(ngWorkRequestDto, "Successfully processed request")
            );
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(
                    new NgApiResponse<>(null, "Failed to get all requests from SharePoint: " + e.getMessage())
            );
        }
    }

    @GetMapping("/process-by-id/{id}")
    public ResponseEntity<NgApiResponse<NgWorkRequestDto>> processByIdRequest(@PathVariable String id) {
        try {
            NgWorkRequestDto ngWorkRequestDto = workRequestService.completeWorkRequest(Long.parseLong(id));
            return ResponseEntity.ok(
                    new NgApiResponse<>(ngWorkRequestDto, "Successfully processed request")
            );
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(
                    new NgApiResponse<>(null, "Failed to get all requests from SharePoint: " + e.getMessage())
            );
        }
    }

    @GetMapping("/get-by-id/{id}")
    public ResponseEntity<NgApiResponse<NgWorkRequestDto>> getById(@PathVariable Long id) {
        try {
            WorkRequest requestById = workRequestService.getEntityById(id);
            NgWorkRequestDto dto = workRequestMapper.convertToNgDto(requestById);
            System.out.println(dto);
            return ResponseEntity.ok(
                    new NgApiResponse<>(dto, "Successfully got work request by id")
            );
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(
                    new NgApiResponse<>(null, "Failed to get work request by id: " + e.getMessage())
            );
        }
    }

    @PostMapping
    public ResponseEntity<NgApiResponse<List<NgWorkRequestDto>>> save(@RequestBody List<NgWorkRequestDto> workRequests) {
        try {
            List<WorkRequest> savedRequests = workRequestService.saveAllFromDto(workRequests);
            List<NgWorkRequestDto> savedDtos = savedRequests.stream().map(workRequestMapper::convertToNgDto).toList();
            return ResponseEntity.ok(
                    new NgApiResponse<>(savedDtos, "Successfully saved work requests.")
            );
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(
                    new NgApiResponse<>(null, "Failed to save work requests: " + e.getMessage())
            );
        }
    }


}
