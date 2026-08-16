package com.dk_power.power_plant_java.sevice.angular.base;


import com.dk_power.power_plant_java.dto.SearchCriteria;
import com.dk_power.power_plant_java.entities.base_entities.BaseIdEntity;
import jakarta.persistence.*;
import jakarta.persistence.criteria.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import java.util.*;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

import static org.apache.commons.beanutils.BeanUtils.getNestedProperty;

public interface FlexibleQueryInterface {

    Logger log = LoggerFactory.getLogger(FlexibleQueryInterface.class);

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

    default <T extends BaseIdEntity> Page<T> complexSearchWithPagination(JpaSpecificationExecutor<T> repository, SearchCriteria criteria, Pageable pageable, boolean andLogicIsEnabled, SearchCriteria baseCriteria) {

        Specification<T> spec = buildComplexSpecification(criteria, andLogicIsEnabled, baseCriteria);
        return repository.findAll(spec, pageable);
    }

    default <T extends BaseIdEntity> Page<T> complexSearchWithPagination(JpaSpecificationExecutor<T> repository, SearchCriteria criteria, Pageable pageable, boolean andLogicIsEnabled) {
        Specification<T> spec = buildComplexSpecification(criteria, andLogicIsEnabled);
        try {
            return repository.findAll(spec, pageable);
        } catch (Exception e) {
            log.error("complexSearchWithPagination: repository.findAll failed", e);
            throw e;
        }
    }


