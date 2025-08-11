package com.dk_power.power_plant_java.sevice.angular.base;

import com.dk_power.power_plant_java.dto.SearchCriteria;
import com.dk_power.power_plant_java.entities.base_entities.BaseIdEntity;
import jakarta.persistence.EntityManager;
import jakarta.persistence.Tuple;
import jakarta.persistence.TypedQuery;
import jakarta.persistence.criteria.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.lang.reflect.Field;
import java.lang.reflect.ParameterizedType;
import java.util.*;
import java.util.stream.Collectors;

@Service
public interface ProjectionQueryInterface<E extends BaseIdEntity> {

    EntityManager getEntityManager();

    Class<E> getEntityClass();

    Logger log = LoggerFactory.getLogger(ProjectionQueryInterface.class);

    /**
     * Retrieves all entities with specified fields projected.
     * This method allows for selective fetching of entity fields, including nested properties.
     *
     * @param fields A list of field names to be projected. These can include nested properties using dot notation.
     * @return A list of entities with only the specified fields populated.
     */

    default List<E> findAllWithProjection(List<String> fields) {
        CriteriaBuilder cb = getEntityManager().getCriteriaBuilder();
        CriteriaQuery<Tuple> query = cb.createTupleQuery();
        Root<E> root = query.from(getEntityClass());

        List<Selection<?>> selections = new ArrayList<>();
        Map<String, Join<?, ?>> joins = new HashMap<>();

        for (String field : fields) {
            Selection<?> selection = getSelection(root, field, joins);
            selections.add(selection);
        }

        query.multiselect(selections);

        List<Tuple> results = getEntityManager().createQuery(query).getResultList();

        return results.stream()
                .map(tuple -> buildEntity(tuple, fields))
                .collect(Collectors.toList());
    }

    /**
     * Retrieves a paginated list of entities with specified fields projected.
     * This method allows for selective fetching of entity fields, including nested properties,
     * with support for pagination and sorting.
     *
     * @param fields   A list of field names to be projected. These can include nested properties using dot notation.
     * @param pageable Pagination information including page number, size, and sorting details.
     * @return A Page object containing the list of entities with only the specified fields populated,
     * along with pagination metadata.
     */
    default Page<E> findAllWithProjectionPaginated(List<String> fields, Pageable pageable) {
        CriteriaBuilder cb = getEntityManager().getCriteriaBuilder();
        CriteriaQuery<Tuple> query = cb.createTupleQuery();
        Root<E> root = query.from(getEntityClass());

        List<Selection<?>> selections = new ArrayList<>();
        Map<String, Join<?, ?>> joins = new HashMap<>();

        for (String field : fields) {
            Selection<?> selection = getSelectionWithJoin(cb, root, field, joins);
            selections.add(selection);
//            log.debug("Added selection for field: {}", field);
        }

        query.multiselect(selections);
        query.distinct(true);

        // Apply sorting
        if (pageable.getSort().isSorted()) {
            List<Order> orders = new ArrayList<>();
            pageable.getSort().forEach(order -> {
                Expression<?> expression = getExpressionWithJoin(cb, root, order.getProperty(), joins);
                if (order.isAscending()) {
                    orders.add(cb.asc(expression));
                } else {
                    orders.add(cb.desc(expression));
                }
//                log.debug("Added sort order: {} {}", order.getProperty(), order.getDirection());
            });
            query.orderBy(orders);
        }

        // Execute query with pagination
        TypedQuery<Tuple> typedQuery = getEntityManager().createQuery(query);

        List<Tuple> results = typedQuery
                .setFirstResult((int) pageable.getOffset())
                .setMaxResults(pageable.getPageSize())
                .getResultList();

        List<E> entities = results.stream()
                .map(tuple -> buildEntity(tuple, fields))
                .collect(Collectors.toList());

        // Count total elements
        CriteriaQuery<Long> countQuery = cb.createQuery(Long.class);
        Root<E> countRoot = countQuery.from(getEntityClass());
        countQuery.select(cb.count(countRoot));
        Long totalElements = getEntityManager().createQuery(countQuery).getSingleResult();

        Map<Long, E> uniqueEntities = new LinkedHashMap<>();
        for (E entity : entities) {
            Long id = entity.getId();
            if (uniqueEntities.containsKey(id)) {
                E existingEntity = uniqueEntities.get(id);
                mergeCollectionFields(existingEntity, entity);
            } else {
                uniqueEntities.put(id, entity);
            }
        }

        List<E> deduplicatedEntities = new ArrayList<>(uniqueEntities.values());

        return new PageImpl<>(deduplicatedEntities, pageable, totalElements);
    }


