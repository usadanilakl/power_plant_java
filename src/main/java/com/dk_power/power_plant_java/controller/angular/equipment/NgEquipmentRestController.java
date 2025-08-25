
package com.dk_power.power_plant_java.controller.angular.equipment;

import com.dk_power.power_plant_java.controller.angular.NgApiResponse;
import com.dk_power.power_plant_java.dto.SearchCriteria;
import com.dk_power.power_plant_java.dto.equipment.EquipmentDto;
import com.dk_power.power_plant_java.dto.equipment.EquipmentIdDto;
import com.dk_power.power_plant_java.dto.files.FileDto;
import com.dk_power.power_plant_java.entities.equipment.Equipment;
import com.dk_power.power_plant_java.entities.files.FileObject;
import com.dk_power.power_plant_java.sevice.angular.NgEquipmentService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/ng/equipment")
@RequiredArgsConstructor
public class NgEquipmentRestController {
    private final NgEquipmentService ngEquipmentService;

    @GetMapping("/paginated")
    public ResponseEntity<NgApiResponse<Page<EquipmentDto>>> getPaginatedEquipment(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "50") int pageSize) {
        try {
            Page<EquipmentDto> paginatedEquipment = ngEquipmentService.findAllWithProjectionPaginated(
                    new ArrayList<>(Arrays.asList("id", "tagNumber", "description", "specificLocation", "eqType.id", "eqType.name", "vendor.name", "vendor.id")),
                    PageRequest.of(page - 1, pageSize)).map(ngEquipmentService::toDto);
            NgApiResponse<Page<EquipmentDto>> response = new NgApiResponse<>(paginatedEquipment, "Equipment retrieved successfully");
            return ResponseEntity.ok().contentType(MediaType.APPLICATION_JSON).body(response);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, e.getMessage()));
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<NgApiResponse<EquipmentDto>> getEquipmentById(@PathVariable Long id) {
        try {
            EquipmentDto equipmentDto = ngEquipmentService.toDto(ngEquipmentService.findById(id).orElse(null));
            if (equipmentDto == null) {
                return ResponseEntity.notFound().build();
            }
            NgApiResponse<EquipmentDto> response = new NgApiResponse<>(equipmentDto, "Equipment retrieved successfully");
            return ResponseEntity.ok().contentType(MediaType.APPLICATION_JSON).body(response);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, e.getMessage()));
        }
    }

    @PostMapping("/search")
    public ResponseEntity<NgApiResponse<Page<EquipmentDto>>> searchEquipment(
            @RequestBody SearchCriteria criteria,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "50") int pageSize) {
        try {
            Page<EquipmentDto> searchResults = null;
            if (criteria.getType().equals(SearchCriteria.SearchType.COLUMN)) {
                searchResults = ngEquipmentService.complexSearch(criteria, page - 1, pageSize, "tagNumber", "asc", true);
            } else if (SearchCriteria.SearchType.GLOBAL.equals(criteria.getType()) && criteria.getQuery() != null && !criteria.getQuery().isEmpty()) {
                searchResults = ngEquipmentService.complexSearch(criteria.getQuery(), page - 1, pageSize);
            }
            NgApiResponse<Page<EquipmentDto>> response = new NgApiResponse<>(searchResults, "Search completed successfully");
            return ResponseEntity.ok().contentType(MediaType.APPLICATION_JSON).body(response);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, e.getMessage()));
        }
    }

    @PutMapping
    public ResponseEntity<NgApiResponse<EquipmentDto>> updateEquipment(@RequestBody EquipmentIdDto equipmentDto) {
        try {
            Equipment eqEntity = ngEquipmentService.processEquipment(equipmentDto);
            EquipmentDto updatedEquipment = ngEquipmentService.toDto(eqEntity);
            FileObject fileObject = eqEntity.getMainFile();
            fileObject.getPoints().forEach(p -> {
                System.out.println(p.getTagNumber());
            });
            return ResponseEntity.ok(new NgApiResponse<>(updatedEquipment, "Equipment updated successfully"));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, "Error updating equipment: " + e.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<NgApiResponse<Void>> deleteEquipment(@PathVariable Long id) {
        try {
            ngEquipmentService.softDelete(id);
            return ResponseEntity.ok(new NgApiResponse<>(null, "Equipment deleted successfully"));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, "Error deleting equipment: " + e.getMessage()));
        }
    }

    @GetMapping("/by-type/{equipmentType}")
    public ResponseEntity<NgApiResponse<List<EquipmentDto>>> getByEquipmentType(@PathVariable String equipmentType) {
        try {
            List<EquipmentDto> equipment = ngEquipmentService.getByEquipmentType(equipmentType);
            return ResponseEntity.ok(new NgApiResponse<>(equipment, "Equipment retrieved successfully"));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, "Error retrieving equipment: " + e.getMessage()));
        }
    }

    @PostMapping("/search-by-base-tag-number")
    public ResponseEntity<NgApiResponse<Page<EquipmentDto>>> searchByBaseTagNumber(
            @RequestBody SearchCriteria criteria,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "50") int pageSize) {
        try {
            if (!SearchCriteria.SearchType.GLOBAL.equals(criteria.getType())) {
                throw new IllegalArgumentException("Invalid search type. Only global search is supported for base tag number.");
            }
            if (criteria.getQuery() == null || criteria.getQuery().isEmpty()) {
                throw new IllegalArgumentException("Base tag number is required for global search.");
            }
            String baseTagNumber = NgEquipmentService.getTagNumberBase(criteria.getQuery());
            if (baseTagNumber == null || baseTagNumber.isEmpty()) {
                throw new IllegalArgumentException("Base tag number not found.");
            }
            Page<EquipmentDto> searchResults = ngEquipmentService.complexSearch(criteria.getQuery(), page - 1, pageSize);

            NgApiResponse<Page<EquipmentDto>> response = new NgApiResponse<>(searchResults, "Search completed successfully");
            return ResponseEntity.ok().contentType(MediaType.APPLICATION_JSON).body(response);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, e.getMessage()));
        }
    }

    @PostMapping("/copy")
    public ResponseEntity<NgApiResponse<EquipmentDto>> copyEquipment(@RequestBody Map<String, Object> requestBody) {
        try {
            Long eqId = Long.parseLong(requestBody.get("eqId").toString());
            Long fileId = Long.parseLong(requestBody.get("fileId").toString());

            EquipmentDto copiedEquipment = ngEquipmentService.copyEquipment(eqId, fileId);
            return ResponseEntity.ok(new NgApiResponse<>(copiedEquipment, "Equipment copied successfully"));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, "Error copying equipment: " + e.getMessage()));
        }
    }

    @PostMapping("/get-other-unit-equipment")
    public ResponseEntity<NgApiResponse<EquipmentDto>> getOtherUnitEquipment(@RequestBody Map<String, String> requestBody) {
        try {
            String tagNumber = requestBody.get("tagNumber");
            String baseTagNumber = tagNumber.substring(2);
            String unit = tagNumber.trim().substring(0, 2);
            String otherUnitTagNumber = unit.equals("01") ? "02" : unit.equals("02") ? "01" : "00";
            System.out.println("Other unit tag number: " + otherUnitTagNumber + baseTagNumber);

            List<EquipmentDto> byTagNumber = ngEquipmentService.getByTagNumber(otherUnitTagNumber + baseTagNumber);
            if (byTagNumber.isEmpty()) throw new IllegalArgumentException("Other unit equipment not found.");
            return ResponseEntity.ok(new NgApiResponse<>(byTagNumber.get(0), "Other unit equipment retrieved successfully"));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, "Error retrieving other unit equipment: " + e.getMessage()));
        }
    }

    @GetMapping("/{id}/related-files")
    public ResponseEntity<NgApiResponse<List<FileDto>>> getRelatedFiles(@PathVariable Long id) {
        try {
            List<FileDto> relatedFiles = ngEquipmentService.getRelatedFiles(id);
            return ResponseEntity.ok(new NgApiResponse<>(relatedFiles, "Related files retrieved successfully"));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, "Error retrieving related files: " + e.getMessage()));
        }
    }
}