    default <T extends BaseIdEntity> List<String> getUniqueValuesOfColumn(JpaSpecificationExecutor<T> repository, String columnName) {

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
            return results.stream().map(obj -> obj != null ? obj.toString() : null).filter(Objects::nonNull).distinct().sorted().collect(Collectors.toList());

        } catch (Exception e) {
            throw new IllegalArgumentException("Invalid column name: " + columnName, e);
        }
    }


    default <T extends BaseIdEntity> Page<T> getFilteredUniqueValuesOfColumn(JpaSpecificationExecutor<T> repository, String columnName, String filterValue, Pageable pageable) {

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
                    return criteriaBuilder.like(criteriaBuilder.lower(path.as(String.class)), "%" + filterValue.toLowerCase() + "%");
                }

                return criteriaBuilder.conjunction();
            };

            Page<T> results = repository.findAll(spec, pageable);

            return results;

        } catch (Exception e) {
            throw new IllegalArgumentException("Invalid column name: " + columnName, e);
        }
    }

    default <T extends BaseIdEntity> Page<String> getFilteredUniqueValuesOfColumn(JpaSpecificationExecutor<T> repository, String columnName, Map<String, String> filters, Pageable pageable, boolean andLogicIsEnabled) {

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
                query.orderBy(criteriaBuilder.desc(targetPath));

                List<Predicate> filterPredicates = new ArrayList<>();
                for (Map.Entry<String, String> filter : filters.entrySet()) {
                    if (filter.getValue() != null && !filter.getValue().trim().isEmpty()) {
                        String[] filterPathParts = filter.getKey().split("\\.");
                        Path<?> filterPath = root;
                        for (String part : filterPathParts) {
                            filterPath = filterPath.get(part);
                        }
                        filterPredicates.add(criteriaBuilder.like(criteriaBuilder.lower(filterPath.as(String.class)), "%" + filter.getValue().toLowerCase() + "%"));
                    }
                }

                if (andLogicIsEnabled) {
                    return filterPredicates.isEmpty() ? criteriaBuilder.conjunction() : criteriaBuilder.and(filterPredicates.toArray(new Predicate[0]));
                }
                return filterPredicates.isEmpty() ? criteriaBuilder.conjunction() : criteriaBuilder.or(filterPredicates.toArray(new Predicate[0]));
            };

            Page<T> entityPage = repository.findAll(spec, pageable);

            // Extract actual column value via reflection or entity method
            List<String> values = entityPage.getContent().stream().map(entity -> {
                        try {
                            // Dynamic property access (your original path logic)
                            Object value = getNestedProperty(entity, columnName);
                            return value != null ? value.toString() : null;
                        } catch (Exception e) {
                            return null;
                        }
                    }).filter(Objects::nonNull).distinct().sorted()  // Client-side sort since projection ignored ORDER BY
                    .collect(Collectors.toList());

            log.debug("getFilteredUniqueValuesOfColumn: filters={} column={} resultSize={}",
                    filters, columnName, values.size());

            return new PageImpl<>(values, pageable, entityPage.getTotalElements());

        } catch (Exception e) {
            log.error("getFilteredUniqueValuesOfColumn: invalid column '{}'", columnName, e);
            throw new IllegalArgumentException("Invalid column name: " + columnName, e);
        }
    }


    /**
     * Returns the list of columns to search for global search.
     * Override this method in your service to provide entity-specific columns.
     * Supports nested paths like "location.name".
     *
     * @return List of column names/paths to search
     */
    default List<String> getGlobalSearchColumns() {
        // Default: empty list (no global search columns defined)
        // Services should override this to provide their searchable columns
        return Collections.emptyList();
    }

    default <T extends BaseIdEntity> Specification<T> buildComplexSpecification(SearchCriteria criteria, boolean andLogicIsEnabled, SearchCriteria baseCriteria) {
        return (root, query, criteriaBuilder) -> {
            List<Predicate> predicates = new ArrayList<>();
            List<Predicate> basePredicates = new ArrayList<>();

            // Handle base criteria
            if (baseCriteria != null && baseCriteria.getFilters() != null && !baseCriteria.getFilters().isEmpty()) {
                basePredicates.addAll(buildPredicates(root, criteriaBuilder, baseCriteria.getFilters(), criteria.getColumnFilterLogic()));
            }

            // Handle GLOBAL search - apply query across all searchable columns.
            // Goes in basePredicates (always AND-ed) rather than predicates, so it
            // narrows the column filters instead of competing with them under the
            // caller's andLogicIsEnabled flag.
            //
            // The two are deliberately NOT exclusive: the table UI keeps the global
            // box and the column filters live at the same time, and its client-side
            // path (TableSearchService.performSearch) ANDs them. Gating this branch
            // on type==GLOBAL made the server honour whichever one the frontend's
            // `type` happened to name and silently drop the other — so a search that
            // worked became wrong the moment the user added the second kind of filter.
            if (criteria.getQuery() != null && !criteria.getQuery().trim().isEmpty()) {
                // Determine global filter logic (default to AND if not specified)
                boolean useAndLogicForGlobal = !"OR".equalsIgnoreCase(criteria.getGlobalFilterLogic());
                List<String> searchColumns = getGlobalSearchColumns();
                Predicate globalPredicate = buildGlobalSearchPredicate(root, criteriaBuilder, criteria.getQuery(), useAndLogicForGlobal, searchColumns);
                if (globalPredicate != null) {
                    basePredicates.add(globalPredicate);
                }
            }
            // Handle COLUMN search - only if filters exist and are not empty
            if (criteria.getFilters() != null && !criteria.getFilters().isEmpty()) {
                predicates.addAll(buildPredicates(root, criteriaBuilder, criteria.getFilters(), criteria.getColumnFilterLogic()));
            }

            // If no predicates, return all records (empty conjunction)
            if (basePredicates.isEmpty() && predicates.isEmpty()) {
                return criteriaBuilder.conjunction(); // Returns true for all records
            }

            // Combine base predicates (always with AND logic)
            Predicate basePredicate = basePredicates.isEmpty() ? criteriaBuilder.conjunction() : criteriaBuilder.and(basePredicates.toArray(new Predicate[0]));

            // Combine main predicates based on andLogicIsEnabled
            Predicate mainPredicate;
            if (predicates.isEmpty()) {
                mainPredicate = criteriaBuilder.conjunction();
            } else if (andLogicIsEnabled) {
                mainPredicate = criteriaBuilder.and(predicates.toArray(new Predicate[0]));
            } else {
                mainPredicate = criteriaBuilder.or(predicates.toArray(new Predicate[0]));
            }
            log.debug("buildComplexSpecification: basePredicates={} predicates={} andLogicIsEnabled={}",
                    basePredicates.size(), predicates.size(), andLogicIsEnabled);

            // Combine base predicate with main predicate
            return criteriaBuilder.and(basePredicate, mainPredicate);
        };
    }

    /**
     * Builds a predicate for global search that applies the query across specified searchable columns.
     * Supports both simple columns (e.g., "tagNumber") and nested paths (e.g., "location.name").
     *
     * @param root The root entity
     * @param cb The CriteriaBuilder
     * @param queryValue The search query string
     * @param useAndLogic If true (AND): at least one column must contain ALL tokens (strict).
     *                    If false (OR): all tokens must be found across the row (can be in different columns).
     * @param searchableColumns List of column paths to search (e.g., "tagNumber", "location.name")
     * @return A predicate for the global search, or null if no valid predicate can be built
     */
    default Predicate buildGlobalSearchPredicate(Root<?> root, CriteriaBuilder cb, String queryValue, boolean useAndLogic, List<String> searchableColumns) {
        String trimmed = queryValue.trim();
        if (trimmed.isEmpty() || searchableColumns == null || searchableColumns.isEmpty()) {
            return null;
        }

        String[] tokens = trimmed.toLowerCase().split("\\s+");

        // Cache joins to avoid creating multiple joins for the same relation
        Map<String, Join<?, ?>> joinCache = new HashMap<>();

        if (useAndLogic) {
            // AND logic: at least one column must contain ALL tokens
            List<Predicate> columnPredicates = new ArrayList<>();

            for (String columnPath : searchableColumns) {
                try {
                    Path<?> path = resolvePathForGlobalSearch(root, columnPath, joinCache);
                    if (path == null) continue;

                    Class<?> fieldType = path.getJavaType();
                    if (!String.class.isAssignableFrom(fieldType)) continue;

                    Expression<String> fieldExpr = cb.lower(path.as(String.class));

                    // All tokens must be in this single column
                    List<Predicate> allTokensInColumn = new ArrayList<>();
                    for (String token : tokens) {
                        if (token.isEmpty()) continue;
                        allTokensInColumn.add(cb.like(fieldExpr, "%" + token + "%"));
                    }
                    if (!allTokensInColumn.isEmpty()) {
                        columnPredicates.add(cb.and(allTokensInColumn.toArray(new Predicate[0])));
                    }
                } catch (IllegalArgumentException e) {
                    log.debug("Skipping column for global search: {}", columnPath);
                }
            }

            if (columnPredicates.isEmpty()) return null;

            // OR between columns: at least one column must have all tokens
            return cb.or(columnPredicates.toArray(new Predicate[0]));

        } else {
            // OR logic: all tokens must be found somewhere in the row (can be in different columns)
            List<Predicate> tokenPredicates = new ArrayList<>();

            for (String token : tokens) {
                if (token.isEmpty()) continue;

                // For this token, check if it exists in ANY column
                List<Predicate> tokenInAnyColumn = new ArrayList<>();

                for (String columnPath : searchableColumns) {
                    try {
                        Path<?> path = resolvePathForGlobalSearch(root, columnPath, joinCache);
                        if (path == null) continue;

                        Class<?> fieldType = path.getJavaType();
                        if (!String.class.isAssignableFrom(fieldType)) continue;

                        Expression<String> fieldExpr = cb.lower(path.as(String.class));
                        tokenInAnyColumn.add(cb.like(fieldExpr, "%" + token + "%"));
                    } catch (IllegalArgumentException e) {
                        log.debug("Skipping column for global search: {}", columnPath);
                    }
                }

                if (!tokenInAnyColumn.isEmpty()) {
                    // This token must be found in at least one column
                    tokenPredicates.add(cb.or(tokenInAnyColumn.toArray(new Predicate[0])));
                }
            }

            if (tokenPredicates.isEmpty()) return null;

            // AND between tokens: all tokens must be found (each in any column)
            return cb.and(tokenPredicates.toArray(new Predicate[0]));
        }
    }

    /**
     * Resolves a column path for global search, handling both simple and nested paths.
     * Uses LEFT JOIN for nested paths to avoid excluding records with null relations.
     */
    private Path<?> resolvePathForGlobalSearch(Root<?> root, String columnPath, Map<String, Join<?, ?>> joinCache) {
        if (!columnPath.contains(".")) {
            // Simple path: just get the attribute directly
            return root.get(columnPath);
        }

        // Nested path: need to join
        String[] parts = columnPath.split("\\.");
        String relationName = parts[0];
        String fieldName = parts[1];

        // Get or create the join (use LEFT JOIN to include records with null relations)
        Join<?, ?> join = joinCache.computeIfAbsent(relationName,
                name -> root.join(name, JoinType.LEFT));

        return join.get(fieldName);
    }


    private List<Predicate> buildPredicates(Root<?> root, CriteriaBuilder criteriaBuilder, Map<String, String> filters, Map<String,String> filterLogic) {
        List<Predicate> predicates = new ArrayList<>();

        filters.forEach((key, value) -> {

            String[] pathParts = key.split("\\.");
            From<?, ?> from = root;
            Path<?> path = root;
            String logic = filterLogic!=null && filterLogic.get(key) != null && filterLogic.get(key).equals("OR") ? "OR" : "AND" ;

            // Navigate through all path parts except the last one
            for (int i = 0; i < pathParts.length - 1; i++) {
                String part = pathParts[i];

                try {
                    Path<?> nextPath = path.get(part);
                    Class<?> nextType = nextPath.getJavaType();

                    // Check if it's a Collection or an Entity that needs joining
                    if (Collection.class.isAssignableFrom(nextType) || nextType.isAnnotationPresent(jakarta.persistence.Entity.class)) {
                        from = from.join(part, JoinType.LEFT);
                        path = from;
                        log.debug("Joined: {} (type: {})", part, nextType.getSimpleName());
                    } else {
                        path = nextPath;
                        log.debug("Navigated: {} (type: {})", part, nextType.getSimpleName());
                    }
                } catch (Exception e) {
                    log.error("Error navigating path part '{}'", part, e);
                    return;
                }
            }

            String fieldName = pathParts[pathParts.length - 1];

            try {
                Class<?> fieldType = path.get(fieldName).getJavaType();

                Predicate fieldPredicate;
                if (value == null || value.isBlank()) {
                    // An empty filter is "no constraint on this column", NOT "match
                    // nothing". disjunction() here is always-false, and since these
                    // predicates get AND-ed it emptied the whole result set whenever a
                    // blank value survived to the server (a whitespace-only box, or a
                    // caller passing the filter map through verbatim).
                    fieldPredicate = criteriaBuilder.conjunction();
                } else if (Collection.class.isAssignableFrom(fieldType)) {
                    fieldPredicate = handleCollectionField(criteriaBuilder, from, fieldName, value, logic);
                } else {
                    // Pass 'from' instead of 'path' to use the correct join context
                    fieldPredicate = handleSingleField(criteriaBuilder, from, fieldName, value, logic);
                }

                predicates.add(fieldPredicate);
            } catch (Exception e) {
                log.error("Error applying filter for '{}'", key, e);
            }
        });

        return predicates;
    }