    default Page<E> findAllWithProjectionPaginated(List<String> fields, Pageable pageable, SearchCriteria searchCriteria) {
        CriteriaBuilder cb = getEntityManager().getCriteriaBuilder();
        CriteriaQuery<Tuple> query = cb.createTupleQuery();
        Root<E> root = query.from(getEntityClass());

        List<Selection<?>> selections = new ArrayList<>();
        Map<String, Join<?, ?>> joins = new HashMap<>();

        for (String field : fields) {
            Selection<?> selection = getSelectionWithJoin(cb, root, field, joins);
            selections.add(selection);
//            log.debug("Added selection for field: {}", field);
        }

        query.multiselect(selections);
        query.distinct(true);

        // Apply search criteria
        List<Predicate> predicates = new ArrayList<>();
        if (searchCriteria != null && !searchCriteria.getFilters().isEmpty()) {
            for (Map.Entry<String, String> entry : searchCriteria.getFilters().entrySet()) {
                String key = entry.getKey();
                String value = entry.getValue();
                if (value != null && !value.isEmpty()) {
                    Expression<?> expression = getExpressionWithJoin(cb, root, key, joins);
                    predicates.add(cb.like(cb.lower(expression.as(String.class)), "%" + value.toLowerCase() + "%"));
//                    log.debug("Added search criteria: {} LIKE %{}%", key, value);
                }
            }
        }

        if (!predicates.isEmpty()) {
            query.where(cb.and(predicates.toArray(new Predicate[0])));
        }

        // Apply sorting
        if (pageable.getSort().isSorted()) {
            List<Order> orders = new ArrayList<>();
            pageable.getSort().forEach(order -> {
                Expression<?> expression = getExpressionWithJoin(cb, root, order.getProperty(), joins);
                if (order.isAscending()) {
                    orders.add(cb.asc(expression));
                } else {
                    orders.add(cb.desc(expression));
                }
//                log.debug("Added sort order: {} {}", order.getProperty(), order.getDirection());
            });
            query.orderBy(orders);
        }

        // Execute query with pagination
        TypedQuery<Tuple> typedQuery = getEntityManager().createQuery(query);

        List<Tuple> results = typedQuery
                .setFirstResult((int) pageable.getOffset())
                .setMaxResults(pageable.getPageSize())
                .getResultList();

        List<E> entities = results.stream()
                .map(tuple -> buildEntity(tuple, fields))
                .collect(Collectors.toList());

        // Count total elements
        CriteriaQuery<Long> countQuery = cb.createQuery(Long.class);
        Root<E> countRoot = countQuery.from(getEntityClass());
//        countQuery.select(cb.count(countRoot));
        countQuery.select(cb.countDistinct(countRoot));

        // Apply the same joins to the count query
        Map<String, Join<?, ?>> countJoins = new HashMap<>();
        for (Map.Entry<String, Join<?, ?>> entry : joins.entrySet()) {
            String[] pathParts = entry.getKey().split("\\.");
            From<?, ?> joinRoot = countRoot;
            for (String part : pathParts) {
                joinRoot = joinRoot.join(part);
            }
            countJoins.put(entry.getKey(), (Join<?, ?>) joinRoot);
        }

        // Apply the same predicates to the count query
        List<Predicate> countPredicates = new ArrayList<>();
        if (searchCriteria != null && !searchCriteria.getFilters().isEmpty()) {
            for (Map.Entry<String, String> entry : searchCriteria.getFilters().entrySet()) {
                String key = entry.getKey();
                String value = entry.getValue();
                if (value != null && !value.isEmpty()) {
                    Expression<?> expression = getExpressionWithJoin(cb, countRoot, key, countJoins);
                    countPredicates.add(cb.like(cb.lower(expression.as(String.class)), "%" + value.toLowerCase() + "%"));
                }
            }
        }

        if (!countPredicates.isEmpty()) {
            countQuery.where(cb.and(countPredicates.toArray(new Predicate[0])));
        }

        Long totalElements = getEntityManager().createQuery(countQuery).getSingleResult();

        return new PageImpl<>(entities, pageable, totalElements);
    }

