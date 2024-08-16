package com.dk_power.power_plant_java.sevice.base_services;

import com.dk_power.power_plant_java.sevice.users.impl.CustomUserDetails;
import com.dk_power.power_plant_java.sevice.users.impl.UserDetailsServiceImpl;
import jakarta.persistence.EntityManager;
import jakarta.persistence.EntityManagerFactory;
import org.hibernate.envers.AuditReader;
import org.hibernate.envers.AuditReaderFactory;
import org.hibernate.envers.query.AuditEntity;
import org.hibernate.envers.query.AuditQuery;

import java.util.ArrayList;
import java.util.List;

public interface AuditingService<E> {
    UserDetailsServiceImpl getUserDetails();
    EntityManagerFactory getEntityManager();
    default List<E> getRevision(Long id, Class<E> entityClass){
        EntityManager entityManager = getEntityManager().createEntityManager();
        List<E> entities = new ArrayList<>();
        try {
            AuditReader reader = AuditReaderFactory.get(entityManager);
            AuditQuery query = reader.createQuery().forRevisionsOfEntity(entityClass, false, true);
            query.add(AuditEntity.id().eq(id));
            List<Object[]> result = query.getResultList();
            result.forEach(e->entities.add(entityClass.cast(e[0])));

        } finally {
            if (entityManager != null) {
                entityManager.close();
            }
        }
        return entities;
    }
    default String getLoggedInUserName(){
        return getUserDetails().getUsersName();
    }
    default String getCurrentUsername(){
        return getUserDetails().getUsersName();
    }
}
