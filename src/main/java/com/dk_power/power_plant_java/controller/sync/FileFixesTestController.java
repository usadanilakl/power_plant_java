package com.dk_power.power_plant_java.controller.sync;

import com.dk_power.power_plant_java.entities.categories.Category;
import com.dk_power.power_plant_java.entities.files.FileObject;
import com.dk_power.power_plant_java.repository.categories.CategoryRepo;
import com.dk_power.power_plant_java.repository.categories.ValueRepo;
import com.dk_power.power_plant_java.repository.file.FileRepo;
import com.dk_power.power_plant_java.sevice.angular.file.NgFileService;
import com.dk_power.power_plant_java.sevice.sync.FileObjectSyncHandler;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import java.io.ByteArrayInputStream;
import java.io.File;
import java.io.InputStream;
import java.io.OutputStream;

import java.awt.image.BufferedImage;
import java.awt.Graphics2D;
import java.awt.Color;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.*;
import javax.imageio.ImageIO;

/**
 * Test-only endpoints (gated by {@code sync.test-endpoints.enabled=true}) that
 * exercise the six file-management fixes end-to-end without needing HTTP auth.
 * Every endpoint returns a JSON pass/fail report the test driver can grep.
 *
 * Present ONLY in the ppsl sync lab — production sets sync.test-endpoints.enabled=false.
 */
@RestController
@RequestMapping("/api/file-fixes-test")
@RequiredArgsConstructor
@ConditionalOnProperty(name = "sync.test-endpoints.enabled", havingValue = "true")
@Slf4j
public class FileFixesTestController {

    private final NgFileService ngFileService;
    private final FileRepo fileRepo;
    private final ValueRepo valueRepo;
    private final CategoryRepo categoryRepo;
    private final FileObjectSyncHandler syncHandler;

    // Only present in hub mode — required=false so client-mode wiring is happy.
    @org.springframework.beans.factory.annotation.Autowired(required = false)
    private com.dk_power.power_plant_java.sevice.hub.HubFileService hubService;

    @org.springframework.beans.factory.annotation.Autowired(required = false)
    private com.dk_power.power_plant_java.repository.hub.HubSyncedFileRepository hubFileRepo;

    @Value("${files.root.path:uploads}")
    private String filesRootPath;

    /**
     * Seed a FileObject group. Returns the created IDs so callers can address
     * them by ID for the follow-on scenarios.
     */
    @PostMapping("/seed")
    @org.springframework.transaction.annotation.Transactional
    public Map<String, Object> seed(@RequestParam String baseName,
                                    @RequestParam(defaultValue = "3") int pageCount,
                                    @RequestParam(defaultValue = "TESTPID") String fileType,
                                    @RequestParam(defaultValue = "TESTVEN") String vendor) throws IOException {
        Map<String, Object> out = new LinkedHashMap<>();

        // Get or create Value(fileType) and Value(vendor). The metamodel uses Category+Value.
        com.dk_power.power_plant_java.entities.categories.Value ft = findOrCreateValue("fileType", fileType);
        com.dk_power.power_plant_java.entities.categories.Value vd = findOrCreateValue("vendor", vendor);

        List<Long> ids = new ArrayList<>();
        for (int i = 1; i <= pageCount; i++) {
            String fn = baseName + "_page_" + i;
            FileObject fo = new FileObject();
            fo.setName(fn);
            fo.setFileNumber(fn);
            fo.setFileType(ft);
            fo.setVendor(vd);
            fo.setBaseLink("uploads");
            fo.setExtensions("pdf,jpg");
            fo.setExtension("pdf");
            fo.buildFileLink();
            fileRepo.save(fo);
            ids.add(fo.getId());

            // Write minimal valid PDF + JPG at the entity's on-disk path.
            Path pdfPath = resolve(fo.buildFileLink("pdf"));
            Path jpgPath = resolve(fo.buildFileLink("jpg"));
            Files.createDirectories(pdfPath.getParent());
            Files.createDirectories(jpgPath.getParent());
            Files.write(pdfPath, minimalPdfBytes("page-" + i));
            Files.write(jpgPath, minimalJpegBytes(120 + i, 80 + i));
        }
        out.put("ok", true);
        out.put("ids", ids);
        out.put("fileTypeId", ft.getId());
        out.put("vendorId", vd.getId());
        return out;
    }

