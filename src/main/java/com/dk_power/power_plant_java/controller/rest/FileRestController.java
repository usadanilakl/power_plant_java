package com.dk_power.power_plant_java.controller.rest;

import com.dk_power.power_plant_java.dto.plant.files.FileDto;
import lombok.AllArgsConstructor;
import lombok.Data;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.net.MalformedURLException;
import java.nio.file.Path;
import java.nio.file.Paths;

@AllArgsConstructor
@Data
@RestController
@RequestMapping("/data")
public class FileRestController {

    @GetMapping("/get-files")
    public Iterable<FileDto> getFiles(){
        return null;
    }

    @DeleteMapping("/delete-kiewit")
    public void deleteKiewit(){

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
}
