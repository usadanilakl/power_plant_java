package com.dk_power.power_plant_java.controller.angular.instrumentation;

import com.dk_power.power_plant_java.controller.angular.NgApiResponse;
import com.dk_power.power_plant_java.dto.instrumentation.InstrumentDto;
import com.dk_power.power_plant_java.dto.pwa.PwaSubmissionResult;
import com.dk_power.power_plant_java.entities.instrumentation.Instrument;
import com.dk_power.power_plant_java.mappers.instrumentation.InstrumentMapper;
import com.dk_power.power_plant_java.repository.instrumentation.InstrumentRepo;
import com.dk_power.power_plant_java.sevice.pwa.PwaInstrumentService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/ng/instruments")
public class NgInstrumentController {

    private final InstrumentRepo instrumentRepo;
    private final InstrumentMapper instrumentMapper;
    private final PwaInstrumentService pwaInstrumentService;

    @GetMapping("/get-all")
    public ResponseEntity<NgApiResponse<List<InstrumentDto>>> getAll() {
        try {
            List<Instrument> all = instrumentRepo.findAll();
            List<InstrumentDto> dtos = all.stream().map(instrumentMapper::convertToDto).toList();
            return ResponseEntity.ok(new NgApiResponse<>(dtos, "Successfully retrieved all instruments"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(
                    new NgApiResponse<>(null, "Failed to get instruments: " + e.getMessage()));
        }
    }

    @GetMapping("/get-by-status/{status}")
    public ResponseEntity<NgApiResponse<List<InstrumentDto>>> getByStatus(@PathVariable String status) {
        try {
            List<Instrument> instruments = instrumentRepo.findAllByCurrentStatus(status);
            List<InstrumentDto> dtos = instruments.stream().map(instrumentMapper::convertToDto).toList();
            return ResponseEntity.ok(new NgApiResponse<>(dtos, "Successfully retrieved instruments with status: " + status));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(
                    new NgApiResponse<>(null, "Failed to get instruments by status: " + e.getMessage()));
        }
    }

    @PostMapping("/create")
    public ResponseEntity<NgApiResponse<PwaSubmissionResult>> create(@RequestBody InstrumentDto dto) {
        try {
            PwaSubmissionResult result = pwaInstrumentService.createInstrument(dto);
            if (result.isSuccess()) {
                return ResponseEntity.ok(new NgApiResponse<>(result, result.getMessage()));
            } else {
                return ResponseEntity.badRequest().body(new NgApiResponse<>(result, result.getMessage()));
            }
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(
                    new NgApiResponse<>(null, "Failed to create instrument: " + e.getMessage()));
        }
    }

    @GetMapping("/get-by-id/{id}")
    public ResponseEntity<NgApiResponse<InstrumentDto>> getById(@PathVariable Long id) {
        try {
            Instrument entity = instrumentRepo.findById(id).orElseThrow(
                    () -> new RuntimeException("Instrument not found with id: " + id));
            return ResponseEntity.ok(new NgApiResponse<>(instrumentMapper.convertToDto(entity), "Found"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(
                    new NgApiResponse<>(null, "Failed to get instrument: " + e.getMessage()));
        }
    }
}
