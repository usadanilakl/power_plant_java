package com.dk_power.power_plant_java.controller.browser;

import com.dk_power.power_plant_java.dto.browser.BrEquipmentDto;
import com.dk_power.power_plant_java.dto.browser.BrFileDto;
import com.dk_power.power_plant_java.dto.browser.BrHeatTrace;
import com.dk_power.power_plant_java.dto.browser.BrLotoPoint;
import com.dk_power.power_plant_java.entities.files.FileObject;
import com.dk_power.power_plant_java.entities.files.ReferenceObject;
import com.dk_power.power_plant_java.sevice.angular.file.ReferenceObjectService;
import com.dk_power.power_plant_java.sevice.browser.BrEquipmentService;
import com.dk_power.power_plant_java.sevice.browser.BrFileService;
import com.dk_power.power_plant_java.sevice.browser.BrHeatTraceService;
import com.dk_power.power_plant_java.sevice.browser.BrLotoPointService;
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
import java.nio.file.Paths;
import java.nio.file.attribute.BasicFileAttributes;
import java.time.Instant;
import java.util.*;

@RestController
@RequestMapping("/backup/update")
public class BackupController {

    private final BrFileService fileObjectService;
    private final BrEquipmentService equipmentService;
    private final BrLotoPointService lotoPointService;
    private final BrHeatTraceService heatTraceService;
    private final ReferenceObjectService referenceObjectService;
    private final ObjectMapper objectMapper;

    @Value("${backup.app.files}")
    private String backupFilePath;

    @Value("${backup.app.equipment}")
    private String backupEquipmentPath;

    @Value("${backup.app.loto-points}")
    private String backupLotoPointPath;

    @Value("${backup.app.heat-trace}")
    private String backupHeatTracePath;

    @Value("${backup.app.reference-data}")
    private String backupReferenceDataPath;

    @Value("${backup.app.properties-data}")
    private String backupPropertiesDataPath;

    @Value("${project.root}")
    private String projectRootPath;

    public BackupController(BrFileService fileObjectService, BrEquipmentService equipmentService, BrLotoPointService lotoPointService, BrHeatTraceService heatTraceService, ReferenceObjectService referenceObjectService, ObjectMapper objectMapper) {
        this.fileObjectService = fileObjectService;
        this.equipmentService = equipmentService;
        this.lotoPointService = lotoPointService;
        this.heatTraceService = heatTraceService;
        this.referenceObjectService = referenceObjectService;
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

    @GetMapping("/loto-points")
    public ResponseEntity<String> backupLotoPoints() {
        try {
            List<BrLotoPoint> allLp = lotoPointService.getAllBrLotoPoints();

            StringBuilder jsContent = new StringBuilder("const lotoPoints = [\n");

            for (int i = 0; i < allLp.size(); i++) {
                String jsonObject = objectMapper.writeValueAsString(allLp.get(i));
                jsContent.append(jsonObject);
                if (i < allLp.size() - 1) {
                    jsContent.append(",\n");
                } else {
                    jsContent.append("\n");
                }
            }

            jsContent.append("];");

            File file = new File(backupLotoPointPath);
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

    @GetMapping("/heat-trace")
    public ResponseEntity<String> backupHeatTrace() {
        try {
            List<BrHeatTrace> all = heatTraceService.getAllBrHeatTrace();

            StringBuilder jsContent = new StringBuilder("const heatTrace = [\n");

            for (int i = 0; i < all.size(); i++) {
                String jsonObject = objectMapper.writeValueAsString(all.get(i));
                jsContent.append(jsonObject);
                if (i < all.size() - 1) {
                    jsContent.append(",\n");
                } else {
                    jsContent.append("\n");
                }
            }

            jsContent.append("];");

            File file = new File(backupHeatTracePath);
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

    @GetMapping("/reference-data")
    public ResponseEntity<String> backupReferenceData() {
        try {
            List<ReferenceObject> all = referenceObjectService.getAll();

            StringBuilder jsContent = new StringBuilder("const referenceData = [\n");

            for (int i = 0; i < all.size(); i++) {
                ReferenceObject obj = all.get(i);
                // Replace special dashes with normal dashes
                obj = replaceSpecialDashes(obj);
                String jsonObject = objectMapper.writeValueAsString(obj);
                jsContent.append(jsonObject);
                if (i < all.size() - 1) {
                    jsContent.append(",\n");
                } else {
                    jsContent.append("\n");
                }
            }

            jsContent.append("];");

            File file = new File(backupReferenceDataPath);
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

    @GetMapping("/properties-data")
    public ResponseEntity<String> backupPropertiesData() {
        try {
            List<Map<String,String>> all = new ArrayList<>();
            Map<String, String> projectRoot = new HashMap<>();
            projectRoot.put("projectRoot", Paths.get(projectRootPath).toString());
            all.add(projectRoot);

            StringBuilder jsContent = new StringBuilder("const propertiesData = [\n");

            for (int i = 0; i < all.size(); i++) {
                String jsonObject = objectMapper.writeValueAsString(all.get(i));
                jsContent.append(jsonObject);
                if (i < all.size() - 1) {
                    jsContent.append(",\n");
                } else {
                    jsContent.append("\n");
                }
            }

            jsContent.append("];");

            File file = new File(backupPropertiesDataPath);
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

    private ReferenceObject replaceSpecialDashes(ReferenceObject obj) {
        // Replace special dashes in all string fields
        if (obj.getDescription() != null) {
            obj.setDescription(obj.getDescription().replaceAll("[\\u2010-\\u2015]", "-"));
        }

        try {
            if (obj.getTagNumbers() != null) {
                List<String> tagNumbers = obj.getTagNumbers();
                tagNumbers.replaceAll(s -> s.replaceAll("[\\u2010-\\u2015]", "-"));
                obj.setTagNumbers(tagNumbers);
            }

            if (obj.getFileNumbers() != null) {
                List<String> fileNumbers = obj.getFileNumbers();
                fileNumbers.replaceAll(s -> s.replaceAll("[\\u2010-\\u2015]", "-"));
                obj.setFileNumbers(fileNumbers);
            }

            if (obj.getCharacteristics() != null) {
                Map<String, String> characteristics = obj.getCharacteristics();
                characteristics.replaceAll((k, v) -> v.replaceAll("[\\u2010-\\u2015]", "-"));
                obj.setCharacteristics(characteristics);
            }

            if (obj.getReferences() != null) {
                Map<String, String> references = obj.getReferences();
                references.replaceAll((k, v) -> v.replaceAll("[\\u2010-\\u2015]", "-"));
                obj.setReferences(references);
            }
        } catch (Exception e) {
            // Log the error but continue processing
            System.err.println("Error replacing special dashes: " + e.getMessage());
        }

        return obj;
    }
}