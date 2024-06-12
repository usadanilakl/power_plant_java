package com.dk_power.power_plant_java.controller.rest;

import com.dk_power.power_plant_java.dto.plant.files.FileDto;
import com.dk_power.power_plant_java.sevice.plant.impl.FileServiceImpl;
import lombok.AllArgsConstructor;
import lombok.Data;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.net.MalformedURLException;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.ArrayList;
import java.util.List;

@AllArgsConstructor
@Data
@RestController
@RequestMapping("/data")
public class FileRestController {
    private final FileServiceImpl fileService;

    @GetMapping("/get-files")
    public Iterable<FileDto> getFiles() {
        return null;
    }

    @DeleteMapping("/delete-kiewit")
    public void deleteKiewit() {

    }

    @GetMapping("/displayPdf")
    public ResponseEntity<Resource> displayPdf() {
        String filename = "uploads/display.pdf";
        Path path = Paths.get(filename);
        Resource resource;
        try {
            resource = new UrlResource(path.toUri());
        } catch (MalformedURLException e) {
            throw new RuntimeException("Error: " + e.getMessage());
        }
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType("application/pdf"))
                .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + resource.getFilename() + "\"")
                .body(resource);
    }

    @GetMapping("/displayJpg")
    public ResponseEntity<Resource> displayJpg() {
        String filename = "uploads/1.jpg";
        Path path = Paths.get(filename);
        Resource resource;
        try {
            resource = new UrlResource(path.toUri());
        } catch (MalformedURLException e) {
            throw new RuntimeException("Error: " + e.getMessage());
        }
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType("image/jpeg"))
                .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + resource.getFilename() + "\"")
                .body(resource);
    }

    @GetMapping("/get-items/{value}")
    public ResponseEntity<List<FileDto>> getItems(@PathVariable("value") String value, @RequestParam(name = "field") String field, @RequestParam(name = "type") String type) {
        List<FileDto> items = fileService.getAllDtos();
        return ResponseEntity.ok().body(items);
    }

    @GetMapping("/get-subgroups/{value}")
    public ResponseEntity<List<String>> getSubGroups(@PathVariable("value") String value, @RequestParam(name = "field") String field) {
        List<String> items = new ArrayList<>();
        if (value.equalsIgnoreCase("vendor")) {
            items = fileService.getVendors();
        }
        return ResponseEntity.ok().body(items);

    }
}
