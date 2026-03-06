package com.dk_power.power_plant_java.controller.angular.permits;

import com.dk_power.power_plant_java.sevice.sharepoint.SharePointListProvisioner;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/ng/sharepoint")
@RequiredArgsConstructor
public class NgSharePointProvisioningController {

    private final SharePointListProvisioner provisioner;

    @GetMapping("/list-status")
    public ResponseEntity<List<Map<String, Object>>> getListStatuses() {
        return ResponseEntity.ok(provisioner.checkAllStatuses());
    }

    @PostMapping("/provision-list")
    public ResponseEntity<Map<String, Object>> provisionSingleList(@RequestParam String title) {
        return ResponseEntity.ok(provisioner.provisionSingle(title));
    }

    @PostMapping("/provision-lists")
    public ResponseEntity<Map<String, Object>> provisionAllLists() {
        return ResponseEntity.ok(provisioner.provisionAll());
    }
}
