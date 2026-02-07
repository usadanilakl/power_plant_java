package com.dk_power.power_plant_java.sevice.fire_impairment;

import com.dk_power.power_plant_java.dto.fire_impairment.FireImpairmentDto;
import com.dk_power.power_plant_java.entities.fire_impairment.FireImpairment;
import com.dk_power.power_plant_java.mappers.UniversalMapper;
import com.dk_power.power_plant_java.repository.fire_impairment.FireImpairmentRepo;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional
@RequiredArgsConstructor
public class FireImpairmentService {

    private final FireImpairmentRepo repo;
    private final UniversalMapper mapper;

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

    public List<FireImpairmentDto> getAll() {
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
            mapper.convert(dto, FireImpairment.class);
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
