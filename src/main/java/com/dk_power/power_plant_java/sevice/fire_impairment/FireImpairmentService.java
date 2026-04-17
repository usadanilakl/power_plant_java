package com.dk_power.power_plant_java.sevice.fire_impairment;

import com.dk_power.power_plant_java.dto.fire_impairment.FireImpairmentDto;
import com.dk_power.power_plant_java.entities.fire_impairment.FireImpairment;
import com.dk_power.power_plant_java.mappers.UniversalMapper;
import com.dk_power.power_plant_java.repository.fire_impairment.FireImpairmentRepo;
import com.dk_power.power_plant_java.sevice.base_services.SyncableService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@Transactional
@RequiredArgsConstructor
public class FireImpairmentService implements SyncableService<FireImpairment> {

    private final FireImpairmentRepo repo;
    private final UniversalMapper mapper;

    @Override
    public FireImpairment getEntity() { return new FireImpairment(); }

    @Override
    public FireImpairment getEntityById(Long id) { return repo.findById(id).orElse(null); }

    @Override
    public List<FireImpairment> getAll() { return repo.findAll(); }

    @Override
    public FireImpairment save(FireImpairment entity) { return repo.save(entity); }

    @Override
    public FireImpairment saveAndFlush(FireImpairment entity) { return repo.saveAndFlush(entity); }

    @Override
    public void deleteById(Long id) { delete(id); }

    @Override
    public List<FireImpairment> getAllSince(LocalDateTime since) { return repo.findAllByDateModifiedAfter(since); }

    @Override
    public void processSyncItem(FireImpairment item) { repo.save(item); }

    @Override
    public void processSyncItems(List<FireImpairment> items) { repo.saveAll(items); }

    @Override
    public Page<FireImpairment> getAllSincePaginated(LocalDateTime lastSyncTime, Pageable pageable) {
        return repo.findAllByDateModifiedAfterOrderByDateModifiedAsc(lastSyncTime, pageable);
    }

    @Override
    public Page<FireImpairment> getAllSinceAndUntilPaginated(LocalDateTime since, LocalDateTime until, Pageable pageable) {
        return repo.findAllByDateModifiedBetween(since, until, pageable);
    }

    public List<FireImpairmentDto> getAllActive() {
        return repo.findAllByIsActiveTrueOrderByDateCreatedDesc()
                .stream()
                .map(e -> mapper.convert(e, FireImpairmentDto.class))
                .toList();
    }

    public List<FireImpairmentDto> getAllClosed() {
        return repo.findAllByIsActiveFalseOrderByDateCreatedDesc()
                .stream()
                .map(e -> mapper.convert(e, FireImpairmentDto.class))
                .toList();
    }

    public List<FireImpairmentDto> getAllDtos() {
        return repo.findAllByOrderByDateCreatedDesc()
                .stream()
                .map(e -> mapper.convert(e, FireImpairmentDto.class))
                .toList();
    }

    public FireImpairmentDto getById(Long id) {
        FireImpairment entity = repo.findById(id)
                .orElseThrow(() -> new RuntimeException("FireImpairment not found: " + id));
        return mapper.convert(entity, FireImpairmentDto.class);
    }

    public FireImpairmentDto getLatest() {
        return repo.findAllByIsActiveTrueOrderByDateCreatedDesc()
                .stream()
                .findFirst()
                .map(e -> mapper.convert(e, FireImpairmentDto.class))
                .orElse(null);
    }

    public FireImpairmentDto save(FireImpairmentDto dto) {
        FireImpairment entity;
        if (dto.getId() != null) {
            entity = repo.findById(dto.getId())
                    .orElseThrow(() -> new RuntimeException("FireImpairment not found: " + dto.getId()));
            mapper.getMapper().map(dto, entity);
        } else {
            entity = mapper.convert(dto, FireImpairment.class);
        }
        FireImpairment saved = repo.save(entity);
        return mapper.convert(saved, FireImpairmentDto.class);
    }

    public FireImpairmentDto close(Long id, String closedDate) {
        FireImpairment entity = repo.findById(id)
                .orElseThrow(() -> new RuntimeException("FireImpairment not found: " + id));
        entity.setIsActive(false);
        entity.setClosedDate(closedDate);
        return mapper.convert(repo.save(entity), FireImpairmentDto.class);
    }

    public FireImpairmentDto cancel(Long id, String canceledDate) {
        FireImpairment entity = repo.findById(id)
                .orElseThrow(() -> new RuntimeException("FireImpairment not found: " + id));
        entity.setIsActive(false);
        entity.setCanceledDate(canceledDate);
        return mapper.convert(repo.save(entity), FireImpairmentDto.class);
    }

    public boolean delete(Long id) {
        FireImpairment entity = repo.findById(id).orElse(null);
        if (entity != null) {
            entity.setDeleted(true);
            repo.save(entity);
            return true;
        }
        return false;
    }
}
