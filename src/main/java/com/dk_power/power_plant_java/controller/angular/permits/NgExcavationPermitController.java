package com.dk_power.power_plant_java.controller.angular.permits;

import com.dk_power.power_plant_java.controller.angular.NgApiResponse;
import com.dk_power.power_plant_java.dto.permits.ExcavationPermitDto;
import com.dk_power.power_plant_java.sevice.angular.permits.NgExcavationPermitService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/ng/excavation-permits")
@RequiredArgsConstructor
public class NgExcavationPermitController {

    private final NgExcavationPermitService service;

    @GetMapping("/get-all")
    public ResponseEntity<NgApiResponse<List<ExcavationPermitDto>>> getAll() {
        try {
            List<ExcavationPermitDto> items = service.getAllDtos();
            return ResponseEntity.ok().contentType(MediaType.APPLICATION_JSON)
                .body(new NgApiResponse<>(items, "Excavation permits retrieved successfully", LocalDateTime.now()));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, "Error: " + e.getMessage()));
        }
    }

    @GetMapping("/get-by-id/{id}")
    public ResponseEntity<NgApiResponse<ExcavationPermitDto>> getById(@PathVariable String id) {
        try {
            ExcavationPermitDto dto = service.getDtoById(id);
            if (dto == null) return ResponseEntity.notFound().build();
            return ResponseEntity.ok().contentType(MediaType.APPLICATION_JSON)
                .body(new NgApiResponse<>(dto, "Excavation permit retrieved successfully", LocalDateTime.now()));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, "Error: " + e.getMessage()));
        }
    }

    @PostMapping
    public ResponseEntity<NgApiResponse<ExcavationPermitDto>> create(@RequestBody ExcavationPermitDto dto) {
        try {
            ExcavationPermitDto created = service.createPermit(dto);
            return ResponseEntity.ok().contentType(MediaType.APPLICATION_JSON)
                .body(new NgApiResponse<>(created, "Excavation permit created successfully", LocalDateTime.now()));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, "Error: " + e.getMessage()));
        }
    }

    @PostMapping("/save-all")
    public ResponseEntity<NgApiResponse<List<ExcavationPermitDto>>> saveAll(@RequestBody List<ExcavationPermitDto> permits) {
        try {
            List<ExcavationPermitDto> saved = service.saveAll(permits);
            return ResponseEntity.ok().contentType(MediaType.APPLICATION_JSON)
                .body(new NgApiResponse<>(saved, "Excavation permits saved successfully", LocalDateTime.now()));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, "Error: " + e.getMessage()));
        }
    }
}
