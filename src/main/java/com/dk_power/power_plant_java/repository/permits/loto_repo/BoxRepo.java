package com.dk_power.power_plant_java.repository.permits.loto_repo;

import com.dk_power.power_plant_java.entities.permits.lotos.Box;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.CrudRepository;

import java.util.stream.Stream;

public interface BoxRepo extends CrudRepository<Box,Long> {
    @Query("SELECT b FROM Box b WHERE b.loto IS NULL ORDER BY b.number ASC")
    Stream<Box> getEmptyBoxes();

    default Box getEmptyBox() {
        return getEmptyBoxes().findFirst().orElse(null);
    }
    @Query("SELECT MAX(b.number) FROM Box b")
    Integer getMaxNumber();
}
