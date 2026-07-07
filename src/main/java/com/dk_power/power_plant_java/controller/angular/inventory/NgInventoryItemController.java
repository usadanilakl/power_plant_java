package com.dk_power.power_plant_java.controller.angular.inventory;

import com.dk_power.power_plant_java.controller.angular.NgApiResponse;
import com.dk_power.power_plant_java.dto.inventory.InventoryItemDto;
import com.dk_power.power_plant_java.dto.inventory.InventoryUsageDto;
import com.dk_power.power_plant_java.entities.permits.PermitAttachment;
import com.dk_power.power_plant_java.repository.permits.PermitAttachmentRepo;
import com.dk_power.power_plant_java.sevice.angular.inventory.NgInventoryItemService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequiredArgsConstructor
@RequestMapping("/ng/inventory-items")
@Slf4j
public class NgInventoryItemController {

    private final NgInventoryItemService service;
    private final PermitAttachmentRepo attachmentRepo;

    @GetMapping("/get-all")
    public ResponseEntity<NgApiResponse<List<InventoryItemDto>>> getAll() {
        try {
            return ResponseEntity.ok(new NgApiResponse<>(service.getAll(), "Successfully retrieved all inventory items"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, "Failed: " + e.getMessage()));
        }
    }

    @GetMapping("/by-type/{type}")
    public ResponseEntity<NgApiResponse<List<InventoryItemDto>>> getByType(@PathVariable String type) {
        try {
            return ResponseEntity.ok(new NgApiResponse<>(service.getByItemType(type), "Retrieved items for type: " + type));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, "Failed: " + e.getMessage()));
        }
    }

    @GetMapping("/by-status/{status}")
    public ResponseEntity<NgApiResponse<List<InventoryItemDto>>> getByStatus(@PathVariable String status) {
        try {
            return ResponseEntity.ok(new NgApiResponse<>(service.getByStatus(status), "Retrieved items with status: " + status));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, "Failed: " + e.getMessage()));
        }
    }

    @GetMapping("/audit/checked-out")
    public ResponseEntity<NgApiResponse<List<InventoryItemDto>>> getCheckedOut(
            @RequestParam(required = false) Integer minDaysOut) {
        try {
            return ResponseEntity.ok(new NgApiResponse<>(service.getCheckedOutItems(minDaysOut),
                    "Checked-out items retrieved"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, "Failed: " + e.getMessage()));
        }
    }

    @GetMapping("/audit/missing")
    public ResponseEntity<NgApiResponse<List<InventoryItemDto>>> getMissing() {
        try {
            return ResponseEntity.ok(new NgApiResponse<>(service.getMissingItems(), "Missing items retrieved"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, "Failed: " + e.getMessage()));
        }
    }

    @GetMapping("/get-by-id/{id}")
    public ResponseEntity<NgApiResponse<InventoryItemDto>> getById(@PathVariable Long id) {
        try {
            InventoryItemDto dto = service.getDtoById(id);
            if (dto == null) return ResponseEntity.notFound().build();
            return ResponseEntity.ok(new NgApiResponse<>(dto, "Found"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, "Failed: " + e.getMessage()));
        }
    }

    @GetMapping("/by-qr/{qrToken}")
    public ResponseEntity<NgApiResponse<InventoryItemDto>> getByQrToken(@PathVariable String qrToken) {
        try {
            InventoryItemDto dto = service.getDtoByQrToken(qrToken);
            if (dto == null) return ResponseEntity.notFound().build();
            return ResponseEntity.ok(new NgApiResponse<>(dto, "Found"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, "Failed: " + e.getMessage()));
        }
    }

    @PostMapping
    public ResponseEntity<NgApiResponse<InventoryItemDto>> create(@RequestBody InventoryItemDto dto) {
        try {
            return ResponseEntity.ok(new NgApiResponse<>(service.save(dto), "Inventory item created"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, "Failed: " + e.getMessage()));
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<NgApiResponse<InventoryItemDto>> update(@PathVariable Long id, @RequestBody InventoryItemDto dto) {
        try {
            dto.setId(id);
            return ResponseEntity.ok(new NgApiResponse<>(service.save(dto), "Inventory item updated"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, "Failed: " + e.getMessage()));
        }
    }

    @PostMapping("/{id}/change-status/{status}")
    public ResponseEntity<NgApiResponse<InventoryItemDto>> changeStatus(
            @PathVariable Long id, @PathVariable String status) {
        try {
            return ResponseEntity.ok(new NgApiResponse<>(service.changeStatus(id, status), "Status changed to " + status));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, "Failed: " + e.getMessage()));
        }
    }

    @GetMapping("/{id}/usage")
    public ResponseEntity<NgApiResponse<List<InventoryUsageDto>>> getUsage(@PathVariable Long id) {
        try {
            return ResponseEntity.ok(new NgApiResponse<>(service.getUsageHistory(id), "Usage history retrieved"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, "Failed: " + e.getMessage()));
        }
    }

    @PostMapping("/{id}/usage")
    public ResponseEntity<NgApiResponse<InventoryUsageDto>> recordUsage(
            @PathVariable Long id, @RequestBody Map<String, String> body) {
        try {
            InventoryUsageDto usage = service.recordUsage(id,
                    body.get("userName"), body.get("userEmail"),
                    body.get("location"), body.get("purpose"),
                    body.get("comments"), body.getOrDefault("eventType", "checkout"));
            return ResponseEntity.ok(new NgApiResponse<>(usage, "Usage recorded"));
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

    @GetMapping("/{id}/attachments")
    public ResponseEntity<NgApiResponse<List<PermitAttachment>>> getAttachments(@PathVariable Long id) {
        try {
            return ResponseEntity.ok(new NgApiResponse<>(
                    attachmentRepo.findByEntityTypeAndEntityIdAndDeletedFalse("InventoryItem", id), "Attachments retrieved"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, "Failed: " + e.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<NgApiResponse<Void>> delete(@PathVariable Long id) {
        try {
            service.softDelete(id);
            return ResponseEntity.ok(new NgApiResponse<>(null, "Inventory item deleted"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, "Failed: " + e.getMessage()));
        }
    }
}
