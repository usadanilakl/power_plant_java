package com.dk_power.power_plant_java.sevice.loto;

import com.dk_power.power_plant_java.dto.permits.LotoDto;
import com.dk_power.power_plant_java.entities.loto.Lock;
import com.dk_power.power_plant_java.entities.loto.Loto;
import com.dk_power.power_plant_java.entities.loto.LotoBox;
import com.dk_power.power_plant_java.entities.loto.LotoPoint;
import com.dk_power.power_plant_java.mappers.UniversalMapper;
import com.dk_power.power_plant_java.repository.loto.LockRepo;
import com.dk_power.power_plant_java.repository.loto.LotoBoxRepo;
import com.dk_power.power_plant_java.repository.loto.LotoPointRepo;
import com.dk_power.power_plant_java.repository.loto.LotoRepo;
import com.dk_power.power_plant_java.sevice.angular.NgValueService;
import com.dk_power.power_plant_java.sevice.loto.loto_point.LotoPointService;
import com.dk_power.power_plant_java.sevice.users.impl.UserDetailsServiceImpl;
import jakarta.persistence.EntityManager;
import jakarta.persistence.EntityManagerFactory;
import jakarta.persistence.EntityNotFoundException;
import jakarta.persistence.EntityTransaction;
import lombok.AllArgsConstructor;
import org.hibernate.SessionFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Service
@AllArgsConstructor
@Transactional
public class LotoServiceImpl implements LotoService {
    private final LotoRepo lotoRepo;
    private final UserDetailsServiceImpl customUserDetails;
    private final UniversalMapper universalMapper;
    private final EntityManagerFactory entityManagerFactory;
    private final LotoPointService lotoPointService;
    private final SessionFactory sessionFactory;
    private final NgValueService ngValueService;
    private final LotoBoxRepo lotoBoxRepo;
    private final LockRepo lockRepo;
    private final LotoPointRepo lotoPointRepo;

    @Override
    public NgValueService getNgValueService() {
        return this.ngValueService;
    }


    @Override
    public UserDetailsServiceImpl getUserDetails() {
        return customUserDetails;
    }

    @Override
    public EntityManagerFactory getEntityManager() {
        return entityManagerFactory;
    }

    @Override
    public Loto getEntity() {
        return new Loto();
    }

    @Override
    public LotoDto getDto() {
        return new LotoDto();
    }

    @Override
    public LotoRepo getRepo() {
        return lotoRepo;
    }

    @Override
    public UniversalMapper getMapper() {
        return universalMapper;
    }

    @Override
    public SessionFactory getSessionFactory() {
        return sessionFactory;
    }

    @Transactional
    @Override
    public void deleteAllLotos() {
        EntityManager entityManager = entityManagerFactory.createEntityManager();
        EntityTransaction transaction = entityManager.getTransaction();

        try {
            transaction.begin();

            // Clear LotoBox relationships
            entityManager.createNativeQuery("UPDATE BOX SET LOTO = NULL WHERE LOTO IS NOT NULL")
                    .executeUpdate();

            // Clear Lock relationships
            entityManager.createNativeQuery("UPDATE LOCK SET LOTO_ID = NULL WHERE LOTO_ID IS NOT NULL")
                    .executeUpdate();

            // Remove LotoPoint associations
            entityManager.createNativeQuery("DELETE FROM LOTO_POINTS")
                    .executeUpdate();
            entityManager.createNativeQuery("DELETE FROM LOTO_LOTO_POINT")
                    .executeUpdate();

            // Delete all Lotos
            entityManager.createNativeQuery("DELETE FROM LOTO")
                    .executeUpdate();

            transaction.commit();
        } catch (Exception e) {
            if (transaction.isActive()) {
                transaction.rollback();
            }
            throw new RuntimeException("Failed to delete all Lotos", e);
        } finally {
            entityManager.close();
        }
    }

