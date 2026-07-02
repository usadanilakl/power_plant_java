package com.dk_power.power_plant_java.controller.angular;

import com.dk_power.power_plant_java.dto.physical.PhysicalObjectDto;
import com.dk_power.power_plant_java.entities.physical.PhysicalObject;
import com.dk_power.power_plant_java.repository.physical.PhysicalObjectRepo;
import com.dk_power.power_plant_java.repository.loto.LotoPointRepo;
import com.dk_power.power_plant_java.repository.equipment.EquipmentRepo;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Objects;
import java.util.Set;
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
        List<PhysicalObjectDto> dtos = kids.stream()
                .map(p -> PhysicalObjectDto.from(p, !repo.findByParentId(p.getId()).isEmpty()))
                .collect(Collectors.toList());
        return ResponseEntity.ok(new NgApiResponse<>(dtos, dtos.size() + " children"));
    }

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
