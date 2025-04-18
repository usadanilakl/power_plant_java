package com.dk_power.power_plant_java.controller.angular.loto;

import com.dk_power.power_plant_java.controller.angular.NgApiResponse;
import com.dk_power.power_plant_java.dto.SearchCriteria;
import com.dk_power.power_plant_java.dto.permits.LotoPointDto;
import com.dk_power.power_plant_java.sevice.angular.loto_point.NgLotoPointService;
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
                    new ArrayList<>(Arrays.asList("id", "tagNumber", "unit", "description", "specificLocation")),
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
}
