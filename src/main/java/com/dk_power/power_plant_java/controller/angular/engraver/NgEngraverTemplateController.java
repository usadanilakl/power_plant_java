package com.dk_power.power_plant_java.controller.angular.engraver;

import com.dk_power.power_plant_java.controller.angular.NgApiResponse;
import com.dk_power.power_plant_java.dto.engraver.EngraverTemplateDto;
import com.dk_power.power_plant_java.sevice.angular.engraver.NgEngraverTemplateService;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/ng/engraver-templates")
@RequiredArgsConstructor
public class NgEngraverTemplateController {

    private final NgEngraverTemplateService service;

    @GetMapping("/get-all")
    public ResponseEntity<NgApiResponse<List<EngraverTemplateDto>>> getAll() {
        try {
            List<EngraverTemplateDto> items = service.getAllDtos();
            return ResponseEntity.ok().contentType(MediaType.APPLICATION_JSON)
                .body(new NgApiResponse<>(items, "Engraver templates retrieved successfully", LocalDateTime.now()));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, "Error: " + e.getMessage()));
        }
    }

    @GetMapping("/get-by-id/{id}")
    public ResponseEntity<NgApiResponse<EngraverTemplateDto>> getById(@PathVariable String id) {
        try {
            EngraverTemplateDto dto = service.getTemplateById(id);
            if (dto == null) {
                return ResponseEntity.status(404).contentType(MediaType.APPLICATION_JSON)
                    .body(new NgApiResponse<>(null, "Engraver template not found", LocalDateTime.now()));
            }
            return ResponseEntity.ok().contentType(MediaType.APPLICATION_JSON)
                .body(new NgApiResponse<>(dto, "Engraver template retrieved successfully", LocalDateTime.now()));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, "Error: " + e.getMessage()));
        }
    }

    @PostMapping
    public ResponseEntity<NgApiResponse<EngraverTemplateDto>> create(@RequestBody EngraverTemplateDto dto) {
        try {
            EngraverTemplateDto created = service.createTemplate(dto);
            return ResponseEntity.ok().contentType(MediaType.APPLICATION_JSON)
                .body(new NgApiResponse<>(created, "Engraver template created successfully", LocalDateTime.now()));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, "Error: " + e.getMessage()));
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<NgApiResponse<EngraverTemplateDto>> update(@PathVariable String id, @RequestBody EngraverTemplateDto dto) {
        try {
            EngraverTemplateDto updated = service.updateTemplate(id, dto);
            return ResponseEntity.ok().contentType(MediaType.APPLICATION_JSON)
                .body(new NgApiResponse<>(updated, "Engraver template updated successfully", LocalDateTime.now()));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, "Error: " + e.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<NgApiResponse<Void>> delete(@PathVariable String id) {
        try {
            service.softDelete(id);
            return ResponseEntity.ok().contentType(MediaType.APPLICATION_JSON)
                .body(new NgApiResponse<>(null, "Engraver template deleted successfully", LocalDateTime.now()));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, "Error: " + e.getMessage()));
        }
    }

    @GetMapping("/by-tag-size/{tagSize}")
    public ResponseEntity<NgApiResponse<List<EngraverTemplateDto>>> getByTagSize(@PathVariable String tagSize) {
        try {
            List<EngraverTemplateDto> items = service.findByTagSize(tagSize);
            return ResponseEntity.ok().contentType(MediaType.APPLICATION_JSON)
                .body(new NgApiResponse<>(items, "Engraver templates retrieved by tag size", LocalDateTime.now()));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, "Error: " + e.getMessage()));
        }
    }

    @GetMapping("/by-config")
    public ResponseEntity<NgApiResponse<List<EngraverTemplateDto>>> getByConfig(
            @RequestParam String tagSize, @RequestParam String dataStructure) {
        try {
            List<EngraverTemplateDto> items = service.findByTagSizeAndDataStructure(tagSize, dataStructure);
            return ResponseEntity.ok().contentType(MediaType.APPLICATION_JSON)
                .body(new NgApiResponse<>(items, "Engraver templates retrieved by config", LocalDateTime.now()));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, "Error: " + e.getMessage()));
        }
    }

    @PostMapping("/{id}/upload-file")
    public ResponseEntity<NgApiResponse<EngraverTemplateDto>> uploadFile(
            @PathVariable String id, @RequestParam("file") MultipartFile file) {
        try {
            EngraverTemplateDto existing = service.getTemplateById(id);
            if (existing == null) {
                return ResponseEntity.status(404).contentType(MediaType.APPLICATION_JSON)
                    .body(new NgApiResponse<>(null, "Engraver template not found", LocalDateTime.now()));
            }

            String originalFilename = file.getOriginalFilename();
            if (originalFilename == null || !originalFilename.toLowerCase().endsWith(".lbrn2")) {
                return ResponseEntity.badRequest().body(new NgApiResponse<>(null, "Only .lbrn2 files are accepted"));
            }

            Path dataDir = Paths.get(service.getEngraverDataPath());
            Files.createDirectories(dataDir);
            Path targetPath = dataDir.resolve(originalFilename);
            file.transferTo(targetPath.toFile());

            existing.setFilename(originalFilename);
            EngraverTemplateDto updated = service.updateTemplate(id, existing);

            return ResponseEntity.ok().contentType(MediaType.APPLICATION_JSON)
                .body(new NgApiResponse<>(updated, "File uploaded successfully", LocalDateTime.now()));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, "Error: " + e.getMessage()));
        }
    }

    @GetMapping("/{id}/download-file")
    public ResponseEntity<?> downloadFile(@PathVariable String id) {
        try {
            EngraverTemplateDto dto = service.getTemplateById(id);
            if (dto == null) {
                return ResponseEntity.status(404).contentType(MediaType.APPLICATION_JSON)
                    .body(new NgApiResponse<>(null, "Engraver template not found", LocalDateTime.now()));
            }
            if (dto.getFilename() == null || dto.getFilename().isBlank()) {
                return ResponseEntity.status(404).contentType(MediaType.APPLICATION_JSON)
                    .body(new NgApiResponse<>(null, "No file associated with this template", LocalDateTime.now()));
            }

            File file = new File(service.getEngraverDataPath(), dto.getFilename());
            if (!file.exists()) {
                return ResponseEntity.status(404).contentType(MediaType.APPLICATION_JSON)
                    .body(new NgApiResponse<>(null, "File not found on disk: " + dto.getFilename(), LocalDateTime.now()));
            }

            Resource resource = new FileSystemResource(file);
            return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + dto.getFilename() + "\"")
                .contentType(MediaType.APPLICATION_OCTET_STREAM)
                .contentLength(file.length())
                .body(resource);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().contentType(MediaType.APPLICATION_JSON)
                .body(new NgApiResponse<>(null, "Error: " + e.getMessage()));
        }
    }
}
