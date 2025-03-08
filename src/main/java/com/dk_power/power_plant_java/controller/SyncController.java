package com.dk_power.power_plant_java.controller;

import com.dk_power.power_plant_java.api.SyncClient;
import com.dk_power.power_plant_java.entities.base_entities.BaseIdEntity;
import com.dk_power.power_plant_java.sevice.ServiceFacade;
import com.dk_power.power_plant_java.sevice.SyncService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
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
    public ResponseEntity<Void> saveChangesFromClient(
            @PathVariable String entityName,
            @RequestBody List<? extends BaseIdEntity> changes) {
        syncService.saveSyncItems(changes);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/{entityName}")
    public ResponseEntity<List<? extends BaseIdEntity>> sendChangesToClient(
            @PathVariable String entityName,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime since) {
        List<? extends BaseIdEntity> changes = serviceFacade.getService(entityName).getAllSince(since);
        return ResponseEntity.ok(changes);
    }
}