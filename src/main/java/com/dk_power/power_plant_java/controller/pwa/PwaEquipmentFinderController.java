package com.dk_power.power_plant_java.controller.pwa;

import com.dk_power.power_plant_java.controller.angular.NgApiResponse;
import com.dk_power.power_plant_java.dto.pwa.finder.FinderRequestDto;
import com.dk_power.power_plant_java.dto.pwa.finder.FinderResultDto;
import com.dk_power.power_plant_java.sevice.pwa.PwaEquipmentFinderService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * Equipment Finder — find a LOTO point or a piece of equipment by what you can remember about it,
 * then open its P&amp;ID.
 *
 * <p>POST rather than GET: five independent word-bucket filters, each with its own AND/OR mode, do not
 * fit a query string without inventing an encoding, and the body is a plain record either way. It is a
 * read-only search; nothing here writes.</p>
 *
 * <p>Plant data, so ROLE_PLANT/ROLE_ADMIN via SecurityConfig — the same bar as the QR resolver whose
 * {@code /item/{type}/{id}} endpoint serves the drawings behind a tapped row.</p>
 */
@RestController
@RequestMapping("/api/pwa/secured/equipment-finder")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin(originPatterns = {"https://dk-power.github.io", "https://jacksongeneration.github.io", "http://localhost:*", "http://127.0.0.1:*"}, allowCredentials = "true")
public class PwaEquipmentFinderController {

    private final PwaEquipmentFinderService finderService;

    /** Run the filters. A request with no usable words comes back empty rather than dumping the plant. */
    @PostMapping("/search")
    public ResponseEntity<NgApiResponse<FinderResultDto>> search(@RequestBody FinderRequestDto request) {
        try {
            FinderResultDto result = finderService.search(request);
            return ResponseEntity.ok(new NgApiResponse<>(result, result.items().size() + " item(s)"));
        } catch (Exception e) {
            log.error("[PWA-FINDER] Search failed: {}", e.getMessage(), e);
            return ResponseEntity.badRequest()
                    .body(new NgApiResponse<>(new FinderResultDto(List.of(), 0, 0, false), "Search failed: " + e.getMessage()));
        }
    }
}
