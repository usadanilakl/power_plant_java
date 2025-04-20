package com.dk_power.power_plant_java.controller.angular.loto;

import com.dk_power.power_plant_java.controller.angular.NgApiResponse;
import com.dk_power.power_plant_java.dto.SearchCriteria;
import com.dk_power.power_plant_java.dto.permits.LotoDto;
import com.dk_power.power_plant_java.dto.permits.LotoPointDto;
import com.dk_power.power_plant_java.sevice.angular.loto.NgLotoService;
import com.dk_power.power_plant_java.sevice.loto.LotoService;
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
@RequestMapping("/ng/lotos")
@RequiredArgsConstructor
public class NgLotoController {
    private final NgLotoService ngLotoService;
    @GetMapping("/paginated")
    public ResponseEntity<NgApiResponse<Page<LotoDto>>> getPaginatedFiles(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "50") int pageSize) {
        try {
//            Page<FileObjectDto> paginatedFiles = fileService.getAll(page - 1, pageSize);
            Page<LotoDto> paginatedLotos = ngLotoService.findAllWithProjectionPaginated(
                    new ArrayList<>(Arrays.asList("id", "docNum", "equipment.id", "workScope", "permitStatus.id", "permitStatus.name", "permitType.id","permitType.name")),
                    PageRequest.of(page - 1, pageSize)).map(ngLotoService::toDto);
            NgApiResponse<Page<LotoDto>> response = new NgApiResponse<>(paginatedLotos, "Files retrieved successfully");
            return ResponseEntity.ok().contentType(MediaType.APPLICATION_JSON).body(response);
//            return ResponseEntity.ok(response);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, e.getMessage()));
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<NgApiResponse<LotoDto>> getFileById(@PathVariable Long id) {
        try {
            LotoDto lotoDto = ngLotoService.findDtoById(id).orElse(null);
            if (lotoDto == null) {
                return ResponseEntity.notFound().build();
            }
            NgApiResponse<LotoDto> response = new NgApiResponse<>(lotoDto, "LOTO retrieved successfully", LocalDateTime.now());
            return ResponseEntity.ok().contentType(MediaType.APPLICATION_JSON).body(response);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, e.getMessage()));
        }
    }

    @PostMapping("/search")
    public ResponseEntity<NgApiResponse<Page<LotoDto>>> searchFiles(
            @RequestBody SearchCriteria criteria,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "50") int pageSize) {
        try {
            Page<LotoDto> searchResults = null;
            if (criteria.getType().equals(SearchCriteria.SearchType.COLUMN)) {
                searchResults = ngLotoService.complexSearch(criteria, page - 1, pageSize, "docNum", "asc", true);
            } else if (SearchCriteria.SearchType.GLOBAL.equals(criteria.getType()) && criteria.getQuery() != null && !criteria.getQuery().isEmpty()) {
                searchResults = ngLotoService.complexSearch(criteria.getQuery(), page - 1, pageSize);
            }
            NgApiResponse<Page<LotoDto>> response = new NgApiResponse<>(searchResults, "Search completed successfully");
            return ResponseEntity.ok().contentType(MediaType.APPLICATION_JSON).body(response);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, e.getMessage()));
        }
    }


    @GetMapping("/{id}/related-images")
    public ResponseEntity<NgApiResponse<List<String>>> getRelatedImages(@PathVariable Long id) {
        try {
            List<String> relatedImages = ngLotoService.getRelatedImages(id);
            NgApiResponse<List<String>> response = new NgApiResponse<>(relatedImages, "Related images retrieved successfully");
            return ResponseEntity.ok().contentType(MediaType.APPLICATION_JSON).body(response);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, e.getMessage()));
        }
    }
}
