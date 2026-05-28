package com.dk_power.power_plant_java.controller.angular.sds;

import com.dk_power.power_plant_java.controller.angular.NgApiResponse;
import com.dk_power.power_plant_java.dto.sds.SdsChemicalDto;
import com.dk_power.power_plant_java.entities.permits.PermitAttachment;
import com.dk_power.power_plant_java.mappers.sds.SdsChemicalMapper;
import com.dk_power.power_plant_java.repository.permits.PermitAttachmentRepo;
import com.dk_power.power_plant_java.sevice.angular.sds.NgSdsChemicalService;
import com.dk_power.power_plant_java.sevice.angular.sds.SdsAddressService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequiredArgsConstructor
@RequestMapping("/ng/sds-chemicals")
@Slf4j
public class NgSdsChemicalController {

    private final NgSdsChemicalService service;
    private final SdsAddressService addressService;
    private final PermitAttachmentRepo attachmentRepo;

    /** Suggested filing address (latest book, next section) for a new chemical; user approves/edits. */
    @GetMapping("/suggest-address")
    public ResponseEntity<NgApiResponse<Map<String, Integer>>> suggestAddress() {
        try {
            SdsAddressService.Address a = addressService.suggestNextAddress();
            return ResponseEntity.ok(new NgApiResponse<>(
                    Map.of("bookNumber", a.bookNumber(), "sectionNumber", a.sectionNumber()), "Suggested address"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, "Failed: " + e.getMessage()));
        }
    }

    /** Admin bulk dump: one Incoming chemical per uploaded PDF (no metadata yet). */
    @PostMapping("/dump")
    public ResponseEntity<NgApiResponse<Integer>> dumpIncoming(@RequestBody List<Map<String, String>> files) {
        try {
            int created = service.dumpIncoming(files);
            return ResponseEntity.ok(new NgApiResponse<>(created, created + " incoming SDS document(s) created"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, "Failed: " + e.getMessage()));
        }
    }

    @GetMapping("/get-all")
    public ResponseEntity<NgApiResponse<List<SdsChemicalDto>>> getAll() {
        try {
            return ResponseEntity.ok(new NgApiResponse<>(service.getAll(), "Successfully retrieved all SDS chemicals"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, "Failed: " + e.getMessage()));
        }
    }

    @GetMapping("/active")
    public ResponseEntity<NgApiResponse<List<SdsChemicalDto>>> getActive() {
        try {
            return ResponseEntity.ok(new NgApiResponse<>(service.getActive(), "Active SDS chemicals retrieved"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, "Failed: " + e.getMessage()));
        }
    }

    @GetMapping("/by-status/{status}")
    public ResponseEntity<NgApiResponse<List<SdsChemicalDto>>> getByStatus(@PathVariable String status) {
        try {
            return ResponseEntity.ok(new NgApiResponse<>(service.getByStatus(status), "Retrieved chemicals with status: " + status));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, "Failed: " + e.getMessage()));
        }
    }

    @GetMapping("/unprocessed")
    public ResponseEntity<NgApiResponse<List<SdsChemicalDto>>> getUnprocessed() {
        try {
            return ResponseEntity.ok(new NgApiResponse<>(service.getUnprocessed(), "Unprocessed SDS chemicals retrieved"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, "Failed: " + e.getMessage()));
        }
    }

    @GetMapping("/get-by-id/{id}")
    public ResponseEntity<NgApiResponse<SdsChemicalDto>> getById(@PathVariable Long id) {
        try {
            SdsChemicalDto dto = service.getDtoById(id);
            if (dto == null) return ResponseEntity.notFound().build();
            return ResponseEntity.ok(new NgApiResponse<>(dto, "Found"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, "Failed: " + e.getMessage()));
        }
    }

    @PostMapping
    public ResponseEntity<NgApiResponse<SdsChemicalDto>> create(@RequestBody SdsChemicalDto dto) {
        try {
            return ResponseEntity.ok(new NgApiResponse<>(service.save(dto), "SDS chemical created"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, "Failed: " + e.getMessage()));
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<NgApiResponse<SdsChemicalDto>> update(@PathVariable Long id, @RequestBody SdsChemicalDto dto) {
        try {
            dto.setId(id);
            return ResponseEntity.ok(new NgApiResponse<>(service.save(dto), "SDS chemical updated"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, "Failed: " + e.getMessage()));
        }
    }

    @PostMapping("/{id}/change-status/{status}")
    public ResponseEntity<NgApiResponse<SdsChemicalDto>> changeStatus(
            @PathVariable Long id, @PathVariable String status) {
        try {
            return ResponseEntity.ok(new NgApiResponse<>(service.changeStatus(id, status), "Status changed to " + status));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, "Failed: " + e.getMessage()));
        }
    }

    @GetMapping("/{id}/attachments")
    public ResponseEntity<NgApiResponse<List<PermitAttachment>>> getAttachments(@PathVariable Long id) {
        try {
            return ResponseEntity.ok(new NgApiResponse<>(
                    attachmentRepo.findByEntityTypeAndEntityId(SdsChemicalMapper.ENTITY_TYPE, id), "Attachments retrieved"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, "Failed: " + e.getMessage()));
        }
    }

    @PostMapping("/{id}/attachments")
    public ResponseEntity<NgApiResponse<PermitAttachment>> uploadAttachment(
            @PathVariable Long id, @RequestBody Map<String, String> body) {
        try {
            PermitAttachment att = service.uploadAttachment(id,
                    body.get("fileName"), body.get("contentType"), body.get("base64Content"));
            return ResponseEntity.ok(new NgApiResponse<>(att, "Attachment uploaded"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, "Failed: " + e.getMessage()));
        }
    }

    @DeleteMapping("/{id}/attachments/{attachmentId}")
    public ResponseEntity<NgApiResponse<Void>> deleteAttachment(
            @PathVariable Long id, @PathVariable Long attachmentId) {
        try {
            service.deleteAttachment(id, attachmentId);
            return ResponseEntity.ok(new NgApiResponse<>(null, "Attachment deleted"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, "Failed: " + e.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<NgApiResponse<Void>> delete(@PathVariable Long id) {
        try {
            service.softDelete(id);
            return ResponseEntity.ok(new NgApiResponse<>(null, "SDS chemical deleted"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, "Failed: " + e.getMessage()));
        }
    }
}
