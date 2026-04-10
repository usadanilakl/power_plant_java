package com.dk_power.power_plant_java.controller.angular;

import com.dk_power.power_plant_java.config.SyncConfig;
import com.dk_power.power_plant_java.entities.files.FileObject;
import com.dk_power.power_plant_java.sevice.angular.permits.NgDailyPermitPackageService;
import com.dk_power.power_plant_java.sevice.angular.permits.NgJobLogService;
import com.dk_power.power_plant_java.sevice.angular.file.NgFileService;
import com.dk_power.power_plant_java.sevice.angular.loto.NgLotoPointService;
import lombok.RequiredArgsConstructor;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.PDPage;
import org.apache.pdfbox.pdmodel.PDPageContentStream;
import org.apache.pdfbox.pdmodel.font.PDType1Font;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import javax.imageio.ImageIO;
import java.awt.Color;
import java.awt.Graphics2D;
import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import java.util.LinkedHashMap;
import java.util.Map;

@RestController
@RequestMapping("/ng/config")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class NgAppConfigController {

    private final SyncConfig syncConfig;
    private final NgJobLogService jobLogService;
    private final NgDailyPermitPackageService packageService;
    private final NgFileService fileService;
    private final NgLotoPointService lotoPointService;

    @Value("${test.ui.enabled:false}")
    private boolean testUiEnabled;

    @GetMapping("/test-mode")
    public ResponseEntity<NgApiResponse<Boolean>> isTestMode() {
        return ResponseEntity.ok(new NgApiResponse<>(testUiEnabled, "ok"));
    }

    @GetMapping("/e2e-info")
    public ResponseEntity<NgApiResponse<Map<String, Object>>> getE2eInfo() {
        Map<String, Object> info = new LinkedHashMap<>();
        info.put("isHub", syncConfig.isHubMode());
        info.put("localPort", syncConfig.getSyncPort());
        info.put("syncServerUrl", syncConfig.getSyncServerUrl());
        info.put("machineName", syncConfig.getMachineName());
        info.put("machineId", syncConfig.getMachineId());
        return ResponseEntity.ok(new NgApiResponse<>(info, "ok"));
    }

    /** Public endpoint for E2E sync verification — only active when test.ui.enabled=true */
    @GetMapping("/e2e-verify/job/{id}")
    public ResponseEntity<NgApiResponse<Object>> getJobForVerification(@PathVariable String id) {
        if (!testUiEnabled) {
            return ResponseEntity.status(403).body(new NgApiResponse<>(null, "E2E verification disabled"));
        }
        try {
            var dto = jobLogService.getDtoById(id);
            return ResponseEntity.ok(new NgApiResponse<>(dto, "ok"));
        } catch (Exception e) {
            return ResponseEntity.ok(new NgApiResponse<>(null, "Not found: " + e.getMessage()));
        }
    }

    /** Public endpoint for E2E sync verification — only active when test.ui.enabled=true */
    @GetMapping("/e2e-verify/package/{id}")
    public ResponseEntity<NgApiResponse<Object>> getPackageForVerification(@PathVariable String id) {
        if (!testUiEnabled) {
            return ResponseEntity.status(403).body(new NgApiResponse<>(null, "E2E verification disabled"));
        }
        try {
            var dto = packageService.getDtoById(id);
            return ResponseEntity.ok(new NgApiResponse<>(dto, "ok"));
        } catch (Exception e) {
            return ResponseEntity.ok(new NgApiResponse<>(null, "Not found: " + e.getMessage()));
        }
    }

    @GetMapping("/e2e-verify/file/{id}")
    public ResponseEntity<NgApiResponse<Object>> getFileForVerification(@PathVariable String id) {
        if (!testUiEnabled) {
            return ResponseEntity.status(403).body(new NgApiResponse<>(null, "E2E verification disabled"));
        }
        try {
            var dto = fileService.findDtoById(Long.parseLong(id)).orElse(null);
            return ResponseEntity.ok(new NgApiResponse<>(dto, "ok"));
        } catch (Exception e) {
            return ResponseEntity.ok(new NgApiResponse<>(null, "Not found: " + e.getMessage()));
        }
    }

    @GetMapping("/e2e-verify/loto-point/{id}")
    public ResponseEntity<NgApiResponse<Object>> getLotoPointForVerification(@PathVariable String id) {
        if (!testUiEnabled) {
            return ResponseEntity.status(403).body(new NgApiResponse<>(null, "E2E verification disabled"));
        }
        try {
            var dto = lotoPointService.findDtoById(Long.parseLong(id)).orElse(null);
            return ResponseEntity.ok(new NgApiResponse<>(dto, "ok"));
        } catch (Exception e) {
            return ResponseEntity.ok(new NgApiResponse<>(null, "Not found: " + e.getMessage()));
        }
    }

    /**
     * Returns the raw {@code fileHash} of a FileObject. Used by the E2E File Flow
     * to assert that override-uploads change the hash and that peers receive the
     * updated bytes after sync. {@code FileDto} intentionally does not expose
     * fileHash, so this endpoint reads the entity directly.
     */
    @GetMapping("/e2e-verify/file-hash/{id}")
    public ResponseEntity<NgApiResponse<String>> getFileHashForVerification(@PathVariable String id) {
        if (!testUiEnabled) {
            return ResponseEntity.status(403).body(new NgApiResponse<>(null, "E2E verification disabled"));
        }
        try {
            FileObject entity = fileService.getEntityById(Long.parseLong(id));
            return ResponseEntity.ok(new NgApiResponse<>(entity != null ? entity.getFileHash() : null, "ok"));
        } catch (Exception e) {
            return ResponseEntity.ok(new NgApiResponse<>(null, "Not found: " + e.getMessage()));
        }
    }

    // ==================== Test asset generators ====================
    // Tiny valid PDFs/PNGs generated on the fly so the E2E File Flow has known
    // good binary content to upload. Variants A and B produce different bytes,
    // which is essential for the override-upload hash-change test.

    @GetMapping("/e2e-test-assets/sample-pdf/{variant}")
    public ResponseEntity<byte[]> getSamplePdf(@PathVariable String variant) {
        if (!testUiEnabled) {
            return ResponseEntity.status(403).build();
        }
        try {
            byte[] pdf = generateSamplePdf("E2E sample PDF — variant " + variant);
            return ResponseEntity.ok()
                    .contentType(MediaType.APPLICATION_PDF)
                    .body(pdf);
        } catch (Exception e) {
            return ResponseEntity.status(500).build();
        }
    }

    @GetMapping("/e2e-test-assets/sample-png")
    public ResponseEntity<byte[]> getSamplePng() {
        if (!testUiEnabled) {
            return ResponseEntity.status(403).build();
        }
        try {
            byte[] png = generateSamplePng();
            return ResponseEntity.ok()
                    .contentType(MediaType.IMAGE_PNG)
                    .body(png);
        } catch (Exception e) {
            return ResponseEntity.status(500).build();
        }
    }

    /** Tiny single-page PDF with the given text. PDFBox-parseable, so the upload
     *  pipeline's split + jpg-conversion can run end-to-end. */
    private byte[] generateSamplePdf(String text) throws Exception {
        try (PDDocument doc = new PDDocument();
             ByteArrayOutputStream baos = new ByteArrayOutputStream()) {
            PDPage page = new PDPage();
            doc.addPage(page);
            try (PDPageContentStream cs = new PDPageContentStream(doc, page)) {
                cs.beginText();
                cs.setFont(PDType1Font.HELVETICA, 12);
                cs.newLineAtOffset(72, 720);
                cs.showText(text);
                cs.endText();
            }
            doc.save(baos);
            return baos.toByteArray();
        }
    }

    /** Tiny solid-color PNG (10x10). Just enough bytes for ImageIO to round-trip. */
    private byte[] generateSamplePng() throws Exception {
        BufferedImage img = new BufferedImage(10, 10, BufferedImage.TYPE_INT_RGB);
        Graphics2D g = img.createGraphics();
        try {
            g.setColor(new Color(64, 128, 192));
            g.fillRect(0, 0, 10, 10);
        } finally {
            g.dispose();
        }
        try (ByteArrayOutputStream baos = new ByteArrayOutputStream()) {
            ImageIO.write(img, "png", baos);
            return baos.toByteArray();
        }
    }
}
