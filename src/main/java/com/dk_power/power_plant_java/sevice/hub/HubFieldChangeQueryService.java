package com.dk_power.power_plant_java.sevice.hub;

import com.dk_power.power_plant_java.entities.sync.FieldChange;
import jakarta.persistence.EntityManager;
import jakarta.persistence.TypedQuery;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;

/**
 * Provides field-change queries not available in FieldChangeRepository.
 * Uses EntityManager directly since we cannot modify the existing repository.
 * Only active when sync.role=hub.
 */
@Service
@ConditionalOnProperty(name = "sync.role", havingValue = "hub")
@RequiredArgsConstructor
@Slf4j
public class HubFieldChangeQueryService {

    private final EntityManager entityManager;

    @Transactional(readOnly = true)
    public Instant findLatestChangeTime() {
        try {
            return entityManager.createQuery(
                "SELECT MAX(fc.timestamp) FROM FieldChange fc", Instant.class)
                .getSingleResult();
        } catch (Exception e) {
            log.debug("Could not find latest change time: {}", e.getMessage());
            return null;
        }
    }

    @Transactional(readOnly = true)
    public Instant findOldestChangeTime() {
        try {
            return entityManager.createQuery(
                "SELECT MIN(fc.timestamp) FROM FieldChange fc", Instant.class)
                .getSingleResult();
        } catch (Exception e) {
            log.debug("Could not find oldest change time: {}", e.getMessage());
            return null;
        }
    }

    @SuppressWarnings("unchecked")
    @Transactional(readOnly = true)
    public List<java.sql.Date> findDistinctChangeDates() {
        try {
            return entityManager.createNativeQuery(
                "SELECT DISTINCT CAST(timestamp AS DATE) as sync_date FROM field_change ORDER BY sync_date DESC")
                .getResultList();
        } catch (Exception e) {
            log.error("Error finding distinct change dates: {}", e.getMessage());
            return List.of();
        }
    }

    @Transactional(readOnly = true)
    public long countChangesSince(Instant since) {
        try {
            return entityManager.createQuery(
                "SELECT COUNT(fc) FROM FieldChange fc WHERE fc.timestamp >= :since", Long.class)
                .setParameter("since", since)
                .getSingleResult();
        } catch (Exception e) {
            log.error("Error counting changes since {}: {}", since, e.getMessage());
            return 0;
        }
    }

    @Transactional(readOnly = true)
    public List<FieldChange> findChangesByEntityTypeSince(String entityType, Instant since) {
        try {
            return entityManager.createQuery(
                "SELECT fc FROM FieldChange fc WHERE fc.entityType = :entityType AND fc.timestamp >= :since ORDER BY fc.timestamp ASC",
                FieldChange.class)
                .setParameter("entityType", entityType)
                .setParameter("since", since)
                .getResultList();
        } catch (Exception e) {
            log.error("Error finding changes for {} since {}: {}", entityType, since, e.getMessage());
            return List.of();
        }
    }

    @Transactional(readOnly = true)
    public Page<FieldChange> findChangesSincePaginated(Instant since, Pageable pageable) {
        // Count total
        long total = countChangesSince(since);

        // Fetch page
        TypedQuery<FieldChange> query = entityManager.createQuery(
            "SELECT fc FROM FieldChange fc WHERE fc.timestamp >= :since ORDER BY fc.timestamp ASC",
            FieldChange.class)
            .setParameter("since", since)
            .setFirstResult((int) pageable.getOffset())
            .setMaxResults(pageable.getPageSize());

        List<FieldChange> content = query.getResultList();
        return new PageImpl<>(content, pageable, total);
    }
}
