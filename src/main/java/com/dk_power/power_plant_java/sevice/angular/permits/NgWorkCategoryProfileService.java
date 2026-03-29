package com.dk_power.power_plant_java.sevice.angular.permits;

import com.dk_power.power_plant_java.dto.permits.WorkCategoryProfileDto;
import com.dk_power.power_plant_java.entities.categories.Value;
import com.dk_power.power_plant_java.entities.permits.WorkCategoryProfile;
import com.dk_power.power_plant_java.mappers.permits.WorkCategoryProfileMapper;
import com.dk_power.power_plant_java.repository.permits.WorkCategoryProfileRepo;
import com.dk_power.power_plant_java.sevice.categories.ValueService;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional
@RequiredArgsConstructor
public class NgWorkCategoryProfileService {
    private final WorkCategoryProfileRepo profileRepo;
    private final WorkCategoryProfileMapper profileMapper;
    private final ValueService valueService;

    public List<WorkCategoryProfileDto> getAllDtoList() {
        return profileRepo.findAll().stream()
                .map(profileMapper::convertToDto)
                .collect(Collectors.toList());
    }

    public WorkCategoryProfileDto getDtoById(Long id) {
        return profileRepo.findById(id)
                .map(profileMapper::convertToDto)
                .orElse(null);
    }

    public WorkCategoryProfileDto getByWorkCategoryId(Long categoryId) {
        return profileRepo.findByWorkCategory_Id(categoryId)
                .map(profileMapper::convertToDto)
                .orElse(null);
    }

    public WorkCategoryProfileDto getByWorkCategoryName(String name) {
        return profileRepo.findByWorkCategory_Name(name)
                .map(profileMapper::convertToDto)
                .orElse(null);
    }

    public WorkCategoryProfileDto saveFromDto(WorkCategoryProfileDto dto) {
        WorkCategoryProfile entity = profileMapper.convertToEntity(dto);

        if (dto.getWorkCategory() != null && dto.getWorkCategory().getId() != null) {
            Value category = valueService.getEntityById(dto.getWorkCategory().getId().toString());
            entity.setWorkCategory(category);
        }

        WorkCategoryProfile saved = profileRepo.save(entity);
        return profileMapper.convertToDto(saved);
    }

    public void softDelete(Long id) {
        profileRepo.findById(id).ifPresent(profile -> {
            profile.setDeleted(true);
            profileRepo.save(profile);
        });
    }
}
