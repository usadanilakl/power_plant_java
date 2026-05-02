package com.dk_power.power_plant_java.controller.angular.loto;

import com.dk_power.power_plant_java.controller.angular.NgApiResponse;
import com.dk_power.power_plant_java.dto.SearchCriteria;
import com.dk_power.power_plant_java.dto.permits.LockDto;
import com.dk_power.power_plant_java.dto.permits.loto_box.LotoBoxDto;
import com.dk_power.power_plant_java.entities.loto.Lock;
import com.dk_power.power_plant_java.entities.loto.LotoBox;
import com.dk_power.power_plant_java.repository.loto.LockRepo;
import com.dk_power.power_plant_java.repository.loto.LotoBoxRepo;
import com.dk_power.power_plant_java.sevice.angular.loto.NgLotoBoxService;
import com.dk_power.power_plant_java.sevice.esp.WledCommandQueueService;
import com.dk_power.power_plant_java.sevice.loto.loto_box.LotoBoxInitializationService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Arrays;

@RestController
@RequestMapping("/ng/loto-boxes")
@RequiredArgsConstructor
public class NgLotoBoxController {
    private final NgLotoBoxService ngLotoBoxService;
    private final WledCommandQueueService wledCommandQueueService;
    private final LotoBoxInitializationService lotoBoxInitializationService;
    private final LotoBoxRepo lotoBoxRepo;
    private final LockRepo lockRepo;

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

