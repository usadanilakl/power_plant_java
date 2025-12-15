package com.dk_power.power_plant_java.sevice.angular.base;


import com.dk_power.power_plant_java.dto.SearchCriteria;
import com.dk_power.power_plant_java.entities.base_entities.BaseIdEntity;
import jakarta.persistence.Temporal;
import jakarta.persistence.criteria.*;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import java.util.*;
import java.util.stream.Collectors;

import static org.apache.commons.beanutils.BeanUtils.getNestedProperty;

public interface FlexibleQueryInterface {

    default <T extends BaseIdEntity> Specification<T> buildSpecification(SearchCriteria criteria) {
        return (root, query, criteriaBuilder) -> {
            List<Predicate> predicates = new ArrayList<>();

            criteria.getFilters().forEach((key, value) -> {
                if (value != null && !value.isEmpty()) {
                    predicates.add(criteriaBuilder.like(criteriaBuilder.lower(root.get(key)), "%" + value.toLowerCase() + "%"));
//                    System.out.println(key + ": " + value);
                }
            });

            return criteriaBuilder.and(predicates.toArray(new Predicate[0]));
        };
    }

    default <T extends BaseIdEntity> Page<T> complexSearchWithPagination(
            JpaSpecificationExecutor<T> repository,
            SearchCriteria criteria,
            Pageable pageable,
            boolean andLogicIsEnabled,
            SearchCriteria baseCriteria) {

        Specification<T> spec = buildComplexSpecification(criteria, andLogicIsEnabled, baseCriteria);
        return repository.findAll(spec, pageable);
    }
    
    default <T extends BaseIdEntity> Page<T> complexSearchWithPagination(
        JpaSpecificationExecutor<T> repository,
        SearchCriteria criteria,
        Pageable pageable,
        boolean andLogicIsEnabled) {

//    System.out.println("Entering complexSearchWithPagination");
//    System.out.println("Filters: " + criteria.getFilters());
    Specification<T> spec = buildComplexSpecification(criteria, andLogicIsEnabled);
//    System.out.println("Specification: " + spec);
//    System.out.println("Repository: " + repository.getClass().getName());
//    System.out.println("Pageable: " + pageable);
    try {
        Page<T> result = repository.findAll(spec, pageable);
//        System.out.println("Result size: " + (result != null ? result.getContent().size() : "null"));
        return result;
    } catch (Exception e) {
        System.err.println("Error in findAll: " + e.getMessage());
        e.printStackTrace();
        throw e;
    }
}


    default <T extends BaseIdEntity> List<String> getUniqueValuesOfColumn(
            JpaSpecificationExecutor<T> repository,
            String columnName) {

        // Validate column name to prevent SQL injection
        if (columnName == null || columnName.trim().isEmpty()) {
            throw new IllegalArgumentException("Column name cannot be null or empty");
        }

        try {
            // Use a native query approach instead of Specification
            List<?> results = repository.findAll((root, query, criteriaBuilder) -> {
                // Handle nested properties (e.g., "isoPos.name")
                String[] pathParts = columnName.split("\\.");
                Path<?> path = root;

                for (String part : pathParts) {
                    path = path.get(part);
                }

                // Set the result type and distinct
                query.multiselect(path).distinct(true);
                query.orderBy(criteriaBuilder.asc(path));

                return criteriaBuilder.conjunction();
            });

            // Extract and convert values to strings
            return results.stream()
                    .map(obj -> obj != null ? obj.toString() : null)
                    .filter(Objects::nonNull)
                    .distinct()
                    .sorted()
                    .collect(Collectors.toList());

        } catch (Exception e) {
            throw new IllegalArgumentException("Invalid column name: " + columnName, e);
        }
    }


