package com.dk_power.power_plant_java.repository.categories;

import com.dk_power.power_plant_java.entities.categories.Value;
import com.dk_power.power_plant_java.repository.base_repositories.BaseRepository;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface ValueRepo extends BaseCategoryValueRepo<Value> {
//    @Query(
//            "SELECT new SharedValueDto(a.id, a.object_type) FROM Equipment WHERE a.value.id = : id" +
//                    "UNION"+
//            "SELECT new SharedValueDto(b.id, b.object_type) FROM LotoPoint WHERE b.value.id = : id" +
//                    "UNION"+
//            "SELECT new SharedValueDto(c.id, c.object_type) FROM Equipment WHERE c.value.id = : id" +
//                    "UNION"+
//
//    )

}
