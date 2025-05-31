package com.dk_power.power_plant_java.controller.browser;

import com.dk_power.power_plant_java.dto.browser.BrEquipmentDto;
import com.dk_power.power_plant_java.dto.browser.BrFileDto;
import com.dk_power.power_plant_java.entities.files.FileObject;
import com.dk_power.power_plant_java.sevice.browser.BrEquipmentService;
import com.dk_power.power_plant_java.sevice.browser.BrFileService;
import com.dk_power.power_plant_java.sevice.file.FileService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.io.File;
import java.io.FileWriter;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.attribute.BasicFileAttributes;
import java.time.Instant;
import java.util.Collections;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/backup/update")
public class BackupController {

    private final BrFileService fileObjectService;
    private final BrEquipmentService equipmentService;
    private final ObjectMapper objectMapper;

    @Value("${backup.app.files}")
    private String backupFilePath;

    @Value("${backup.app.equipment}")
    private String backupEquipmentPath;

    public BackupController(BrFileService fileObjectService, BrEquipmentService equipmentService, ObjectMapper objectMapper) {
        this.fileObjectService = fileObjectService;
        this.equipmentService = equipmentService;
        this.objectMapper = objectMapper;
    }

    @GetMapping("/check")
    public ResponseEntity<Map<String, Boolean>> checkBackup() {
        Boolean hasUpdates = true;
        Map<String, Boolean> response = Collections.singletonMap("hasUpdates", hasUpdates);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/files")
    public ResponseEntity<String> backupFileObjects() {
        try {
            List<BrFileDto> allFiles = fileObjectService.getAllFiles();

            StringBuilder jsContent = new StringBuilder("const files = [\n");

            for (int i = 0; i < allFiles.size(); i++) {
                String jsonObject = objectMapper.writeValueAsString(allFiles.get(i));
                jsContent.append(jsonObject);
                if (i < allFiles.size() - 1) {
                    jsContent.append(",\n");
                } else {
                    jsContent.append("\n");
                }
            }

            jsContent.append("];");

            File file = new File(backupFilePath);
            file.getParentFile().mkdirs(); // Ensure the directory exists

            try (FileWriter writer = new FileWriter(file)) {
                writer.write(jsContent.toString());
            }

            return ResponseEntity.ok("Backup created successfully");
        } catch (IOException e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError().body("Failed to create backup: " + e.getMessage());
        }
    }

    @GetMapping("/equipment")
    public ResponseEntity<String> backupEquipment() {
        try {
            List<BrEquipmentDto> allEq = equipmentService.getAllBrEquipment();

            StringBuilder jsContent = new StringBuilder("const equipment = [\n");

            for (int i = 0; i < allEq.size(); i++) {
                String jsonObject = objectMapper.writeValueAsString(allEq.get(i));
                jsContent.append(jsonObject);
                if (i < allEq.size() - 1) {
                    jsContent.append(",\n");
                } else {
                    jsContent.append("\n");
                }
            }

            jsContent.append("];");

            File file = new File(backupEquipmentPath);
            file.getParentFile().mkdirs(); // Ensure the directory exists

            try (FileWriter writer = new FileWriter(file)) {
                writer.write(jsContent.toString());
            }

            return ResponseEntity.ok("Backup created successfully");
        } catch (IOException e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError().body("Failed to create backup: " + e.getMessage());
        }
    }
}