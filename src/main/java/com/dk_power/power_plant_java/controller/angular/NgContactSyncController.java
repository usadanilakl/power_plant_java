package com.dk_power.power_plant_java.controller.angular;

import com.dk_power.power_plant_java.dto.users.ContactsImportRequest;
import com.dk_power.power_plant_java.sevice.users.ContactSyncService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/ng/contacts")
@RequiredArgsConstructor
@Slf4j
public class NgContactSyncController {

    private final ContactSyncService contactSyncService;

    @PostMapping("/sync")
    public ResponseEntity<NgApiResponse<ContactSyncService.ImportReport>> sync(
            @RequestBody ContactsImportRequest request) {
        try {
            ContactSyncService.ImportReport report = contactSyncService.importContacts(request);
            return ResponseEntity.ok(new NgApiResponse<>(report, "Contacts imported"));
        } catch (Exception e) {
            log.error("[Contacts] Import failed", e);
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, e.getMessage()));
        }
    }
}
