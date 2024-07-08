package com.dk_power.power_plant_java.repository.loto;

import com.dk_power.power_plant_java.entities.loto.Box;
import com.dk_power.power_plant_java.repository.base_repositories.BaseRepository;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.transaction.annotation.Transactional;

import java.util.stream.Stream;
@Transactional
public interface BoxRepo extends BaseRepository<Box> {
    @Query("SELECT b FROM Box b WHERE b.loto IS NULL ORDER BY b.number ASC")
    Stream<Box> getEmptyBoxes();
    default Box getEmptyBox() {
        return getEmptyBoxes().findFirst().orElse(null);
    }
    @Query("SELECT MAX(b.number) FROM Box b")
    Integer getMaxNumber();
    Box findByNumber(Integer number);
}
