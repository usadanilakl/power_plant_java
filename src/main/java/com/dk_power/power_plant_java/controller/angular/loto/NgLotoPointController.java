package com.dk_power.power_plant_java.controller.angular.loto;

import com.dk_power.power_plant_java.controller.angular.NgApiResponse;
import com.dk_power.power_plant_java.dto.SearchCriteria;
import com.dk_power.power_plant_java.dto.files.FileDto;
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
import java.util.*;
import java.util.stream.Collectors;

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
                    new ArrayList<>(Arrays.asList("id", "tagNumber", "unit", "description", "specificLocation", "isoPos.name", "isoPos.id", "normPos.name", "normPos.id")),
                    PageRequest.of(page - 1, pageSize)
            ).map(ngLotoPointService::toDto);
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
                // Use client-provided sort if available, otherwise default to tagNumber/asc
                String sortColumn = criteria.getSortColumn() != null ? criteria.getSortColumn() : "tagNumber";
                String sortDirection = criteria.getSortDirection() != null ? criteria.getSortDirection().toLowerCase() : "asc";


                searchResults = ngLotoPointService.complexSearch(criteria, page - 1, pageSize, sortColumn, sortDirection, true);
            } else if (SearchCriteria.SearchType.GLOBAL.equals(criteria.getType()) && criteria.getQuery() != null && !criteria.getQuery().isEmpty()) {
                // Use client-provided sort if available, otherwise default to tagNumber/asc
                String sortColumn = criteria.getSortColumn() != null ? criteria.getSortColumn() : "tagNumber";
                String sortDirection = criteria.getSortDirection() != null ? criteria.getSortDirection().toLowerCase() : "asc";

                searchResults = ngLotoPointService.complexSearch(criteria, page - 1, pageSize, sortColumn, sortDirection, true);
            } else if (criteria.getType().equals(SearchCriteria.SearchType.SORT) && criteria.getSortColumn() != null) {
                // Handle explicit sorting case
                String sortDirection = criteria.getSortDirection() != null ? criteria.getSortDirection().toLowerCase() : "asc";
                searchResults = ngLotoPointService.complexSearch(
                        criteria,
                        page - 1,
                        pageSize,
                        criteria.getSortColumn(),
                        sortDirection,
                        true
                );
            }

            NgApiResponse<Page<LotoPointDto>> response = new NgApiResponse<>(searchResults, "Search completed successfully");
            return ResponseEntity.ok().contentType(MediaType.APPLICATION_JSON).body(response);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, e.getMessage()));
        }
    }

