package com.dk_power.power_plant_java.sevice.angular.permits;

import com.dk_power.power_plant_java.dto.permits.PermitMapAssignDto;
import com.dk_power.power_plant_java.dto.permits.PermitMapDto;
import com.dk_power.power_plant_java.entities.base_entities.BasePermitEntity;
import com.dk_power.power_plant_java.entities.categories.Value;
import com.dk_power.power_plant_java.entities.loto.Loto;
import com.dk_power.power_plant_java.entities.permits.ConfinedSpace;
import com.dk_power.power_plant_java.entities.permits.pojo.ConfinedSpaceType;
import com.dk_power.power_plant_java.entities.permits.HotWork;
import com.dk_power.power_plant_java.entities.permits.SafeWork;
import com.dk_power.power_plant_java.entities.permits.WorkArea;
import com.dk_power.power_plant_java.entities.permits.WorkRequest;
import com.dk_power.power_plant_java.entities.permits.pojo.WorkRequestArea;
import com.dk_power.power_plant_java.repository.permits.WorkAreaRepo;
import jakarta.persistence.EntityManager;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

/**
 * Builds the permits-map payload: every open request, permit and LOTO, placed onto the work areas
 * it touches.
 *
 * <h2>How a thing gets placed</h2>
 *
 * Four rules, tried in order; the first that answers wins.
 *
 * <ol>
 *   <li><b>AREA</b> — the record's own {@code workArea} FK, inherited by every permit type from
 *       {@code BasePermitEntity}. A person chose this; nothing else beats it.</li>
 *   <li><b>TEXT</b> — its own location text names an area, via {@link WorkAreaLocationResolver}.
 *       This is what catches the PWA requests whose map pick survived only as the composed
 *       {@code "<Area Name> - <detail>"} string.</li>
 *   <li><b>PACKAGE</b> — inherited from the daily package the permit belongs to, which in turn
 *       takes its areas from its work requests. A Safe Work generated from a request rarely
 *       carries a location of its own, but it is unambiguously happening wherever that request
 *       is.</li>
 *   <li><b>STANDARD</b> — LOTO only: the work areas that list this LOTO's source standard among
 *       their constant standards. A static association ("isolating this system always affects
 *       these areas"), so it is the weakest of the four and is tried last.</li>
 * </ol>
 *
 * <p>The rule that placed each item travels with it, because the four are not equally trustworthy
 * and an operator deciding whether to walk somewhere deserves to know which one they are reading.
 *
 * <h2>Why an item can be in several areas</h2>
 *
 * A LOTO reached through two packages in two parts of the plant is genuinely in both. Picking one
 * arbitrarily would hide live isolation from whoever is looking at the other. So
 * {@code workAreaIds} is a list, and an area's badge counts the items TOUCHING it rather than the
 * items "belonging" to it.
 *
 * <h2>A note on the queries</h2>
 *
 * Every status filter here is an explicit {@code LEFT JOIN}. Writing {@code e.permitStatus.name}
 * in a WHERE clause is an implicit INNER join in JPQL, which silently drops every row whose status
 * FK is null — and a null status is not an edge case in this database, it is how "not started yet"
 * is stored. That same mistake previously made the stale-package sweep see 5 of 159 packages.
 */
@Service
@Transactional
@RequiredArgsConstructor
public class NgPermitMapService {

    /**
     * A request that has been turned into a job and a package is not itself live work any more —
     * the permits it produced are, and they appear on their own layers. Leaving it on the WR layer
     * as well would draw the same job twice.
     */
    private static final Set<String> WR_DONE = Set.of("closed", "processed", "expired", "cancelled", "canceled");

    private static final Set<String> PERMIT_DONE = Set.of("closed", "processed", "expired", "cancelled", "canceled");

    /** LOTO has no "processed" state; a LOTO stays interesting until it is cleared. */
    private static final Set<String> LOTO_DONE = Set.of("closed", "cancelled", "canceled");

