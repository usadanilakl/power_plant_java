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

        return streamPackFile(name, relativePath);
    }

    /**
     * Same bytes as {@link #downloadFile}, but the pack name and file path arrive as QUERY PARAMS so the
     * request URL path is {@code /api/resource-packs/file-by-path} — no file extension. In production the
     * hub sits behind IIS/ARR, whose static-file handler grabs extension-bearing proxied URLs (…/foo.png)
     * under Windows Auth and returns 401 before ARR forwards them to the app. A no-extension URL path
     * sidesteps that. Mirrors HubResyncController's permanent-by-path; the Electron resource-pack sync
     * (resource-pack.manager.ts) uses this endpoint.
     */
    @GetMapping("/file-by-path")
    public ResponseEntity<Resource> downloadFileByPath(
        @RequestParam("name") String name,
        @RequestParam("path") String relativePath
    ) {
        if (name == null || name.isBlank() || relativePath == null || relativePath.isBlank()) {
            return ResponseEntity.badRequest().build();
        }
        // @RequestParam already decoded once; handle a defensive double-encoding like the resync endpoint.
        if (relativePath.contains("%")) {
            try { relativePath = URLDecoder.decode(relativePath, StandardCharsets.UTF_8); } catch (Exception ignore) { }
        }
        return streamPackFile(name, relativePath);
    }

    private ResponseEntity<Resource> streamPackFile(String name, String relativePath) {
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
