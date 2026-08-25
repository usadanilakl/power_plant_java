package com.dk_power.power_plant_java.sevice.sync;

import com.dk_power.power_plant_java.entities.base_entities.EmailCorrespondence;
import com.dk_power.power_plant_java.entities.instrumentation.Instrument;
import com.dk_power.power_plant_java.entities.loto.Lock;
import com.dk_power.power_plant_java.entities.loto.Loto;
import com.dk_power.power_plant_java.entities.loto.LotoBox;
import com.dk_power.power_plant_java.entities.loto.LotoPoint;
import com.dk_power.power_plant_java.entities.loto.LotoSnapshot;
import com.dk_power.power_plant_java.entities.loto.ZeroEnergy;
import com.dk_power.power_plant_java.entities.messaging.Conversation;
import com.dk_power.power_plant_java.entities.messaging.Message;
import com.dk_power.power_plant_java.entities.permits.Jha;
import com.dk_power.power_plant_java.entities.permits.WorkRequest;
import com.dk_power.power_plant_java.repository.messaging.MessageRepo;
import com.dk_power.power_plant_java.sevice.loto.zero_energy.ZeroEnergyService;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Test-only seeders + triggers + inspectors to DIRECTLY validate the 2026-08-24 emission-gap fixes
 * against a live hub+2-client lab (see sync_emission_gap_audit_2026_08_24 memory). Every seed persists
 * through the normal JPA path so it emits FieldChanges and propagates to the other nodes BEFORE the
 * merge runs; the merge then re-points children via the fixed managed saves, which must ALSO emit and
 * converge. Inspection reads the raw FK column via `e.assoc.id` JPQL (no join → not blocked by the
 * target's @Where soft-delete filter) and native SQL for the soft-deleted parent rows.
 *
 * Gated by the same flag as {@link com.dk_power.power_plant_java.controller.sync.SyncE2ETestController} —
 * absent in production.
 */
@Service
@Slf4j
@RequiredArgsConstructor
@ConditionalOnProperty(name = "sync.test-endpoints.enabled", havingValue = "true")
public class SyncE2EMergeTestService {

    private static final String SEED = "sync-e2e-merge";

    private final WorkRequestMergeService workRequestMergeService;
    private final LotoMergeService lotoMergeService;
    private final ZeroEnergyService zeroEnergyService;
    private final MessageRepo messageRepo;
    private final InstrumentMergeService instrumentMergeService;

    @PersistenceContext
    private EntityManager entityManager;

    // ==================== LOTO MERGE (B1 locks, B4 multi-box, B5 snapshots) ====================

    /**
     * Seed a canonical Loto + TWO duplicate Lotos sharing {@code spId}. dupA carries a LotoBox + Lock +
     * LotoSnapshot; dupB carries its OWN LotoBox — the multi-box case that exposed the stale-inverse guard
     * bug (B4). After merge: dupA's box moves to canonical, dupB's box must NOT (canonical already has one),
     * lock+snapshot re-point to canonical, both dups soft-deleted.
     */
    @Transactional
    public Map<String, Object> seedLotoMerge(String spId) {
        Loto canonical = newLoto(spId);
        Loto dupA = newLoto(spId);
        Loto dupB = newLoto(spId);
        entityManager.persist(canonical);
        entityManager.persist(dupA);
        entityManager.persist(dupB);
        entityManager.flush();

        LotoBox boxA = new LotoBox();
        boxA.setNumber(1);
        boxA.setLoto(dupA);
        boxA.setCreatedBy(SEED);
        LotoBox boxB = new LotoBox();
        boxB.setNumber(2);
        boxB.setLoto(dupB);
        boxB.setCreatedBy(SEED);
        Lock lock = new Lock();
        lock.setNumber(1);
        lock.setLoto(dupA);
        lock.setCreatedBy(SEED);
        LotoSnapshot snap = new LotoSnapshot();
        snap.setLoto(dupA);
        snap.setCreatedBy(SEED);
        entityManager.persist(boxA);
        entityManager.persist(boxB);
        entityManager.persist(lock);
        entityManager.persist(snap);
        entityManager.flush();

        Map<String, Object> r = new HashMap<>();
        r.put("spId", spId);
        r.put("canonicalId", canonical.getId());
        r.put("dupAId", dupA.getId());
        r.put("dupBId", dupB.getId());
        r.put("boxAId", boxA.getId());
        r.put("boxBId", boxB.getId());
        r.put("lockId", lock.getId());
        r.put("snapshotId", snap.getId());
        log.info("[E2E-Merge] seeded Loto merge scenario spId={} -> {}", spId, r);
        return r;
    }

    private Loto newLoto(String spId) {
        Loto l = new Loto();
        l.setSharepointId(spId);
        l.setPermitNumber("MERGETEST-" + spId);
        l.setCreatedBy(SEED);
        return l;
    }

    public Map<String, Object> triggerLotoMerge() {
        lotoMergeService.mergeIfDuplicatesExist();
        return Map.of("ok", true);
    }

    /** Post-merge inspection for the Loto scenario (call on hub, clientA, clientB — all must match). */
    public Map<String, Object> inspectLoto(Map<String, Long> ids) {
        Map<String, Object> out = new HashMap<>();
        out.put("lockLotoId", fkId("Lock", "loto", ids.get("lockId")));
        out.put("snapshotLotoId", fkId("LotoSnapshot", "loto", ids.get("snapshotId")));
        out.put("boxALotoId", fkId("LotoBox", "loto", ids.get("boxAId")));
        out.put("boxBLotoId", fkId("LotoBox", "loto", ids.get("boxBId")));
        out.put("canonicalDeleted", nativeDeleted("loto", ids.get("canonicalId")));
        out.put("dupADeleted", nativeDeleted("loto", ids.get("dupAId")));
        out.put("dupBDeleted", nativeDeleted("loto", ids.get("dupBId")));
        return out;
    }

    // ==================== WORK REQUEST MERGE (B2 JHA, B6 EmailCorrespondence) ====================

    @Transactional
    public Map<String, Object> seedWorkRequestMerge(String spId) {
        WorkRequest canonical = new WorkRequest();
        canonical.setSharepointId(spId);
        canonical.setCreatedBy(SEED);
        WorkRequest dup = new WorkRequest();
        dup.setSharepointId(spId);
        dup.setCreatedBy(SEED);
        entityManager.persist(canonical);
        entityManager.persist(dup);
        entityManager.flush();

        Jha jha = new Jha();
        jha.setWorkRequest(dup);
        jha.setCreatedBy(SEED);
        EmailCorrespondence ec = new EmailCorrespondence();
        ec.setEntityType("WorkRequest");
        ec.setEntityId(dup.getId());
        ec.setDirection(EmailCorrespondence.Direction.OUTBOUND);
        ec.setSubject("merge test");
        ec.setCreatedBy(SEED);
        entityManager.persist(jha);
        entityManager.persist(ec);
        entityManager.flush();

        Map<String, Object> r = new HashMap<>();
        r.put("spId", spId);
        r.put("canonicalId", canonical.getId());
        r.put("dupId", dup.getId());
        r.put("jhaId", jha.getId());
        r.put("emailId", ec.getId());
        log.info("[E2E-Merge] seeded WorkRequest merge scenario spId={} -> {}", spId, r);
        return r;
    }

    public Map<String, Object> triggerWorkRequestMerge() {
        workRequestMergeService.mergeIfDuplicatesExist();
        return Map.of("ok", true);
    }

    public Map<String, Object> inspectWorkRequest(Map<String, Long> ids) {
        Map<String, Object> out = new HashMap<>();
        out.put("jhaWrId", fkId("Jha", "workRequest", ids.get("jhaId")));
        out.put("emailEntityId", scalar("EmailCorrespondence", "entityId", ids.get("emailId")));
        out.put("canonicalDeleted", nativeDeleted("work_request", ids.get("canonicalId")));
        out.put("dupDeleted", nativeDeleted("work_request", ids.get("dupId")));
        return out;
    }

    // ==================== ZERO ENERGY REPOINT (C1) ====================

    /** Two ZeroEnergy rows; two LotoPoints both referencing ze1. Merge(ze1 -> ze2) must re-point both. */
    @Transactional
    public Map<String, Object> seedZeroEnergyShare() {
        ZeroEnergy ze1 = new ZeroEnergy();
        ze1.setMethod("ZE1 method");
        ze1.setCreatedBy(SEED);
        ZeroEnergy ze2 = new ZeroEnergy();
        ze2.setMethod("ZE2 method");
        ze2.setCreatedBy(SEED);
        entityManager.persist(ze1);
        entityManager.persist(ze2);
        entityManager.flush();

        LotoPoint p1 = new LotoPoint();
        p1.setDescription("ZE merge point 1");
        p1.setZeroEnergy(ze1);
        p1.setCreatedBy(SEED);
        LotoPoint p2 = new LotoPoint();
        p2.setDescription("ZE merge point 2");
        p2.setZeroEnergy(ze1);
        p2.setCreatedBy(SEED);
        entityManager.persist(p1);
        entityManager.persist(p2);
        entityManager.flush();

        Map<String, Object> r = new HashMap<>();
        r.put("ze1Id", ze1.getId());
        r.put("ze2Id", ze2.getId());
        r.put("p1Id", p1.getId());
        r.put("p2Id", p2.getId());
        log.info("[E2E-Merge] seeded ZeroEnergy share scenario -> {}", r);
        return r;
    }

    public Map<String, Object> triggerZeroEnergyMerge(Long sourceId, Long targetId) {
        int n = zeroEnergyService.merge(sourceId, targetId);
        return Map.of("reassigned", n);
    }

    public Map<String, Object> inspectZeroEnergy(Map<String, Long> ids) {
        Map<String, Object> out = new HashMap<>();
        out.put("p1ZeId", fkId("LotoPoint", "zeroEnergy", ids.get("p1Id")));
        out.put("p2ZeId", fkId("LotoPoint", "zeroEnergy", ids.get("p2Id")));
        out.put("ze1Deleted", nativeDeleted("zero_energy", ids.get("ze1Id")));
        out.put("ze2Deleted", nativeDeleted("zero_energy", ids.get("ze2Id")));
        return out;
    }

    // ==================== MESSAGE READ (C3) ====================

    @Transactional
    public Map<String, Object> seedMessageScenario(Long readerUserId) {
        long senderId = readerUserId + 1; // an incoming sender (not the reader)
        Conversation c = new Conversation();
        c.setEntityType("MergeTest");
        c.setEntityId(1L);
        c.setInitiatorId(readerUserId);
        c.setResponderId(senderId);
        c.setSubject("read-receipt merge test");
        c.setStatus(Conversation.Status.OPEN);
        c.setCreatedBy(SEED);
        entityManager.persist(c);
        entityManager.flush();

        Message m1 = newMessage(c, senderId);
        Message m2 = newMessage(c, senderId);
        entityManager.persist(m1);
        entityManager.persist(m2);
        entityManager.flush();

        Map<String, Object> r = new HashMap<>();
        r.put("conversationId", c.getId());
        r.put("m1Id", m1.getId());
        r.put("m2Id", m2.getId());
        r.put("senderId", senderId);
        r.put("readerUserId", readerUserId);
        log.info("[E2E-Merge] seeded Message scenario -> {}", r);
        return r;
    }

    private Message newMessage(Conversation c, long senderId) {
        Message m = new Message();
        m.setConversation(c);
        m.setSenderId(senderId);
        m.setContent("hello");
        m.setSentAt(LocalDateTime.now());
        m.setIsRead(false);
        m.setCreatedBy(SEED);
        return m;
    }

    /** Replicates NgConversationService.markRead's fixed loop (findUnreadIncoming + managed save → emits). */
    @Transactional
    public Map<String, Object> markRead(Long conversationId, Long readerUserId) {
        int n = 0;
        for (Message m : messageRepo.findUnreadIncoming(conversationId, readerUserId)) {
            m.setIsRead(true);
            messageRepo.save(m);
            n++;
        }
        return Map.of("markedRead", n);
    }

    public Map<String, Object> inspectMessage(Map<String, Long> ids) {
        Map<String, Object> out = new HashMap<>();
        out.put("m1IsRead", scalar("Message", "isRead", ids.get("m1Id")));
        out.put("m2IsRead", scalar("Message", "isRead", ids.get("m2Id")));
        return out;
    }

    // ==================== INSTRUMENT (tag_number key + unique-constraint-drop + coexist) ====================

    /** Two Instruments with the SAME tagNumber. A successful persist proves the unique(tag_number) index was
     *  dropped (else the 2nd INSERT would throw); the hub-only merge then dedups by tag_number. */
    @Transactional
    public Map<String, Object> seedInstrumentMerge(String tag) {
        Instrument a = new Instrument();
        a.setTagNumber(tag);
        a.setDescription("dupA");
        a.setCreatedBy(SEED);
        Instrument b = new Instrument();
        b.setTagNumber(tag);
        b.setDescription("dupB");
        b.setCreatedBy(SEED);
        entityManager.persist(a);
        entityManager.persist(b);
        entityManager.flush();

        Map<String, Object> r = new HashMap<>();
        r.put("tag", tag);
        r.put("aId", a.getId());
        r.put("bId", b.getId());
        log.info("[E2E-Merge] seeded Instrument merge scenario tag={} -> {}", tag, r);
        return r;
    }

    public Map<String, Object> triggerInstrumentMerge() {
        instrumentMergeService.mergeIfDuplicatesExist();
        return Map.of("ok", true);
    }

    public Map<String, Object> inspectInstrument(Map<String, Long> ids) {
        Map<String, Object> out = new HashMap<>();
        out.put("aDeleted", nativeDeleted("instrument", ids.get("aId")));
        out.put("bDeleted", nativeDeleted("instrument", ids.get("bId")));
        return out;
    }

    // ==================== helpers ====================

    /** Read a @ManyToOne FK id WITHOUT joining the target (so its @Where soft-delete filter can't hide the row). */
    private Long fkId(String entity, String assoc, Long id) {
        if (id == null) return null;
        List<?> r = entityManager.createQuery(
                        "SELECT e." + assoc + ".id FROM " + entity + " e WHERE e.id = :id")
                .setParameter("id", id).getResultList();
        return r.isEmpty() ? null : (Long) r.get(0);
    }

    /** Read a plain scalar column of an entity by id. */
    private Object scalar(String entity, String field, Long id) {
        if (id == null) return null;
        List<?> r = entityManager.createQuery(
                        "SELECT e." + field + " FROM " + entity + " e WHERE e.id = :id")
                .setParameter("id", id).getResultList();
        return r.isEmpty() ? null : r.get(0);
    }

    /** Native read of `deleted` (bypasses @Where so soft-deleted parents are still visible). */
    private Boolean nativeDeleted(String table, Long id) {
        if (id == null) return null;
        List<?> r = entityManager.createNativeQuery(
                        "SELECT deleted FROM " + table + " WHERE id = :id")
                .setParameter("id", id).getResultList();
        if (r.isEmpty()) return null;
        Object v = r.get(0);
        return v == null ? Boolean.FALSE : (Boolean) v;
    }
}