    private static final String BY_AREA = "AREA";
    private static final String BY_TEXT = "TEXT";
    private static final String BY_PACKAGE = "PACKAGE";
    private static final String BY_STANDARD = "STANDARD";

    /**
     * SafeWork, HotWork and ConfinedSpace do NOT declare {@code @Where(deleted...)}.
     *
     * <p>{@code @Where} sits on {@code BaseIdEntity}, which is a {@code @MappedSuperclass}, and
     * Hibernate does not inherit it — so unlike WorkRequest and Loto (which re-declare it), these
     * three return soft-deleted rows from every query. Without this predicate the map listed
     * deleted permits, and staging one produced a baffling "no longer exists" from the assign
     * endpoint's own delete check.
     */
    private static final String NOT_DELETED = " AND (e.deleted IS NULL OR e.deleted = false)";

    private final EntityManager entityManager;
    private final WorkAreaRepo workAreaRepo;
    private final WorkAreaLocationResolver locationResolver;

    public PermitMapDto build() {
        PermitMapDto out = new PermitMapDto();

        List<WorkArea> areas = workAreaRepo.findAll();
        for (WorkArea area : areas) {
            if (area == null || area.getId() == null) continue;
            out.getAreas().add(new PermitMapDto.Area(
                    area.getId(),
                    area.getName(),
                    area.getShape() != null ? area.getShape().getId() : null));
        }

        WorkAreaLocationResolver.Index index = locationResolver.buildIndex(areas);
        Map<Long, List<Long>> areasByPackage = areasByPackage(index);
        Map<Long, List<Long>> packagesByLoto = packagesByLoto();
        Map<Long, List<Long>> areasByStandard = areasByStandard();

        List<PermitMapDto.Item> all = new ArrayList<>();
        all.addAll(workRequests(index));
        all.addAll(safeWorks(index, areasByPackage));
        all.addAll(hotWorks(index, areasByPackage));
        all.addAll(confinedSpaces(index, areasByPackage));
        all.addAll(lotos(areasByPackage, packagesByLoto, areasByStandard));

        for (PermitMapDto.Item item : all) {
            if (item.getWorkAreaIds().isEmpty()) out.getUnplaced().add(item);
            else out.getItems().add(item);
        }
        return out;
    }

    // ------------------------------------------------------------------ assignment

    /**
     * Map a layer key back to the entity it names. The map speaks in short layer codes because
     * that is what fits on a chip; the assign endpoint has to turn one back into a class.
     */
    private static final Map<String, Class<? extends BasePermitEntity>> LAYER_TYPES = Map.of(
            "WR", WorkRequest.class,
            "SW", SafeWork.class,
            "HW", HotWork.class,
            "CS", ConfinedSpace.class,
            "RC", ConfinedSpace.class,
            "LOTO", Loto.class);

    /**
     * Point one or more records at a work area, from the map.
     *
     * <p>This writes the {@code workArea} FK — placement rule 1 — so an item assigned here stops
     * being a guess and is drawn from a recorded decision from then on. The location text is
     * deliberately left exactly as it was written: the operator's words are not this action's to
     * rewrite, and the FK already outranks them.
     *
     * <h3>Why it resolves everything before it writes anything</h3>
     *
     * Two passes, and a bad reference rejects the whole request before a single entity is touched.
     * The obvious alternative — assign what you can and report the rest — is the shape that broke
     * the stale-package sweep: a {@code @Transactional} method that throws inside a transaction
     * marks it rollback-only, so catching the exception and carrying on guarantees that everything
     * the batch "succeeded" at is discarded at commit. Validating first removes the partial-failure
     * path instead of trying to survive it, and the operator can simply re-select and retry.
     *
     * <p>Mutation goes through the persistence context rather than an UPDATE query so
     * {@code FieldChangeEntityListener} fires and the change syncs. A native update here would be
     * invisible to every other node.
     */
    public PermitMapAssignDto.Result assign(PermitMapAssignDto.Request request) {
        if (request == null || request.getWorkAreaId() == null) {
            throw new IllegalArgumentException("A work area is required.");
        }
        List<PermitMapAssignDto.Ref> refs = request.getItems() == null ? List.of() : request.getItems();
        if (refs.isEmpty()) {
            throw new IllegalArgumentException("Select at least one item to place.");
        }

        WorkArea area = workAreaRepo.findById(request.getWorkAreaId())
                .orElseThrow(() -> new IllegalArgumentException(
                        "Work area " + request.getWorkAreaId() + " no longer exists."));

        List<BasePermitEntity> targets = new ArrayList<>(refs.size());
        for (PermitMapAssignDto.Ref ref : refs) {
            targets.add(resolve(ref));
        }

        for (BasePermitEntity target : targets) {
            target.setWorkArea(area);
        }
        // Flush inside this transaction so the listener's @PreUpdate/@PostUpdate pair runs here
        // and any constraint failure surfaces as this call's error rather than at commit.
        entityManager.flush();

        PermitMapAssignDto.Result result = new PermitMapAssignDto.Result();
        result.setAssigned(targets.size());
        result.setWorkAreaId(area.getId());
        result.setWorkAreaName(area.getName());
        return result;
    }

