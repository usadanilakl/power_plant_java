package com.dk_power.power_plant_java.controller.pwa;

import com.dk_power.power_plant_java.controller.angular.NgApiResponse;
import com.dk_power.power_plant_java.dto.pwa.qr.QrFileInfoDto;
import com.dk_power.power_plant_java.dto.pwa.qr.QrTagResultDto;
import com.dk_power.power_plant_java.sevice.pwa.PwaQrService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * Mobile (PWA) side of the LOTO QR label flow.
 *
 * <p>A scanned label points at the hub ({@code /qr/{tag}}), which is public and merely redirects into the
 * PWA — the gate is here. Lives under {@code /api/pwa/secured/**} so PwaJwtAuthFilter authenticates it,
 * plus an explicit ROLE_PLANT/ROLE_ADMIN rule in SecurityConfig (P&amp;IDs are plant data, same bar as the
 * LOTO endpoints next door). A signed-in contractor therefore gets a clean 403 the page can explain,
 * rather than drawings.</p>
 *
 * <p>Drawing <b>bytes</b> are not served here: the viewer already fetches and caches them through
 * {@code /api/pwa/secured/loto-standards/files/{fileId}/image}, which is gated to the same roles.</p>
 */
@RestController
@RequestMapping("/api/pwa/secured/qr")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin(originPatterns = {"https://dk-power.github.io", "https://jacksongeneration.github.io", "http://localhost:*", "http://127.0.0.1:*"}, allowCredentials = "true")
public class PwaQrController {

    private final PwaQrService qrService;

    /**
     * Resolve a scanned tag to its LOTO point(s) — or, when the tag has no LOTO point, its equipment —
     * each with every drawing it appears on.
     *
     * <p>An unknown tag returns 200 with an empty match list on purpose: it is a legitimate answer
     * ("this label is not in the system"), it is cacheable for offline re-scans, and it keeps the client
     * from having to treat a 404 body as data.</p>
     */
    @GetMapping("/tag/{tagNumber}")
    public ResponseEntity<NgApiResponse<QrTagResultDto>> resolveTag(@PathVariable String tagNumber) {
        try {
            QrTagResultDto result = qrService.resolveTag(tagNumber);
            return ResponseEntity.ok(new NgApiResponse<>(result, result.matches().size() + " match(es)"));
        } catch (Exception e) {
            log.error("[PWA-QR] Tag lookup failed: tagNumber={}, error={}", tagNumber, e.getMessage(), e);
            return ResponseEntity.badRequest()
                    .body(new NgApiResponse<>(new QrTagResultDto(tagNumber, List.of()), "Lookup failed: " + e.getMessage()));
        }
    }

    /** One drawing plus its off-page references — the payload behind tapping a connector to change drawing. */
    @GetMapping("/file/{fileId}")
    public ResponseEntity<NgApiResponse<QrFileInfoDto>> fileInfo(@PathVariable Long fileId) {
        try {
            QrFileInfoDto info = qrService.fileInfo(fileId);
            if (info == null) return ResponseEntity.notFound().build();
            return ResponseEntity.ok(new NgApiResponse<>(info, info.connectors().size() + " connector(s)"));
        } catch (Exception e) {
            log.error("[PWA-QR] File info failed: fileId={}, error={}", fileId, e.getMessage(), e);
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, "Failed: " + e.getMessage()));
        }
    }
}
