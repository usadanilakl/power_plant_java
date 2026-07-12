package com.dk_power.power_plant_java.sevice.physical;

import com.dk_power.power_plant_java.dto.maximo.MaximoServiceRequestCriteria;
import com.dk_power.power_plant_java.dto.maximo.MaximoWorkOrderCriteria;
import com.dk_power.power_plant_java.dto.physical.PhysicalObjectAggregate;
import com.dk_power.power_plant_java.dto.physical.PhysicalObjectAggregate.*;
import com.dk_power.power_plant_java.dto.physical.PhysicalObjectDto;
import com.dk_power.power_plant_java.entities.base_entities.Comment;
import com.dk_power.power_plant_java.entities.categories.Value;
import com.dk_power.power_plant_java.entities.files.FileObject;
import com.dk_power.power_plant_java.entities.loto.LotoPoint;
import com.dk_power.power_plant_java.entities.permits.WorkArea;
import com.dk_power.power_plant_java.entities.physical.PhysicalObject;
import com.dk_power.power_plant_java.repository.base_repositories.CommentRepo;
import com.dk_power.power_plant_java.repository.file.FileRepo;
import com.dk_power.power_plant_java.repository.loto.LotoPointRepo;
import com.dk_power.power_plant_java.repository.permits.WorkAreaRepo;
import com.dk_power.power_plant_java.repository.physical.PhysicalObjectRepo;
import com.dk_power.power_plant_java.sevice.maximo.MaximoServiceRequestAdapter;
import com.dk_power.power_plant_java.sevice.maximo.MaximoWorkOrderAdapter;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Set;