    private BasePermitEntity resolve(PermitMapAssignDto.Ref ref) {
        if (ref == null || ref.getId() == null) {
            throw new IllegalArgumentException("An item reference is missing its id.");
        }
        Class<? extends BasePermitEntity> type = LAYER_TYPES.get(ref.getLayer());
        if (type == null) {
            throw new IllegalArgumentException("Unknown layer '" + ref.getLayer() + "'.");
        }
        BasePermitEntity entity = entityManager.find(type, ref.getId());
        if (entity == null || Boolean.TRUE.equals(entity.getDeleted())) {
            // Someone else deleted it between the map loading and this click. Say so rather than
            // reporting a silent success for a row that is not there.
            throw new IllegalArgumentException(
                    ref.getLayer() + " #" + ref.getId() + " no longer exists — reload the map.");
        }
        return entity;
    }

    // ------------------------------------------------------------------ layers

    private List<PermitMapDto.Item> workRequests(WorkAreaLocationResolver.Index index) {
        List<WorkRequest> rows = entityManager.createQuery(
                        "SELECT DISTINCT w FROM WorkRequest w "
                                + "LEFT JOIN FETCH w.workArea "
                                + "LEFT JOIN FETCH w.permitStatus s "
                                + "WHERE s IS NULL OR LOWER(s.name) NOT IN :done", WorkRequest.class)
                .setParameter("done", WR_DONE)
                .getResultList();

        List<PermitMapDto.Item> items = new ArrayList<>(rows.size());
        for (WorkRequest w : rows) {
            PermitMapDto.Item item = base("WR", w);
            item.setTitle(w.getWorkScope());
            item.setDate(w.getDateOfWorkToBePerformed());
            item.setCompany(w.getCompany());
            item.setPerson(firstNonBlank(w.getForeman(), w.getRequestedBy()));
            item.setLocation(w.getLocation());
            item.setPackageId(w.getDailyPermitPackage() == null ? null : w.getDailyPermitPackage().getId());
            place(item, index, w.getWorkArea(), w.getLocation(), null, null);
            // A request covering several areas is happening in all of them, so it is drawn on all of
            // them. The FK stays the primary; these are the rest.
            for (WorkRequestArea extra : w.getWorkAreas()) {
                if (extra.getId() != null && !item.getWorkAreaIds().contains(extra.getId())) {
                    item.getWorkAreaIds().add(extra.getId());
                }
            }
            items.add(item);
        }
        return items;
    }

