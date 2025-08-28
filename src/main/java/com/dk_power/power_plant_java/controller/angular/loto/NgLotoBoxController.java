package com.dk_power.power_plant_java.controller.angular.loto;

import com.dk_power.power_plant_java.controller.angular.NgApiResponse;
import com.dk_power.power_plant_java.dto.SearchCriteria;
import com.dk_power.power_plant_java.dto.permits.LotoBoxDto;
import com.dk_power.power_plant_java.sevice.angular.loto.NgLotoBoxService;
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
@RequestMapping("/ng/loto-boxes")
@RequiredArgsConstructor
public class NgLotoBoxController {
    private final NgLotoBoxService ngLotoBoxService;

    @GetMapping("/paginated")
    public ResponseEntity<NgApiResponse<Page<LotoBoxDto>>> getPaginatedLotoBoxes(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "50") int pageSize) {
        try {
            Page<LotoBoxDto> paginatedLotoBoxes = ngLotoBoxService.findAllWithProjectionPaginated(
                    new ArrayList<>(Arrays.asList("id", "number", "loto", "lotoAccessoryStatus")),
                    PageRequest.of(page - 1, pageSize)).map(ngLotoBoxService::toDto);
            NgApiResponse<Page<LotoBoxDto>> response = new NgApiResponse<>(paginatedLotoBoxes, "LotoBoxes retrieved successfully");
            return ResponseEntity.ok().contentType(MediaType.APPLICATION_JSON).body(response);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, e.getMessage()));
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<NgApiResponse<LotoBoxDto>> getLotoBoxById(@PathVariable Long id) {
        try {
            LotoBoxDto lotoBoxDto = ngLotoBoxService.findDtoById(id).orElse(null);
            if (lotoBoxDto == null) {
                return ResponseEntity.notFound().build();
            }
            NgApiResponse<LotoBoxDto> response = new NgApiResponse<>(lotoBoxDto, "LotoBox retrieved successfully", LocalDateTime.now());
            return ResponseEntity.ok().contentType(MediaType.APPLICATION_JSON).body(response);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, e.getMessage()));
        }
    }

    @PostMapping("/search")
    public ResponseEntity<NgApiResponse<Page<LotoBoxDto>>> searchLotoBoxes(
            @RequestBody SearchCriteria criteria,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "50") int pageSize) {
        try {
            Page<LotoBoxDto> searchResults = null;
            if (criteria.getType().equals(SearchCriteria.SearchType.COLUMN)) {
                searchResults = ngLotoBoxService.complexSearch(criteria, page - 1, pageSize, "number", "asc", true);
            } else if (SearchCriteria.SearchType.GLOBAL.equals(criteria.getType()) && criteria.getQuery() != null && !criteria.getQuery().isEmpty()) {
                searchResults = ngLotoBoxService.complexSearch(criteria.getQuery(), page - 1, pageSize);
            }
            NgApiResponse<Page<LotoBoxDto>> response = new NgApiResponse<>(searchResults, "Search completed successfully");
            return ResponseEntity.ok().contentType(MediaType.APPLICATION_JSON).body(response);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, e.getMessage()));
        }
    }

}