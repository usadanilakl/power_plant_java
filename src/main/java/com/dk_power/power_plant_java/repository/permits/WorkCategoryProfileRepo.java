package com.dk_power.power_plant_java.repository.permits;

import com.dk_power.power_plant_java.entities.permits.WorkCategoryProfile;
import com.dk_power.power_plant_java.repository.base_repositories.BaseRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface WorkCategoryProfileRepo extends BaseRepository<WorkCategoryProfile> {
    Optional<WorkCategoryProfile> findByWorkCategory_Id(Long categoryId);
    Optional<WorkCategoryProfile> findByWorkCategory_Name(String name);
}
