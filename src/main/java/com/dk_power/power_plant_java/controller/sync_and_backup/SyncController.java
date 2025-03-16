package com.dk_power.power_plant_java.controller.sync_and_backup;

import com.dk_power.power_plant_java.entities.base_entities.BaseIdEntity;
import com.dk_power.power_plant_java.sevice.ServiceFacade;
import com.dk_power.power_plant_java.sevice.sync_and_backup.SyncService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
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

//    @GetMapping("/{entityName}")
//    public ResponseEntity<List<? extends BaseIdEntity>> sendChangesToClient(
//            @PathVariable String entityName,
//            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime since) {
//        List<? extends BaseIdEntity> changes = serviceFacade.getService(entityName).getAllSince(since);
//        return ResponseEntity.ok(changes);
//    }



    @GetMapping("/{entityName}")
    public ResponseEntity<List<? extends BaseIdEntity>> getChanges(
            @PathVariable String entityName,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime since,
            @RequestParam(defaultValue = "#{T(java.time.LocalDateTime).now()}") @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime until,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "1000000000") int size) {

        System.out.println(page + " " + size);
        System.out.println(since + " " + until);
        System.out.println(entityName);

        Pageable pageable = PageRequest.of(page, size);
        List changes = serviceFacade.getService(entityName).getAllSinceAndUntilPaginated(since, until, pageable).stream().toList();

        System.out.println("changes.size() = " + changes.size());
        if (changes.isEmpty()) {
            return ResponseEntity.noContent().build();
        }

        return ResponseEntity.ok(changes);
    }

    @GetMapping("/all")
    public ResponseEntity<Void> getAllSyncClients() {
        syncService.syncAll();
        return ResponseEntity.ok().build();
    }
}