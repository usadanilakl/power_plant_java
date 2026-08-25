package com.dk_power.power_plant_java.sevice.pwa;

import com.dk_power.power_plant_java.dto.files.FileConnectorDto;
import com.dk_power.power_plant_java.dto.permits.loto_standard.PointDrawingDto;
import com.dk_power.power_plant_java.dto.pwa.qr.QrConnectorDto;
import com.dk_power.power_plant_java.entities.equipment.Equipment;
import com.dk_power.power_plant_java.entities.files.FileObject;
import com.dk_power.power_plant_java.entities.loto.LotoPoint;
import com.dk_power.power_plant_java.entities.loto.LotoStandard;
import com.dk_power.power_plant_java.repository.file.FileRepo;
import com.dk_power.power_plant_java.repository.loto.LotoPointRepo;
import com.dk_power.power_plant_java.repository.loto.LotoRepo;
import com.dk_power.power_plant_java.repository.loto.LotoStandardRepo;
import com.dk_power.power_plant_java.sevice.angular.file.NgFileConnectorService;
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
import java.util.Collection;
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
    private final LotoRepo lotoRepo;
    private final LotoPointRepo lotoPointRepo;
    private final FileRepo fileRepo;
    /** Reused rather than re-querying: it already maps connectors and resolves the target file's number. */
    private final NgFileConnectorService connectorService;

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
        return drawingsForPoints(s.getLotoPoints().stream().map(LotoPoint::getId).toList());
    }

    /** Same resolver, for a LOTO permit — its ordered points → drawings. Backs the permit hang/verify/walkdown viewer. */
    @Transactional(readOnly = true)
    public List<PointDrawingDto> drawingsForLoto(Long lotoId) {
        var loto = lotoRepo.findById(lotoId)
                .orElseThrow(() -> new IllegalArgumentException("LOTO permit not found: " + lotoId));
        return drawingsForPoints(loto.getLotoPoints().stream().map(com.dk_power.power_plant_java.dto.permits.loto_point.LotoPointIdDto::getId).toList());
    }

    /** Every point→drawing occurrence for the given point ids (see class doc for the highlight-suppression rule). */
    @Transactional(readOnly = true)
    public List<PointDrawingDto> drawingsForPoints(List<Long> pointIds) {
        List<PointDrawingDto> out = new ArrayList<>();
        for (Long pointId : pointIds) {
            if (pointId == null) continue;
            // Re-fetch with the equipment collection eagerly joined (its mainFile is EAGER) — the same load
            // the desktop uses; walking the lazy collection could otherwise come back empty.
            LotoPoint p = lotoPointRepo.findByIdWithEquipment(pointId);
            if (p == null || p.getEquipmentList() == null) continue;
            out.addAll(descriptorsFor(p.getId(), p.getEquipmentList()));
        }
        return out;
    }

    /**
     * The shared descriptor builder: one entry per Equipment occurrence, stamped with {@code ownerId}.
     *
     * <p>Extracted from {@link #drawingsForPoints} so the QR resolver can reuse it verbatim for an
     * <b>Equipment</b> match — a tag with no LOTO point still has drawings, and they are found exactly the
     * same way (the Equipment IS the occurrence). For that fallback {@code ownerId} is the equipment id;
     * the match's {@code type} tells the client which id space it is in.</p>
     *
     * <p>Highlight-suppression rule (unchanged): per owner, a file that has at least one drawn shape
     * suppresses a duplicate no-highlight entry for the same file.</p>
     */
    @Transactional(readOnly = true)
    public List<PointDrawingDto> descriptorsFor(Long ownerId, Collection<Equipment> equipment) {
        if (equipment == null) return List.of();
        List<PointDrawingDto> withRect = new ArrayList<>();
        Map<Long, PointDrawingDto> noRect = new LinkedHashMap<>();
        Set<Long> filesWithRect = new HashSet<>();
        for (Equipment eq : equipment) {
            FileObject file = eq.getMainFile();
            if (file == null || file.getId() == null) continue;
            double[] rect = parseCoordinates(eq.getCoordinates());
            double[] dims = parsePictureSize(eq.getOriginalPictureSize());
            if (rect != null && dims != null) {
                withRect.add(new PointDrawingDto(ownerId, file.getId(), file.getName(),
                        dims[0], dims[1], rect[0], rect[1], rect[2], rect[3]));
                filesWithRect.add(file.getId());
            } else {
                noRect.putIfAbsent(file.getId(), new PointDrawingDto(ownerId, file.getId(), file.getName(),
                        null, null, null, null, null, null));
            }
        }
        List<PointDrawingDto> out = new ArrayList<>(withRect);
        for (Map.Entry<Long, PointDrawingDto> e : noRect.entrySet()) {
            if (!filesWithRect.contains(e.getKey())) out.add(e.getValue());
        }
        return out;
    }

    /**
     * Off-page references drawn on a file, normalised for the phone viewer.
     *
     * <p>Connectors store their shape with the same {@code coordinates} + {@code originalPictureSize}
     * convention as Equipment (see {@code FileConnector}), so the parsers below apply unchanged. The
     * rectangle is converted to fractions of the drawn-at image size here rather than on the client: the
     * viewer places shapes in percentages, which stays correct even when the served JPG derivative is a
     * different pixel size than the image the shape was drawn on.</p>
     *
     * <p>Rows that never got a usable shape (no coordinates, or no recorded picture size) are dropped —
     * there is nowhere to draw them. Symbol/SVG rendering is deliberately not carried over from the
     * desktop: on a phone, a labelled tap-target is the whole point.</p>
     */
    @Transactional(readOnly = true)
    public List<QrConnectorDto> connectorsForFile(Long fileId) {
        if (fileId == null) return List.of();
        List<QrConnectorDto> out = new ArrayList<>();
        for (FileConnectorDto c : connectorService.findBySourceFile(fileId)) {
            if (c.getTargetFileId() == null) continue; // orphan — nothing to navigate to
            double[] rect = parseCoordinates(c.getCoordinates());
            double[] dims = parsePictureSize(c.getOriginalPictureSize());
            if (rect == null || dims == null) continue;
            out.add(new QrConnectorDto(c.getId(), c.getTargetFileId(), connectorLabel(c),
                    rect[0] / dims[0], rect[1] / dims[1], rect[2] / dims[0], rect[3] / dims[1]));
        }
        return out;
    }

    /**
     * Display text for a connector chip. Mirrors the desktop mapper's fallback chain (explicit label →
     * target file number → target file name → "#id"), resolved here so the client needs no second fetch.
     */
    private String connectorLabel(FileConnectorDto c) {
        if (c.getLabel() != null && !c.getLabel().isBlank()) return c.getLabel();
        if (c.getTargetFileNumber() != null && !c.getTargetFileNumber().isBlank()) return c.getTargetFileNumber();
        if (c.getTargetFileName() != null && !c.getTargetFileName().isBlank()) return c.getTargetFileName();
        return "Drawing #" + c.getTargetFileId();
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
