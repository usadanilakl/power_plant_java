package com.dk_power.power_plant_java.repository.categories;

import com.dk_power.power_plant_java.entities.categories.Value;
import com.dk_power.power_plant_java.repository.base_repositories.BaseRepository;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ValueRepo extends BaseCategoryValueRepo<Value> {

}