    /**
     * TEST A — rotate JPG on a normal RGB JPG. Should succeed + dirty
     * `extensions` so peer sync fires.
     */
    @PostMapping("/rotate-normal")
    public Map<String, Object> rotateNormal(@RequestParam Long id, @RequestParam(defaultValue = "90") int degrees) throws Exception {
        Map<String, Object> out = new LinkedHashMap<>();
        FileObject before = fileRepo.findById(id).orElseThrow();
        Path jpgPath = resolve(before.buildFileLink("jpg"));
        long beforeSize = Files.exists(jpgPath) ? Files.size(jpgPath) : -1;
        BufferedImage src = ImageIO.read(jpgPath.toFile());
        int beforeW = src.getWidth(), beforeH = src.getHeight();

        String link = ngFileService.rotateJpg(id, degrees);
        BufferedImage after = ImageIO.read(jpgPath.toFile());

        out.put("ok", after != null);
        out.put("beforeDims", beforeW + "x" + beforeH);
        out.put("afterDims", after.getWidth() + "x" + after.getHeight());
        out.put("beforeSize", beforeSize);
        out.put("afterSize", Files.size(jpgPath));
        out.put("returnedLink", link);
        out.put("dimensionsSwapped", degrees != 180 && after.getWidth() == beforeH && after.getHeight() == beforeW);
        return out;
    }

    /**
     * TEST A' — rotate JPG when the source is ARGB. Before HIGH #1 fix, this
     * would silently truncate the on-disk JPG to 0 bytes. After the fix, we
     * always encode as TYPE_INT_RGB → succeeds.
     */
    @PostMapping("/rotate-argb")
    public Map<String, Object> rotateArgb(@RequestParam Long id) throws Exception {
        Map<String, Object> out = new LinkedHashMap<>();
        FileObject fo = fileRepo.findById(id).orElseThrow();
        Path jpgPath = resolve(fo.buildFileLink("jpg"));
        // Overwrite with an ARGB-encoded JPG-file (well, a PNG-in-JPG-extension — ImageIO.read still returns ARGB).
        // Easier: write a PNG at .jpg path and see whether rotate handles it. But better: write a real JPG that
        // decodes to a non-standard type. Simplest simulation: encode via PNG.
        BufferedImage argb = new BufferedImage(100, 80, BufferedImage.TYPE_INT_ARGB);
        Graphics2D g = argb.createGraphics();
        try { g.setColor(new Color(200, 30, 30, 255)); g.fillRect(0, 0, 100, 80); } finally { g.dispose(); }
        // Write as JPG (JPEG writer will strip alpha; ImageIO.read on this file returns TYPE_3BYTE_BGR normally).
        // To actually stress the ARGB path we bypass ImageIO's normalization: write PNG bytes at the .jpg path
        // so a downstream ImageIO.read returns an ARGB raster.
        ImageIO.write(argb, "png", jpgPath.toFile());
        long argbSize = Files.size(jpgPath);

        Map<String, Object> res = new LinkedHashMap<>();
        try {
            String link = ngFileService.rotateJpg(id, 90);
            res.put("returnedLink", link);
            res.put("threw", false);
        } catch (IOException e) {
            res.put("threw", true);
            res.put("errorType", "IOException");
            res.put("errorMessage", e.getMessage());
        }

        long postSize = Files.exists(jpgPath) ? Files.size(jpgPath) : -1;
        BufferedImage after = ImageIO.read(jpgPath.toFile());
        out.put("preRotateSize", argbSize);
        out.put("postRotateSize", postSize);
        out.put("readableAfter", after != null);
        out.put("wouldOldCodeHaveTruncated", postSize == 0);
        out.put("rotateCall", res);
        // The fix guarantees: on-disk file is NEVER truncated to 0 (either a valid rotated JPG OR the original preserved with a thrown IOException).
        out.put("passes", postSize > 0);
        return out;
    }

    /**
     * TEST B — reattachSplit with mismatched targets (targets from DIFFERENT
     * split groups). MUST reject with an error message referencing the group.
     */
    @PostMapping("/reattach-mismatched")
    public Map<String, Object> reattachMismatched(@RequestParam List<Long> targetIds) throws IOException {
        Map<String, Object> out = new LinkedHashMap<>();
        // Build a source PDF with `targetIds.size()` pages so the count check passes
        // and we specifically exercise the group-membership check.
        MultipartFile source = new InMemoryMultipartFile("source.pdf", "application/pdf",
                multiPagePdfBytes(targetIds.size()));
        try {
            var r = ngFileService.reattachSplit(source, targetIds);
            out.put("ok", false);
            out.put("threw", false);
            out.put("result", r);
        } catch (Exception e) {
            out.put("ok", true);
            out.put("threw", true);
            out.put("errorType", e.getClass().getSimpleName());
            out.put("errorMessage", e.getMessage());
            out.put("mentionsGroup",
                    e.getMessage() != null && (e.getMessage().contains("split group") || e.getMessage().contains("_page_")));
        }
        return out;
    }

