package com.dk_power.power_plant_java.repository.users;

import com.dk_power.power_plant_java.entities.users.ShiftDay;
import com.dk_power.power_plant_java.repository.base_repositories.BaseRepository;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface ShiftDayRepo extends BaseRepository<ShiftDay> {

    Optional<ShiftDay> findFirstByDate(LocalDate date);

    List<ShiftDay> findByDateBetweenOrderByDateAsc(LocalDate from, LocalDate to);

    List<ShiftDay> findByYearOrderByDateAsc(Integer year);

    /** Rows modified after the given watermark. Used by the hub-side Supabase mirror scanner. */
    List<ShiftDay> findByDateModifiedGreaterThanOrderByDateModifiedAsc(LocalDateTime after);

    /** Max modified timestamp across all rows. Used to detect schedule freshness. */
    @org.springframework.data.jpa.repository.Query("select max(s.dateModified) from ShiftDay s")
    Optional<LocalDateTime> findMaxDateModified();
}
