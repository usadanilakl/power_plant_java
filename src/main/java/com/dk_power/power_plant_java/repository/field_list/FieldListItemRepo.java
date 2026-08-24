package com.dk_power.power_plant_java.repository.field_list;

import com.dk_power.power_plant_java.entities.field_list.FieldListItem;
import com.dk_power.power_plant_java.repository.base_repositories.BaseRepository;

import java.util.List;
import java.util.Optional;

public interface FieldListItemRepo extends BaseRepository<FieldListItem> {
    Optional<FieldListItem> findFirstBySharepointIdOrderByIdAsc(String sharepointId);
    Optional<FieldListItem> findFirstByLocalUuidOrderByIdAsc(String localUuid);
    List<FieldListItem> findByListType_NameIgnoreCase(String listTypeName);
    List<FieldListItem> findByStatus_NameIgnoreCase(String statusName);
    List<FieldListItem> findByStatus_NameIn(List<String> statusNames);
    List<FieldListItem> findByListType_NameIgnoreCaseAndStatus_NameIn(String listTypeName, List<String> statusNames);
    boolean existsBySharepointId(String sharepointId);

    // === Maximo bridge queries (used by MaximoFieldListSyncJob) ===
    /** Rows that failed their initial Maximo create and need a backfill retry. Both SR and WO paths use this flag. */
    List<FieldListItem> findByMaximoSyncPendingTrueOrderByIdAsc();
    /** Rows that were locally deleted but the cancel call failed. Native query bypasses {@code @Where(deleted != true)}. */
    @org.springframework.data.jpa.repository.Query(
            value = "SELECT * FROM field_list_item WHERE maximo_cancel_pending = TRUE AND deleted = TRUE ORDER BY id ASC",
            nativeQuery = true
    )
    List<FieldListItem> findDeletedWithPendingCancel();
    /** Rows where {@code bridge.complete()} failed and backfill should retry the WO COMP call. */
    List<FieldListItem> findByMaximoCompletePendingTrueOrderByIdAsc();
    /** Look up a live row by Maximo (recordType, recordId) tuple — used by the drift admin (no lock needed). */
    Optional<FieldListItem> findFirstByMaximoRecordTypeAndMaximoRecordId(String maximoRecordType, String maximoRecordId);

    /**
     * Same lookup, PESSIMISTIC_WRITE-locked. Used by the status-poll reconcile so a
     * concurrent {@code bridge.complete()} on the same row cannot commit COMP between
     * our read and our save. Without this lock (and without @Version on the entity),
     * H2 MVCC's blind-UPDATE would clobber the concurrent commit for up to 60s until
     * the next poll tick corrected. The lock is held for the duration of the per-row
     * REQUIRES_NEW tx, which is microseconds in the hub JVM.
     */
    @org.springframework.data.jpa.repository.Lock(jakarta.persistence.LockModeType.PESSIMISTIC_WRITE)
    @org.springframework.data.jpa.repository.Query(
            "SELECT f FROM FieldListItem f WHERE f.maximoRecordType = :recordType AND f.maximoRecordId = :recordId"
    )
    Optional<FieldListItem> findAndLockByMaximoRecord(
            @org.springframework.data.repository.query.Param("recordType") String recordType,
            @org.springframework.data.repository.query.Param("recordId") String recordId);

    /**
     * findById variant that takes a PESSIMISTIC_WRITE lock. The complete-path listener
     * uses this so it holds the same row-lock as the status-poll reconcile — both writers
     * serialize on the same lock and neither can commit stale data over a concurrent commit.
     */
    @org.springframework.data.jpa.repository.Lock(jakarta.persistence.LockModeType.PESSIMISTIC_WRITE)
    @org.springframework.data.jpa.repository.Query(
            "SELECT f FROM FieldListItem f WHERE f.id = :id"
    )
    Optional<FieldListItem> findAndLockById(@org.springframework.data.repository.query.Param("id") Long id);

    /**
     * findById that INCLUDES soft-deleted rows. Standard findById is filtered by
     * {@code @Where(deleted != true)}. Needed by the cancel-path event listener + backfill
     * so a locally-deleted row can still have its Maximo record cancelled by re-fetch.
     */
    @org.springframework.data.jpa.repository.Query(
            value = "SELECT * FROM field_list_item WHERE id = :id",
            nativeQuery = true
    )
    Optional<FieldListItem> findByIdIncludingDeleted(@org.springframework.data.repository.query.Param("id") Long id);

    // Intentionally NOT a native UPDATE for the poll-reconcile status write. A
    // native UPDATE bypasses FieldChangeEntityListener (@PostUpdate), which would
    // stop maximoStatus changes from syncing hub → desktops via CRDT — desktops
    // would then never see ops closing an SR/WO. The poll-vs-complete race is
    // handled by refetching inside the per-row tx and checking terminal-state in
    // Java before save() (see MaximoFieldListSyncJob.reconcileOneInNewTx). Race
    // window is microseconds within a single hub JVM instead of DB-atomic.

    // === Drift dashboard queries (used by MaximoFieldListDriftService) ===

    /** Total routed-to-Maximo rows (recordId not null) — headline count for the drift panel. */
    long countByMaximoRecordIdIsNotNull();

    /** Simple counts for the pending buckets — avoids materializing the list when only count is needed. */
    long countByMaximoSyncPendingTrue();
    long countByMaximoCompletePendingTrue();

    @org.springframework.data.jpa.repository.Query(
            value = "SELECT COUNT(*) FROM field_list_item WHERE maximo_cancel_pending = TRUE AND deleted = TRUE",
            nativeQuery = true
    )
    long countDeletedWithPendingCancel();