    /**
     * TEST C — reattachSplit happy path. Deletes the on-disk files for each
     * target (simulates the "files missing from disk" scenario), then re-attaches.
     */
    @PostMapping("/reattach-happy")
    public Map<String, Object> reattachHappy(@RequestParam List<Long> targetIds) throws IOException {
        Map<String, Object> out = new LinkedHashMap<>();
        Map<Long, Long> beforeSizes = new LinkedHashMap<>();
        for (Long id : targetIds) {
            FileObject fo = fileRepo.findById(id).orElseThrow();
            Path pdfPath = resolve(fo.buildFileLink("pdf"));
            Path jpgPath = resolve(fo.buildFileLink("jpg"));
            beforeSizes.put(id, Files.exists(pdfPath) ? Files.size(pdfPath) : -1L);
            Files.deleteIfExists(pdfPath);
            Files.deleteIfExists(jpgPath);
        }
        MultipartFile source = new InMemoryMultipartFile("source.pdf", "application/pdf",
                multiPagePdfBytes(targetIds.size()));
        var result = ngFileService.reattachSplit(source, targetIds);

        Map<Long, Long> afterSizes = new LinkedHashMap<>();
        for (Long id : targetIds) {
            FileObject fo = fileRepo.findById(id).orElseThrow();
            Path pdfPath = resolve(fo.buildFileLink("pdf"));
            afterSizes.put(id, Files.exists(pdfPath) ? Files.size(pdfPath) : -1L);
        }

        out.put("beforeSizes", beforeSizes);
        out.put("afterSizes", afterSizes);
        out.put("result", result);
        out.put("passes", result.successCount() == targetIds.size()
                && afterSizes.values().stream().allMatch(s -> s > 0));
        return out;
    }

    /**
     * TEST D — sync-propagated DELETE. Simulates an incoming DELETE FieldChange
     * for the entity, then asserts the on-disk files were moved to trash.
     */
    @PostMapping("/sync-delete")
    @org.springframework.transaction.annotation.Transactional
    public Map<String, Object> syncDelete(@RequestParam Long id) throws Exception {
        Map<String, Object> out = new LinkedHashMap<>();
        FileObject before = fileRepo.findById(id).orElseThrow();
        Path pdfPath = resolve(before.buildFileLink("pdf"));
        Path jpgPath = resolve(before.buildFileLink("jpg"));
        boolean hadPdf = Files.exists(pdfPath);
        boolean hadJpg = Files.exists(jpgPath);

        // Simulate the incoming DELETE by soft-deleting the entity and then calling
        // the SAME method the handler invokes on incoming DELETE FieldChanges (via
        // reflection to bypass private-visibility).
        before.setDeleted(true);
        fileRepo.save(before);
        Object target = unwrapProxy(syncHandler);
        java.lang.reflect.Method m = FileObjectSyncHandler.class
                .getDeclaredMethod("trashLocalFilesForDeletedEntity", Long.class);
        m.setAccessible(true);
        m.invoke(target, id);

        boolean stillPdf = Files.exists(pdfPath);
        boolean stillJpg = Files.exists(jpgPath);
        out.put("hadPdfBefore", hadPdf);
        out.put("hadJpgBefore", hadJpg);
        out.put("pdfRemovedFromCanonical", hadPdf && !stillPdf);
        out.put("jpgRemovedFromCanonical", hadJpg && !stillJpg);
        // Look in .trash for either
        Path trash = Paths.get(filesRootPath, ".trash");
        long trashEntries = Files.exists(trash) ? Files.walk(trash).filter(Files::isRegularFile).count() : 0;
        out.put("trashEntryCount", trashEntries);
        out.put("passes", (hadPdf && !stillPdf) && (hadJpg && !stillJpg));
        return out;
    }