    /**
     * Get all LOTO boxes with their LED color state
     */
    @GetMapping("/all")
    public ResponseEntity<NgApiResponse<java.util.List<LotoBoxDto>>> getAllBoxes() {
        try {
            java.util.List<LotoBoxDto> boxes = ngLotoBoxService.getAllBoxes();
            NgApiResponse<java.util.List<LotoBoxDto>> response = new NgApiResponse<>(boxes, "All boxes retrieved successfully");
            return ResponseEntity.ok().contentType(MediaType.APPLICATION_JSON).body(response);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, e.getMessage()));
        }
    }

    /**
     * Update LED color for a box by ID
     */
    @PutMapping("/{id}/led-color")
    public ResponseEntity<NgApiResponse<LotoBoxDto>> updateBoxLedColor(
            @PathVariable Long id,
            @RequestParam Integer r,
            @RequestParam Integer g,
            @RequestParam Integer b,
            @RequestParam(defaultValue = "255") Integer brightness) {
        try {
            LotoBoxDto updated = ngLotoBoxService.updateBoxLedColor(id, r, g, b, brightness);
            NgApiResponse<LotoBoxDto> response = new NgApiResponse<>(updated, "Box LED color updated successfully");
            return ResponseEntity.ok().contentType(MediaType.APPLICATION_JSON).body(response);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, e.getMessage()));
        }
    }

    /**
     * Update LED color for a box by box number
     */
    @PutMapping("/number/{boxNumber}/led-color")
    public ResponseEntity<NgApiResponse<LotoBoxDto>> updateBoxLedColorByNumber(
            @PathVariable Integer boxNumber,
            @RequestParam Integer r,
            @RequestParam Integer g,
            @RequestParam Integer b,
            @RequestParam(defaultValue = "255") Integer brightness) {
        try {
            LotoBoxDto updated = ngLotoBoxService.updateBoxLedColorByNumber(boxNumber, r, g, b, brightness);
            NgApiResponse<LotoBoxDto> response = new NgApiResponse<>(updated, "Box LED color updated successfully");
            return ResponseEntity.ok().contentType(MediaType.APPLICATION_JSON).body(response);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, e.getMessage()));
        }
    }

    /**
     * Sync all boxes to ESP device
     */
    @PostMapping("/sync-to-esp")
    public ResponseEntity<NgApiResponse<String>> syncAllBoxesToEsp() {
        try {
            ngLotoBoxService.syncAllBoxesToEsp();
            NgApiResponse<String> response = new NgApiResponse<>("OK", "All boxes synced to ESP successfully");
            return ResponseEntity.ok().contentType(MediaType.APPLICATION_JSON).body(response);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, e.getMessage()));
        }
    }

    @GetMapping("/available")
    public ResponseEntity<NgApiResponse<java.util.List<LotoBoxDto>>> getAvailableBoxes() {
        try {
            java.util.List<LotoBoxDto> boxes = ngLotoBoxService.findAvailableBoxes();
            return ResponseEntity.ok(new NgApiResponse<>(boxes, "Available boxes retrieved"));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, e.getMessage()));
        }
    }

    @GetMapping("/grid")
    public ResponseEntity<NgApiResponse<java.util.List<LotoBoxDto>>> getBoxGrid() {
        try {
            java.util.List<LotoBoxDto> boxes = ngLotoBoxService.getAllBoxes();
            return ResponseEntity.ok(new NgApiResponse<>(boxes, "Box grid retrieved"));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, e.getMessage()));
        }
    }

    @GetMapping("/wled-queue-status")
    public ResponseEntity<NgApiResponse<java.util.Map<String, Long>>> getWledQueueStatus() {
        try {
            java.util.Map<String, Long> status = java.util.Map.of(
                    "pending", wledCommandQueueService.getPendingCount(),
                    "expired", wledCommandQueueService.getExpiredCount()
            );
            return ResponseEntity.ok(new NgApiResponse<>(status, "Queue status retrieved"));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, e.getMessage()));
        }
    }

    @PostMapping("/seed-inventory")
    public ResponseEntity<NgApiResponse<String>> seedInventory() {
        try {
            lotoBoxInitializationService.seedLotoBoxData();
            return ResponseEntity.ok(new NgApiResponse<>("OK", "Boxes and lock inventory seeded"));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, e.getMessage()));
        }
    }

    @PostMapping("/reconcile")
    public ResponseEntity<NgApiResponse<String>> reconcile() {
        try {
            String result = ngLotoBoxService.reconcileExistingLotos();
            return ResponseEntity.ok(new NgApiResponse<>("OK", result));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, e.getMessage()));
        }
    }

    @PostMapping
    public ResponseEntity<NgApiResponse<LotoBoxDto>> createBox(@RequestBody LotoBoxDto dto) {
        try {
            LotoBox entity = new LotoBox();
            if (dto.getNumber() == null || dto.getNumber() == 0) {
                Integer max = lotoBoxRepo.getMaxNumber();
                entity.setNumber((max == null ? 0 : max) + 1);
            } else {
                if (lotoBoxRepo.findByNumber(dto.getNumber()) != null) {
                    return ResponseEntity.badRequest().body(new NgApiResponse<>(null, "Box number " + dto.getNumber() + " already exists"));
                }
                entity.setNumber(dto.getNumber());
            }
            entity.setDescription(dto.getDescription());
            entity.setSetSize(dto.getSetSize() != null ? dto.getSetSize() : 0);
            entity.setActive(dto.getActive() != null ? dto.getActive() : Boolean.TRUE);
            entity.setPortable(dto.getPortable() != null ? dto.getPortable() : Boolean.FALSE);
            LotoBox saved = lotoBoxRepo.save(entity);
            return ResponseEntity.ok(new NgApiResponse<>(ngLotoBoxService.toDto(saved), "Box created"));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, e.getMessage()));
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<NgApiResponse<LotoBoxDto>> updateBox(@PathVariable Long id, @RequestBody LotoBoxDto dto) {
        try {
            LotoBox entity = lotoBoxRepo.findById(id)
                    .orElseThrow(() -> new RuntimeException("Box not found: " + id));
            if (dto.getNumber() != null && !dto.getNumber().equals(entity.getNumber())) {
                LotoBox other = lotoBoxRepo.findByNumber(dto.getNumber());
                if (other != null && !other.getId().equals(id)) {
                    return ResponseEntity.badRequest().body(new NgApiResponse<>(null, "Box number " + dto.getNumber() + " already in use"));
                }
                // also rehome any locks pointing at the old number
                Integer oldNumber = entity.getNumber();
                if (oldNumber != null) {
                    for (Lock lock : lockRepo.findByHomeBoxNumber(oldNumber)) {
                        lock.setHomeBoxNumber(dto.getNumber());
                        lockRepo.save(lock);
                    }
                }
                entity.setNumber(dto.getNumber());
            }
            if (dto.getDescription() != null) entity.setDescription(dto.getDescription());
            if (dto.getSetSize() != null) entity.setSetSize(dto.getSetSize());
            if (dto.getActive() != null) entity.setActive(dto.getActive());
            if (dto.getPortable() != null) entity.setPortable(dto.getPortable());
            LotoBox saved = lotoBoxRepo.save(entity);
            return ResponseEntity.ok(new NgApiResponse<>(ngLotoBoxService.toDto(saved), "Box updated"));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, e.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<NgApiResponse<String>> deactivateBox(@PathVariable Long id) {
        try {
            LotoBox entity = lotoBoxRepo.findById(id)
                    .orElseThrow(() -> new RuntimeException("Box not found: " + id));
            if (entity.getLoto() != null) {
                return ResponseEntity.badRequest().body(new NgApiResponse<>(null, "Cannot deactivate a box currently assigned to a LOTO"));
            }
            entity.setActive(false);
            lotoBoxRepo.save(entity);
            return ResponseEntity.ok(new NgApiResponse<>("OK", "Box deactivated"));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, e.getMessage()));
        }
    }

    @PostMapping("/{id}/locks")
    public ResponseEntity<NgApiResponse<LotoBoxDto>> addLocksToBox(
            @PathVariable Long id,
            @RequestParam Integer startNumber,
            @RequestParam Integer count,
            @RequestParam(defaultValue = "false") Boolean isSingleLock,
            @RequestParam(defaultValue = "LOCK") String lockType) {
        try {
            LotoBox entity = lotoBoxRepo.findById(id)
                    .orElseThrow(() -> new RuntimeException("Box not found: " + id));
            if (count == null || count <= 0) {
                return ResponseEntity.badRequest().body(new NgApiResponse<>(null, "count must be > 0"));
            }
            for (int i = 0; i < count; i++) {
                Lock lock = new Lock();
                lock.setNumber(startNumber + i);
                lock.setHomeBoxNumber(entity.getNumber());
                lock.setIsSingleLock(isSingleLock);
                lock.setLockType(lockType);
                lockRepo.save(lock);
            }
            if (Boolean.FALSE.equals(isSingleLock)) {
                int newSetSize = (entity.getSetSize() != null ? entity.getSetSize() : 0) + count;
                entity.setSetSize(newSetSize);
                lotoBoxRepo.save(entity);
            }
            return ResponseEntity.ok(new NgApiResponse<>(ngLotoBoxService.toDto(lotoBoxRepo.findById(id).orElseThrow()), count + " locks added"));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, e.getMessage()));
        }
    }
}