/**
 * Builds the "everything about a physical object" aggregate — one call gathering the informational binder (files,
 * LOTO points, work areas, systems, logs) plus best-effort Maximo WO/SR. Backs the desktop object binder and the
 * PWA Rounds question-context. The polymorphic object-log ({@code Comment} entityType="PhysicalObject") lives here too.
 *
 * <p>The Maximo adapters are optional ({@code @ConditionalOnProperty(maximo.api-key)}): resolved via
 * {@link ObjectProvider} so a desktop without a Maximo key still returns the rest of the bundle.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class PhysicalObjectAggregateService {

    public static final String LOG_ENTITY_TYPE = "PhysicalObject";

    private final PhysicalObjectRepo repo;
    private final FileRepo fileRepo;
    private final LotoPointRepo lotoPointRepo;
    private final WorkAreaRepo workAreaRepo;
    private final CommentRepo commentRepo;
    private final ObjectProvider<MaximoWorkOrderAdapter> workOrders;
    private final ObjectProvider<MaximoServiceRequestAdapter> serviceRequests;

    @Transactional(readOnly = true)
    public PhysicalObjectAggregate aggregate(Long id, boolean includeMaximo) {
        PhysicalObject node = repo.findById(id).orElse(null);
        if (node == null) return null;

        PhysicalObjectDto nodeDto = PhysicalObjectDto.from(node, !repo.findByParentId(id).isEmpty());

        List<PhysicalObjectDto> breadcrumb = breadcrumb(node);
        List<LinkedFileRef> files = fileRepo.findByPhysicalObjectId(id).stream().map(this::fileRef).toList();
        List<LotoPointRef> loto = lotoPointRepo.findByPhysicalObjectId(id).stream().map(this::lotoRef).toList();
        List<WorkAreaRef> areas = workAreaRepo.findByPhysicalObjectId(id).stream().map(this::areaRef).toList();
        List<SystemRef> systems = systemRefs(node.getSystems());
        List<ObjectLog> logs = listLogs(id);
        MaximoFacet maximo = includeMaximo ? maximoFacet(node) : new MaximoFacet(false, node.getMaximoAssetnum(), node.getMaximoLocation(), List.of(), List.of());

        return new PhysicalObjectAggregate(nodeDto, breadcrumb, files, loto, areas, systems, logs, maximo);
    }

    // ── object logs (polymorphic Comment) ──

    @Transactional(readOnly = true)
    public List<ObjectLog> listLogs(Long id) {
        return commentRepo.findByEntityTypeAndEntityIdOrderByDateCreatedDesc(LOG_ENTITY_TYPE, id).stream()
                .map(this::logOf).toList();
    }

    @Transactional
    public ObjectLog addLog(Long id, String content, boolean needsAttention) {
        Comment c = new Comment();
        c.setEntityType(LOG_ENTITY_TYPE);
        c.setEntityId(id);
        c.setContent(content);
        c.setNeedsAttention(needsAttention);
        return logOf(commentRepo.save(c)); // createdBy stamped by Spring Data auditing
    }

    // ── mappers ──

    private List<PhysicalObjectDto> breadcrumb(PhysicalObject node) {
        List<PhysicalObjectDto> chain = new ArrayList<>();
        PhysicalObject cur = node;
        int guard = 0;
        while (cur != null && guard++ < 200) {
            chain.add(0, PhysicalObjectDto.from(cur, true));
            Long parentId = cur.getParent() != null ? cur.getParent().getId() : null;
            cur = parentId != null ? repo.findById(parentId).orElse(null) : null;
        }
        return chain;
    }

    private LinkedFileRef fileRef(FileObject f) {
        String link = f.getFileLink();
        if (link == null || link.isBlank()) link = f.getStoredFileLink();
        return new LinkedFileRef(f.getId(), f.getName(), f.getFileNumber(), link, f.getExtension());
    }

    private LotoPointRef lotoRef(LotoPoint p) {
        return new LotoPointRef(p.getId(), p.getTagNumber(), p.getDescription(), p.getType(),
                p.getNormalPosition(), p.getIsolatedPosition(), p.getSpecificLocation());
    }

    private WorkAreaRef areaRef(WorkArea wa) {
        String type = wa.getAreaType() != null ? wa.getAreaType().getName() : null;
        int lotos = wa.getConstantLotos() != null ? wa.getConstantLotos().size() : 0;
        return new WorkAreaRef(wa.getId(), wa.getName(), wa.getDescription(), type, lotos);
    }

    private List<SystemRef> systemRefs(Set<Value> systems) {
        if (systems == null) return List.of();
        return systems.stream()
                .map(v -> new SystemRef(v.getId(), v.getName()))
                .sorted(Comparator.comparing(SystemRef::name, Comparator.nullsLast(String.CASE_INSENSITIVE_ORDER)))
                .toList();
    }

    private ObjectLog logOf(Comment c) {
        return new ObjectLog(c.getId(), c.getContent(), c.getCreatedBy(),
                c.getDateCreated() != null ? c.getDateCreated().toString() : null,
                Boolean.TRUE.equals(c.getNeedsAttention()));
    }

    private MaximoFacet maximoFacet(PhysicalObject node) {
        MaximoWorkOrderAdapter wo = workOrders.getIfAvailable();
        MaximoServiceRequestAdapter sr = serviceRequests.getIfAvailable();
        String assetnum = node.getMaximoAssetnum();
        String location = node.getMaximoLocation();
        if (wo == null || sr == null) return new MaximoFacet(false, assetnum, location, List.of(), List.of());
        try {
            List<Object> wos = List.of();
            List<Object> srs = List.of();
            if (assetnum != null && !assetnum.isBlank()) {
                wos = new ArrayList<>(wo.listForAsset(assetnum, 50));
                srs = new ArrayList<>(sr.listForAsset(assetnum, 50));
            } else if (location != null && !location.isBlank()) {
                MaximoWorkOrderCriteria wc = new MaximoWorkOrderCriteria();
                wc.setLocation(location);
                wos = new ArrayList<>(wo.listByCriteria(wc, 50));
                MaximoServiceRequestCriteria sc = new MaximoServiceRequestCriteria();
                sc.setLocation(location);
                srs = new ArrayList<>(sr.listByCriteria(sc, 50));
            }
            return new MaximoFacet(true, assetnum, location, wos, srs);
        } catch (Exception e) {
            log.warn("[Aggregate] Maximo facet for object {} failed: {}", node.getId(), e.getMessage());
            return new MaximoFacet(false, assetnum, location, List.of(), List.of());
        }
    }
}