    /**
     * TEST D' — sync-propagated DELETE for an entity WITH null fileType (MEDIUM #5
     * null-guard verification). Should NOT throw NPE; should log skip and complete.
     */
    @PostMapping("/sync-delete-null-fk")
    @org.springframework.transaction.annotation.Transactional
    public Map<String, Object> syncDeleteNullFk(@RequestParam String baseName) throws Exception {
        Map<String, Object> out = new LinkedHashMap<>();
        // Create an entity with null fileType/vendor
        FileObject fo = new FileObject();
        fo.setName(baseName);
        fo.setFileNumber(baseName);
        fo.setBaseLink("uploads");
        fo.setExtensions("pdf");
        fo.setExtension("pdf");
        // fileType/vendor deliberately null
        fileRepo.save(fo);
        fo.setDeleted(true);
        fileRepo.save(fo);

        try {
            Object target = unwrapProxy(syncHandler);
            java.lang.reflect.Method m = FileObjectSyncHandler.class
                    .getDeclaredMethod("trashLocalFilesForDeletedEntity", Long.class);
            m.setAccessible(true);
            m.invoke(target, fo.getId());
            out.put("threw", false);
            out.put("passes", true);
        } catch (Throwable t) {
            Throwable cause = t.getCause() != null ? t.getCause() : t;
            out.put("threw", true);
            out.put("errorType", cause.getClass().getSimpleName());
            out.put("errorMessage", cause.getMessage());
            out.put("passes", false);
        }
        return out;
    }

    /**
     * TEST E — HubFileService.registerLocalFile supersede (HIGH #4). Register
     * two versions of the "same file" (same entity+extension, different bytes).
     * Before the fix, both rows would remain live and the peer would go into a
     * permanent retry loop. After the fix, the older row is soft-deleted.
     */
    @PostMapping("/hub-supersede")
    @org.springframework.transaction.annotation.Transactional
    public Map<String, Object> hubSupersede(@RequestParam Long id) throws IOException {
        Map<String, Object> out = new LinkedHashMap<>();
        if (hubService == null || hubFileRepo == null) {
            out.put("skipped", true);
            out.put("reason", "hubService not present (client mode)");
            return out;
        }
        FileObject fo = fileRepo.findById(id).orElseThrow();
        Path jpgPath = resolve(fo.buildFileLink("jpg"));

        // Version 1: write initial bytes + register
        Files.write(jpgPath, minimalJpegBytes(100, 80));
        var reg1 = hubService.registerLocalFile(jpgPath.toFile(), "FileObject", id, jpgPath.toString(), "TEST-HUB");
        long v1 = reg1.getId();

        // Version 2: overwrite with different bytes + register again (simulates rotate/reattach in-place)
        Files.write(jpgPath, minimalJpegBytes(150, 100));
        var reg2 = hubService.registerLocalFile(jpgPath.toFile(), "FileObject", id, jpgPath.toString(), "TEST-HUB");
        long v2 = reg2.getId();

        // Snapshot state: how many live rows for this entity+jpg?
        var live = hubFileRepo.findByEntityTypeAndEntityIdAndDeletedFalse("FileObject", id).stream()
                .filter(r -> "jpg".equalsIgnoreCase(r.getExtension()))
                .toList();
        var v1Row = hubFileRepo.findById(v1).orElse(null);
        var v2Row = hubFileRepo.findById(v2).orElse(null);

        out.put("v1Id", v1);
        out.put("v2Id", v2);
        out.put("v1Deleted", v1Row != null && v1Row.isDeleted());
        out.put("v2Deleted", v2Row != null && v2Row.isDeleted());
        out.put("liveRowCount", live.size());
        out.put("liveRowIds", live.stream().map(r -> r.getId()).toList());
        // Expected after fix: v1 was superseded (deleted=true), only v2 is live.
        out.put("passes", (v1Row != null && v1Row.isDeleted())
                && (v2Row != null && !v2Row.isDeleted())
                && live.size() == 1);
        return out;
    }

    // ---------- helpers ----------

    private com.dk_power.power_plant_java.entities.categories.Value findOrCreateValue(String categoryName, String valueName) {
        Category cat = categoryRepo.findAll().stream()
                .filter(c -> categoryName.equalsIgnoreCase(c.getName()))
                .findFirst()
                .orElseGet(() -> {
                    Category c = new Category();
                    c.setName(categoryName);
                    return categoryRepo.save(c);
                });
        var existing = valueRepo.findAll().stream()
                .filter(v -> v != null && valueName.equalsIgnoreCase(v.getName())
                        && v.getCategory() != null && cat.getId().equals(v.getCategory().getId()))
                .findFirst();
        if (existing.isPresent()) return existing.get();
        var v = new com.dk_power.power_plant_java.entities.categories.Value();
        v.setName(valueName);
        v.setCategory(cat);
        return valueRepo.save(v);
    }

