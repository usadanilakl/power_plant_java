package com.dk_power.power_plant_java.sevice.angular.base;


import com.dk_power.power_plant_java.dto.SearchCriteria;
import com.dk_power.power_plant_java.entities.base_entities.BaseIdEntity;
import jakarta.persistence.Temporal;
import jakarta.persistence.criteria.*;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import java.util.ArrayList;
import java.util.Collection;
import java.util.List;
import java.util.Map;

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

//    default <T extends BaseIdEntity> Page<T> complexSearchWithPagination(
//            JpaSpecificationExecutor<T> repository,
//            SearchCriteria criteria,
//            Pageable pageable,
//            boolean andLogicIsEnabled) {
//
//        System.out.println("Filters: " + criteria.getFilters());
//        Specification<T> spec = buildComplexSpecification(criteria, andLogicIsEnabled);
//        System.out.println("Specification: " + spec);
//        return repository.findAll(spec, pageable);
//    }
    
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


    
    default <T extends BaseIdEntity> Specification<T> buildComplexSpecification(SearchCriteria criteria, boolean andLogicIsEnabled, SearchCriteria baseCriteria) {
        return (root, query, criteriaBuilder) -> {
            List<Predicate> predicates = new ArrayList<>();
            List<Predicate> basePredicates = new ArrayList<>();

            // Handle base criteria
            if (baseCriteria != null && baseCriteria.getFilters() != null) {
                basePredicates.addAll(buildPredicates(root, criteriaBuilder, baseCriteria.getFilters()));
            }

            // Handle main criteria
            predicates.addAll(buildPredicates(root, criteriaBuilder, criteria.getFilters()));

            // Combine base predicates (always with AND logic)
            Predicate basePredicate = criteriaBuilder.and(basePredicates.toArray(new Predicate[0]));

            // Combine main predicates based on andLogicIsEnabled
            Predicate mainPredicate;
            if (andLogicIsEnabled) {
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