    private List<PermitMapDto.Item> safeWorks(WorkAreaLocationResolver.Index index,
                                              Map<Long, List<Long>> areasByPackage) {
        List<SafeWork> rows = entityManager.createQuery(
                        "SELECT DISTINCT e FROM SafeWork e "
                                + "LEFT JOIN FETCH e.workArea "
                                + "LEFT JOIN FETCH e.permitStatus s "
                                + "WHERE (s IS NULL OR LOWER(s.name) NOT IN :done)" + NOT_DELETED, SafeWork.class)
                .setParameter("done", PERMIT_DONE)
                .getResultList();

        List<PermitMapDto.Item> items = new ArrayList<>(rows.size());
        for (SafeWork e : rows) {
            PermitMapDto.Item item = base("SW", e);
            item.setTitle(e.getWorkScope());
            item.setDate(e.getDate());
            item.setCompany(e.getCompanyPerson());
            item.setPerson(e.getRequestedBy());
            item.setLocation(e.getLocation());
            item.setPackageId(packageIdOf(e));
            place(item, index, e.getWorkArea(), e.getLocation(), packageIdOf(e), areasByPackage);
            items.add(item);
        }
        return items;
    }

    private List<PermitMapDto.Item> hotWorks(WorkAreaLocationResolver.Index index,
                                             Map<Long, List<Long>> areasByPackage) {
        List<HotWork> rows = entityManager.createQuery(
                        "SELECT DISTINCT e FROM HotWork e "
                                + "LEFT JOIN FETCH e.workArea "
                                + "LEFT JOIN FETCH e.permitStatus s "
                                + "WHERE (s IS NULL OR LOWER(s.name) NOT IN :done)" + NOT_DELETED, HotWork.class)
                .setParameter("done", PERMIT_DONE)
                .getResultList();

        List<PermitMapDto.Item> items = new ArrayList<>(rows.size());
        for (HotWork e : rows) {
            PermitMapDto.Item item = base("HW", e);
            item.setTitle(e.getWorkScope());
            item.setDate(e.getDate());
            item.setPerson(e.getForeman());
            item.setLocation(e.getLocation());
            item.setPackageId(packageIdOf(e));
            place(item, index, e.getWorkArea(), e.getLocation(), packageIdOf(e), areasByPackage);
            items.add(item);
        }
        return items;
    }

    private List<PermitMapDto.Item> confinedSpaces(WorkAreaLocationResolver.Index index,
                                                   Map<Long, List<Long>> areasByPackage) {
        List<ConfinedSpace> rows = entityManager.createQuery(
                        "SELECT DISTINCT e FROM ConfinedSpace e "
                                + "LEFT JOIN FETCH e.workArea "
                                + "LEFT JOIN FETCH e.permitStatus s "
                                + "WHERE (s IS NULL OR LOWER(s.name) NOT IN :done)" + NOT_DELETED, ConfinedSpace.class)
                .setParameter("done", PERMIT_DONE)
                .getResultList();

        List<PermitMapDto.Item> items = new ArrayList<>(rows.size());
        for (ConfinedSpace e : rows) {
            // Permit-Required and Reclassified are different jobs with different controls, so they
            // are separate layers rather than one "CS" bucket an operator has to open to tell apart.
            PermitMapDto.Item item = base(
                    e.getCsType() == ConfinedSpaceType.RECLASSIFIED ? "RC" : "CS", e);
            item.setTitle(e.getWorkScope());
            item.setDate(e.getDate());
            item.setPerson(e.getIssuedTo());
            // A Confined Space names the vessel rather than a location, and the vessel name is very
            // often the area name too, so it is the right string to try the text rule against.
            item.setLocation(e.getSpace());
            item.setPackageId(packageIdOf(e));
            place(item, index, e.getWorkArea(), e.getSpace(), packageIdOf(e), areasByPackage);
            items.add(item);
        }
        return items;
    }

