package com.dk_power.power_plant_java.controller.angular.field_list;

import com.dk_power.power_plant_java.controller.angular.NgApiResponse;
import com.dk_power.power_plant_java.dto.field_list.FieldListItemDto;
import com.dk_power.power_plant_java.entities.permits.PermitAttachment;
import com.dk_power.power_plant_java.repository.permits.PermitAttachmentRepo;
import com.dk_power.power_plant_java.sevice.angular.field_list.NgFieldListItemService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/ng/field-list-items")
@Slf4j
public class NgFieldListItemController {

    private final NgFieldListItemService service;
    private final PermitAttachmentRepo attachmentRepo;

    @GetMapping("/get-all")
    public ResponseEntity<NgApiResponse<List<FieldListItemDto>>> getAll() {
        try {
            List<FieldListItemDto> dtos = service.getAll();
            return ResponseEntity.ok(new NgApiResponse<>(dtos, "Successfully retrieved all field list items"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(
                    new NgApiResponse<>(null, "Failed to get field list items: " + e.getMessage()));
        }
    }

    @GetMapping("/by-list-type/{listType}")
    public ResponseEntity<NgApiResponse<List<FieldListItemDto>>> getByListType(@PathVariable String listType) {
        try {
            List<FieldListItemDto> dtos = service.getByListType(listType);
            return ResponseEntity.ok(new NgApiResponse<>(dtos, "Retrieved items for list type: " + listType));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(
                    new NgApiResponse<>(null, "Failed to get items by list type: " + e.getMessage()));
        }
    }

    @GetMapping("/by-status/{status}")
    public ResponseEntity<NgApiResponse<List<FieldListItemDto>>> getByStatus(@PathVariable String status) {
        try {
            List<FieldListItemDto> dtos = service.getByStatus(status);
            return ResponseEntity.ok(new NgApiResponse<>(dtos, "Retrieved items with status: " + status));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(
                    new NgApiResponse<>(null, "Failed to get items by status: " + e.getMessage()));
        }
    }

    @GetMapping("/get-by-id/{id}")
    public ResponseEntity<NgApiResponse<FieldListItemDto>> getById(@PathVariable Long id) {
        try {
            FieldListItemDto dto = service.getDtoById(id);
            if (dto == null) {
                return ResponseEntity.notFound().build();
            }
            return ResponseEntity.ok(new NgApiResponse<>(dto, "Found"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(
                    new NgApiResponse<>(null, "Failed to get field list item: " + e.getMessage()));
        }
    }

    @PostMapping
    public ResponseEntity<NgApiResponse<FieldListItemDto>> create(@RequestBody FieldListItemDto dto) {
        try {
            FieldListItemDto saved = service.save(dto);
            return ResponseEntity.ok(new NgApiResponse<>(saved, "Field list item created"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(
                    new NgApiResponse<>(null, "Failed to create field list item: " + e.getMessage()));
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<NgApiResponse<FieldListItemDto>> update(@PathVariable Long id, @RequestBody FieldListItemDto dto) {
        try {
            dto.setId(id);
            FieldListItemDto saved = service.save(dto);
            return ResponseEntity.ok(new NgApiResponse<>(saved, "Field list item updated"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(
                    new NgApiResponse<>(null, "Failed to update field list item: " + e.getMessage()));
        }
    }

    @GetMapping("/{id}/attachments")
    public ResponseEntity<NgApiResponse<List<PermitAttachment>>> getAttachments(@PathVariable Long id) {
        try {
            List<PermitAttachment> attachments = attachmentRepo.findByEntityTypeAndEntityId("FieldListItem", id);
            return ResponseEntity.ok(new NgApiResponse<>(attachments, "Attachments retrieved"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(
                    new NgApiResponse<>(null, "Failed to get attachments: " + e.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<NgApiResponse<Void>> delete(@PathVariable Long id) {
        try {
            service.softDelete(id);
            return ResponseEntity.ok(new NgApiResponse<>(null, "Field list item deleted"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(
                    new NgApiResponse<>(null, "Failed to delete field list item: " + e.getMessage()));
        }
    }
}