    /**
     * Rows where the Maximo record is at a terminal status but the local FieldListStatus is still open —
     * ops closed it in Maximo, the PWA still shows it open. Excludes soft-deleted rows so the cancel
     * backlog doesn't get double-counted here. Uses JPQL so {@code @Where(deleted != true)} applies.
     */
    @org.springframework.data.jpa.repository.Query(
            "SELECT f FROM FieldListItem f WHERE f.maximoStatus IN :maximoTerminal AND f.status.name IN :localOpen ORDER BY f.dateModified DESC"
    )
    List<FieldListItem> findMaximoClosedLocalOpen(
            @org.springframework.data.repository.query.Param("maximoTerminal") List<String> maximoTerminalStatuses,
            @org.springframework.data.repository.query.Param("localOpen") List<String> localOpenStatuses);

    /**
     * Rows where local FieldListStatus is closed but the Maximo WO is still open — the wo-completion-status
     * flip fired the {@code bridge.complete()} but it failed silently. Scoped to recordType=WO because SR
     * lifecycles are planner-driven — an SR in NEW when we've marked the local Closed is expected, not drift.
     */
    @org.springframework.data.jpa.repository.Query(
            "SELECT f FROM FieldListItem f WHERE f.maximoRecordType = 'WO' AND f.maximoStatus IN :maximoOpen "
                    + "AND f.status.name = :localClosed ORDER BY f.dateModified DESC"
    )
    List<FieldListItem> findLocalClosedMaximoOpen(
            @org.springframework.data.repository.query.Param("maximoOpen") List<String> maximoOpenStatuses,
            @org.springframework.data.repository.query.Param("localClosed") String localClosedStatus);

    /**
     * Field lists actively waiting for insulation contractor work. Matches rows routed to Maximo
     * as WOs (only insulation types route to WO on this tenant) that are ACTIVE from EITHER
     * side's perspective: local status is Open/In Progress OR the cached maximoStatus is a
     * non-terminal WO status. Rationale for the OR:
     *   - After a LOCAL reopen (Maximo can't be uncomp'd via OSLC), local status flips to Open
     *     but the maximoStatus cache stays "COMP" until the status-poll ticks. Without the OR
     *     the reopened item never comes back into the queue — reopen would be meaningless.
     *   - After ops reopens the WO in Maximo directly (COMP → WAPPR), the status-poll picks
     *     up the change and maximoStatus flips back to WAPPR; the OR keeps that path working.
     * Filter by listType.name allows other WO-routed types (if added later) to have their
     * own dedicated views instead of sharing this one.
     */
    @org.springframework.data.jpa.repository.Query(
            "SELECT f FROM FieldListItem f WHERE f.listType.name = :listTypeName "
                    + "AND f.maximoRecordType = 'WO' "
                    + "AND (f.status.name IN :localOpen OR f.maximoStatus IN :maximoOpen) "
                    + "ORDER BY f.dateModified DESC"
    )
    List<FieldListItem> findActiveWoByListType(
            @org.springframework.data.repository.query.Param("listTypeName") String listTypeName,
            @org.springframework.data.repository.query.Param("localOpen") List<String> localOpenStatuses,
            @org.springframework.data.repository.query.Param("maximoOpen") List<String> maximoOpenStatuses);

    /**
     * Recently-CLOSED contractor items — mirrors {@link #findActiveWoByListType} but for the
     * "recently closed" panel that gives a contractor an undo path (their item drops off
     * the active list on complete; without this they can't find it to reopen). Filtered by
     * Maximo terminal status + modified within the last {@code since} cutoff. Same listType
     * gate so the two panels don't cross-contaminate.
     */
    @org.springframework.data.jpa.repository.Query(
            "SELECT f FROM FieldListItem f WHERE f.listType.name = :listTypeName "
                    + "AND f.maximoRecordType = 'WO' AND f.maximoStatus IN :terminalStatuses "
                    + "AND f.dateModified >= :since ORDER BY f.dateModified DESC"
    )
    List<FieldListItem> findRecentlyClosedWoByListType(
            @org.springframework.data.repository.query.Param("listTypeName") String listTypeName,
            @org.springframework.data.repository.query.Param("terminalStatuses") List<String> terminalStatuses,
            @org.springframework.data.repository.query.Param("since") java.time.LocalDateTime since);

    /**
     * Rows that look like orphaned Maximo WOs — created accidentally when the bridge was
     * first enabled against a repo of already-Closed items. Filter: maximoRecordType=WO
     * AND maximoStatus IN a caller-supplied list (e.g. WAPPR/APPR) AND local status.name
     * matches one of a caller-supplied list (usually "Closed"/"Cancelled"). Ordered by
     * dateModified DESC so the admin sees the most-recent candidates first. Backs the
     * Drift Center's "Bulk cancel Maximo orphans" panel.
     */
    @org.springframework.data.jpa.repository.Query(
            "SELECT f FROM FieldListItem f WHERE f.maximoRecordType = 'WO' "
                    + "AND f.maximoStatus IN :maximoStatuses "
                    + "AND f.status.name IN :localStatuses "
                    + "AND f.maximoRecordId IS NOT NULL "
                    + "ORDER BY f.dateModified DESC"
    )
    List<FieldListItem> findMaximoWoOrphans(
            @org.springframework.data.repository.query.Param("maximoStatuses") List<String> maximoStatuses,
            @org.springframework.data.repository.query.Param("localStatuses") List<String> localStatuses);
}
