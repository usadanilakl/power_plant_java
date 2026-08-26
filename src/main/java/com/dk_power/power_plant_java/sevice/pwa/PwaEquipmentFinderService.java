package com.dk_power.power_plant_java.sevice.pwa;

import com.dk_power.power_plant_java.dto.pwa.finder.FinderFilterDto;
import com.dk_power.power_plant_java.dto.pwa.finder.FinderItemDto;
import com.dk_power.power_plant_java.dto.pwa.finder.FinderRequestDto;
import com.dk_power.power_plant_java.dto.pwa.finder.FinderResultDto;
import com.dk_power.power_plant_java.entities.equipment.Equipment;
import com.dk_power.power_plant_java.entities.loto.LotoPoint;
import com.dk_power.power_plant_java.repository.equipment.EquipmentRepo;
import com.dk_power.power_plant_java.repository.loto.LotoPointRepo;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import jakarta.persistence.criteria.CriteriaBuilder;
import jakarta.persistence.criteria.Expression;
import jakarta.persistence.criteria.Join;
import jakarta.persistence.criteria.JoinType;
import jakarta.persistence.criteria.Predicate;
import jakarta.persistence.criteria.Root;
import jakarta.persistence.criteria.Subquery;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.Collection;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

/**
 * Equipment Finder: search LOTO points and equipment by the same five fields, in one query pair.
 *
 * <p>Filters combine with AND across boxes and by the box's own AND/OR mode within one box, each word
 * matching as a case-insensitive substring. Every filter maps onto a field both entities have, which
 * is what lets one request search both — {@code location} is the one exception: for a LOTO point it
 * also matches the free-text {@code generalLocation}, since the plant records a location there on
 * older rows and in the {@code location} Value on newer ones.</p>
 *
 * <p><b>Equipment is only returned when no LOTO point references it.</b> A referenced equipment row IS
 * the LOTO point's occurrence on a drawing, so listing both would show the same physical thing twice
 * under two names. The check is an explicit NOT EXISTS over LotoPoint rather than
 * {@code isEmpty(lotoPoints)}: the subquery root applies LotoPoint's {@code @Where} soft-delete
 * filter, so equipment whose only references are deleted points correctly comes back as unreferenced,
 * where the collection form would still count the stale join rows.</p>
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class PwaEquipmentFinderService {

    private final LotoPointRepo lotoPointRepo;
    private final EquipmentRepo equipmentRepo;

    @PersistenceContext
    private EntityManager em;

    /** Rows returned in one response unless the caller asks for fewer. Counts still reflect the full set. */
    private static final int DEFAULT_LIMIT = 200;
    private static final int MAX_LIMIT = 500;

    /**
     * Run a finder query. An empty request (no usable words anywhere) returns nothing rather than the
     * whole plant — a blank form should not be able to pull tens of thousands of rows onto a phone.
     */
    @Transactional(readOnly = true)
    public FinderResultDto search(FinderRequestDto req) {
        if (req == null || !hasAnyTerm(req)) {
            return new FinderResultDto(List.of(), 0, 0, false);
        }

        int limit = Math.min(req.limit() == null || req.limit() < 1 ? DEFAULT_LIMIT : req.limit(), MAX_LIMIT);
        Sort byTag = Sort.by(Sort.Direction.ASC, "tagNumber");

        // LOTO points fill the list first — they are the thing the plant actually locks out.
        Page<LotoPoint> points = lotoPointRepo.findAll(lotoPointSpec(req), PageRequest.of(0, limit, byTag));
        int remaining = Math.max(0, limit - points.getNumberOfElements());
        Page<Equipment> equipment = remaining > 0
                ? equipmentRepo.findAll(unreferencedEquipmentSpec(req), PageRequest.of(0, remaining, byTag))
                // Still ask for the count when the page is already full, so "showing 200 of N" stays honest.
                : equipmentRepo.findAll(unreferencedEquipmentSpec(req), PageRequest.of(0, 1, byTag));

        List<FinderItemDto> items = new ArrayList<>();
        Set<Long> pointsWithDrawing = pointIdsWithDrawing(points.getContent().stream().map(LotoPoint::getId).toList());
        for (LotoPoint p : points) {
            items.add(new FinderItemDto("lotoPoint", p.getId(), p.getTagNumber(), p.getDescription(),
                    valueName(p.getLocation() == null ? null : p.getLocation().getName(), p.getGeneralLocation()),
                    p.getEqType() == null ? null : p.getEqType().getName(),
                    p.getSpecificLocation(),
                    pointsWithDrawing.contains(p.getId())));
        }
        if (remaining > 0) {
            for (Equipment e : equipment) {
                items.add(new FinderItemDto("equipment", e.getId(), e.getTagNumber(), e.getDescription(),
                        e.getLocation() == null ? null : e.getLocation().getName(),
                        e.getEqType() == null ? null : e.getEqType().getName(),
                        e.getSpecificLocation(),
                        e.getMainFile() != null));
            }
        }

        long total = points.getTotalElements() + equipment.getTotalElements();
        boolean truncated = total > items.size();
        log.info("[PWA-FINDER] search: lotoPoints={}, unreferencedEquipment={}, returned={}, truncated={}",
                points.getTotalElements(), equipment.getTotalElements(), items.size(), truncated);
        return new FinderResultDto(items, points.getTotalElements(), equipment.getTotalElements(), truncated);
    }

    // ── Specifications ──────────────────────────────────────────────────────────

    private Specification<LotoPoint> lotoPointSpec(FinderRequestDto req) {
        return (root, query, cb) -> {
            List<Predicate> all = new ArrayList<>();
            // LEFT joins, not path navigation: an implicit join is an INNER one, which would drop every
            // row whose location or type was never set — exactly the rows a finder is used to hunt down.
            Join<Object, Object> location = root.join("location", JoinType.LEFT);
            Join<Object, Object> eqType = root.join("eqType", JoinType.LEFT);

            addIfPresent(all, matchTerms(cb, req.location(), List.of(location.get("name"), root.get("generalLocation"))));
            addIfPresent(all, matchTerms(cb, req.eqType(), List.of(eqType.get("name"))));
            addIfPresent(all, matchTerms(cb, req.specificLocation(), List.of(root.get("specificLocation"))));
            addIfPresent(all, matchTerms(cb, req.tagNumber(), List.of(root.get("tagNumber"))));
            addIfPresent(all, matchTerms(cb, req.description(), List.of(root.get("description"))));
            return all.isEmpty() ? cb.conjunction() : cb.and(all.toArray(new Predicate[0]));
        };
    }

    private Specification<Equipment> unreferencedEquipmentSpec(FinderRequestDto req) {
        return (root, query, cb) -> {
            List<Predicate> all = new ArrayList<>();
            Join<Object, Object> location = root.join("location", JoinType.LEFT);
            Join<Object, Object> eqType = root.join("eqType", JoinType.LEFT);

            addIfPresent(all, matchTerms(cb, req.location(), List.of(location.get("name"))));
            addIfPresent(all, matchTerms(cb, req.eqType(), List.of(eqType.get("name"))));
            addIfPresent(all, matchTerms(cb, req.specificLocation(), List.of(root.get("specificLocation"))));
            addIfPresent(all, matchTerms(cb, req.tagNumber(), List.of(root.get("tagNumber"))));
            addIfPresent(all, matchTerms(cb, req.description(), List.of(root.get("description"))));

            // "No LOTO point references it" — see class doc for why this is a subquery, not isEmpty().
            Subquery<Integer> referenced = query.subquery(Integer.class);
            Root<LotoPoint> point = referenced.from(LotoPoint.class);
            Join<Object, Object> pointEquipment = point.join("equipmentList");
            referenced.select(cb.literal(1)).where(cb.equal(pointEquipment.get("id"), root.get("id")));
            all.add(cb.not(cb.exists(referenced)));

            return cb.and(all.toArray(new Predicate[0]));
        };
    }

    /**
     * Turn one filter box into a predicate: each word must appear in at least one of {@code fields},
     * and the words themselves combine by the box's AND/OR mode. Returns null when the box is empty so
     * the caller can drop it rather than AND-ing in a tautology.
     */
    private Predicate matchTerms(CriteriaBuilder cb, FinderFilterDto filter, List<Expression<?>> fields) {
        List<String> terms = cleanTerms(filter);
        if (terms.isEmpty()) return null;

        List<Predicate> perTerm = new ArrayList<>();
        for (String term : terms) {
            String pattern = "%" + escapeLike(term.toLowerCase()) + "%";
            List<Predicate> perField = new ArrayList<>();
            for (Expression<?> field : fields) {
                perField.add(cb.like(cb.lower(field.as(String.class)), pattern, '\\'));
            }
            perTerm.add(cb.or(perField.toArray(new Predicate[0])));
        }
        return filter.isAndMode()
                ? cb.and(perTerm.toArray(new Predicate[0]))
                : cb.or(perTerm.toArray(new Predicate[0]));
    }

    /** Drop a filter that produced nothing instead of AND-ing in a tautology. */
    private void addIfPresent(List<Predicate> all, Predicate predicate) {
        if (predicate != null) all.add(predicate);
    }

    // ── Helpers ─────────────────────────────────────────────────────────────────

    /**
     * Which of these points have at least one drawing behind them — one query for the whole page
     * instead of walking each point's equipment collection, which would drag every Equipment and its
     * eager mainFile into memory just to render a badge.
     */
    private Set<Long> pointIdsWithDrawing(Collection<Long> pointIds) {
        if (pointIds == null || pointIds.isEmpty()) return Set.of();
        return new HashSet<>(em.createQuery(
                        "SELECT DISTINCT lp.id FROM LotoPoint lp JOIN lp.equipmentList e "
                                + "WHERE lp.id IN :ids AND e.mainFile IS NOT NULL", Long.class)
                .setParameter("ids", pointIds)
                .getResultList());
    }

    private boolean hasAnyTerm(FinderRequestDto req) {
        return !cleanTerms(req.location()).isEmpty()
                || !cleanTerms(req.eqType()).isEmpty()
                || !cleanTerms(req.specificLocation()).isEmpty()
                || !cleanTerms(req.tagNumber()).isEmpty()
                || !cleanTerms(req.description()).isEmpty();
    }

    private List<String> cleanTerms(FinderFilterDto filter) {
        if (filter == null || filter.terms() == null) return List.of();
        return filter.terms().stream()
                .filter(t -> t != null && !t.isBlank())
                .map(String::trim)
                .toList();
    }

    /** A typed % or _ is a literal here, not a wildcard — otherwise "%" alone would match everything. */
    private String escapeLike(String s) {
        return s.replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_");
    }

    /** Prefer the Value's name, fall back to the free-text field, so the row always shows what matched. */
    private String valueName(String fromValue, String freeText) {
        if (fromValue != null && !fromValue.isBlank()) return fromValue;
        return freeText;
    }
}
