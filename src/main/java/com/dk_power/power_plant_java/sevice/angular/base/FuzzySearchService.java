package com.dk_power.power_plant_java.sevice.angular.base;

import com.dk_power.power_plant_java.entities.loto.LotoPoint;
import com.dk_power.power_plant_java.repository.loto.LotoPointRepo;
import jakarta.persistence.criteria.*;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Service;

import java.util.Arrays;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class FuzzySearchService {

    // Inject your specific repository
     private final LotoPointRepo lotoPointRepository;


public <T> Page<T> search(Class<T> entityClass, Map<String, String> fieldFilters,
                          Pageable pageable, JpaSpecificationExecutor<T> repository) {
    Specification<T> spec = Specification.where(null);

    for (Map.Entry<String, String> filter : fieldFilters.entrySet()) {
        if (filter.getValue() != null && !filter.getValue().trim().isEmpty()) {
            spec = spec.and(createFuzzySpec(filter.getKey(), filter.getValue()));
        }
    }

    return repository.findAll(spec, pageable);
}

    private <T> Specification<T> createFuzzySpec(String fieldPath, String value) {
        String[] tokens = value.trim().toLowerCase().split("\\s+");
        return (root, query, cb) -> {
            Predicate[] predicates = Arrays.stream(tokens)
//                    .map(token -> buildFieldPredicate(root, fieldPath, token, cb))
                    .map(token -> buildFieldLevingsteinPredicate(root, fieldPath, token, cb))
                    .toArray(Predicate[]::new);
            return cb.and(predicates);
        };
    }

    private <T> Predicate buildFieldPredicate(Root<T> root, String fieldPath, String token, CriteriaBuilder cb) {
        String[] pathParts = fieldPath.split("\\.");

        if (pathParts.length == 1) {
            // Simple field: root.get("description")
            return cb.like(cb.lower(root.get(pathParts[0])), "%" + token + "%");
        }

        if (fieldPath.contains("[*]")) {
            // Array of entities: "tags[*].name"
            return buildArrayPredicate(root, fieldPath, token, cb);
        }

        // Nested path: "location.city" or "owner.name"
        return buildNestedPredicate(root, pathParts, token, cb);
    }

    
    private <T> Predicate buildNestedPredicate(Root<T> root, String[] pathParts, String token, CriteriaBuilder cb) {
        Path<?> path = root;
        for (String part : pathParts) {
            path = path.get(part);
        }
        return cb.like(cb.lower(path.as(String.class)), "%" + token + "%");
    }
    
    private <T> Predicate buildArrayPredicate(Root<T> root, String fieldPath, String token, CriteriaBuilder cb) {
        // Replace [*] with actual join
        String joinPath = fieldPath.replace("[*]", "");
        String[] pathParts = joinPath.split("\\.");
    
        // Create join for array of entities
        Join<?, ?> join = root.join(pathParts[0], JoinType.LEFT);
    
        Path<?> path = join;
        for (int i = 1; i < pathParts.length; i++) {
            path = path.get(pathParts[i]);
        }
    
        return cb.like(cb.lower(path.as(String.class)), "%" + token + "%");
    }

    private <T> Predicate buildFieldLevingsteinPredicate(Root<T> root, String fieldPath, String token, CriteriaBuilder cb) {
        String[] pathParts = fieldPath.split("\\.");

        if (pathParts.length == 1) {
            return buildLevenshteinPredicate(root.get(pathParts[0]), token, cb);
        }

        if (fieldPath.contains("[*]")) {
            return buildArrayLevenshteinPredicate(root, fieldPath, token, cb);
        }

        return buildNestedLevenshteinPredicate(root, pathParts, token, cb);
    }

    
        private <T> Predicate buildLevenshteinPredicate(Path<?> path, String token, CriteriaBuilder cb) {
            Expression<String> field = cb.lower(path.as(String.class));
            String t = token.toLowerCase();
            
            // Build fuzzy matching predicates for H2 (no Levenshtein support)
            Predicate[] fuzzyPredicates = new Predicate[]{
                cb.like(field, t),                           // exact match: "pmp" = "pmp"
                cb.like(field, t + "%"),                     // prefix: "pmp" = "pmp-station"  
                cb.like(field, "%" + t),                     // suffix: "pmp" = "superpmp"
                cb.like(field, "%" + t + "%"),               // contains: "pmp" = "power-pmp-station"
                cb.like(field, t + "s%"),                    // plural: "pmp" = "pmps"
                cb.like(field, t + "es%"),                   // plural variant: "pmp" = "pmpes"
                cb.like(field, t + "ed%"),                   // past tense: "pmp" = "pumped"
                cb.like(field, t + "ing%")                   // gerund: "pmp" = "pumping"
            };
            
            // Handle substring case only if token length > 1
            if (t.length() > 1) {
                String prefix = t.substring(0, t.length() - 1);
                fuzzyPredicates = java.util.Arrays.copyOf(fuzzyPredicates, fuzzyPredicates.length + 1);
                fuzzyPredicates[fuzzyPredicates.length - 1] = cb.like(field, prefix + "%");
            }
            
            return cb.or(fuzzyPredicates);
        }

    private <T> Predicate buildNestedLevenshteinPredicate(Root<T> root, String[] pathParts, String token, CriteriaBuilder cb) {
        Path<?> path = root;
        for (String part : pathParts) {
            path = path.get(part);
        }
        return buildLevenshteinPredicate(path, token, cb);
    }

    private <T> Predicate buildArrayLevenshteinPredicate(Root<T> root, String fieldPath, String token, CriteriaBuilder cb) {
        String joinPath = fieldPath.replace("[*]", "");
        String[] pathParts = joinPath.split("\\.");

        Join<Object, Object> join = root.join(pathParts[0], JoinType.LEFT);
        Path<?> path = join;
        for (int i = 1; i < pathParts.length; i++) {
            path = path.get(pathParts[i]);
        }

        return buildLevenshteinPredicate(path, token, cb);
    }


    public void testFuzzySearch() {
    System.out.println("\n========== TEST: FuzzySearchService ==========\n");
    
    // Test 1: Simple field search
    System.out.println("TEST 1: Simple field 'description', search 'pmp st'");
    Map<String, String> filters1 = Map.of("description", "pmp st");
    Pageable pageable = PageRequest.of(0, 10);
    Page<LotoPoint> results1 = search(LotoPoint.class, filters1, pageable, lotoPointRepository);
    System.out.println("Results: " + results1.getTotalElements() + " rows found");
    results1.getContent().forEach(p -> 
        System.out.println("  - " + p.getDescription() + " | " + p.getTagNumber())
    );
    
    // Test 2: Multiple field search
    System.out.println("\nTEST 2: Multiple fields, search 'pmp' in description, 'cnd' in tagNumber");
    Map<String, String> filters2 = Map.of(
        "description", "pmp",
        "tagNumber", "cnd"
    );
    Page<LotoPoint> results2 = search(LotoPoint.class, filters2, pageable, lotoPointRepository);
    System.out.println("Results: " + results2.getTotalElements() + " rows found");
    results2.getContent().forEach(p -> 
        System.out.println("  - " + p.getDescription() + " | " + p.getTagNumber())
    );
    
    // Test 3: Extra spacing
    System.out.println("\nTEST 3: Extra spacing 'pmp    st'");
    Map<String, String> filters3 = Map.of("description", "pmp    st");
    Page<LotoPoint> results3 = search(LotoPoint.class, filters3, pageable, lotoPointRepository);
    System.out.println("Results: " + results3.getTotalElements() + " rows found");
    results3.getContent().forEach(p -> 
        System.out.println("  - " + p.getDescription() + " | " + p.getTagNumber())
    );
    
    // Test 4: Single token
    System.out.println("\nTEST 4: Single token 'pmp'");
    Map<String, String> filters4 = Map.of("description", "pmp");
    Page<LotoPoint> results4 = search(LotoPoint.class, filters4, pageable, lotoPointRepository);
    System.out.println("Results: " + results4.getTotalElements() + " rows found");
    results4.getContent().forEach(p -> 
        System.out.println("  - " + p.getDescription() + " | " + p.getTagNumber())
    );

    //Test 5: Nested path search
    System.out.println("\nTEST 5: Nested path 'isoPos.name, Open,description', pmp st");
    Map<String, String> filters5 = Map.of("isoPos.name", "Open","description", "pmp st");
    Page<LotoPoint> results5 = search(LotoPoint.class, filters5, pageable, lotoPointRepository);
    System.out.println("Results: " + results5.getTotalElements() + " rows found");
    results5.getContent().forEach(p -> 
        System.out.println(p.getDescription() + "  - " + p.getIsoPos().getName() + " | " + p.getTagNumber())
    );
    
    // Test 6: Array search
    System.out.println("\nTEST 6: Array search 'tags[*].name', search 'PMP'");
    Map<String, String> filters6 = Map.of("tags[*].name", "PMP");

    //Test 7: Nested Entity Array search
    System.out.println("\nTEST 7: Nested Entity Array search 'equipmentList[*].description', search 'PMP'");
    Map<String, String> filters7 = Map.of("equipmentList[*].description", "PMP st");
    Page<LotoPoint> results7 = search(LotoPoint.class, filters7, pageable, lotoPointRepository);
    System.out.println("Results: " + results7.getTotalElements() + " rows found");
    results7.getContent().forEach(p -> {
        String equipmentDescriptions = p.getEquipmentList().stream()
            .map(e -> e.getDescription())
            .collect(Collectors.joining(", "));
        System.out.println("  - LotoPoint: " + p.getDescription() + " | Equipment: [" + equipmentDescriptions + "] | Tag: " + p.getTagNumber());
    });
    
    // Test 8: Levingstein search for cnd pmp
    System.out.println("\nTEST 8: Levenshtein search 'descriotion', search 'cnd pmp' (fuzzy match, max 2 edits)");
    Map<String, String> filters8 = Map.of("description", "cnd pmp");
    Page<LotoPoint> results8 = search(LotoPoint.class, filters8, pageable, lotoPointRepository);
    System.out.println("Results: " + results8.getTotalElements() + " rows found");
    results8.getContent().forEach(p -> 
        System.out.println("  - " + p.getDescription() + " | TagNumber: " + p.getTagNumber())
    );

    
    
    System.out.println("\n========== END TESTS ==========\n");
}








}

