package com.dk_power.power_plant_java.controller.sync;

import com.dk_power.power_plant_java.config.SyncConfig;
import com.dk_power.power_plant_java.sevice.users.ContractorDirectoryService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.LinkedHashMap;
import java.util.Map;

/**
 * Contractor directory for DESKTOPS, over the LAN.
 *
 * <p>Deliberately alongside {@code /api/sync/**} in the LAN-only matcher rather than behind a token.
 * Desktops already reach the hub this way for sync with no credential — the gate is
 * {@code NetworkUtils.isInternalRequest}, which rejects anything carrying reverse-proxy headers, so
 * external traffic can never look internal. Reusing it means a desktop needs no OnLocation key and
 * no hub service account to show the directory.
 *
 * <p>Hub-only: a desktop asking another desktop would get an empty answer, so say so plainly instead.
 */
@RestController
@RequestMapping("/api/contractors")
@RequiredArgsConstructor
@Slf4j
public class LanContractorDirectoryController {

    private final ContractorDirectoryService directoryService;
    private final SyncConfig syncConfig;

    @GetMapping("/directory")
    public ResponseEntity<Map<String, Object>> directory() {
        if (!syncConfig.isHubMode()) {
            // Only the hub polls OnLocation; a desktop has nothing of its own to serve.
            return ResponseEntity.status(409).body(Map.of("error", "NOT_HUB",
                    "message", "This instance is not the hub and holds no contractor directory"));
        }
        ContractorDirectoryService.Directory dir = directoryService.get();
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("fetchedAt", dir.fetchedAt() == null ? null : dir.fetchedAt().toString());
        body.put("source", dir.source().name());
        body.put("contractors", dir.contractors());
        return ResponseEntity.ok(body);
    }
}
