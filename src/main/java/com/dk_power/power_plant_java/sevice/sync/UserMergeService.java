package com.dk_power.power_plant_java.sevice.sync;

import com.dk_power.power_plant_java.entities.users.User;
import com.dk_power.power_plant_java.sevice.ServiceFacade;
import com.dk_power.power_plant_java.sevice.base_services.SyncableService;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.lang.reflect.Field;
import java.util.ArrayList;
import java.util.List;

/**
 * Detects and merges duplicate User entities.
 * Duplicates arise when AdminUserSeeder creates a local bootstrap user and
 * sync later brings the "real" user from the hub with the same windowsUsername
 * but a different ID and email.
 *
 * Detection key: windowsUsername (the OS-level identity used for auto-login).
 * Winner: lowest ID (deterministic, consistent with all other merge services).
 *
 * All entities referencing the duplicate User are re-pointed to the canonical
 * User via reflection (synced entities) and native SQL (non-synced entities
 * like PasswordResetToken and AccessGrant).
 */
@Service
@Slf4j
@RequiredArgsConstructor
public class UserMergeService {

    private final ServiceFacade serviceFacade;
    private final EntityTableRegistry entityTableRegistry;
    private final SyncContext syncContext;

    @PersistenceContext
    private EntityManager entityManager;

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void mergeIfDuplicatesExist() {
        boolean wasSyncing = syncContext.isSyncing();
        if (wasSyncing) {
            syncContext.endSync();
        }
        try {
            int merged = mergeUsers();
            if (merged > 0) {
                log.info("User merge complete: {} users deduplicated", merged);
            }
        } finally {
            if (wasSyncing) {
                syncContext.startSync();
            }
        }
    }

    @SuppressWarnings("unchecked")
    private int mergeUsers() {
        // Find windowsUsernames that have more than one active user
        List<Object[]> duplicates = entityManager.createNativeQuery(
            "SELECT LOWER(windows_username), COUNT(*) FROM users " +
            "WHERE deleted = false AND windows_username IS NOT NULL AND windows_username <> '' " +
            "GROUP BY LOWER(windows_username) HAVING COUNT(*) > 1")
            .getResultList();

        int merged = 0;
        for (Object[] row : duplicates) {
            String windowsUsername = (String) row[0];
            merged += mergeUsersByWindowsUsername(windowsUsername);
        }
        return merged;
    }

    private int mergeUsersByWindowsUsername(String windowsUsername) {
        List<User> users = entityManager.createQuery(
            "SELECT u FROM User u WHERE LOWER(u.windowsUsername) = LOWER(:wun) " +
            "AND u.deleted = false ORDER BY u.id",
            User.class)
            .setParameter("wun", windowsUsername)
            .getResultList();

        if (users.size() <= 1) return 0;

        User canonical = users.get(0); // Lowest ID wins
        int merged = 0;

        for (int i = 1; i < users.size(); i++) {
            User duplicate = users.get(i);

            // Re-point all references across synced entity types (dynamic reflection)
            refactorAllReferences(duplicate, canonical);

            // Re-point non-synced entities via native SQL
            refactorNonSyncedReferences(duplicate.getId(), canonical.getId());

            // Soft-delete via JPA so FieldChangeEntityListener fires
            duplicate.setDeleted(true);
            entityManager.merge(duplicate);
            entityManager.flush();
            merged++;

            log.info("User merge: '{}' ID={} ({}) merged into ID={} ({})",
                windowsUsername, duplicate.getId(), duplicate.getEmail(),
                canonical.getId(), canonical.getEmail());
        }

        return merged;
    }

