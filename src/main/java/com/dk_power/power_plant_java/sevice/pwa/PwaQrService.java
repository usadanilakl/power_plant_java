package com.dk_power.power_plant_java.sevice.pwa;

import com.dk_power.power_plant_java.dto.permits.loto_standard.PointDrawingDto;
import com.dk_power.power_plant_java.dto.pwa.qr.QrFileInfoDto;
import com.dk_power.power_plant_java.dto.pwa.qr.QrMatchDto;
import com.dk_power.power_plant_java.dto.pwa.qr.QrTagResultDto;
import com.dk_power.power_plant_java.entities.equipment.Equipment;
import com.dk_power.power_plant_java.entities.files.FileObject;
import com.dk_power.power_plant_java.entities.loto.LotoPoint;
import com.dk_power.power_plant_java.repository.equipment.EquipmentRepo;
import com.dk_power.power_plant_java.repository.file.FileRepo;
import com.dk_power.power_plant_java.repository.loto.LotoPointRepo;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;

/**
 * Resolves a scanned QR tag for the mobile viewer.
 *
 * <p>Entry point for the label flow: a printed/engraved LOTO label encodes
 * {@code https://<hub>/qr/{tag}}, the hub redirects that to the PWA (see {@code QrTrafficController}),
 * and the PWA calls here for the drawings behind the tag. The desktop resolver
 * ({@code NgQrController}) is left untouched and still serves the hub-hosted viewer.</p>
 *
 * <p><b>LOTO points first, equipment as a fallback.</b> Most tags exist as both a LotoPoint and an
 * Equipment row, and a LotoPoint resolves its drawings through exactly those Equipment rows — so
 * returning both would show the operator two choices that open the same drawings. Equipment matches
 * are therefore only produced when no LOTO point carries the tag (labels printed for equipment that
 * was never turned into a LOTO point).</p>
 *
 * <p>Unlike the desktop resolver, which picks the <i>first</i> equipment with a drawing, every
 * occurrence is returned: a point that appears on three P&amp;IDs gets three drawings, one tab each.</p>
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class PwaQrService {

    private final LotoPointRepo lotoPointRepo;
    private final EquipmentRepo equipmentRepo;
    private final FileRepo fileRepo;
    private final PwaLotoDrawingService drawingService;

    /**
     * Everything the scanned tag resolves to. An unknown tag is a normal empty result, not an error —
     * the client shows a "nothing found" card and can cache that answer for a re-scan while offline.
     */
    @Transactional(readOnly = true)
    public QrTagResultDto resolveTag(String tagNumber) {
        List<QrMatchDto> matches = new ArrayList<>();

        List<LotoPoint> points = lotoPointRepo.findAllActiveByTagNumberIgnoreCase(tagNumber);
        for (LotoPoint p : points) {
            List<PointDrawingDto> drawings = drawingService.drawingsForPoints(List.of(p.getId()));
            matches.add(new QrMatchDto("lotoPoint", p.getId(), p.getTagNumber(), p.getDescription(), drawings));
        }

        int equipmentCount = 0;
        if (matches.isEmpty()) {
            List<Equipment> equipment = equipmentRepo.findAllActiveByTagNumberIgnoreCase(tagNumber);
            equipmentCount = equipment.size();
            for (Equipment eq : equipment) {
                List<PointDrawingDto> drawings = drawingService.descriptorsFor(eq.getId(), List.of(eq));
                matches.add(new QrMatchDto("equipment", eq.getId(), eq.getTagNumber(), eq.getDescription(), drawings));
            }
        }

        log.info("[PWA-QR] Tag lookup: tagNumber={}, lotoPoints={}, equipmentFallback={}",
                tagNumber, points.size(), equipmentCount);
        return new QrTagResultDto(tagNumber, matches);
    }

    /**
     * The drawings for one specific item, addressed the way the Equipment Finder holds it: by type and
     * id rather than by tag.
     *
     * <p>Deliberately NOT a tag lookup. A finder row can be an equipment whose tag ALSO belongs to a
     * LOTO point, and {@link #resolveTag} would answer with the point — opening something other than
     * what the operator tapped. Same {@link QrMatchDto} shape either way, so the client hosts the
     * result in the same viewer.</p>
     *
     * @return null when the id does not resolve (deleted or wrong type), for a clean 404.
     */
    @Transactional(readOnly = true)
    public QrMatchDto resolveItem(String type, Long id) {
        if ("equipment".equalsIgnoreCase(type)) {
            Equipment eq = equipmentRepo.findById(id).orElse(null);
            if (eq == null) return null;
            return new QrMatchDto("equipment", eq.getId(), eq.getTagNumber(), eq.getDescription(),
                    drawingService.descriptorsFor(eq.getId(), List.of(eq)));
        }
        LotoPoint p = lotoPointRepo.findById(id).orElse(null);
        if (p == null) return null;
        return new QrMatchDto("lotoPoint", p.getId(), p.getTagNumber(), p.getDescription(),
                drawingService.drawingsForPoints(List.of(p.getId())));
    }

    /**
     * A drawing plus the off-page references drawn on it. Used both when the viewer opens a file the tag
     * landed on and when the operator taps a connector to hop to the drawing it points at, so
     * drawing-to-drawing navigation needs nothing else.
     */
    @Transactional(readOnly = true)
    public QrFileInfoDto fileInfo(Long fileId) {
        FileObject file = fileRepo.findById(fileId).orElse(null);
        if (file == null) return null;
        return new QrFileInfoDto(file.getId(), file.getName(), file.getFileNumber(),
                drawingService.connectorsForFile(fileId));
    }
}
