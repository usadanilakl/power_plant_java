package com.dk_power.power_plant_java.controller.angular;

import com.dk_power.power_plant_java.dto.physical.PhysicalObjectDto;
import com.dk_power.power_plant_java.dto.diagrams.DiagramDto;
import com.dk_power.power_plant_java.entities.physical.PhysicalObject;
import com.dk_power.power_plant_java.entities.physical.PhysicalObjectType;
import com.dk_power.power_plant_java.repository.physical.PhysicalObjectRepo;
import com.dk_power.power_plant_java.repository.loto.LotoPointRepo;
import com.dk_power.power_plant_java.repository.equipment.EquipmentRepo;
import com.dk_power.power_plant_java.repository.file.FileRepo;
import com.dk_power.power_plant_java.repository.categories.ValueRepo;
import com.dk_power.power_plant_java.repository.permits.WorkAreaRepo;
import com.dk_power.power_plant_java.entities.categories.Value;
import com.dk_power.power_plant_java.entities.files.FileObject;
import com.dk_power.power_plant_java.entities.permits.WorkArea;
import com.dk_power.power_plant_java.sevice.angular.diagrams.NgDiagramService;
import org.springframework.transaction.annotation.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.HashSet;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Angular-facing read API for the {@link PhysicalObject} hierarchy. Deliberately NOT gated on Maximo — a desktop
 * without a Maximo key still receives synced nodes and must be able to browse them. Maximo-dependent actions
 * (reseed, the WOs/SRs tab) live on the gated {@code NgMaximoController} under {@code /ng/maximo/physical-object/*}.
 */
@RestController
@RequestMapping("/ng/physical-object")
@RequiredArgsConstructor
public class NgPhysicalObjectController {

    private final PhysicalObjectRepo repo;
    private final LotoPointRepo lotoPointRepo;
    private final EquipmentRepo equipmentRepo;
    private final NgDiagramService ngDiagramService;
    private final FileRepo fileRepo;
    private final ValueRepo valueRepo;
    private final WorkAreaRepo workAreaRepo;

    /** Whole hierarchy as a flat list of nodes (id + parentId + hasChildren); the frontend assembles the tree. */
    @GetMapping("/tree")
    public ResponseEntity<NgApiResponse<List<PhysicalObjectDto>>> tree() {
        List<PhysicalObject> all = repo.findAll();
        Set<Long> parents = all.stream()
                .map(p -> p.getParent() != null ? p.getParent().getId() : null)
                .filter(Objects::nonNull)
                .collect(Collectors.toSet());
        List<PhysicalObjectDto> dtos = all.stream()
                .map(p -> PhysicalObjectDto.from(p, parents.contains(p.getId())))
                .collect(Collectors.toList());
        return ResponseEntity.ok(new NgApiResponse<>(dtos, dtos.size() + " nodes"));
    }

    /** One node. */
    @GetMapping("/{id}")
    public ResponseEntity<NgApiResponse<PhysicalObjectDto>> node(@PathVariable Long id) {
        return repo.findById(id)
                .map(p -> ResponseEntity.ok(new NgApiResponse<>(
                        PhysicalObjectDto.from(p, !repo.findByParentId(p.getId()).isEmpty()), "ok")))
                .orElseGet(() -> ResponseEntity.ok(new NgApiResponse<>(null, "not found")));
    }

    /** Direct children of a node (lazy tree expansion, if the frontend prefers it over the flat tree). */
    @GetMapping("/{id}/children")
    public ResponseEntity<NgApiResponse<List<PhysicalObjectDto>>> children(@PathVariable Long id) {
        List<PhysicalObject> kids = repo.findByParentId(id);
        Set<Long> withChildren = hasChildrenSet(kids);
        List<PhysicalObjectDto> dtos = kids.stream()
                .map(p -> PhysicalObjectDto.from(p, withChildren.contains(p.getId())))
                .collect(Collectors.toList());
        return ResponseEntity.ok(new NgApiResponse<>(dtos, dtos.size() + " children"));
    }

    /** One-query hasChildren set for a sibling list (avoids an N+1 per child). */
    private Set<Long> hasChildrenSet(List<PhysicalObject> nodes) {
        if (nodes.isEmpty()) return Set.of();
        List<Long> ids = nodes.stream().map(PhysicalObject::getId).collect(Collectors.toList());
        return new HashSet<>(repo.findParentIdsHavingChildren(ids));
    }

    // ---- Builder writes (local-owned nodes) ----------------------------------------------------

    /** Create a new local-owned node under a parent (the builder's "create new object"). */
    @PostMapping
    public ResponseEntity<NgApiResponse<PhysicalObjectDto>> create(@RequestBody CreateNodeRequest req) {
        PhysicalObject n = new PhysicalObject();
        n.setName(req.name());
        n.setType(parseType(req.type()));
        n.setTagNumber(req.tagNumber());
        n.setDescription(req.description());
        n.setSpecificLocation(req.specificLocation());
        n.setFloorIndex(req.floorIndex());
        if (req.parentId() != null) {
            PhysicalObject parent = repo.findById(req.parentId()).orElse(null);
            if (parent == null) return ResponseEntity.badRequest().body(new NgApiResponse<>(null, "parent not found"));
            n.setParent(parent);
        }
        n.setLocalUuid(UUID.randomUUID().toString()); // local node → maximoKey computes as LOCAL:{uuid}
        PhysicalObject saved = repo.save(n);
        return ResponseEntity.ok(new NgApiResponse<>(PhysicalObjectDto.from(saved, false), "created"));
    }

    /** Patch a node (blank/absent fields are left unchanged). */
    @PutMapping("/{id}")
    public ResponseEntity<NgApiResponse<PhysicalObjectDto>> update(@PathVariable Long id, @RequestBody UpdateNodeRequest req) {
        PhysicalObject n = repo.findById(id).orElse(null);
        if (n == null) return ResponseEntity.ok(new NgApiResponse<>(null, "not found"));
        if (req.name() != null) n.setName(req.name());
        if (req.type() != null) n.setType(parseType(req.type()));
        if (req.tagNumber() != null) n.setTagNumber(req.tagNumber());
        if (req.description() != null) n.setDescription(req.description());
        if (req.specificLocation() != null) n.setSpecificLocation(req.specificLocation());
        if (req.floorIndex() != null) n.setFloorIndex(req.floorIndex());
        if (req.parentId() != null) {
            PhysicalObject parent = repo.findById(req.parentId()).orElse(null);
            if (parent == null) return ResponseEntity.badRequest().body(new NgApiResponse<>(null, "parent not found"));
            n.setParent(parent);
        }
        PhysicalObject saved = repo.save(n);
        return ResponseEntity.ok(new NgApiResponse<>(
                PhysicalObjectDto.from(saved, !repo.findByParentId(id).isEmpty()), "updated"));
    }

    /**
     * Soft-delete a leaf node. Blocked when the node still has children (so a subtree can't be orphaned —
     * unreachable under the tree's {@code @Where(deleted)}). Its schematic Diagram (if any) is left in place
     * (cheap, recoverable); the node's shape on its parent's canvas simply stops resolving on next open.
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<NgApiResponse<Void>> delete(@PathVariable Long id) {
        PhysicalObject n = repo.findById(id).orElse(null);
        if (n == null) return ResponseEntity.ok(new NgApiResponse<>(null, "not found"));
        if (!repo.findByParentId(id).isEmpty()) {
            return ResponseEntity.badRequest().body(
                    new NgApiResponse<>(null, "cannot delete: node has children — delete or move them first"));
        }
        n.setDeleted(true);
        repo.save(n);
        return ResponseEntity.ok(new NgApiResponse<>(null, "deleted"));
    }

    // ---- Navigation + schematic canvas (for the plant map) ------------------------------------

    /** Ancestor chain root→node, for the navigator breadcrumb. */
    @GetMapping("/{id}/breadcrumb")
    public ResponseEntity<NgApiResponse<List<PhysicalObjectDto>>> breadcrumb(@PathVariable Long id) {
        List<PhysicalObjectDto> chain = new ArrayList<>();
        PhysicalObject node = repo.findById(id).orElse(null);
        int guard = 0;
        while (node != null && guard++ < 200) {
            chain.add(0, PhysicalObjectDto.from(node, true));
            Long parentId = node.getParent() != null ? node.getParent().getId() : null; // getId() on lazy proxy — no init
            node = parentId != null ? repo.findById(parentId).orElse(null) : null;
        }
        return ResponseEntity.ok(new NgApiResponse<>(chain, chain.size() + " levels"));
    }

    /** Children ordered by floorIndex (nulls last) — the level/floor selector. */
    @GetMapping("/{id}/levels")
    public ResponseEntity<NgApiResponse<List<PhysicalObjectDto>>> levels(@PathVariable Long id) {
        List<PhysicalObject> kids = repo.findByParentId(id);
        Set<Long> withChildren = hasChildrenSet(kids);
        List<PhysicalObjectDto> dtos = kids.stream()
                .sorted(Comparator.comparing(PhysicalObject::getFloorIndex,
                        Comparator.nullsLast(Comparator.naturalOrder())))
                .map(p -> PhysicalObjectDto.from(p, withChildren.contains(p.getId())))
                .collect(Collectors.toList());
        return ResponseEntity.ok(new NgApiResponse<>(dtos, dtos.size() + " levels"));
    }

    /**
     * Get-or-create the node's blank schematic {@code Diagram} (the surface its children are drawn on). Returns the
     * existing Diagram when {@code diagramId} is set and still exists, else creates a blank one, links it, and returns
     * it. {@code @Transactional} + a pessimistic write lock on the node ({@code findByIdForUpdate}) serialize concurrent
     * calls for the same node, so two rapid requests can't each create a diagram and orphan one.
     */
    @GetMapping("/{id}/diagram")
    @org.springframework.transaction.annotation.Transactional
    public ResponseEntity<NgApiResponse<DiagramDto>> getOrCreateDiagram(@PathVariable Long id) {
        PhysicalObject n = repo.findByIdForUpdate(id).orElse(null);
        if (n == null) return ResponseEntity.ok(new NgApiResponse<>(null, "not found"));
        if (n.getDiagramId() != null) {
            try {
                DiagramDto existing = ngDiagramService.getDiagramById(String.valueOf(n.getDiagramId()));
                if (existing != null) return ResponseEntity.ok(new NgApiResponse<>(existing, "ok"));
            } catch (Exception ignored) { /* diagram was deleted — fall through and create a fresh one */ }
        }
        DiagramDto blank = new DiagramDto();
        blank.setName((n.getName() != null ? n.getName() : ("#" + n.getId())) + " — Map");
        blank.setCanvasWidth(1920);
        blank.setCanvasHeight(1080);
        blank.setGridSize(20);
        DiagramDto created = ngDiagramService.createDiagram(blank);
        n.setDiagramId(created.getId());
        repo.save(n); // fires sync; diagramId is device-prefixed → same Diagram on every desktop
        return ResponseEntity.ok(new NgApiResponse<>(created, "created"));
    }

    // ---- Binder: linked files / documents (attach files & P&IDs to a node) ------------------

    /** Files bound to this node — its "Documents". */
    @GetMapping("/{id}/files")
    public ResponseEntity<NgApiResponse<List<LinkedFileDto>>> files(@PathVariable Long id) {
        List<LinkedFileDto> dtos = fileRepo.findByPhysicalObjectId(id).stream()
                .map(LinkedFileDto::from)
                .collect(Collectors.toList());
        return ResponseEntity.ok(new NgApiResponse<>(dtos, dtos.size() + " files"));
    }

    /** Bind a file to this node. */
    @PostMapping("/{id}/files/{fileId}")
    public ResponseEntity<NgApiResponse<Void>> linkFile(@PathVariable Long id, @PathVariable Long fileId) {
        if (repo.findById(id).isEmpty()) return ResponseEntity.badRequest().body(new NgApiResponse<>(null, "node not found"));
        FileObject f = fileRepo.findById(fileId).orElse(null);
        if (f == null) return ResponseEntity.badRequest().body(new NgApiResponse<>(null, "file not found"));
        f.setPhysicalObjectId(id);
        fileRepo.save(f);
        return ResponseEntity.ok(new NgApiResponse<>(null, "linked"));
    }

    /** Unbind a file from this node (only if it's currently bound to it). */
    @DeleteMapping("/{id}/files/{fileId}")
    public ResponseEntity<NgApiResponse<Void>> unlinkFile(@PathVariable Long id, @PathVariable Long fileId) {
        FileObject f = fileRepo.findById(fileId).orElse(null);
        if (f != null && id.equals(f.getPhysicalObjectId())) {
            f.setPhysicalObjectId(null);
            fileRepo.save(f);
        }
        return ResponseEntity.ok(new NgApiResponse<>(null, "unlinked"));
    }

    // ---- System membership (the cross-cutting functional axis / map layers) -------------------

    /** The System values this object belongs to (the functional axis, orthogonal to the spatial tree). */
    @GetMapping("/{id}/systems")
    @Transactional(readOnly = true)
    public ResponseEntity<NgApiResponse<List<SystemRef>>> systems(@PathVariable Long id) {
        PhysicalObject n = repo.findById(id).orElse(null);
        if (n == null) return ResponseEntity.ok(new NgApiResponse<>(null, "not found"));
        List<SystemRef> refs = toSystemRefs(n.getSystems());
        return ResponseEntity.ok(new NgApiResponse<>(refs, refs.size() + " systems"));
    }

    /**
     * Set this object's System membership (full replace by Value ids). Mutates the collection in place then touches
     * {@code dateModified} so {@code @PostUpdate} fires — a collection-only change does NOT dirty the parent, so
     * without this the change would never broadcast to other desktops (the known M2M-sync hazard).
     */
    @PutMapping("/{id}/systems")
    @Transactional
    public ResponseEntity<NgApiResponse<List<SystemRef>>> setSystems(@PathVariable Long id, @RequestBody SetSystemsRequest req) {
        PhysicalObject n = repo.findById(id).orElse(null);
        if (n == null) return ResponseEntity.ok(new NgApiResponse<>(null, "not found"));
        Set<Value> set = n.getSystems();
        if (set == null) { set = new HashSet<>(); n.setSystems(set); }
        set.clear();
        if (req.systemIds() != null) {
            for (Long vid : req.systemIds()) {
                if (vid == null || vid <= 0) continue;
                valueRepo.findById(vid).ifPresent(set::add);
            }
        }
        n.setDateModified(LocalDateTime.now()); // force @PostUpdate → sync emission for the M2M change
        PhysicalObject saved = repo.save(n);
        return ResponseEntity.ok(new NgApiResponse<>(toSystemRefs(saved.getSystems()), "updated"));
    }

    /**
     * System-membership map for a node's direct children: {@code childId → [systemValueId,…]}. Backs the map
     * layer overlay (highlight the children that belong to the picked system) in one query, no lazy N+1.
     */
    @GetMapping("/{id}/child-systems")
    @Transactional(readOnly = true)
    public ResponseEntity<NgApiResponse<Map<Long, List<Long>>>> childSystems(@PathVariable Long id) {
        Map<Long, List<Long>> map = new HashMap<>();
        for (Object[] row : repo.findChildSystemLinks(id)) {
            Long childId = ((Number) row[0]).longValue();
            Long valueId = ((Number) row[1]).longValue();
            map.computeIfAbsent(childId, k -> new ArrayList<>()).add(valueId);
        }
        return ResponseEntity.ok(new NgApiResponse<>(map, map.size() + " children with systems"));
    }

    private static List<SystemRef> toSystemRefs(Set<Value> systems) {
        if (systems == null) return List.of();
        return systems.stream()
                .map(v -> new SystemRef(v.getId(), v.getName()))
                .sorted(Comparator.comparing(SystemRef::name, Comparator.nullsLast(String.CASE_INSENSITIVE_ORDER)))
                .collect(Collectors.toList());
    }

    public record SystemRef(Long id, String name) {}
    public record SetSystemsRequest(List<Long> systemIds) {}

    // ---- Binder: work areas (permit safety profiles anchored to this node) --------------------

    /** Work areas bound to this node — their safety profile summary (the binder's "Safety" surface). */
    @GetMapping("/{id}/work-areas")
    @Transactional(readOnly = true)
    public ResponseEntity<NgApiResponse<List<WorkAreaRef>>> workAreas(@PathVariable Long id) {
        List<WorkAreaRef> refs = workAreaRepo.findByPhysicalObjectId(id).stream()
                .map(WorkAreaRef::from)
                .collect(Collectors.toList());
        return ResponseEntity.ok(new NgApiResponse<>(refs, refs.size() + " work areas"));
    }

    /** How many work areas each of a node's children has: childId → count (backs the map's safety badge). */
    @GetMapping("/{id}/child-work-areas")
    public ResponseEntity<NgApiResponse<Map<Long, Long>>> childWorkAreas(@PathVariable Long id) {
        List<Long> childIds = repo.findByParentId(id).stream().map(PhysicalObject::getId).collect(Collectors.toList());
        Map<Long, Long> map = new HashMap<>();
        if (!childIds.isEmpty()) {
            for (Object[] row : workAreaRepo.countByPhysicalObjectIdIn(childIds)) {
                if (row[0] != null) map.put(((Number) row[0]).longValue(), ((Number) row[1]).longValue());
            }
        }
        return ResponseEntity.ok(new NgApiResponse<>(map, map.size() + " children with work areas"));
    }

    /** Anchor a work area to this node (scalar FK → syncs normally). */
    @PostMapping("/{id}/work-areas/{workAreaId}")
    public ResponseEntity<NgApiResponse<Void>> linkWorkArea(@PathVariable Long id, @PathVariable Long workAreaId) {
        if (repo.findById(id).isEmpty()) return ResponseEntity.badRequest().body(new NgApiResponse<>(null, "node not found"));
        WorkArea wa = workAreaRepo.findById(workAreaId).orElse(null);
        if (wa == null) return ResponseEntity.badRequest().body(new NgApiResponse<>(null, "work area not found"));
        // Scalar FK change dirties the row → @PreUpdate sets dateModified → @PostUpdate fires → sync emits.
        // (No manual dateModified touch needed here, unlike setSystems' collection-only change.)
        wa.setPhysicalObjectId(id);
        workAreaRepo.save(wa);
        return ResponseEntity.ok(new NgApiResponse<>(null, "linked"));
    }

    /** Unbind a work area from this node (only if it's currently bound to it). */
    @DeleteMapping("/{id}/work-areas/{workAreaId}")
    public ResponseEntity<NgApiResponse<Void>> unlinkWorkArea(@PathVariable Long id, @PathVariable Long workAreaId) {
        WorkArea wa = workAreaRepo.findById(workAreaId).orElse(null);
        if (wa != null && id.equals(wa.getPhysicalObjectId())) {
            wa.setPhysicalObjectId(null);
            workAreaRepo.save(wa);
        }
        return ResponseEntity.ok(new NgApiResponse<>(null, "unlinked"));
    }

    /** Slim safety-profile summary of a bound work area (full detail lives in the permit builder). */
    public record WorkAreaRef(Long id, String name, String description, String areaType, int lotoCount) {
        static WorkAreaRef from(WorkArea wa) {
            String type = wa.getAreaType() != null ? wa.getAreaType().getName() : null;
            int lotos = wa.getConstantLotos() != null ? wa.getConstantLotos().size() : 0;
            return new WorkAreaRef(wa.getId(), wa.getName(), wa.getDescription(), type, lotos);
        }
    }

    /** Slim view of a bound file — enough to list and open it. */
    public record LinkedFileDto(Long id, String name, String fileNumber, String fileLink, String extension) {
        static LinkedFileDto from(FileObject f) {
            String link = f.getFileLink();
            if (link == null || link.isBlank()) link = f.getStoredFileLink();
            return new LinkedFileDto(f.getId(), f.getName(), f.getFileNumber(), link, f.getExtension());
        }
    }

    private static PhysicalObjectType parseType(String s) {
        if (s == null || s.isBlank()) return null;
        try { return PhysicalObjectType.valueOf(s.trim().toUpperCase()); }
        catch (IllegalArgumentException e) { return null; }
    }

    public record CreateNodeRequest(String name, String type, Long parentId, String tagNumber,
            String description, String specificLocation, Integer floorIndex) {}
    public record UpdateNodeRequest(String name, String type, Long parentId, String tagNumber,
            String description, String specificLocation, Integer floorIndex) {}

    // ---- Slice-1 verification: how well do local tags line up with seeded Maximo assets? ----

    /**
     * Compare local {@code LotoPoint}/{@code Equipment} tag numbers against seeded EQUIPMENT
     * {@code maximoAssetnum}s — both exact (trim/uppercase) and separator-insensitive (alphanumerics only).
     * The match rate decides whether Slice 2's app-side binding can be mostly automatic (tag → asset) or must be
     * mostly manual. Purely local (no Maximo call); run it after a reseed.
     */
    @GetMapping("/probe/tag-match")
    public ResponseEntity<NgApiResponse<TagMatchProbe>> tagMatchProbe() {
        List<PhysicalObject> equipmentNodes = repo.findByMaximoAssetnumIsNotNull();
        Set<String> exactSet = new HashSet<>();
        Set<String> looseSet = new HashSet<>();
        for (PhysicalObject p : equipmentNodes) {
            String a = p.getMaximoAssetnum();
            if (a != null && !a.isBlank()) { exactSet.add(norm(a)); looseSet.add(alnum(a)); }
        }
        TagGroupStats loto = matchGroup(
                lotoPointRepo.findAll().stream().map(x -> x.getTagNumber()).collect(Collectors.toList()),
                exactSet, looseSet);
        TagGroupStats equip = matchGroup(
                equipmentRepo.findAll().stream().map(x -> x.getTagNumber()).collect(Collectors.toList()),
                exactSet, looseSet);
        return ResponseEntity.ok(new NgApiResponse<>(
                new TagMatchProbe(equipmentNodes.size(), loto, equip), "ok"));
    }

    private static final int SAMPLE = 25;

    private TagGroupStats matchGroup(List<String> tags, Set<String> exactSet, Set<String> looseSet) {
        LinkedHashSet<String> distinct = new LinkedHashSet<>();
        for (String t : tags) if (t != null && !t.isBlank()) distinct.add(t.trim());
        int exact = 0, loose = 0;
        List<String> unmatched = new ArrayList<>();
        for (String t : distinct) {
            boolean e = exactSet.contains(norm(t));
            boolean l = e || looseSet.contains(alnum(t));
            if (e) exact++;
            if (l) loose++;
            else if (unmatched.size() < SAMPLE) unmatched.add(t);
        }
        return new TagGroupStats(distinct.size(), exact, loose, unmatched);
    }

    private static String norm(String s) { return s == null ? null : s.trim().toUpperCase(); }
    private static String alnum(String s) { return s == null ? null : s.trim().toUpperCase().replaceAll("[^A-Z0-9]", ""); }

    public record TagGroupStats(int distinct, int exactMatched, int looseMatched, List<String> sampleUnmatched) {}
    public record TagMatchProbe(int equipmentAssetNodes, TagGroupStats loto, TagGroupStats equipment) {}
}