    private Selection<?> getSelectionWithJoin(CriteriaBuilder cb, Root<E> root, String field, Map<String, Join<?, ?>> joins) {
        String[] parts = field.split("\\.");
        From<?, ?> from = root;
        Path<?> path = null;

        for (int i = 0; i < parts.length; i++) {
            String part = parts[i];
            if (i < parts.length - 1) {
                String joinKey = String.join(".", Arrays.copyOfRange(parts, 0, i + 1));
                if (!joins.containsKey(joinKey)) {
                    Join<?, ?> join = from.join(part, JoinType.LEFT);
                    joins.put(joinKey, join);
                    from = join;
                } else {
                    from = joins.get(joinKey);
                }
            } else {
                path = from.get(part);
            }
        }

        return path.alias(field);
    }

    private Expression<?> getExpressionWithJoin(CriteriaBuilder cb, Root<E> root, String field, Map<String, Join<?, ?>> joins) {
        String[] parts = field.split("\\.");
        From<?, ?> from = root;
        Expression<?> expression = null;

        for (int i = 0; i < parts.length; i++) {
            String part = parts[i];
            if (i < parts.length - 1) {
                String joinKey = String.join(".", Arrays.copyOfRange(parts, 0, i + 1));
                if (!joins.containsKey(joinKey)) {
                    Join<?, ?> join = from.join(part, JoinType.LEFT);
                    joins.put(joinKey, join);
                    from = join;
                } else {
                    from = joins.get(joinKey);
                }
            } else {
                expression = from.get(part);
            }
        }

        return expression;
    }

    private Selection<?> getSelection(Root<E> root, String field, Map<String, Join<?, ?>> joins) {
        String[] parts = field.split("\\.");
        From<?, ?> from = root;

        for (int i = 0; i < parts.length - 1; i++) {
            String part = parts[i];
            if (!joins.containsKey(part)) {
                Join<?, ?> join = from.join(part);
                joins.put(part, join);
            }
            from = joins.get(part);
        }

        Path<?> path = from.get(parts[parts.length - 1]);
        return path.alias(field);
    }

    private Field findField(Class<?> clazz, String fieldName) {
        while (clazz != null) {
            try {
                return clazz.getDeclaredField(fieldName);
            } catch (NoSuchFieldException e) {
                clazz = clazz.getSuperclass();
            }
        }
        return null;
    }

    private E buildEntity(Tuple tuple, List<String> fields) {
        E entity = createEntityInstance();
//        log.debug("Created new instance of {}", entity.getClass().getSimpleName());

        for (int i = 0; i < fields.size(); i++) {
            String field = fields.get(i);
            Object value = tuple.get(i);
//            log.debug("Setting field '{}' with value: {}", field, value);
            setEntityFieldRecursively(entity, field, value);
        }

        return entity;
    }

