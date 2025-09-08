package com.dk_power.power_plant_java.controller.automation;

import com.dk_power.power_plant_java.clients.PowerAutomateClient;
import com.dk_power.power_plant_java.controller.angular.NgApiResponse;
import com.dk_power.power_plant_java.dto.permits.WorkRequestDto;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/power-automate")
public class PowerAutomateController {

    private final PowerAutomateClient powerAutomateClient;

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
}
