package com.dk_power.power_plant_java.controller.sync_and_backup;

import com.dk_power.power_plant_java.sevice.app_services.H2BackupService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;
import java.sql.SQLException;
import java.util.List;

@RestController
@RequestMapping("/api/backup")
public class DatabaseBackupController {

    private final H2BackupService h2BackupService;

    @Autowired
    public DatabaseBackupController(H2BackupService h2BackupService) {
        this.h2BackupService = h2BackupService;
    }

    @PostMapping("/backup-database")
    public ResponseEntity<String> backupDatabase(@RequestParam(required = false) String backupFileName) {
        try {
            h2BackupService.backupDatabase(backupFileName);
            return ResponseEntity.ok("Database backup created successfully");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error creating backup: " + e.getMessage());
        }
    }

    @PostMapping("/restore-database")
    public ResponseEntity<String> restoreDatabase(@RequestParam String backupFileName) {
        try {
            h2BackupService.restoreDatabase(backupFileName);
            return ResponseEntity.ok("Database restored successfully");
        } catch (SQLException | IOException e) {
            return ResponseEntity.badRequest().body("Error restoring database: " + e.getMessage());
        }
    }

    @PostMapping("/restore-database")
    public ResponseEntity<String> restoreSharedDatabase(@RequestParam String backupFileName) {
        try {
            h2BackupService.restoreSharedDatabase(backupFileName);
            return ResponseEntity.ok("Database restored successfully");
        } catch (SQLException | IOException e) {
            return ResponseEntity.badRequest().body("Error restoring database: " + e.getMessage());
        }
    }
    
    @GetMapping("/list-backups")
    public ResponseEntity<List<String>> listBackups() {
        try {
            List<String> backups = h2BackupService.listBackups();
            return ResponseEntity.ok(backups);
        } catch (IOException e) {
            return ResponseEntity.badRequest().body(null);
        }
    }

    @GetMapping("/list-shared-backups")
    public ResponseEntity<List<String>> listSharedBackups() {
        try {
            List<String> backups = h2BackupService.listBackups();
            return ResponseEntity.ok(backups);
        } catch (IOException e) {
            return ResponseEntity.badRequest().body(null);
        }
    }
}