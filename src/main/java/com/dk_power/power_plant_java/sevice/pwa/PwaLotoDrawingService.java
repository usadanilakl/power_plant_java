package com.dk_power.power_plant_java.sevice.pwa;

import com.dk_power.power_plant_java.dto.permits.loto_standard.PointDrawingDto;
import com.dk_power.power_plant_java.entities.equipment.Equipment;
import com.dk_power.power_plant_java.entities.equipment.Highlight;
import com.dk_power.power_plant_java.entities.files.FileObject;
import com.dk_power.power_plant_java.entities.loto.LotoPoint;
import com.dk_power.power_plant_java.entities.loto.LotoStandard;
import com.dk_power.power_plant_java.repository.file.FileRepo;
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
import java.util.List;

/**
 * Resolves, per LOTO point, which drawing(s) show it and where (the highlight rectangle), and streams the
 * drawing bytes — for the mobile "pull up the P&amp;ID with this point circled" viewer.
 *
 * <p>Point → {@code equipmentList} → each Equipment's {@code mainFile} (the drawing) + {@code highlight} (the
 * rectangle, per-file). Bytes are served from the JPG derivative on disk (drawings render as JPG). Everything
 * here is read-only; the mobile client caches the descriptors + image blobs for offline field use.</p>
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class PwaLotoDrawingService {

    private final LotoStandardRepo standardRepo;
    private final FileRepo fileRepo;

    @Value("${files.root.path:uploads}")
    private String filesRootPath;

    @Value("${project.root:}")
    private String projectRootPath;

    /** Every point→drawing descriptor for a standard (a point may appear more than once if on several drawings). */
    @Transactional(readOnly = true)
    public List<PointDrawingDto> drawingsForStandard(Long standardId) {
        LotoStandard s = standardRepo.findById(standardId)
                .orElseThrow(() -> new IllegalArgumentException("LOTO standard not found: " + standardId));
        List<PointDrawingDto> out = new ArrayList<>();
        for (LotoPoint p : s.getLotoPoints()) {
            if (p.getEquipmentList() == null) continue;
            for (Equipment eq : p.getEquipmentList()) {
                FileObject file = eq.getMainFile();
                Highlight h = eq.getHighlight();
                if (file == null || file.getId() == null || h == null) continue;
                double[] rect = rect(h);
                double[] dims = dims(h);
                if (rect == null || dims == null) continue;
                out.add(new PointDrawingDto(p.getId(), file.getId(), file.getName(),
                        dims[0], dims[1], rect[0], rect[1], rect[2], rect[3]));
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

    // ── Coordinate/size resolution (parse the string forms if the Double columns aren't populated) ──

    private double[] rect(Highlight h) {
        try {
            if (h.getStartX() == null && h.getCoordinates() != null) h.buildCoordinates();
            if (h.getStartX() == null || h.getStartY() == null || h.getWidth() == null || h.getHeight() == null) return null;
            return new double[]{h.getStartX(), h.getStartY(), h.getWidth(), h.getHeight()};
        } catch (Exception e) {
            return null;
        }
    }

    private double[] dims(Highlight h) {
        try {
            if (h.getPictureWidth() == null && h.getOriginalPictureSize() != null) h.buildPictureSize();
            if (h.getPictureWidth() == null || h.getPictureHeight() == null) return null;
            return new double[]{h.getPictureWidth(), h.getPictureHeight()};
        } catch (Exception e) {
            return null;
        }
    }

    /** Uploads root on disk: absolute files.root.path as-is, else resolved under project.root when set. */
    private Path uploadsPath() {
        Path filesPath = Paths.get(filesRootPath);
        if (filesPath.isAbsolute()) return filesPath;
        if (projectRootPath != null && !projectRootPath.isEmpty()) return Paths.get(projectRootPath, filesRootPath);
        return filesPath;
    }
}
