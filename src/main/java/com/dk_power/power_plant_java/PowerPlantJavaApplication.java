package com.dk_power.power_plant_java;

import com.dk_power.power_plant_java.entities.permits.lotos.BaseLoto;
import com.dk_power.power_plant_java.entities.permits.lotos.Loto;
import com.dk_power.power_plant_java.entities.users.User;
import com.dk_power.power_plant_java.repository.permits.BasePermitRepo;
import com.dk_power.power_plant_java.repository.permits.PermitNumbersRepo;
import com.dk_power.power_plant_java.repository.permits.loto_repo.BaseLotoRepo;
import com.dk_power.power_plant_java.repository.permits.loto_repo.LotoRepo;
import com.dk_power.power_plant_java.repository.users.UserRepo;
import com.dk_power.power_plant_java.util.DataGenerator;
import jakarta.persistence.EntityManager;
import jakarta.persistence.EntityManagerFactory;
import lombok.AllArgsConstructor;
import org.hibernate.envers.AuditReader;
import org.hibernate.envers.AuditReaderFactory;
import org.hibernate.envers.RevisionType;
import org.hibernate.envers.query.AuditEntity;
import org.hibernate.envers.query.AuditQuery;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

import java.util.List;

@SpringBootApplication
@AllArgsConstructor
public class PowerPlantJavaApplication implements CommandLineRunner {
private final UserRepo userRepo;
private final LotoRepo lotoRepo;
private final BasePermitRepo basePermitRepo;
private final PermitNumbersRepo permitNumbersRepo;
private final BaseLotoRepo baseLotoRepo;
private final DataGenerator dataGenerator;
private final EntityManager entityManager;
private EntityManagerFactory entityManagerFactory;

    public static void main(String[] args) {
        SpringApplication.run(PowerPlantJavaApplication.class, args);

    }

    @Override
    public void run(String... args) throws Exception {
        EntityManager entityManager = entityManagerFactory.createEntityManager();
        try {
            AuditReader reader = AuditReaderFactory.get(entityManager);
            // get an audited entity by primary key and revision number
            Loto entity = reader.find(Loto.class, 652, 141);

            // get a list of revisions for a specific entity
            AuditQuery query = reader.createQuery().forRevisionsOfEntity(Loto.class, false, true);
            query.add(AuditEntity.id().eq(652));
            List<Object[]> result = query.getResultList();
            result.forEach(e->{
                System.out.println("================================");
                System.out.println(((Loto) e[0]).getWorkScope());
                System.out.println(e[1].toString());
                System.out.println((RevisionType) e[2]);
                System.out.println("================================");
            });
        } finally {
            if (entityManager != null) {
                entityManager.close();
            }
        }



    }
}