    default <T extends BaseIdEntity> Page<T> getFilteredUniqueValuesOfColumn(
            JpaSpecificationExecutor<T> repository,
            String columnName,
            String filterValue,
            Pageable pageable) {

        if (columnName == null || columnName.trim().isEmpty()) {
            throw new IllegalArgumentException("Column name cannot be null or empty");
        }

        try {
            Specification<T> spec = (root, query, criteriaBuilder) -> {
                String[] pathParts = columnName.split("\\.");
                Path<?> path = root;

                for (String part : pathParts) {
                    path = path.get(part);
                }

                query.multiselect(path).distinct(true);
                query.orderBy(criteriaBuilder.asc(path));

                // Add filter if provided
                if (filterValue != null && !filterValue.isEmpty()) {
                    return criteriaBuilder.like(
                            criteriaBuilder.lower(path.as(String.class)),
                            "%" + filterValue.toLowerCase() + "%"
                    );
                }

                return criteriaBuilder.conjunction();
            };

            Page<T> results = repository.findAll(spec, pageable);

            return results;

        } catch (Exception e) {
            throw new IllegalArgumentException("Invalid column name: " + columnName, e);
        }
    }

//    default <T extends BaseIdEntity> Page<T> getFilteredUniqueValuesOfColumn(
//            JpaSpecificationExecutor<T> repository,
//            String columnName,
//            Map<String, String> filters,  // { "name": "john", "city": "NY" }
//            Pageable pageable,
//            boolean andLogicIsEnabled) {
//
////        System.out.println("Column: "+ columnName);
////        System.out.println("Filters: "+ filters);
//
//        if (columnName == null || columnName.trim().isEmpty()) {
//            throw new IllegalArgumentException("Column name cannot be null or empty");
//        }
//
//        try {
//            Specification<T> spec = (root, query, criteriaBuilder) -> {
//                // Build target column path for SELECT/ORDER
//                String[] pathParts = columnName.split("\\.");
//                Path<?> targetPath = root;
//                for (String part : pathParts) {
//                    targetPath = targetPath.get(part);
//                }
//
//                query.multiselect(targetPath).distinct(true);
//                query.orderBy(criteriaBuilder.asc(targetPath));
//
//                // Build multi-column filters as OR predicates
//                List<Predicate> filterPredicates = new ArrayList<>();
//                for (Map.Entry<String, String> filter : filters.entrySet()) {
//                    if (filter.getValue() != null && !filter.getValue().trim().isEmpty()) {
//                        String[] filterPathParts = filter.getKey().split("\\.");
//                        Path<?> filterPath = root;
//                        for (String part : filterPathParts) {
////                            System.out.println("Part: " + part);
//                            filterPath = filterPath.get(part);
//                        }
//                        filterPredicates.add(criteriaBuilder.like(
//                                criteriaBuilder.lower(filterPath.as(String.class)),
//                                "%" + filter.getValue().toLowerCase() + "%"
//                        ));
//                    }
//                }
//
//                // Combine filters with AND, require all matches
//                if(andLogicIsEnabled)return filterPredicates.isEmpty()
//                        ? criteriaBuilder.conjunction()
//                        : criteriaBuilder.and(filterPredicates.toArray(new Predicate[0]));
//
//                // Combine filters with OR, require at least one match
//                return filterPredicates.isEmpty()
//                        ? criteriaBuilder.conjunction()
//                        : criteriaBuilder.or(filterPredicates.toArray(new Predicate[0]));
//            };
//
//            return repository.findAll(spec, pageable);
//        } catch (Exception e) {
//            e.printStackTrace();
//            throw new IllegalArgumentException("Invalid column name: " + columnName, e);
//        }
//    }
default <T extends BaseIdEntity> Page<String> getFilteredUniqueValuesOfColumn(
        JpaSpecificationExecutor<T> repository,
        String columnName,
        Map<String, String> filters,
        Pageable pageable,
        boolean andLogicIsEnabled) {

    if (columnName == null || columnName.trim().isEmpty()) {
        throw new IllegalArgumentException("Column name cannot be null or empty");
    }

    try {
        Specification<T> spec = (root, query, criteriaBuilder) -> {
            String[] pathParts = columnName.split("\\.");
            Path<?> targetPath = root;
            for (String part : pathParts) {
                targetPath = targetPath.get(part);
            }

            // Select ONLY the column value
            query.multiselect(targetPath.as(String.class)).distinct(true);
            query.orderBy(criteriaBuilder.asc(targetPath));

            List<Predicate> filterPredicates = new ArrayList<>();
            for (Map.Entry<String, String> filter : filters.entrySet()) {
                if (filter.getValue() != null && !filter.getValue().trim().isEmpty()) {
                    String[] filterPathParts = filter.getKey().split("\\.");
                    Path<?> filterPath = root;
                    for (String part : filterPathParts) {
                        filterPath = filterPath.get(part);
                    }
                    filterPredicates.add(criteriaBuilder.like(
                            criteriaBuilder.lower(filterPath.as(String.class)),
                            "%" + filter.getValue().toLowerCase() + "%"
                    ));
                }
            }

            if(andLogicIsEnabled) {
                return filterPredicates.isEmpty()
                        ? criteriaBuilder.conjunction()
                        : criteriaBuilder.and(filterPredicates.toArray(new Predicate[0]));
            }
            return filterPredicates.isEmpty()
                    ? criteriaBuilder.conjunction()
                    : criteriaBuilder.or(filterPredicates.toArray(new Predicate[0]));
        };

        Page<T> entityPage = repository.findAll(spec, pageable);

        // Extract actual column value via reflection or entity method
        List<String> values = entityPage.getContent().stream()
                .map(entity -> {
                    try {
                        // Dynamic property access (your original path logic)
                        Object value = getNestedProperty(entity, columnName);
                        return value != null ? value.toString() : null;
                    } catch (Exception e) {
                        return null;
                    }
                })
                .filter(Objects::nonNull)
                .distinct()
                .sorted()  // Client-side sort since projection ignored ORDER BY
                .collect(Collectors.toList());

        return new PageImpl<>(values, pageable, entityPage.getTotalElements());

    } catch (Exception e) {
        e.printStackTrace();
        throw new IllegalArgumentException("Invalid column name: " + columnName, e);
    }
}



