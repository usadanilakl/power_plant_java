package com.dk_power.power_plant_java.controller.hub;

import com.dk_power.power_plant_java.sevice.hub.HubResourcePackService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.core.io.InputStreamResource;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;
import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;
import java.util.Optional;

/**
 * REST controller for resource pack distribution.
 * Matches sync-server's ResourcePackController API contract.
 * Only active when sync.role=hub.
 */
@RestController
@RequestMapping("/api/resource-packs")
@ConditionalOnProperty(name = "sync.role", havingValue = "hub")
@RequiredArgsConstructor
@Slf4j
public class HubResourcePackController {

    private final HubResourcePackService resourcePackService;

    @GetMapping("/list")
    public ResponseEntity<List<String>> listPacks() {
        return ResponseEntity.ok(resourcePackService.listPacks());
    }

    @GetMapping("/manifest/{name}")
    public ResponseEntity<List<HubResourcePackService.PackFileEntry>> getManifest(@PathVariable String name) {
        Optional<List<HubResourcePackService.PackFileEntry>> manifest = resourcePackService.getManifest(name);

        if (manifest.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        log.info("Resource pack manifest: {} ({} files)", name, manifest.get().size());
        return ResponseEntity.ok(manifest.get());
    }

    @GetMapping("/file/{name}/**")
    public ResponseEntity<Resource> downloadFile(
        @PathVariable String name,
        HttpServletRequest request
    ) {
        String prefix = "/api/resource-packs/file/" + name + "/";
        String requestUri = request.getRequestURI();
        String relativePath = requestUri.substring(requestUri.indexOf(prefix) + prefix.length());

        relativePath = URLDecoder.decode(relativePath, StandardCharsets.UTF_8);

        Optional<Path> filePath = resourcePackService.getFilePath(name, relativePath);
        if (filePath.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        Path file = filePath.get();
        try {
            long fileSize = Files.size(file);
            String fileName = file.getFileName().toString();

            InputStreamResource resource = new InputStreamResource(Files.newInputStream(file));

            HttpHeaders headers = new HttpHeaders();
            headers.setContentDispositionFormData("attachment", fileName);
            headers.setContentLength(fileSize);

            return ResponseEntity.ok()
                .headers(headers)
                .contentType(MediaType.APPLICATION_OCTET_STREAM)
                .body(resource);
        } catch (IOException e) {
            log.error("Error streaming resource pack file: {}/{}", name, relativePath, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
}