    private List<PermitMapDto.Item> lotos(Map<Long, List<Long>> areasByPackage,
                                          Map<Long, List<Long>> packagesByLoto,
                                          Map<Long, List<Long>> areasByStandard) {
        List<Loto> rows = entityManager.createQuery(
                        "SELECT DISTINCT l FROM Loto l "
                                + "LEFT JOIN FETCH l.workArea "
                                + "LEFT JOIN FETCH l.permitStatus s "
                                + "WHERE s IS NULL OR LOWER(s.name) NOT IN :done", Loto.class)
                .setParameter("done", LOTO_DONE)
                .getResultList();

        List<PermitMapDto.Item> items = new ArrayList<>(rows.size());
        for (Loto l : rows) {
            PermitMapDto.Item item = base("LOTO", l);
            item.setTitle(firstNonBlank(l.getWorkScope(), l.getName(), l.getEquipmentSystem()));
            item.setDate(l.getDate());
            item.setPerson(l.getLotoRequestor());
            item.setLocation(l.getEquipmentSystem());
            List<Long> lotoPackages = packagesByLoto.getOrDefault(l.getId(), List.of());
            if (!lotoPackages.isEmpty()) item.setPackageId(lotoPackages.get(0));
            items.add(item);

            if (l.getWorkArea() != null && l.getWorkArea().getId() != null) {
                item.setWorkAreaIds(new ArrayList<>(List.of(l.getWorkArea().getId())));
                item.setMatchedBy(BY_AREA);
                continue;
            }

            // The TEXT rule is deliberately skipped for this layer. A LOTO's location text is an
            // equipment system ("Unit 1 Feedwater"), not a place, so matching it against area names
            // produces confident nonsense. Structure only.
            Set<Long> viaPackages = new LinkedHashSet<>();
            for (Long pkgId : packagesByLoto.getOrDefault(l.getId(), List.of())) {
                viaPackages.addAll(areasByPackage.getOrDefault(pkgId, List.of()));
            }
            if (!viaPackages.isEmpty()) {
                item.setWorkAreaIds(new ArrayList<>(viaPackages));
                item.setMatchedBy(BY_PACKAGE);
                continue;
            }

            Long standardId = l.getSourceStandard() == null ? null : l.getSourceStandard().getId();
            List<Long> viaStandard = standardId == null
                    ? List.of() : areasByStandard.getOrDefault(standardId, List.of());
            if (!viaStandard.isEmpty()) {
                item.setWorkAreaIds(new ArrayList<>(viaStandard));
                item.setMatchedBy(BY_STANDARD);
            }
        }
        return items;
    }

    // ------------------------------------------------------------------ placement

    /**
     * Apply the AREA → TEXT → PACKAGE ladder. Leaves {@code workAreaIds} empty when none of them
     * answers, which is how an item reaches the "unplaced" list instead of being guessed onto the
     * map.
     */
    private void place(PermitMapDto.Item item,
                       WorkAreaLocationResolver.Index index,
                       WorkArea ownArea,
                       String locationText,
                       Long packageId,
                       Map<Long, List<Long>> areasByPackage) {
        if (ownArea != null && ownArea.getId() != null) {
            item.setWorkAreaIds(new ArrayList<>(List.of(ownArea.getId())));
            item.setMatchedBy(BY_AREA);
            return;
        }
        Long byText = index.match(locationText);
        if (byText != null) {
            // Mutable: a multi-area request appends its remaining areas to this list afterwards, and
            // List.of would throw UnsupportedOperationException and fail the entire map response.
            item.setWorkAreaIds(new ArrayList<>(List.of(byText)));
            item.setMatchedBy(BY_TEXT);
            return;
        }
        if (packageId != null && areasByPackage != null) {
            List<Long> inherited = areasByPackage.get(packageId);
            if (inherited != null && !inherited.isEmpty()) {
                item.setWorkAreaIds(new ArrayList<>(inherited));
                item.setMatchedBy(BY_PACKAGE);
            }
        }
    }