    private void setEntityFieldRecursively(Object entity, String fieldPath, Object value) {
        String[] parts = fieldPath.split("\\.");
        Object target = entity;

        for (int i = 0; i < parts.length - 1; i++) {
            Field field = findField(target.getClass(), parts[i]);
            if (field == null) {
                log.warn("Field '{}' not found in class {}", parts[i], target.getClass().getSimpleName());
                return;
            }
            field.setAccessible(true);
            try {
                Object nestedObject = field.get(target);
                if (nestedObject == null) {
                    nestedObject = createInstance(field.getType());
                    field.set(target, nestedObject);
                }
                if (Collection.class.isAssignableFrom(field.getType())) {
                    handleCollectionField(field, target, nestedObject, Arrays.copyOfRange(parts, i + 1, parts.length), value);
                    return;
                }
                target = nestedObject;
            } catch (Exception e) {
                log.error("Error setting nested field: " + field.getName(), e);
                return;
            }
        }

        setFinalField(target, parts[parts.length - 1], value);
    }

    private void handleCollectionField(Field field, Object parent, Object collection, String[] remainingParts, Object value) throws Exception {
        if (!(collection instanceof Collection)) {
            log.warn("Expected a Collection, but got {}", collection.getClass().getSimpleName());
            return;
        }

        Collection col = (Collection) collection;
        if (col.isEmpty()) {
            Object newItem = createInstance(getGenericType(field));
            col.add(newItem);
            setEntityFieldRecursively(newItem, String.join(".", remainingParts), value);
        } else {
            for (Object item : col) {
                setEntityFieldRecursively(item, String.join(".", remainingParts), value);
            }
        }
    }

    private Class<?> getGenericType(Field field) {
        ParameterizedType type = (ParameterizedType) field.getGenericType();
        return (Class<?>) type.getActualTypeArguments()[0];
    }

    private void setFinalField(Object target, String fieldName, Object value) {
        Field finalField = findField(target.getClass(), fieldName);
        if (finalField == null) {
            log.warn("Field '{}' not found in class {}", fieldName, target.getClass().getSimpleName());
            return;
        }
        finalField.setAccessible(true);
        try {
            if (Collection.class.isAssignableFrom(finalField.getType())) {
                Collection collection = (Collection) finalField.get(target);
                if (collection == null) {
                    collection = createCollectionInstance(finalField.getType());
                    finalField.set(target, collection);
                }
                if (value != null) {
                    if (value instanceof Collection) {
                        collection.addAll((Collection) value);
                    } else {
                        collection.add(value);
                    }
                }
            } else {
                finalField.set(target, value);
            }
        } catch (Exception e) {
            log.error("Error setting final field: " + finalField.getName(), e);
        }
    }

    private Object createInstance(Class<?> type) throws Exception {
        if (type.isInterface()) {
            if (Set.class.isAssignableFrom(type)) {
                return new HashSet<>();
            } else if (List.class.isAssignableFrom(type)) {
                return new ArrayList<>();
            } else if (Map.class.isAssignableFrom(type)) {
                return new HashMap<>();
            }
        }
        return type.getDeclaredConstructor().newInstance();
    }

    private Collection createCollectionInstance(Class<?> type) {
        if (Set.class.isAssignableFrom(type)) {
            return new HashSet<>();
        } else if (List.class.isAssignableFrom(type)) {
            return new ArrayList<>();
        } else {
            return new ArrayList<>(); // Default to ArrayList if it's a custom Collection type
        }
    }

    private E createEntityInstance() {
        try {
            return getEntityClass().getDeclaredConstructor().newInstance();
        } catch (Exception e) {
            throw new RuntimeException("Failed to create entity instance", e);
        }
    }

    default void mergeCollectionFields(E existingEntity, E newEntity) {
        Class<?> entityClass = existingEntity.getClass();
        for (Field field : entityClass.getDeclaredFields()) {
            field.setAccessible(true);
            if (Collection.class.isAssignableFrom(field.getType())) {
                try {
                    Collection existingCollection = (Collection) field.get(existingEntity);
                    Collection newCollection = (Collection) field.get(newEntity);
                    if (existingCollection != null && newCollection != null) {
                        existingCollection.addAll(newCollection);
                    } else if (newCollection != null) {
                        field.set(existingEntity, newCollection);
                    }
                } catch (IllegalAccessException e) {
                    log.error("Error merging collection field: " + field.getName(), e);
                }
            }
        }
    }
}