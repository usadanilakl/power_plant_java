package com.dk_power.power_plant_java.controller;

import com.dk_power.power_plant_java.api.SyncClient;
import com.dk_power.power_plant_java.entities.base_entities.BaseAuditEntity;
import com.dk_power.power_plant_java.entities.base_entities.BaseIdEntity;
import com.dk_power.power_plant_java.sevice.ServiceFacade;
import com.dk_power.power_plant_java.sevice.SyncService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/sync")
@RequiredArgsConstructor
public class SyncController {

    private final SyncService syncService;
    private final ServiceFacade serviceFacade;

@PostMapping("/{entityName}")
public ResponseEntity<?> saveChangesFromClient(
        @PathVariable String entityName,
        @RequestBody List<? extends BaseIdEntity> changes) {
    try {
        syncService.saveSyncItems(changes);
        return ResponseEntity.ok("Changes saved successfully");
    } catch (IllegalArgumentException e) {
        // This could be thrown if the entityName is invalid
        return ResponseEntity.badRequest().body("Invalid entity name: " + entityName);
    } catch (Exception e) {
        // Generic exception handling
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body("An error occurred while saving changes: " + e.getMessage());
    }
}

    @GetMapping("/{entityName}")
    public ResponseEntity<List<? extends BaseIdEntity>> sendChangesToClient(
            @PathVariable String entityName,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime since) {
        List<? extends BaseIdEntity> changes = serviceFacade.getService(entityName).getAllSince(since);
        return ResponseEntity.ok(changes);
    }

    @GetMapping("/all")
    public ResponseEntity<Void> getAllSyncClients(){
        syncService.syncAll();
        return ResponseEntity.ok().build();
    }
}