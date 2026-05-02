package com.dk_power.power_plant_java.controller.angular.loto;

import com.dk_power.power_plant_java.controller.angular.NgApiResponse;
import com.dk_power.power_plant_java.dto.permits.LockDto;
import com.dk_power.power_plant_java.entities.loto.Lock;
import com.dk_power.power_plant_java.entities.loto.LotoBox;
import com.dk_power.power_plant_java.repository.loto.LockRepo;
import com.dk_power.power_plant_java.repository.loto.LotoBoxRepo;
import com.dk_power.power_plant_java.sevice.angular.loto.NgLockService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/ng/locks")
@RequiredArgsConstructor
public class NgLockController {
    private final NgLockService lockService;
    private final LockRepo lockRepo;
    private final LotoBoxRepo lotoBoxRepo;

    @GetMapping
    public ResponseEntity<NgApiResponse<List<LockDto>>> getAll() {
        try {
            List<LockDto> locks = lockRepo.findAll().stream()
                    .map(lockService::toDto)
                    .toList();
            return ResponseEntity.ok(new NgApiResponse<>(locks, "Locks retrieved"));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, e.getMessage()));
        }
    }

    @PostMapping
    public ResponseEntity<NgApiResponse<LockDto>> create(@RequestBody LockDto dto) {
        try {
            Lock entity = lockService.toEntity(dto);
            Lock saved = lockRepo.save(entity);
            adjustSetSize(saved.getHomeBoxNumber(), saved.getIsSingleLock(), +1);
            return ResponseEntity.ok(new NgApiResponse<>(lockService.toDto(saved), "Lock created"));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, e.getMessage()));
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<NgApiResponse<LockDto>> update(@PathVariable Long id, @RequestBody LockDto dto) {
        try {
            Lock entity = lockRepo.findById(id)
                    .orElseThrow(() -> new RuntimeException("Lock not found: " + id));
            Integer oldHome = entity.getHomeBoxNumber();
            Boolean oldSingle = entity.getIsSingleLock();

            if (dto.getNumber() != null) entity.setNumber(dto.getNumber());
            if (dto.getTagLabel() != null) entity.setTagLabel(dto.getTagLabel());
            if (dto.getLockType() != null) entity.setLockType(dto.getLockType());
            if (dto.getHomeBoxNumber() != null) entity.setHomeBoxNumber(dto.getHomeBoxNumber());
            if (dto.getIsSingleLock() != null) entity.setIsSingleLock(dto.getIsSingleLock());
            Lock saved = lockRepo.save(entity);

            // recompute set sizes if lock moved or changed type
            if (!java.util.Objects.equals(oldHome, saved.getHomeBoxNumber())
                    || !java.util.Objects.equals(oldSingle, saved.getIsSingleLock())) {
                adjustSetSize(oldHome, oldSingle, -1);
                adjustSetSize(saved.getHomeBoxNumber(), saved.getIsSingleLock(), +1);
            }
            return ResponseEntity.ok(new NgApiResponse<>(lockService.toDto(saved), "Lock updated"));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, e.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<NgApiResponse<String>> delete(@PathVariable Long id) {
        try {
            Lock entity = lockRepo.findById(id)
                    .orElseThrow(() -> new RuntimeException("Lock not found: " + id));
            if (entity.getLoto() != null) {
                return ResponseEntity.badRequest().body(new NgApiResponse<>(null, "Cannot delete a lock currently assigned to a LOTO"));
            }
            adjustSetSize(entity.getHomeBoxNumber(), entity.getIsSingleLock(), -1);
            lockRepo.delete(entity);
            return ResponseEntity.ok(new NgApiResponse<>("OK", "Lock deleted"));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, e.getMessage()));
        }
    }

    private void adjustSetSize(Integer boxNumber, Boolean isSingleLock, int delta) {
        if (boxNumber == null || Boolean.TRUE.equals(isSingleLock)) return;
        LotoBox box = lotoBoxRepo.findByNumber(boxNumber);
        if (box == null) return;
        int current = box.getSetSize() != null ? box.getSetSize() : 0;
        box.setSetSize(Math.max(0, current + delta));
        lotoBoxRepo.save(box);
    }
}
