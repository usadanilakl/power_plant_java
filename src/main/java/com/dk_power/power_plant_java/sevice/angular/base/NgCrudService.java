package com.dk_power.power_plant_java.sevice.angular.base;

import com.dk_power.power_plant_java.dto.SearchCriteria;
import com.dk_power.power_plant_java.entities.base_entities.BaseIdEntity;
import com.dk_power.power_plant_java.entities.categories.Value;
import com.dk_power.power_plant_java.mappers.BaseMapper;
import com.dk_power.power_plant_java.repository.base_repositories.BaseRepository;
import com.dk_power.power_plant_java.sevice.base_services.SyncableService;
import jakarta.persistence.criteria.Predicate;
import org.hibernate.SessionFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.transaction.annotation.Transactional;

import java.lang.reflect.Field;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collection;
import java.util.List;
import java.util.Optional;

@Transactional
public interface NgCrudService<
        E extends BaseIdEntity,
        D,
        R extends BaseRepository<E>,
        M extends BaseMapper> extends FlexibleQueryInterface, ProjectionQueryInterface<E>, SyncableService<E> {

    R getRepo();

    M getMapper();

    SessionFactory getSessionFactory();

    D getDto();

    E getEntity();

    //    E create(Map<String,Object> fields);
    default List<E> getAll() {
        return getRepo().findAll();
    }

    default Page<D> getAll(int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        Page<E> filePage = getRepo().findAll(pageable);
        return filePage.map(this::toDto);
    }

    default Page<D> searchItems(String query, int page, int pageSize) {
        Pageable pageable = PageRequest.of(page - 1, pageSize); // Adjust page number to 0-based index
        Page<E> searchResult = getRepo().findAll((root, criteriaQuery, criteriaBuilder) -> {
            return criteriaBuilder.or(
                    root.getModel().getDeclaredSingularAttributes().stream()
                            .filter(attr -> attr.getJavaType() == String.class)
                            .map(attr -> criteriaBuilder.like(criteriaBuilder.lower(root.get(attr.getName())), "%" + query.toLowerCase() + "%"))
                            .toArray(Predicate[]::new)
            );
        }, pageable);
        return searchResult.map(this::toDto);
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
        return toDto(entityById);
    }

    default D getDtoById(Long id) {
        E entityById = getEntityById(id);
        return toDto(entityById);
    }

    default List<E> getByCreatedBy(String name) {
        return getRepo().findByCreatedBy(name);
    }

    default E save(E entity) {
        return getRepo().save(entity);
    }

    default E saveAndFlush(E entity) {
        return getRepo().saveAndFlush(entity);
    }

    default void deleteById(Long id) {
        getRepo().deleteById(id);
    }

    default E save(D dto) {
        E entity = toEntity(dto);
        return save(entity);
    }

    default E update(E entity) {
        return getRepo().save(entity);
    }

    default E update(D dto) {
        E entity = toEntity(dto);
        return update(entity);
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
        getRepo().delete(entity);
        return entity;
    }

    default E hardDelete(String id) {
        return hardDelete(getEntityById(id));
    }

    default E hardDelete(Long id) {
        return hardDelete(getEntityById(id));
    }

    default E toEntity(D dto) {
        return getMapper().convert(dto, getEntity());
    }

    default D toDto(E entity) {
        return getMapper().convert(entity, getDto());
    }

    default List<D> convertAllToDto(Collection<E> list) {
        return list.stream().map(this::toDto).toList();
    }

    default List<E> convertAllToEntity(Collection<D> list) {
        return list.stream().map(this::toEntity).toList();
    }

    default E create(D dto) {
        return save(toEntity(dto));
    }

    default Boolean existsById(Long id) {
        return getRepo().existsById(id);
    }


    default E getReferenceById(Long fileId) {
        return getRepo().getReferenceById(fileId);
    }

    default Page<D> complexSearch(SearchCriteria criteria, int page, int size, String sortBy, String sortDirection, boolean andLogicIsEnabled) {
        Sort.Direction direction = Sort.Direction.fromString(sortDirection);
        Pageable pageable = PageRequest.of(page, size, Sort.by(direction, sortBy));
        Page<E> itemsPage = complexSearchWithPagination(getRepo(), criteria, pageable, andLogicIsEnabled);

        return itemsPage.map(this::toDto);
    }

    default Page<D> complexSearch(SearchCriteria criteria, int page, int size, String sortBy, String sortDirection, boolean andLogicIsEnabled, SearchCriteria baseCriteria) {
        Sort.Direction direction = Sort.Direction.fromString(sortDirection);
        Pageable pageable = PageRequest.of(page, size, Sort.by(direction, sortBy));
        Page<E> itemsPage = complexSearchWithPagination(getRepo(), criteria, pageable, andLogicIsEnabled, baseCriteria);

        return itemsPage.map(this::toDto);
    }

    default List<E> refactorValues(Value oldValue, Value newValue) {
        List<E> entityList = getRepo().findAll();
        List<E> changedEntities = new ArrayList<>();
        boolean changes = false;

        for (E entity : entityList) {
            boolean entityChanged = refactorEntityValues(entity, oldValue, newValue);

            if (entityChanged) {
                changedEntities.add(getRepo().save(entity));
                changes = true;
            }
        }

        return changedEntities;
    }

    private boolean refactorEntityValues(E entity, Value oldValue, Value newValue) {
        boolean entityChanged = false;
        Class<?> currentClass = entity.getClass();

        while (currentClass != null && !currentClass.equals(Object.class)) {
            for (Field field : currentClass.getDeclaredFields()) {
                field.setAccessible(true);
                try {
                    if (field.getType().equals(Value.class)) {
                        Value fieldValue = (Value) field.get(entity);
                        if (fieldValue != null && fieldValue.getId() != null
                                && fieldValue.getId().equals(oldValue.getId())) {
                            field.set(entity, newValue);
                            entityChanged = true;
                        }
                    } else if (Collection.class.isAssignableFrom(field.getType())) {
                        Collection<?> collection = (Collection<?>) field.get(entity);
                        if (collection != null) {
                            List<Object> mutableList = new ArrayList<>(collection);
                            boolean removed = mutableList.removeIf(item ->
                                    item instanceof Value v && v.getId() != null
                                            && v.getId().equals(oldValue.getId()));
                            if (removed) {
                                mutableList.add(newValue);
                                field.set(entity, mutableList);
                                entityChanged = true;
                            }
                        }
                    }
                } catch (IllegalAccessException e) {
                    // Handle exception (log it, throw a custom exception, etc.)
                    e.printStackTrace();
                }
            }
            currentClass = currentClass.getSuperclass();
        }

        return entityChanged;
    }

    default boolean containsValue(E entity, Value value) {
        if (entity == null || value == null) {
            return false;
        }

        Class<?> entityClass = entity.getClass();

        // Check all fields of the entity
        for (Field field : entityClass.getDeclaredFields()) {
            field.setAccessible(true);

            try {
                // Check if the field is of type Value
                if (field.getType().equals(Value.class)) {
                    Value fieldValue = (Value) field.get(entity);
                    if (fieldValue != null && fieldValue.equals(value)) {
                        return true;
                    }
                }
                // Check if the field is a collection of Values
                else if (Collection.class.isAssignableFrom(field.getType())) {
                    Collection<?> collection = (Collection<?>) field.get(entity);
                    if (collection != null) {
                        for (Object item : collection) {
                            if (item instanceof Value && item.equals(value)) {
                                return true;
                            }
                        }
                    }
                }
            } catch (IllegalAccessException e) {
                // Log the exception or handle it as appropriate for your application
                e.printStackTrace();
            }
        }

        // Check fields from superclasses
        Class<?> superClass = entityClass.getSuperclass();
        while (superClass != null && !superClass.equals(Object.class)) {
            for (Field field : superClass.getDeclaredFields()) {
                field.setAccessible(true);

                try {
                    // Check if the field is of type Value
                    if (field.getType().equals(Value.class)) {
                        Value fieldValue = (Value) field.get(entity);
                        if (fieldValue != null && fieldValue.equals(value)) {
                            return true;
                        }
                    }
                    // Check if the field is a collection of Values
                    else if (Collection.class.isAssignableFrom(field.getType())) {
                        Collection<?> collection = (Collection<?>) field.get(entity);
                        if (collection != null) {
                            for (Object item : collection) {
                                if (item instanceof Value && item.equals(value)) {
                                    return true;
                                }
                            }
                        }
                    }
                } catch (IllegalAccessException e) {
                    // Log the exception or handle it as appropriate for your application
                    e.printStackTrace();
                }
            }
            superClass = superClass.getSuperclass();
        }

        return false;
    }

    default List<E> findByValue(Value value) {
        List<E> result = new ArrayList<>();
        for (E entity : getRepo().findAll()) {
            if (containsValue(entity, value)) {
                result.add(entity);
            }
        }
        return result;
    }

    // Synchronization methods
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