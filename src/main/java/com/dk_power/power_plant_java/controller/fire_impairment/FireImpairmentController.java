package com.dk_power.power_plant_java.controller.fire_impairment;

import com.dk_power.power_plant_java.dto.fire_impairment.FireImpairmentDto;
import com.dk_power.power_plant_java.entities.fire_impairment.FireImpairmentLocation;
import com.dk_power.power_plant_java.entities.fire_impairment.ProtectionIdentifier;
import com.dk_power.power_plant_java.sevice.fire_impairment.FireImpairmentService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Arrays;
import java.util.List;
import java.util.Map;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/fire-impairment")
public class FireImpairmentController {

    private final FireImpairmentService service;

    @GetMapping
    public ResponseEntity<List<FireImpairmentDto>> getAll() {
        return ResponseEntity.ok(service.getAll());
    }

    @GetMapping("/active")
    public ResponseEntity<List<FireImpairmentDto>> getActive() {
        return ResponseEntity.ok(service.getAllActive());
    }

    @GetMapping("/closed")
    public ResponseEntity<List<FireImpairmentDto>> getClosed() {
        return ResponseEntity.ok(service.getAllClosed());
    }

    @GetMapping("/{id}")
    public ResponseEntity<FireImpairmentDto> getById(@PathVariable Long id) {
        return ResponseEntity.ok(service.getById(id));
    }

    @GetMapping("/latest")
    public ResponseEntity<FireImpairmentDto> getLatest() {
        FireImpairmentDto latest = service.getLatest();
        if (latest == null) {
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.ok(latest);
    }

    @PostMapping
    public ResponseEntity<FireImpairmentDto> create(@RequestBody FireImpairmentDto dto) {
        return ResponseEntity.ok(service.save(dto));
    }

    @PutMapping("/{id}")
    public ResponseEntity<FireImpairmentDto> update(@PathVariable Long id, @RequestBody FireImpairmentDto dto) {
        dto.setId(id);
        return ResponseEntity.ok(service.save(dto));
    }

    @PutMapping("/{id}/close")
    public ResponseEntity<FireImpairmentDto> close(@PathVariable Long id, @RequestBody Map<String, String> body) {
        String closedDate = body.getOrDefault("closedDate", "");
        return ResponseEntity.ok(service.close(id, closedDate));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        service.delete(id);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/locations")
    public ResponseEntity<List<Map<String, String>>> getLocations() {
        List<Map<String, String>> locations = Arrays.stream(FireImpairmentLocation.values())
                .map(l -> Map.of("value", l.name(), "display", l.getDisplayName()))
                .toList();
        return ResponseEntity.ok(locations);
    }

    @GetMapping("/protection-types")
    public ResponseEntity<List<Map<String, String>>> getProtectionTypes() {
        List<Map<String, String>> types = Arrays.stream(ProtectionIdentifier.values())
                .map(p -> Map.of("value", p.name(), "display", p.getDisplayValue()))
                .toList();
        return ResponseEntity.ok(types);
    }
}