    @Transactional
    public void modifyLotoSchema() {
        EntityManager entityManager = entityManagerFactory.createEntityManager();
        EntityTransaction transaction = entityManager.getTransaction();

        try {
            transaction.begin();

            // Drop the foreign key constraint in the BOX table
            entityManager.createNativeQuery("ALTER TABLE BOX DROP CONSTRAINT IF EXISTS FK_BOX_LOTO")
                    .executeUpdate();

            // Drop the LOTO column from the BOX table
            entityManager.createNativeQuery("ALTER TABLE BOX DROP COLUMN IF EXISTS LOTO")
                    .executeUpdate();

            // Drop the foreign key constraint in the LOCK table
            entityManager.createNativeQuery("ALTER TABLE LOCK DROP CONSTRAINT IF EXISTS FK_LOCK_LOTO")
                    .executeUpdate();

            // Drop the LOTO_ID column from the LOCK table
            entityManager.createNativeQuery("ALTER TABLE LOCK DROP COLUMN IF EXISTS LOTO_ID")
                    .executeUpdate();

            // Drop the junction table for the many-to-many relationship
            entityManager.createNativeQuery("DROP TABLE IF EXISTS loto_points")
                    .executeUpdate();
            entityManager.createNativeQuery("DROP TABLE IF EXISTS loto_points_aud")
                    .executeUpdate();
            entityManager.createNativeQuery("DROP TABLE IF EXISTS loto_loto_point")
                    .executeUpdate();
            entityManager.createNativeQuery("DROP TABLE IF EXISTS loto_loto_point_aud")
                    .executeUpdate();

            // Remove the LOTO_BOX column from the LOTO table if it exists
            entityManager.createNativeQuery("ALTER TABLE LOTO DROP COLUMN IF EXISTS LOTO_BOX")
                    .executeUpdate();

            transaction.commit();
        } catch (Exception e) {
            if (transaction.isActive()) {
                transaction.rollback();
            }
            throw new RuntimeException("Failed to modify Loto schema", e);
        } finally {
            entityManager.close();
        }
    }

    @Override
    @Transactional
    public void modifyLotoSnapshotSchema() {
        EntityManager entityManager = entityManagerFactory.createEntityManager();
        EntityTransaction transaction = entityManager.getTransaction();

        try {
            transaction.begin();

            // Drop the unique constraint on loto_id if it exists
            // H2 doesn't support IF EXISTS for dropping constraints, so we'll use a try-catch block
            try {
                entityManager.createNativeQuery(
                        "ALTER TABLE loto_snapshot DROP CONSTRAINT UK_CVAK75JCVYNRCSW6VLO4DG3DX"
                ).executeUpdate();
                System.out.println("Constraint (by name) dropped successfully");
            } catch (Exception e) {
                // Constraint doesn't exist, continue
                System.out.println("Constraint (by name) not found or has a different name");
            }

            // H2 doesn't support querying information_schema for constraints in the same way
            // We'll try to drop any unique constraint on the loto_id column
            try {
                entityManager.createNativeQuery(
                        "ALTER TABLE loto_snapshot DROP CONSTRAINT IF EXISTS loto_snapshot_loto_id_key"
                ).executeUpdate();
                System.out.println("Constraint (by key) dropped successfully");
            } catch (Exception e) {
                // Constraint doesn't exist or has a different name, continue
                System.out.println("Constraint (by key) not found or has a different name");
            }

            // Ensure the loto_id column is not marked as unique
            // H2 doesn't support ALTER COLUMN DROP NOT NULL, so we'll modify the column
            entityManager.createNativeQuery(
                    "ALTER TABLE loto_snapshot ALTER COLUMN loto_id BIGINT"
            ).executeUpdate();
            System.out.println("Table loto_snapshot column loto_id was altered and set to BIGINT");

            transaction.commit();
        } catch (Exception e) {
            if (transaction.isActive()) {
                transaction.rollback();
            }
            throw new RuntimeException("Failed to modify LotoSnapshot schema", e);
        } finally {
            entityManager.close();
        }
    }

    @Override
    public void deleteLotoSnapshotTable() {
        EntityManager entityManager = entityManagerFactory.createEntityManager();
        EntityTransaction transaction = entityManager.getTransaction();

        try {
            transaction.begin();

            entityManager.createNativeQuery("DROP TABLE IF EXISTS LOTO_SNAPSHOT_POINTS_AUD")
                    .executeUpdate();

            entityManager.createNativeQuery("DROP TABLE IF EXISTS LOTO_SNAPSHOT_POINTS")
                    .executeUpdate();

            entityManager.createNativeQuery("DROP TABLE IF EXISTS LOTO_SNAPSHOT_AUD")
                    .executeUpdate();

            entityManager.createNativeQuery("DROP TABLE IF EXISTS LOTO_SNAPSHOT")
                    .executeUpdate();

            transaction.commit();
        } catch (Exception e) {
            if (transaction.isActive()) {
                transaction.rollback();
            }
            throw new RuntimeException("Failed to modify Loto schema", e);
        } finally {
            entityManager.close();
        }
    }
}
