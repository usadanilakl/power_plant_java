package com.dk_power.power_plant_java.sevice.pwa;

import com.dk_power.power_plant_java.dto.permits.loto_standard.PointDrawingDto;
import com.dk_power.power_plant_java.entities.equipment.Equipment;
import com.dk_power.power_plant_java.entities.files.FileObject;
import com.dk_power.power_plant_java.entities.loto.LotoPoint;
import com.dk_power.power_plant_java.entities.loto.LotoStandard;
import com.dk_power.power_plant_java.repository.file.FileRepo;
import com.dk_power.power_plant_java.repository.loto.LotoPointRepo;
import com.dk_power.power_plant_java.repository.loto.LotoStandardRepo;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.net.MalformedURLException;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

/**
 * Resolves, per LOTO point, which drawing(s) show it and where (the highlight rectangle), and streams the
 * drawing bytes — for the mobile "pull up the P&amp;ID with this point circled" viewer.
 *
 * <p>Resolution mirrors the desktop viewer exactly: a point → {@code equipmentList} (ManyToMany Equipment);
 * <b>each Equipment is one occurrence on one drawing</b> — the drawing is {@code Equipment.mainFile} and the
 * rectangle is parsed from {@code Equipment.coordinates} + {@code Equipment.originalPictureSize} (NOT the
 * {@code Highlight} entity, which is unused for this). A point on several drawings simply has several Equipment.
 * Bytes are served from the JPG derivative on disk. Read-only; the client caches descriptors + blobs offline.</p>
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class PwaLotoDrawingService {

    private final LotoStandardRepo standardRepo;
    private final LotoPointRepo lotoPointRepo;
    private final FileRepo fileRepo;

    @Value("${files.root.path:uploads}")
    private String filesRootPath;

    @Value("${project.root:}")
    private String projectRootPath;

    /**
     * Every point→drawing occurrence for a standard. Each Equipment's {@code mainFile} is one drawing; when the
     * Equipment has a drawn shape ({@code coordinates} + {@code originalPictureSize}) it carries the highlight
     * rectangle, otherwise it's still returned (the file is linked, just without a highlight). Per point, a file
     * that has at least one highlighted occurrence suppresses a duplicate no-highlight entry for the same file.
     */
    @Transactional(readOnly = true)
    public List<PointDrawingDto> drawingsForStandard(Long standardId) {
        LotoStandard s = standardRepo.findById(standardId)
                .orElseThrow(() -> new IllegalArgumentException("LOTO standard not found: " + standardId));
        List<PointDrawingDto> out = new ArrayList<>();
        for (LotoPoint stub : s.getLotoPoints()) {
            // Re-fetch with the equipment collection eagerly joined (its mainFile is EAGER) — the same load
            // the desktop uses; walking the lazy collection off the standard could otherwise come back empty.
            LotoPoint p = lotoPointRepo.findByIdWithEquipment(stub.getId());
            if (p == null || p.getEquipmentList() == null) continue;
            List<PointDrawingDto> withRect = new ArrayList<>();
            Map<Long, PointDrawingDto> noRect = new LinkedHashMap<>();
            Set<Long> filesWithRect = new HashSet<>();
            for (Equipment eq : p.getEquipmentList()) {
                FileObject file = eq.getMainFile();
                if (file == null || file.getId() == null) continue;
                double[] rect = parseCoordinates(eq.getCoordinates());
                double[] dims = parsePictureSize(eq.getOriginalPictureSize());
                if (rect != null && dims != null) {
                    withRect.add(new PointDrawingDto(p.getId(), file.getId(), file.getName(),
                            dims[0], dims[1], rect[0], rect[1], rect[2], rect[3]));
                    filesWithRect.add(file.getId());
                } else {
                    noRect.putIfAbsent(file.getId(), new PointDrawingDto(p.getId(), file.getId(), file.getName(),
                            null, null, null, null, null, null));
                }
            }
            out.addAll(withRect);
            for (Map.Entry<Long, PointDrawingDto> e : noRect.entrySet()) {
                if (!filesWithRect.contains(e.getKey())) out.add(e.getValue());
            }
        }
        return out;
    }

    /** The JPG bytes for a file, resolved from disk under the uploads root. */
    @Transactional(readOnly = true)
    public Resource imageResource(Long fileId) {
        FileObject file = fileRepo.findById(fileId)
                .orElseThrow(() -> new IllegalArgumentException("File not found: " + fileId));
        String rel = file.buildRelativePath("jpg");
        if (rel == null) throw new IllegalArgumentException("File " + fileId + " has no resolvable path");
        Path path = uploadsPath().resolve(rel);
        try {
            Resource r = new UrlResource(path.toUri());
            if (!r.exists() || !r.isReadable()) {
                throw new IllegalArgumentException("Drawing image not found on disk: " + rel);
            }
            return r;
        } catch (MalformedURLException e) {
            throw new RuntimeException("Bad image path: " + e.getMessage(), e);
        }
    }

    // ── Coordinate / size parsing (Equipment.coordinates + originalPictureSize strings) ──

    /**
     * Parse "startX:..,startY:..,endX:..,endY:..,width:..,height:.." into {x, y, width, height} — x/y are the
     * top-left (min of start/end) and width/height are the absolute span, so the box is always valid.
     */
    private double[] parseCoordinates(String s) {
        Map<String, Double> m = parseKv(s);
        Double sx = m.get("startx"), sy = m.get("starty"), ex = m.get("endx"), ey = m.get("endy");
        if (sx != null && sy != null && ex != null && ey != null) {
            double w = Math.abs(ex - sx), h = Math.abs(ey - sy);
            if (w == 0 && m.get("width") != null) w = Math.abs(m.get("width"));
            if (h == 0 && m.get("height") != null) h = Math.abs(m.get("height"));
            if (w == 0 || h == 0) return null;
            return new double[]{Math.min(sx, ex), Math.min(sy, ey), w, h};
        }
        // Fallback: startX/startY + width/height only
        Double w = m.get("width"), h = m.get("height");
        if (sx != null && sy != null && w != null && h != null && w != 0 && h != 0) {
            return new double[]{sx, sy, Math.abs(w), Math.abs(h)};
        }
        return null;
    }

    /** Parse "width:..,height:.." (also tolerates the "widht:" typo used by the Highlight entity). */
    private double[] parsePictureSize(String s) {
        Map<String, Double> m = parseKv(s);
        Double w = m.get("width");
        if (w == null) w = m.get("widht");
        Double h = m.get("height");
        if (w == null || h == null || w == 0 || h == 0) return null;
        return new double[]{w, h};
    }

    private Map<String, Double> parseKv(String s) {
        Map<String, Double> m = new HashMap<>();
        if (s == null || s.isBlank()) return m;
        // Values may be stored JSON-ish ({"startX":..}) or plain (startX:..). Strip backslashes, braces,
        // quotes and spaces so the key:value split works for both forms (mirrors the desktop parser).
        String cleaned = s.replace("\\", "").replace("{", "").replace("}", "").replace("\"", "").replace(" ", "");
        for (String part : cleaned.split(",")) {
            int i = part.indexOf(':');
            if (i <= 0) continue;
            String k = part.substring(0, i).trim().toLowerCase();
            try {
                m.put(k, Double.parseDouble(part.substring(i + 1).trim()));
            } catch (NumberFormatException ignore) {
                // skip malformed segment
            }
        }
        return m;
    }

    /** Uploads root on disk: absolute files.root.path as-is, else resolved under project.root when set. */
    private Path uploadsPath() {
        Path filesPath = Paths.get(filesRootPath);
        if (filesPath.isAbsolute()) return filesPath;
        if (projectRootPath != null && !projectRootPath.isEmpty()) return Paths.get(projectRootPath, filesRootPath);
        return filesPath;
    }
}
