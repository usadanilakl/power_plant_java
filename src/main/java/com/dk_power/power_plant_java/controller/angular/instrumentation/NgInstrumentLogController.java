package com.dk_power.power_plant_java.controller.angular.instrumentation;

import com.dk_power.power_plant_java.controller.angular.NgApiResponse;
import com.dk_power.power_plant_java.dto.instrumentation.InstrumentLogDto;
import com.dk_power.power_plant_java.entities.instrumentation.InstrumentLog;
import com.dk_power.power_plant_java.mappers.instrumentation.InstrumentLogMapper;
import com.dk_power.power_plant_java.repository.instrumentation.InstrumentLogRepo;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/ng/instrument-logs")
public class NgInstrumentLogController {

    private final InstrumentLogRepo instrumentLogRepo;
    private final InstrumentLogMapper logMapper;

    @GetMapping("/get-all")
    public ResponseEntity<NgApiResponse<List<InstrumentLogDto>>> getAll() {
        try {
            List<InstrumentLog> all = instrumentLogRepo.findAll();
            List<InstrumentLogDto> dtos = all.stream().map(logMapper::convertToDto).toList();
            return ResponseEntity.ok(new NgApiResponse<>(dtos, "Successfully retrieved all instrument logs"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(
                    new NgApiResponse<>(null, "Failed to get instrument logs: " + e.getMessage()));
        }
    }

    @GetMapping("/get-by-instrument/{tagNumber}")
    public ResponseEntity<NgApiResponse<List<InstrumentLogDto>>> getByInstrument(@PathVariable String tagNumber) {
        try {
            List<InstrumentLog> logs = instrumentLogRepo.findAllByInstrumentTagNumber(tagNumber);
            List<InstrumentLogDto> dtos = logs.stream().map(logMapper::convertToDto).toList();
            return ResponseEntity.ok(new NgApiResponse<>(dtos, "Successfully retrieved logs for " + tagNumber));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(
                    new NgApiResponse<>(null, "Failed to get logs for " + tagNumber + ": " + e.getMessage()));
        }
    }

    @GetMapping("/get-by-id/{id}")
    public ResponseEntity<NgApiResponse<InstrumentLogDto>> getById(@PathVariable Long id) {
        try {
            InstrumentLog entity = instrumentLogRepo.findById(id).orElseThrow(
                    () -> new RuntimeException("Instrument log not found with id: " + id));
            return ResponseEntity.ok(new NgApiResponse<>(logMapper.convertToDto(entity), "Found"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(
                    new NgApiResponse<>(null, "Failed to get instrument log: " + e.getMessage()));
        }
    }
}