    /**
     * Re-point all User references across synced entity types using reflection.
     * Scans all registered entity types for User-typed fields and updates any
     * that reference the duplicate to point to the canonical user.
     */
    private void refactorAllReferences(User duplicate, User canonical) {
        for (String entityType : entityTableRegistry.getSyncOrder()) {
            if ("User".equals(entityType)) continue;

            try {
                SyncableService<?> service = serviceFacade.getService(entityType);
                if (service == null) continue;

                Class<?> entityClass = service.getEntity().getClass();

                // Find all User-typed fields via reflection on the class hierarchy
                List<Field> userFields = new ArrayList<>();
                Class<?> cls = entityClass;
                while (cls != null && !cls.equals(Object.class)) {
                    for (Field field : cls.getDeclaredFields()) {
                        if (field.getType().equals(User.class)) {
                            userFields.add(field);
                        }
                    }
                    cls = cls.getSuperclass();
                }

                if (userFields.isEmpty()) continue;

                // Build JPQL to find entities referencing the duplicate User
                StringBuilder jpql = new StringBuilder("SELECT e FROM ")
                        .append(entityType).append(" e WHERE ");
                for (int j = 0; j < userFields.size(); j++) {
                    if (j > 0) jpql.append(" OR ");
                    jpql.append("e.").append(userFields.get(j).getName()).append(".id = :dupId");
                }

                List<?> entities = entityManager.createQuery(jpql.toString())
                        .setParameter("dupId", duplicate.getId())
                        .getResultList();

                if (entities.isEmpty()) continue;

                int updated = 0;
                for (Object entity : entities) {
                    boolean changed = false;
                    for (Field field : userFields) {
                        field.setAccessible(true);
                        User fieldValue = (User) field.get(entity);
                        if (fieldValue != null && duplicate.getId().equals(fieldValue.getId())) {
                            field.set(entity, canonical);
                            changed = true;
                        }
                    }
                    if (changed) {
                        entityManager.merge(entity);
                        updated++;
                    }
                }

                if (updated > 0) {
                    log.info("Re-pointed {} {} entities from User #{} to #{}",
                            updated, entityType, duplicate.getId(), canonical.getId());
                }
            } catch (Exception e) {
                log.warn("Error re-pointing {} User references: {}", entityType, e.getMessage());
            }
        }
    }

    /**
     * Re-point User references in non-synced entities that aren't in SYNC_ORDER.
     * Uses native SQL since these entities don't have SyncableService implementations.
     * IMPORTANT: Must check table existence BEFORE running SQL — on fresh DBs these
     * tables may not exist, and a failed native SQL marks the Hibernate session
     * rollback-only (even if caught), which would silently kill the entire merge.
     */
    private void refactorNonSyncedReferences(Long duplicateId, Long canonicalId) {
        // PasswordResetToken — ephemeral tokens, just delete for the duplicate user
        if (tableExists("PASSWORD_RESET_TOKEN")) {
            int deleted = entityManager.createNativeQuery(
                "DELETE FROM password_reset_token WHERE user_id = :dupId")
                .setParameter("dupId", duplicateId)
                .executeUpdate();
            if (deleted > 0) {
                log.debug("Deleted {} password reset tokens for duplicate User #{}", deleted, duplicateId);
            }
        }

        // AccessGrant — re-point user_id and approved_by_id
        if (tableExists("ACCESS_GRANT")) {
            int updated = entityManager.createNativeQuery(
                "UPDATE access_grant SET user_id = :canId WHERE user_id = :dupId")
                .setParameter("canId", canonicalId)
                .setParameter("dupId", duplicateId)
                .executeUpdate();
            updated += entityManager.createNativeQuery(
                "UPDATE access_grant SET approved_by_id = :canId WHERE approved_by_id = :dupId")
                .setParameter("canId", canonicalId)
                .setParameter("dupId", duplicateId)
                .executeUpdate();
            if (updated > 0) {
                log.debug("Re-pointed {} access grants from User #{} to #{}", updated, duplicateId, canonicalId);
            }
        }
    }

    @SuppressWarnings("unchecked")
    private boolean tableExists(String tableName) {
        List<Object> result = entityManager.createNativeQuery(
            "SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = :name")
            .setParameter("name", tableName)
            .getResultList();
        return !result.isEmpty();
    }
}