    /**
     * Areas per daily package, taken from the package's work requests by the same AREA-then-TEXT
     * rule the requests themselves are placed by — so a permit that inherits from its package
     * lands exactly where that package's requests are drawn and the layers agree with each other.
     */
    private Map<Long, List<Long>> areasByPackage(WorkAreaLocationResolver.Index index) {
        List<Object[]> rows = entityManager.createQuery(
                        "SELECT p.id, wa.id, w.location, w.workAreasJson FROM DailyPermitPackage p "
                                + "JOIN p.workRequests w LEFT JOIN w.workArea wa "
                                + "WHERE p.deleted IS NULL OR p.deleted = false", Object[].class)
                .getResultList();

        Map<Long, Set<Long>> gathered = new HashMap<>();
        for (Object[] row : rows) {
            Long packageId = (Long) row[0];
            if (packageId == null) continue;
            Set<Long> areas = gathered.computeIfAbsent(packageId, k -> new LinkedHashSet<>());

            Long areaId = (Long) row[1];
            if (areaId == null) areaId = index.match((String) row[2]);
            if (areaId != null) areas.add(areaId);

            // A request covering several areas makes its package cover them too, so a permit that
            // inherits from the package — the spanning Safe Work especially — is drawn everywhere
            // the work actually is, not only on its request's primary area.
            for (WorkRequestArea extra : WorkRequestArea.fromJson((String) row[3])) {
                if (extra.getId() != null) areas.add(extra.getId());
            }
        }
        gathered.values().removeIf(Set::isEmpty);
        return freeze(gathered);
    }

    private Map<Long, List<Long>> packagesByLoto() {
        List<Object[]> rows = entityManager.createQuery(
                        "SELECT l.id, p.id FROM DailyPermitPackage p JOIN p.lotos l "
                                + "WHERE p.deleted IS NULL OR p.deleted = false", Object[].class)
                .getResultList();

        Map<Long, Set<Long>> gathered = new HashMap<>();
        for (Object[] row : rows) {
            Long lotoId = (Long) row[0];
            Long packageId = (Long) row[1];
            if (lotoId == null || packageId == null) continue;
            gathered.computeIfAbsent(lotoId, k -> new LinkedHashSet<>()).add(packageId);
        }
        return freeze(gathered);
    }

    private Map<Long, List<Long>> areasByStandard() {
        List<Object[]> rows = entityManager.createQuery(
                        "SELECT s.id, wa.id FROM WorkArea wa JOIN wa.constantLotos s", Object[].class)
                .getResultList();

        Map<Long, Set<Long>> gathered = new HashMap<>();
        for (Object[] row : rows) {
            Long standardId = (Long) row[0];
            Long areaId = (Long) row[1];
            if (standardId == null || areaId == null) continue;
            gathered.computeIfAbsent(standardId, k -> new LinkedHashSet<>()).add(areaId);
        }
        return freeze(gathered);
    }

    // ------------------------------------------------------------------ helpers

    private static Map<Long, List<Long>> freeze(Map<Long, Set<Long>> gathered) {
        Map<Long, List<Long>> out = new HashMap<>(gathered.size());
        gathered.forEach((key, value) -> out.put(key, new ArrayList<>(value)));
        return out;
    }

    /**
     * The package id without loading the package. {@code dailyPermitPackage} is a LAZY proxy here
     * and asking a proxy for its identifier does not initialise it, so this stays free — reading
     * any other field would be a query per permit.
     */
    private static Long packageIdOf(SafeWork e) {
        return e.getDailyPermitPackage() == null ? null : e.getDailyPermitPackage().getId();
    }

    private static Long packageIdOf(HotWork e) {
        return e.getDailyPermitPackage() == null ? null : e.getDailyPermitPackage().getId();
    }

    private static Long packageIdOf(ConfinedSpace e) {
        return e.getDailyPermitPackage() == null ? null : e.getDailyPermitPackage().getId();
    }

    private static PermitMapDto.Item base(String layer, BasePermitEntity entity) {
        PermitMapDto.Item item = new PermitMapDto.Item();
        item.setLayer(layer);
        item.setId(entity.getId());
        item.setPermitNumber(entity.getPermitNumber());
        item.setStatus(statusName(entity.getPermitStatus()));
        return item;
    }

    private static String statusName(Value status) {
        return status == null ? null : status.getName();
    }

    private static String firstNonBlank(String... values) {
        for (String value : values) {
            if (value != null && !value.isBlank()) return value;
        }
        return null;
    }
}
