package com.dk_power.power_plant_java.controller.angular;

import com.dk_power.power_plant_java.sevice.users.ContractorDirectoryService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.LinkedHashMap;
import java.util.Map;

/**
 * Contractor directory for the desktop app — read-only.
 *
 * <p>This used to also import contractors into the User table (a desktop push that wrote rows with
 * no review) and run a nightly diff that parked changes for admin approval. Both are gone. The same
 * OnLocation record reaching the User table by two doors, applied instantly through one and gated
 * behind the other, meant the approval gate only guarded whichever door nobody used.
 *
 * <p>Contractors are now reference data, not accounts: OnLocation is pulled into a cache and read.
 * Nothing here writes a User row.
 */
@RestController
@RequestMapping("/ng/contractors")
@RequiredArgsConstructor
@Slf4j
public class NgContractorController {

    private final ContractorDirectoryService contractorDirectoryService;

    /** Cached OnLocation directory — what the desktop reads before falling back to its own pull. */
    @GetMapping("/directory")
    public ResponseEntity<NgApiResponse<Map<String, Object>>> directory() {
        return ResponseEntity.ok(new NgApiResponse<>(toBody(contractorDirectoryService.get()), "Contractor directory"));
    }

    /**
     * Force a pull from OnLocation now rather than waiting for the hourly job. Updates the one shared
     * cache, so a refresh from any client is immediately visible to every other client.
     */
    @PostMapping("/directory/refresh")
    public ResponseEntity<NgApiResponse<Map<String, Object>>> refreshDirectory() {
        return ResponseEntity.ok(new NgApiResponse<>(toBody(contractorDirectoryService.refresh()),
                "Contractor directory refreshed"));
    }

    private Map<String, Object> toBody(ContractorDirectoryService.Directory dir) {
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("fetchedAt", dir.fetchedAt() == null ? null : dir.fetchedAt().toString());
        body.put("source", dir.source().name());
        body.put("contractors", dir.contractors());
        return body;
    }
}
