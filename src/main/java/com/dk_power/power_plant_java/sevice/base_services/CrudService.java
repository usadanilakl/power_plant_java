package com.dk_power.power_plant_java.sevice.base_services;

import com.dk_power.power_plant_java.annotations.Association;
import com.dk_power.power_plant_java.entities.base_entities.BaseIdEntity;
import com.dk_power.power_plant_java.mappers.BaseMapper;
import com.dk_power.power_plant_java.repository.base_repositories.BaseRepository;
import org.hibernate.Session;
import org.hibernate.SessionFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;

import java.lang.reflect.Field;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface CrudService<
        E extends BaseIdEntity,
        D,
        R extends BaseRepository<E>,
        M extends BaseMapper> {
    E getEntity();

    D getDto();

    R getRepo();

    M getMapper();

    SessionFactory getSessionFactory();

    //    @PostConstruct
    public default void enableFilter() {
        Session session = getSessionFactory().getCurrentSession();
        session.enableFilter("deletedFilter").setParameter("isDeleted", false);
    }

    default List<E> getAll() {
        return getRepo().findAll();
    }

    default List<E> getAllSorted(String column) {
        return getRepo().findAll(Sort.by(column));
    }

    default List<D> getAllDtos() {
        return getAll().stream().map(e -> getMapper().convert(e, getDto())).toList();
    }

    default E getEntityById(Long id) {
        return getRepo().findById(id).orElse(null);
    }

    default E getEntityById(String id) {
        return getRepo().findById(Long.parseLong(id)).orElse(null);
    }

    default D getDtoById(String id) {
        E entityById = getEntityById(id);
        return convertToDto(entityById);
    }

    default D getDtoById(Long id) {
        E entityById = getEntityById(id);
        return convertToDto(entityById);
    }

    default List<E> getByCreatedBy(String name) {
        return getRepo().findByCreatedBy(name);
    }

    default E save(E entity) {
        return getRepo().save(entity);
    }

    default E save(D dto) {
        E entity = convertToEntity(dto);
        return save(entity);
    }

    default E update(E entity) {
        return getRepo().save(entity);
    }

    default E update(String id) {
        return getRepo().save(getEntityById(id));
    }

    default E softDelete(E entity) {
        entity.setDeleted(true);
        return save(entity);
    }

    default E softDelete(String id) {
        return softDelete(getEntityById(id));
    }

    default E softDelete(Long id) {
        return softDelete(getEntityById(id));
    }

    default E hardDelete(E entity) {
        breakAssociations(entity);
        getRepo().delete(entity);
        return entity;
    }

    default void breakAssociations(E entity) {
        Class<?> clazz = entity.getClass();
        Field[] fields = clazz.getDeclaredFields();

        for (Field field : fields) {
            if (field.isAnnotationPresent(Association.class)) {
                field.setAccessible(true);
                try {
                    Object value = field.get(entity);
                    if (value instanceof Collection<?>) {
                        Collection<?> collection = (Collection<?>) value;
                        for (Object associatedEntity : new ArrayList<>(collection)) {
                            removeAssociation(associatedEntity, entity);
                        }
                        collection.clear();
                    } else if (value != null) {
                        removeAssociation(value, entity);
                        field.set(entity, null);
                    }
                } catch (IllegalAccessException e) {
                    throw new RuntimeException("Error breaking associations", e);
                }
            }
        }
    }

    default void removeAssociation(Object associatedEntity, E entity) {
        Class<?> associatedClass = associatedEntity.getClass();
        Field[] associatedFields = associatedClass.getDeclaredFields();

        for (Field associatedField : associatedFields) {
            associatedField.setAccessible(true);
            try {
                Object fieldValue = associatedField.get(associatedEntity);
                if (fieldValue == entity) {
                    associatedField.set(associatedEntity, null);
                } else if (fieldValue instanceof Collection) {
                    ((Collection<?>) fieldValue).remove(entity);
                }
            } catch (IllegalAccessException e) {
                throw new RuntimeException("Error removing bidirectional association", e);
            }
        }
    }

    default List<E> getAllSoftDeleted() {
        return getRepo().findByDeletedTrue();
    }

    default E convertToEntity(D dto) {
        return getMapper().convert(dto, getEntity());
    }

    default D convertToDto(E entity) {
        return getMapper().convert(entity, getDto());
    }

    default Collection<D> convertAllToDto(Collection<E> list) {
        return list.stream().map(this::convertToDto).toList();
    }

    default Collection<E> convertAllToEntity(Collection<D> list) {
        return list.stream().map(this::convertToEntity).toList();
    }


    //Synchronization methods
    default List<E> getAllSince(LocalDateTime since) {
        return getRepo().findAllByDateModifiedAfter(since);
    }

    default void processSyncItem(E item) {
        if (item == null || item.getId() == null) {
            return;
        }
        getRepo().saveAndFlush(item);
    }

    default void processSyncItems(List<E> items) {
        if (items == null || items.isEmpty()) {
            return;
        }
        items.forEach(this::processSyncItem);
    }

    default Page<E> getAllSincePaginated(LocalDateTime lastSyncTime, Pageable pageable) {
        return getRepo().findAllByDateModifiedAfterOrderByDateModifiedAsc(lastSyncTime, pageable);
    }

    default Page<E> getAllSinceAndUntilPaginated(LocalDateTime since, LocalDateTime until, Pageable pageable) {
        return getRepo().findAllByDateModifiedBetween(since, until, pageable);
    }

    default Optional<E> findById(Long id) {
        return getRepo().findById(id);
    }

}
