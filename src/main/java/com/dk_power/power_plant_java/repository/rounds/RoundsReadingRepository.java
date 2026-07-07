package com.dk_power.power_plant_java.repository.rounds;

import com.dk_power.power_plant_java.entities.rounds.RoundsReading;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Collection;
import java.util.List;
import java.util.Optional;

/**
 * Repository for {@link RoundsReading} — a plain {@link JpaRepository} (NOT the
 * sync {@code BaseRepository}), since readings are a local projection derived
 * from synced snapshots and never sync on their own.
 */
public interface RoundsReadingRepository extends JpaRepository<RoundsReading, Long> {

    /** Existing reading for a question on a shift — the natural-key upsert lookup. */
    Optional<RoundsReading> findByQuestionKeyAndShiftDateAndShift(
        String questionKey, LocalDate shiftDate, String shift);

    /** Readings for the requested questions over a time window, chronological. */
    List<RoundsReading> findByQuestionKeyInAndShiftTimeBetweenOrderByShiftTimeAsc(
        Collection<String> questionKeys, LocalDateTime from, LocalDateTime to);

    /**
     * One metadata row per distinct question (for the series picker). {@code max()}
     * over label/unit/category is a cheap "representative value" — these are
     * effectively stable per question.
     */
    @Query("""
        select r.questionKey        as questionKey,
               max(r.questionLabel)  as label,
               max(r.category)       as category,
               max(r.unit)           as unit,
               count(r)              as points,
               max(r.shiftTime)      as lastReading
        from RoundsReading r
        group by r.questionKey
        order by max(r.category), r.questionKey
        """)
    List<SeriesMeta> findSeriesMeta();

    /** Interface projection for {@link #findSeriesMeta()}. */
    interface SeriesMeta {
        String getQuestionKey();
        String getLabel();
        String getCategory();
        String getUnit();
        long getPoints();
        LocalDateTime getLastReading();
    }
}