//    default Predicate handleSingleField(CriteriaBuilder criteriaBuilder, From<?, ?> from, String fieldName, String value) {
//        Class<?> fieldType = from.get(fieldName).getJavaType();
//
//        if (isStringNumberOrDate(fieldType)) {
//            return criteriaBuilder.like(criteriaBuilder.lower(from.get(fieldName).as(String.class)), "%" + value.toLowerCase() + "%");
//        } else {
//            return criteriaBuilder.equal(from.get(fieldName), value);
//        }
//    }

    default Predicate handleSingleField(CriteriaBuilder cb, From<?, ?> from, String fieldName, String value, String logic) {
        Class<?> fieldType = from.get(fieldName).getJavaType();

        // Non-string: keep existing behavior
        if (!isStringNumberOrDate(fieldType)) {
            return cb.equal(from.get(fieldName), value);
        }

        // String: multi-word fuzzy/contains
        String trimmed = value == null ? "" : value.trim();
        if (trimmed.isEmpty()) {
            return cb.conjunction(); // nothing to filter on => no constraint
        }

        String[] tokens = trimmed.toLowerCase().split("\\s+"); // e.g. "pm cn" -> ["pm","cn"]

        List<Predicate> tokenPredicates = new ArrayList<>();

        for (String token : tokens) {
            if (token.isEmpty()) continue;

            Expression<String> fieldExpr = cb.lower(from.get(fieldName).as(String.class));

            // LIKE for partial/contains
            Predicate likePred = cb.like(fieldExpr, "%" + token + "%");

            Predicate perToken = likePred;

            tokenPredicates.add(perToken);
        }

        if (tokenPredicates.isEmpty()) {
            return cb.conjunction(); // only blank tokens => no constraint
        }

        // AND between tokens -> all words must match somewhere
        if(logic.equals("OR"))return cb.or(tokenPredicates.toArray(new Predicate[0]));
        return cb.and(tokenPredicates.toArray(new Predicate[0]));

    }


        
