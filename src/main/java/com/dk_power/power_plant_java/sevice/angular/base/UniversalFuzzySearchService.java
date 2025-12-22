package com.dk_power.power_plant_java.sevice.angular.base;

import com.dk_power.power_plant_java.entities.loto.LotoPoint;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import jakarta.persistence.TypedQuery;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.util.*;

@Service
public class UniversalFuzzySearchService {
    
    @PersistenceContext
    private EntityManager entityManager;
    
    /**
     * "pmp st" searches ALL specified fields - ANY token in ANY field
     */
    public <T> List<T> searchMultipleFields(Class<T> entityClass, List<String> fieldPaths, String query) {
        String[] tokens = query.trim().toLowerCase().split("\\s+");
        if (tokens.length == 0) return Collections.emptyList();
        
        // Build JPQL: token1 in ANY field AND token2 in ANY field
        StringBuilder jpql = new StringBuilder("SELECT e FROM " + entityClass.getSimpleName() + " e WHERE 1=1");
        List<String> params = new ArrayList<>();
        
        for (String token : tokens) {
            if (!token.isEmpty()) {
                jpql.append(" AND (");
                for (int i = 0; i < fieldPaths.size(); i++) {
                    if (i > 0) jpql.append(" OR ");
                    jpql.append("LOWER(e.").append(fieldPaths.get(i)).append(") LIKE LOWER(CONCAT('%', ?").append(params.size() + 1).append(", '%'))");
                }
                jpql.append(")");
                params.add(token);
            }
        }
        
        System.out.println("JPQL: " + jpql + " | Params: " + params);
        
        TypedQuery<T> quer = entityManager.createQuery(jpql.toString(), entityClass);
        for (int i = 0; i < params.size(); i++) {
            quer.setParameter(i + 1, params.get(i));
        }
        
        return quer.getResultList();
    }

    public <T> List<T> searchAnyField(Class<T> entityClass, String fieldPath, String query) {
        String[] tokens = query.trim().toLowerCase().split("\\s+");
        if (tokens.length == 0) return Collections.emptyList();

        // Dynamic JPQL for ANY entity/field
        String jpql = "SELECT e FROM " + entityClass.getSimpleName() + " e WHERE 1=1";
        List<String> params = new ArrayList<>();

        for (String token : tokens) {
            if (!token.isEmpty()) {
                jpql += " AND LOWER(e." + fieldPath + ") LIKE LOWER(CONCAT('%', ?1, '%'))";
                params.add(token);
            }
        }

        TypedQuery<T> quer = entityManager.createQuery(jpql, entityClass);
        for (int i = 0; i < params.size(); i++) {
            quer.setParameter(i + 1, params.get(i));
        }

        return quer.getResultList();
    }

    // Pagination support
    public <T> Page<T> searchAnyFieldPaged(Class<T> entityClass, String fieldPath,
                                           String query, Pageable pageable) {
        List<T> results = searchAnyField(entityClass, fieldPath, query);
        return new PageImpl<>(results, pageable, results.size());
    }

    public <T> List<T> searchWithFieldFilters(Class<T> entityClass, Map<String, String> fieldFilters, boolean andLogic) {
        StringBuilder jpql = new StringBuilder("SELECT e FROM " + entityClass.getSimpleName() + " e WHERE 1=1");
        List<String> params = new ArrayList<>();
        List<PredicateGroup> groups = new ArrayList<>();

        // Each field gets its own token group
        for (Map.Entry<String, String> filter : fieldFilters.entrySet()) {
            String field = filter.getKey();
            String value = filter.getValue();

            if (value == null || value.trim().isEmpty()) continue;

            // Split field value into tokens: "pmp st" → AND within field
            String[] tokens = value.trim().toLowerCase().split("\\s+");
            PredicateGroup group = new PredicateGroup(field, tokens);
            groups.add(group);

            // Build field AND tokens
            jpql.append(" AND (");
            for (int i = 0; i < tokens.length; i++) {
                if (i > 0) jpql.append(" AND ");
                jpql.append("LOWER(e.").append(field).append(") LIKE LOWER(CONCAT('%', ?").append(params.size() + 1).append(", '%'))");
                params.add(tokens[i]);
            }
            jpql.append(")");
        }

        System.out.println("JPQL: " + jpql + " | Params: " + params);

        TypedQuery<T> query = entityManager.createQuery(jpql.toString(), entityClass);
        for (int i = 0; i < params.size(); i++) {
            query.setParameter(i + 1, params.get(i));
        }

        return query.getResultList();
    }

    public void testSearchWithFieldFilters() {
    System.out.println("\n========== TEST: searchWithFieldFilters ==========\n");
    
    // Test 1: Single field, multiple tokens
    System.out.println("TEST 1: Single field 'description', search 'pmp st'");
    Map<String, String> filters1 = new HashMap<>();
    filters1.put("description", "pmp st");
    List<?> results1 = searchWithFieldFilters(LotoPoint.class, filters1, true);
    System.out.println("Results: " + results1.size() + " rows found");
    results1.forEach(r -> System.out.println("  - " + r));
    
    // Test 2: Multiple fields, different tokens
    System.out.println("\nTEST 2: Multiple fields, search 'pmp' in description, 'st' in location");
    Map<String, String> filters2 = new HashMap<>();
    filters2.put("description", "pmp");
    filters2.put("tagNumber", "cnd");
    List<?> results2 = searchWithFieldFilters(LotoPoint.class, filters2, true);
    System.out.println("Results: " + results2.size() + " rows found");
    results2.forEach(r -> System.out.println("  - " + r));
    
    // Test 3: Edge case - empty filter
    System.out.println("\nTEST 3: Empty filter value");
    Map<String, String> filters3 = new HashMap<>();
    filters3.put("description", "");
    List<?> results3 = searchWithFieldFilters(LotoPoint.class, filters3, true);
    System.out.println("Results: " + results3.size() + " rows found");
    
    // Test 4: Multiple tokens with special spacing
    System.out.println("\nTEST 4: Multiple tokens 'pmp    st' (extra spaces)");
    Map<String, String> filters4 = new HashMap<>();
    filters4.put("description", "pmp    st");
    List<?> results4 = searchWithFieldFilters(LotoPoint.class, filters4, true);
    System.out.println("Results: " + results4.size() + " rows found");
    results4.forEach(r -> System.out.println("  - " + r));
    
    System.out.println("\n========== END TESTS ==========\n");
}
}

// Helper class
class PredicateGroup {
    String field;
    String[] tokens;
    PredicateGroup(String f, String[] t) { field = f; tokens = t; }
}