//    @PostMapping("/search")
//    public ResponseEntity<NgApiResponse<Page<LotoPointDto>>> searchFiles(
//            @RequestBody SearchCriteria criteria,
//            @RequestParam(defaultValue = "1") int page,
//            @RequestParam(defaultValue = "50") int pageSize) {
//        try {
//            Page<LotoPointDto> searchResults = null;
//
//            if (criteria.getType().equals(SearchCriteria.SearchType.COLUMN)) {
//                // Use client-provided sort if available, otherwise default to tagNumber/asc
//                String sortColumn = criteria.getSortColumn() != null ? criteria.getSortColumn() : "tagNumber";
//                String sortDirection = criteria.getSortDirection() != null ? criteria.getSortDirection().toLowerCase() : "asc";
//
//
//                searchResults = ngLotoPointService.fuzziSearch(criteria, page, pageSize, sortColumn, sortDirection, true);
//            } else if (SearchCriteria.SearchType.GLOBAL.equals(criteria.getType()) && criteria.getQuery() != null && !criteria.getQuery().isEmpty()) {
//                // Use client-provided sort if available, otherwise default to tagNumber/asc
//                String sortColumn = criteria.getSortColumn() != null ? criteria.getSortColumn() : "tagNumber";
//                String sortDirection = criteria.getSortDirection() != null ? criteria.getSortDirection().toLowerCase() : "asc";
//
//                searchResults = ngLotoPointService.complexSearch(criteria, page - 1, pageSize, sortColumn, sortDirection, true);
//            } else if (criteria.getType().equals(SearchCriteria.SearchType.SORT) && criteria.getSortColumn() != null) {
//                // Handle explicit sorting case
//                String sortDirection = criteria.getSortDirection() != null ? criteria.getSortDirection().toLowerCase() : "asc";
//                searchResults = ngLotoPointService.complexSearch(
//                        criteria,
//                        page - 1,
//                        pageSize,
//                        criteria.getSortColumn(),
//                        sortDirection,
//                        true
//                );
//            }
//
//            NgApiResponse<Page<LotoPointDto>> response = new NgApiResponse<>(searchResults, "Search completed successfully");
//            return ResponseEntity.ok().contentType(MediaType.APPLICATION_JSON).body(response);
//        } catch (Exception e) {
//            e.printStackTrace();
//            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, e.getMessage()));
//        }
//    }

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
                baseTagNumber = criteria.getQuery();
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

    @GetMapping("/{id}/related-files")
    public ResponseEntity<NgApiResponse<List<FileDto>>> getRelatedFiles(@PathVariable Long id) {
        try {
            List<FileDto> relatedImages = ngLotoPointService.getRelatedFiles(id);
            NgApiResponse<List<FileDto>> response = new NgApiResponse<>(relatedImages, "Related file retrieved successfully");
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
//            if (lotoPoint.getId() == null || lotoPoint.getId() == 0) {
//                return ResponseEntity.badRequest().body(new NgApiResponse<>(null, "LotoPoint ID is required"));
//            }

//            LotoPoint lp = ngLotoPointService.convertIdDtoToEntity(lotoPoint);

            LotoPoint lp = ngLotoPointService.processLotoPoint(lotoPoint);

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

    @GetMapping("/unique-values/{column}")
    public ResponseEntity<NgApiResponse<List<String>>> getUniqueValuesOfColumn(@PathVariable String column) {
        try {
            List<String> uniqueValues = ngLotoPointService.getUniqueValuesOfColumn(column);
            NgApiResponse<List<String>> response = new NgApiResponse<>(uniqueValues, "Unique values retrieved successfully");
            return ResponseEntity.ok().contentType(MediaType.APPLICATION_JSON).body(response);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, e.getMessage()));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, e.getMessage()));
        }
    }

//@PostMapping("/unique-values/{column}/filtered")
//public ResponseEntity<NgApiResponse<Page<String>>> getFilteredUniqueValuesOfColumn(
//        @PathVariable String column,
//        @RequestBody Map<String, String> filters,
//        @RequestParam(defaultValue = "1") int page,
//        @RequestParam(defaultValue = "50") int pageSize,
//        @RequestParam(defaultValue = "true") boolean andLogicEnabled
//) {
//    try {
//        Page<String> uniqueValues = ngLotoPointService.getFilteredUniqueValuesOfColumn(
//                column,
//                filters,
//                page,
//                pageSize,
//                andLogicEnabled
//        );
//
//        NgApiResponse<Page<String>> response = new NgApiResponse<>(
//                uniqueValues,
//                "Filtered unique values retrieved successfully"
//        );
//        return ResponseEntity.ok().contentType(MediaType.APPLICATION_JSON).body(response);
//    } catch (IllegalArgumentException e) {
//        return ResponseEntity.badRequest().body(new NgApiResponse<>(null, e.getMessage()));
//    } catch (Exception e) {
//        e.printStackTrace();
//        return ResponseEntity.badRequest().body(new NgApiResponse<>(null, e.getMessage()));
//    }
//}

    @PostMapping("/unique-values/{column}/filtered")
    public ResponseEntity<NgApiResponse<Page<String>>> getFilteredUniqueValuesOfColumn(
            @PathVariable String column,
            @RequestBody Map<String, String> filters,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "50") int pageSize,
            @RequestParam(defaultValue = "true") boolean andLogicEnabled
    ) {
        try {
            Page<String> uniqueValues = ngLotoPointService.getFilteredUniqueValuesOfColumn2(
                    column,
                    filters,
                    page,
                    pageSize,
                    andLogicEnabled
            );

            NgApiResponse<Page<String>> response = new NgApiResponse<>(
                    uniqueValues,
                    "Filtered unique values retrieved successfully"
            );
            return ResponseEntity.ok().contentType(MediaType.APPLICATION_JSON).body(response);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, e.getMessage()));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, e.getMessage()));
        }
    }
}