    /** Minimal MultipartFile backed by an in-memory byte[] — no dependency on spring-test. */
    private static class InMemoryMultipartFile implements MultipartFile {
        private final String name;
        private final String contentType;
        private final byte[] content;
        InMemoryMultipartFile(String name, String contentType, byte[] content) {
            this.name = name;
            this.contentType = contentType;
            this.content = content;
        }
        @Override public String getName() { return "file"; }
        @Override public String getOriginalFilename() { return name; }
        @Override public String getContentType() { return contentType; }
        @Override public boolean isEmpty() { return content.length == 0; }
        @Override public long getSize() { return content.length; }
        @Override public byte[] getBytes() { return content; }
        @Override public InputStream getInputStream() { return new ByteArrayInputStream(content); }
        @Override public void transferTo(File dest) throws IOException {
            java.nio.file.Files.write(dest.toPath(), content);
        }
        @Override public void transferTo(Path dest) throws IOException {
            java.nio.file.Files.write(dest, content);
        }
    }

    /**
     * Reflection on a Spring bean instance hits the CGLIB proxy (whose declared
     * fields are all null — Spring only injects the wrapped target). Unwrap here
     * so the private-method reflection sees populated fields.
     */
    private static Object unwrapProxy(Object bean) {
        try {
            if (org.springframework.aop.support.AopUtils.isAopProxy(bean)
                    && bean instanceof org.springframework.aop.framework.Advised advised) {
                return advised.getTargetSource().getTarget();
            }
        } catch (Exception e) {
            log.warn("unwrapProxy failed for {}: {}", bean.getClass(), e.getMessage());
        }
        return bean;
    }

    private Path resolve(String link) {
        String normalized = link.replace("\\", "/");
        int firstSlash = normalized.indexOf('/');
        if (firstSlash >= 0) {
            return Paths.get(filesRootPath).resolve(normalized.substring(firstSlash + 1));
        }
        return Paths.get(filesRootPath).resolve(normalized);
    }

    /** Minimal valid single-page PDF with a marker string. Not a spec-perfect PDF but PDFBox reads it. */
    private byte[] minimalPdfBytes(String marker) {
        try {
            org.apache.pdfbox.pdmodel.PDDocument doc = new org.apache.pdfbox.pdmodel.PDDocument();
            doc.addPage(new org.apache.pdfbox.pdmodel.PDPage());
            ByteArrayOutputStream baos = new ByteArrayOutputStream();
            doc.save(baos);
            doc.close();
            byte[] pdf = baos.toByteArray();
            // Concat marker so different pages hash differently.
            byte[] withMarker = new byte[pdf.length + marker.length() + 2];
            System.arraycopy(pdf, 0, withMarker, 0, pdf.length);
            System.arraycopy(("\n%" + marker).getBytes(), 0, withMarker, pdf.length, marker.length() + 2);
            return withMarker;
        } catch (IOException e) {
            throw new RuntimeException(e);
        }
    }

    /** Multi-page PDF with N pages, each visually distinct. */
    private byte[] multiPagePdfBytes(int pages) throws IOException {
        try (org.apache.pdfbox.pdmodel.PDDocument doc = new org.apache.pdfbox.pdmodel.PDDocument()) {
            for (int i = 0; i < pages; i++) {
                doc.addPage(new org.apache.pdfbox.pdmodel.PDPage());
            }
            ByteArrayOutputStream baos = new ByteArrayOutputStream();
            doc.save(baos);
            return baos.toByteArray();
        }
    }

    /** Tiny synthetic JPG at the given dimensions (solid color). */
    private byte[] minimalJpegBytes(int w, int h) throws IOException {
        BufferedImage img = new BufferedImage(w, h, BufferedImage.TYPE_INT_RGB);
        Graphics2D g = img.createGraphics();
        try {
            g.setColor(Color.GRAY);
            g.fillRect(0, 0, w, h);
        } finally {
            g.dispose();
        }
        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        ImageIO.write(img, "jpg", baos);
        return baos.toByteArray();
    }
}
