package com.dk_power.power_plant_java.controller.angular.loto;

import com.dk_power.power_plant_java.controller.angular.NgApiResponse;
import com.dk_power.power_plant_java.dto.SearchCriteria;
import com.dk_power.power_plant_java.dto.permits.LotoPointDto;
import com.dk_power.power_plant_java.dto.permits.LotoPointIdDto;
import com.dk_power.power_plant_java.entities.loto.LotoPoint;
import com.dk_power.power_plant_java.sevice.angular.NgEquipmentService;
import com.dk_power.power_plant_java.sevice.angular.loto.NgLotoPointService;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/ng/loto-points")
@RequiredArgsConstructor
public class NgLotoPointController {
    private final NgLotoPointService ngLotoPointService;

    @GetMapping("/paginated")
    public ResponseEntity<NgApiResponse<Page<LotoPointDto>>> getPaginatedFiles(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "50") int pageSize) {
        try {
//            Page<FileObjectDto> paginatedFiles = fileService.getAll(page - 1, pageSize);
            Page<LotoPointDto> paginatedFiles = ngLotoPointService.findAllWithProjectionPaginated(
                    new ArrayList<>(Arrays.asList("id", "tagNumber", "unit", "description", "specificLocation", "lotos.workScope", "isoPos.name", "isoPos.id", "normPos.name", "normPos.id")),
                    PageRequest.of(page - 1, pageSize)).map(ngLotoPointService::toDto);
            NgApiResponse<Page<LotoPointDto>> response = new NgApiResponse<>(paginatedFiles, "Files retrieved successfully");
            return ResponseEntity.ok().contentType(MediaType.APPLICATION_JSON).body(response);
//            return ResponseEntity.ok(response);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, e.getMessage()));
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<NgApiResponse<LotoPointDto>> getFileById(@PathVariable Long id) {
        try {
            LotoPointDto lotoPointDto = ngLotoPointService.findDtoById(id).orElse(null);
            if (lotoPointDto == null) {
                return ResponseEntity.notFound().build();
            }
            NgApiResponse<LotoPointDto> response = new NgApiResponse<>(lotoPointDto, "File retrieved successfully", LocalDateTime.now());
            return ResponseEntity.ok().contentType(MediaType.APPLICATION_JSON).body(response);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, e.getMessage()));
        }
    }

    @PostMapping("/search")
    public ResponseEntity<NgApiResponse<Page<LotoPointDto>>> searchFiles(
            @RequestBody SearchCriteria criteria,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "50") int pageSize) {
        try {
            Page<LotoPointDto> searchResults = null;
            if (criteria.getType().equals(SearchCriteria.SearchType.COLUMN)) {
                searchResults = ngLotoPointService.complexSearch(criteria, page - 1, pageSize, "tagNumber", "asc", true);
            } else if (SearchCriteria.SearchType.GLOBAL.equals(criteria.getType()) && criteria.getQuery() != null && !criteria.getQuery().isEmpty()) {
                searchResults = ngLotoPointService.complexSearch(criteria.getQuery(), page - 1, pageSize);
            }
            NgApiResponse<Page<LotoPointDto>> response = new NgApiResponse<>(searchResults, "Search completed successfully");
            return ResponseEntity.ok().contentType(MediaType.APPLICATION_JSON).body(response);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, e.getMessage()));
        }
    }

    @PostMapping("/search-by-base-tag-number")
    public ResponseEntity<NgApiResponse<Page<LotoPointDto>>> searchByBaseTagNumber(
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
            Page<LotoPointDto> searchResults = ngLotoPointService.complexSearch(baseTagNumber, page - 1, pageSize);

            NgApiResponse<Page<LotoPointDto>> response = new NgApiResponse<>(searchResults, "Search completed successfully");
            return ResponseEntity.ok().contentType(MediaType.APPLICATION_JSON).body(response);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, e.getMessage()));
        }
    }

    @GetMapping("/{id}/related-images")
    public ResponseEntity<NgApiResponse<List<String>>> getRelatedImages(@PathVariable Long id) {
        try {
            List<String> relatedImages = ngLotoPointService.getRelatedImages(id);
            NgApiResponse<List<String>> response = new NgApiResponse<>(relatedImages, "Related images retrieved successfully");
            return ResponseEntity.ok().contentType(MediaType.APPLICATION_JSON).body(response);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, e.getMessage()));
        }
    }

    @PostMapping(value = "/tagging", consumes = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<NgApiResponse<LotoPointDto>> updateLotoPoint(@RequestBody Map<String, Object> tagData) {
        try {
            // Validate input
            Long id = Long.valueOf(tagData.get("id").toString());
            if (id == null) {
                return ResponseEntity.badRequest().body(new NgApiResponse<>(null, "LotoPoint ID is required"));
            }

            // Find the existing LotoPoint
            LotoPointDto existingLotoPoint = ngLotoPointService.findDtoById(id)
                    .orElseThrow(() -> new EntityNotFoundException("LotoPoint not found with id: " + id));

            // Update only the specified fields
            if (tagData.containsKey("tagNumber")) {
                existingLotoPoint.setTagNumber((String) tagData.get("tagNumber"));
            }
            if (tagData.containsKey("description")) {
                existingLotoPoint.setDescription((String) tagData.get("description"));
            }
            if (tagData.containsKey("specificLocation")) {
                existingLotoPoint.setSpecificLocation((String) tagData.get("specificLocation"));
            }

            // Save the updated LotoPoint
            LotoPointDto updatedLotoPoint = ngLotoPointService.toDto(ngLotoPointService.save(existingLotoPoint));

            NgApiResponse<LotoPointDto> response = new NgApiResponse<>(updatedLotoPoint, "LotoPoint updated successfully");
            return ResponseEntity.ok().contentType(MediaType.APPLICATION_JSON).body(response);
        } catch (EntityNotFoundException e) {
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, e.getMessage()));
        }
    }

    @PutMapping
    public ResponseEntity<NgApiResponse<LotoPointDto>> updateLotoPoint(@RequestBody LotoPointIdDto lotoPoint) {
        try {
            if (lotoPoint.getId() == null || lotoPoint.getId() == 0) {
                return ResponseEntity.badRequest().body(new NgApiResponse<>(null, "LotoPoint ID is required"));
            }

            LotoPoint lp = ngLotoPointService.convertIdDtoToEntity(lotoPoint);

            LotoPointDto updatedLotoPoint = ngLotoPointService.toDto(ngLotoPointService.save(lp));

            NgApiResponse<LotoPointDto> response = new NgApiResponse<>(updatedLotoPoint, "LotoPoint updated successfully", LocalDateTime.now());
            return ResponseEntity.ok().contentType(MediaType.APPLICATION_JSON).body(response);
        } catch (EntityNotFoundException e) {
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, e.getMessage()));
        }
    }

    @GetMapping("/tag-number/{system}")
    public ResponseEntity<NgApiResponse<String>> createNewTagNumber(@PathVariable String system) {
        try {
            String newTagNumber = ngLotoPointService.generateTagNumber(system);
            NgApiResponse<String> response = new NgApiResponse<>(newTagNumber, "New tag number generated successfully");
            return ResponseEntity.ok().contentType(MediaType.APPLICATION_JSON).body(response);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, e.getMessage()));
        }
    }
}