    default <T extends BaseIdEntity> Specification<T> buildComplexSpecification(SearchCriteria criteria, boolean andLogicIsEnabled, SearchCriteria baseCriteria) {
        return (root, query, criteriaBuilder) -> {
            List<Predicate> predicates = new ArrayList<>();
            List<Predicate> basePredicates = new ArrayList<>();

            // Handle base criteria
            if (baseCriteria != null && baseCriteria.getFilters() != null && !baseCriteria.getFilters().isEmpty()) {
                basePredicates.addAll(buildPredicates(root, criteriaBuilder, baseCriteria.getFilters()));
            }

            // Handle main criteria - only if filters exist and are not empty
            if (criteria.getFilters() != null && !criteria.getFilters().isEmpty()) {
                predicates.addAll(buildPredicates(root, criteriaBuilder, criteria.getFilters()));
            }

            // If no predicates, return all records (empty conjunction)
            if (basePredicates.isEmpty() && predicates.isEmpty()) {
                return criteriaBuilder.conjunction(); // Returns true for all records
            }

            // Combine base predicates (always with AND logic)
            Predicate basePredicate = basePredicates.isEmpty()
                    ? criteriaBuilder.conjunction()
                    : criteriaBuilder.and(basePredicates.toArray(new Predicate[0]));

            // Combine main predicates based on andLogicIsEnabled
            Predicate mainPredicate;
            if (predicates.isEmpty()) {
                mainPredicate = criteriaBuilder.conjunction();
            } else if (andLogicIsEnabled) {
                mainPredicate = criteriaBuilder.and(predicates.toArray(new Predicate[0]));
            } else {
                mainPredicate = criteriaBuilder.or(predicates.toArray(new Predicate[0]));
            }

            // Combine base predicate with main predicate
            return criteriaBuilder.and(basePredicate, mainPredicate);
        };
    }

    private List<Predicate> buildPredicates(Root<?> root, CriteriaBuilder criteriaBuilder, Map<String, String> filters) {
        List<Predicate> predicates = new ArrayList<>();

        filters.forEach((key, value) -> {
            String[] pathParts = key.split("\\.");
            From<?, ?> from = root;
            Path<?> path = root;
            boolean isNullable = false;

            for (int i = 0; i < pathParts.length - 1; i++) {
                if (path.get(pathParts[i]).getJavaType().isAssignableFrom(Collection.class)) {
                    from = from.join(pathParts[i], JoinType.LEFT);
                    path = from;
                    isNullable = true;
                } else {
                    path = path.get(pathParts[i]);
                    if (path.getJavaType().isAnnotationPresent(jakarta.persistence.Entity.class)) {
                        from = from.join(pathParts[i], JoinType.LEFT);
                        path = from;
                        isNullable = true;
                    }
                }
            }
            String fieldName = pathParts[pathParts.length - 1];

            Class<?> fieldType = path.get(fieldName).getJavaType();

            Predicate fieldPredicate;
            if (value == null || value.isEmpty()) {
                fieldPredicate = criteriaBuilder.disjunction();
            } else if (Collection.class.isAssignableFrom(fieldType)) {
                fieldPredicate = handleCollectionField(criteriaBuilder, from, fieldName, value);
            } else {
                fieldPredicate = handleSingleField(criteriaBuilder, path, fieldName, value);
            }

            predicates.add(fieldPredicate);

            System.out.println(key + ": " + value);
        });

        return predicates;
    }

    default <T extends BaseIdEntity> Specification<T> buildComplexSpecification(SearchCriteria criteria, boolean andLogicIsEnabled) {
        return buildComplexSpecification(criteria, andLogicIsEnabled, null);
    }
    
    
    
    
    default Predicate handleCollectionField(CriteriaBuilder criteriaBuilder, From<?, ?> from, String fieldName, String value) {
        Join<?, ?> join = from.join(fieldName, JoinType.LEFT);
        Class<?> elementType = join.getJavaType();

        if (isStringNumberOrDate(elementType)) {
            return criteriaBuilder.like(criteriaBuilder.lower(join.as(String.class)), "%" + value.toLowerCase() + "%");
        } else {
            return criteriaBuilder.equal(join.get("id"), value);
        }
    }

    default Predicate handleSingleField(CriteriaBuilder criteriaBuilder, Path<?> path, String fieldName, String value) {
        Class<?> fieldType = path.get(fieldName).getJavaType();

        if (isStringNumberOrDate(fieldType)) {
            return criteriaBuilder.like(criteriaBuilder.lower(path.get(fieldName).as(String.class)), "%" + value.toLowerCase() + "%");
        } else {
            return criteriaBuilder.equal(path.get(fieldName), value);
        }
    }

    default boolean isStringNumberOrDate(Class<?> type) {
        return String.class.isAssignableFrom(type)
                || Number.class.isAssignableFrom(type)
                || Temporal.class.isAssignableFrom(type);
    }
}