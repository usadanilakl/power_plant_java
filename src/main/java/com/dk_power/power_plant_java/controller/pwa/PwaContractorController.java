package com.dk_power.power_plant_java.controller.pwa;

import com.dk_power.power_plant_java.dto.users.ContractorDto;
import com.dk_power.power_plant_java.sevice.users.ContractorDirectoryService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Contractor lookup for plant personnel: contacts and orientation dates.
 *
 * <p>Gated to the plant-affiliated groups in SecurityConfigSpring, alongside schedule and contacts —
 * this is contractor personal data, not a public directory.
 *
 * <p>The response always carries {@code fetchedAt} and {@code source} so the client can say how old
 * the answer is. A lookup that silently shows week-old orientation dates is worse than one that
 * admits it: the whole point is deciding whether someone is currently cleared to work.
 */
@RestController
@RequestMapping("/api/pwa/secured/contractors")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin(originPatterns = {"https://dk-power.github.io", "https://jacksongeneration.github.io", "http://localhost:*", "http://127.0.0.1:*"}, allowCredentials = "true")
public class PwaContractorController {

    private final ContractorDirectoryService directoryService;

    /** @param q optional filter on name / company / email / title. */
    @GetMapping
    public ResponseEntity<Map<String, Object>> list(@RequestParam(required = false) String q) {
        ContractorDirectoryService.Directory directory = directoryService.get();
        List<ContractorDto> rows = directoryService.search(q);

        Map<String, Object> body = new LinkedHashMap<>();
        body.put("fetchedAt", directory.fetchedAt() == null ? null : directory.fetchedAt().toString());
        body.put("source", directory.source().name());
        body.put("total", directory.contractors().size());
        body.put("contractors", rows);
        return ResponseEntity.ok(body);
    }
}