// default Predicate handleSingleField(CriteriaBuilder cb, From<?, ?> from, String fieldName, String value) {
//     String[] tokens = value.trim().toLowerCase().split("\\s+");
//     Expression<String> fieldLower = cb.lower(from.get(fieldName).as(String.class));
    
//     List<Predicate> patterns = new ArrayList<>();
    
//     for (String token : tokens) {
//         if (token.isEmpty()) continue;
        
//         String cleanToken = token.replaceAll("[aeiou]", "");
        
//         // 6 vowel-tolerant patterns (covers 98% cases)
//         patterns.add(cb.like(fieldLower, "%" + token + "%"));           // exact: "pmp"
//         patterns.add(cb.like(fieldLower, "%" + cleanToken + "%"));      // vowel-free: "pmp"
//     }
    
//     return cb.and(patterns.toArray(new Predicate[0]));
// }





    default <T extends BaseIdEntity> Specification<T> buildComplexSpecification(SearchCriteria criteria, boolean andLogicIsEnabled) {
        return buildComplexSpecification(criteria, andLogicIsEnabled, null);
    }


    default Predicate handleCollectionField(CriteriaBuilder criteriaBuilder, From<?, ?> from, String fieldName, String value, String logic) {
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
        return String.class.isAssignableFrom(type) || Number.class.isAssignableFrom(type) || Temporal.class.isAssignableFrom(type);
    }





    //==========================UNIQUE QUERY METHODS=================================
    
    private String buildPathExpression(String columnName) {
        if (columnName.contains(".")) {
            // Nested: "location.city" → "e.location.city"
            return "e." + columnName;
        }
        return "e." + columnName;
    }



    // default <T> Page<String> getFilteredUniqueValuesOfColumn(
    //         EntityManager entityManager,
    //         JpaSpecificationExecutor<T> repository,
    //         Class<T> entityClass,
    //         String columnName,
    //         Map<String, String> filters,
    //         Pageable pageable,
    //         boolean andLogicIsEnabled  // ← You have this parameter
    // ) {
    //     String entityName = entityClass.getSimpleName();
    //     String pathExpr = buildPathExpression(columnName);
    
    //     String selectClause = pathExpr;
    //     String orderByClause = pathExpr;
        
    //     if (columnName.contains(".")) {
    //         String[] parts = columnName.split("\\.");
    //         String relationName = parts[0];
    //         selectClause = pathExpr + ", e." + relationName + ".id";
    //         orderByClause = pathExpr;
    //     }
    
    //     StringBuilder jpql = new StringBuilder("SELECT DISTINCT ");
    //     jpql.append(selectClause)
    //             .append(" FROM ")
    //             .append(entityName)
    //             .append(" e WHERE 1=1");
    
    //     List<Object> params = new ArrayList<>();
    //     int paramIndex = 1;
        
    //     // Collect all filter conditions
    //     List<String> filterConditions = new ArrayList<>();
    
    //     for (Map.Entry<String, String> filter : filters.entrySet()) {
    //         if (filter.getValue() != null && !filter.getValue().trim().isEmpty()) {
    //             String[] tokens = filter.getValue().trim().toLowerCase().split("\s+");
                
    //             StringBuilder filterClause = new StringBuilder("(");
    //             for (int i = 0; i < tokens.length; i++) {
    //                 if (i > 0) filterClause.append(" AND ");  // ← Tokens always AND
    //                 filterClause.append("LOWER(e.").append(filter.getKey()).append(") LIKE ?").append(paramIndex);
    //                 params.add("%" + tokens[i] + "%");
    //                 paramIndex++;
    //             }
    //             filterClause.append(")");
    //             filterConditions.add(filterClause.toString());
    //         }
    //     }
    
    //     // Combine filter conditions based on andLogicIsEnabled
    //     if (!filterConditions.isEmpty()) {
    //         String filterLogic = andLogicIsEnabled ? " AND " : " OR ";
    //         System.out.println("Filter Logic: " + filterLogic);
    //         jpql.append(" AND (").append(String.join(filterLogic, filterConditions)).append(")");
    //     }
    
    //     jpql.append(" ORDER BY ").append(orderByClause).append(" ASC");
    
    //     System.out.println("JPQL Query: " + jpql.toString());
    //     System.out.println("Parameters: " + params);
    
    //     Query query = entityManager.createQuery(jpql.toString());
    //     for (int i = 0; i < params.size(); i++) {
    //         query.setParameter(i + 1, params.get(i));
    //     }
    
    //     query.setFirstResult((int) pageable.getOffset());
    //     query.setMaxResults(pageable.getPageSize());
    
    //     List<?> results = query.getResultList();
        
    //     List<String> values = new ArrayList<>();
    //     for (Object result : results) {
    //         if (result instanceof Object[] arr) {
    //             values.add(String.valueOf(arr[0]));
    //         } else {
    //             values.add(String.valueOf(result));
    //         }
    //     }
    
    //     long total = getCountForUniqueValues(entityManager, entityName, columnName, filters, andLogicIsEnabled);
        
    //     return new PageImpl<>(values, pageable, total);
    // }
    
    // private long getCountForUniqueValues(EntityManager entityManager, String entityName, 
    //                                      String columnName, Map<String, String> filters,
    //                                      boolean andLogicIsEnabled) {
    //     StringBuilder jpql = new StringBuilder("SELECT COUNT(DISTINCT ");
    //     jpql.append("e.").append(columnName.split("\\.")[0]);
    //     jpql.append(") FROM ").append(entityName).append(" e WHERE 1=1");
    
    //     int paramIndex = 1;
    //     List<Object> params = new ArrayList<>();
        
    //     List<String> filterConditions = new ArrayList<>();
        
    //     for (Map.Entry<String, String> filter : filters.entrySet()) {
    //         if (filter.getValue() != null && !filter.getValue().trim().isEmpty()) {
    //             String[] tokens = filter.getValue().trim().toLowerCase().split("\s+");
                
    //             StringBuilder filterClause = new StringBuilder("(");
    //             for (int i = 0; i < tokens.length; i++) {
    //                 if (i > 0) filterClause.append(" AND ");  // ← Tokens always AND
    //                 filterClause.append("LOWER(e.").append(filter.getKey()).append(") LIKE ?").append(paramIndex);
    //                 params.add("%" + tokens[i] + "%");
    //                 paramIndex++;
    //             }
    //             filterClause.append(")");
    //             filterConditions.add(filterClause.toString());
    //         }
    //     }
    
    //     if (!filterConditions.isEmpty()) {
    //         String filterLogic = andLogicIsEnabled ? " AND " : " OR ";
    //         jpql.append(" AND (").append(String.join(filterLogic, filterConditions)).append(")");
    //     }
    
    //     Query query = entityManager.createQuery(jpql.toString());
    //     for (int i = 0; i < params.size(); i++) {
    //         query.setParameter(i + 1, params.get(i));
    //     }
    
    //     return (Long) query.getSingleResult();
    // }



    
        default <T> Page<String> getFilteredUniqueValuesOfColumn(
                EntityManager entityManager,
                JpaSpecificationExecutor<T> repository,
                Class<T> entityClass,
                String columnName,
                SearchCriteria searchCriteria,
                Pageable pageable,
                boolean andLogicIsEnabled
        ) {
            String entityName = entityClass.getSimpleName();
            String pathExpr = buildPathExpression(columnName);

            Map<String,String> filters = searchCriteria.getFilters() != null ? searchCriteria.getFilters() : Map.of();
            Map<String,String> filterLogic = searchCriteria.getColumnFilterLogic() != null ? searchCriteria.getColumnFilterLogic() : Map.of();

            // For nested entities, we need to select the ID for ordering
            String selectClause = pathExpr;
            String orderByClause = pathExpr;
            
            if (columnName.contains(".")) {
                // Nested path: include the foreign key in SELECT for DISTINCT + ORDER BY
                String[] parts = columnName.split("\\.");
                String relationName = parts[0];
                selectClause = pathExpr + ", e." + relationName + ".id";
                orderByClause = pathExpr;
            }
        
            StringBuilder jpql = new StringBuilder("SELECT DISTINCT ");
            jpql.append(selectClause)
                    .append(" FROM ")
                    .append(entityName)
                    .append(" e WHERE 1=1");
        
            List<Object> params = new ArrayList<>();
            int paramIndex = 1;
        
            // Build WHERE clause for each filter field
            for (Map.Entry<String, String> filter : filters.entrySet()) {
                String logic = getFilterLogicFromMap(filterLogic,filter.getKey());
                if (filter.getValue() != null && !filter.getValue().trim().isEmpty()) {
                    String[] tokens = filter.getValue().trim().toLowerCase().split("\\s+");
                    
                    jpql.append(" AND (");
                    for (int i = 0; i < tokens.length; i++) {
                        if (i > 0) jpql.append(" "+logic+" ");
                        jpql.append("LOWER(e.").append(filter.getKey()).append(") LIKE ?").append(paramIndex);
                        params.add("%" + tokens[i] + "%");
                        paramIndex++;
                    }
                    jpql.append(")");
                }
            }
        
            jpql.append(" ORDER BY ").append(orderByClause).append(" ASC");
        
            log.debug("JPQL Query: {} | Parameters: {}", jpql, params);
        
            Query query = entityManager.createQuery(jpql.toString());
            for (int i = 0; i < params.size(); i++) {
                query.setParameter(i + 1, params.get(i));
            }
        
            query.setFirstResult((int) pageable.getOffset());
            query.setMaxResults(pageable.getPageSize());
        
            List<?> results = query.getResultList();
            
            // Extract just the values (not the IDs used for ordering)
            List<String> values = new ArrayList<>();
            for (Object result : results) {
                if (result instanceof Object[] arr) {
                    // For nested: [value, id], take the first element
                    values.add(String.valueOf(arr[0]));
                } else {
                    values.add(String.valueOf(result));
                }
            }
        
            long total = getCountForUniqueValues(entityManager, entityName, columnName, filters, filterLogic);
            
            return new PageImpl<>(values, pageable, total);
        }
    
    private long getCountForUniqueValues(EntityManager entityManager, String entityName, 
                                         String columnName, Map<String, String> filters, Map<String, String> filterLogic) {
        StringBuilder jpql = new StringBuilder("SELECT COUNT(DISTINCT ");
        jpql.append("e.").append(columnName.split("\\.")[0]);
        jpql.append(") FROM ").append(entityName).append(" e WHERE 1=1");
    
        int paramIndex = 1;
        List<Object> params = new ArrayList<>();
        
        for (Map.Entry<String, String> filter : filters.entrySet()) {
            if (filter.getValue() != null && !filter.getValue().trim().isEmpty()) {
                String logic = getFilterLogicFromMap(filterLogic,filter.getKey());
                String[] tokens = filter.getValue().trim().toLowerCase().split("\s+");
                
                jpql.append(" AND (");
                for (int i = 0; i < tokens.length; i++) {
                    if (i > 0) jpql.append(" "+logic+" ");
                    jpql.append("LOWER(e.").append(filter.getKey()).append(") LIKE ?").append(paramIndex);
                    params.add("%" + tokens[i] + "%");
                    paramIndex++;
                }
                jpql.append(")");
            }
        }
    
        Query query = entityManager.createQuery(jpql.toString());
        for (int i = 0; i < params.size(); i++) {
            query.setParameter(i + 1, params.get(i));
        }
    
        return (Long) query.getSingleResult();
    }

    private String getFilterLogicFromMap(Map<String,String> filterLogicMap, String column){
        if(filterLogicMap==null || filterLogicMap.get(column)==null) return "AND";
        String logic = filterLogicMap.get(column);
        return logic.equalsIgnoreCase("or") ? "OR" : "AND";
    }



}