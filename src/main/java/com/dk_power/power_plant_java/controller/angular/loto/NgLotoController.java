package com.dk_power.power_plant_java.controller.angular.loto;

import com.dk_power.power_plant_java.controller.angular.NgApiResponse;
import com.dk_power.power_plant_java.dto.SearchCriteria;
import com.dk_power.power_plant_java.dto.permits.LotoDto;
import com.dk_power.power_plant_java.dto.permits.LotoIdDto;
import com.dk_power.power_plant_java.dto.permits.LotoPointDto;
import com.dk_power.power_plant_java.entities.loto.Loto;
import com.dk_power.power_plant_java.sevice.angular.loto.NgLotoService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Set;

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
//            Page<LotoDto> paginatedLotos = ngLotoService.findAllWithProjectionPaginated(
//                    Loto.lightDtoFields,
//                    PageRequest.of(page - 1, pageSize)).map(ngLotoService::toDto);
            Page<LotoDto> paginatedLotos = ngLotoService.getAll(page-1,pageSize);
            System.out.println(paginatedLotos.getTotalElements() + " files found");
            paginatedLotos.getContent().forEach(System.out::println);
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
    public ResponseEntity<NgApiResponse<Set<String>>> getRelatedImages(@PathVariable Long id) {
        try {
            Set<String> relatedImages = ngLotoService.getRelatedImages(id);
            NgApiResponse<Set<String>> response = new NgApiResponse<>(relatedImages, "Related images retrieved successfully");
            return ResponseEntity.ok().contentType(MediaType.APPLICATION_JSON).body(response);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, e.getMessage()));
        }
    }

    @PutMapping(consumes = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<NgApiResponse<LotoDto>> updateLoto(@RequestBody LotoIdDto lotoDto) {
        try {
            Loto updatedLoto = ngLotoService.update(lotoDto);
            LotoDto updatedLotoDto = ngLotoService.toDto(updatedLoto);
            NgApiResponse<LotoDto> response = new NgApiResponse<>(updatedLotoDto, "LOTO updated successfully", LocalDateTime.now());
            return ResponseEntity.ok().contentType(MediaType.APPLICATION_JSON).body(response);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, "Error updating LOTO: " + e.getMessage()));
        }
    }

    @GetMapping("/active")
    public ResponseEntity<NgApiResponse<List<LotoPointDto>>> getActiveLotoPoints() {
        try {
            List<LotoPointDto> activeLotoPoints = ngLotoService.getActiveLotoPoints();
            NgApiResponse<List<LotoPointDto>> response = new NgApiResponse<>(activeLotoPoints, "Active LOTO points retrieved successfully", LocalDateTime.now());
            return ResponseEntity.ok().contentType(MediaType.APPLICATION_JSON).body(response);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, "Error retrieving active LOTO points: " + e.getMessage()));
        }
    }

    @PostMapping("/add/{pointId}/to/{lotoId}")
    public ResponseEntity<NgApiResponse<LotoDto>> addLotoPointToLoto(@PathVariable Long pointId, @PathVariable Long lotoId) {
        try {
            LotoDto updatedLoto = ngLotoService.addLotoPointToLoto(pointId, lotoId);
            NgApiResponse<LotoDto> response = new NgApiResponse<>(updatedLoto, "LOTO point added to LOTO successfully", LocalDateTime.now());
            return ResponseEntity.ok().contentType(MediaType.APPLICATION_JSON).body(response);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, "Error adding LOTO point to LOTO: " + e.getMessage()));
        }
    }
    
    @DeleteMapping("/remove/{pointId}/from/{lotoId}")
    public ResponseEntity<NgApiResponse<LotoDto>> removeLotoPointFromLoto(@PathVariable Long pointId, @PathVariable Long lotoId) {
        try {
            LotoDto updatedLoto = ngLotoService.removeLotoPointFromLoto(pointId, lotoId);
            NgApiResponse<LotoDto> response = new NgApiResponse<>(updatedLoto, "LOTO point removed from LOTO successfully", LocalDateTime.now());
            return ResponseEntity.ok().contentType(MediaType.APPLICATION_JSON).body(response);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, "Error removing LOTO point from LOTO: " + e.getMessage()));
        }
    }


}
