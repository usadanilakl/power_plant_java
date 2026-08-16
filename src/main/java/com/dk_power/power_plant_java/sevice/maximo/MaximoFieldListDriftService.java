package com.dk_power.power_plant_java.sevice.maximo;

import com.dk_power.power_plant_java.dto.admin.MaximoFieldListDriftDto;
import com.dk_power.power_plant_java.dto.admin.MaximoFieldListDriftRowDto;
import com.dk_power.power_plant_java.entities.field_list.FieldListItem;
import com.dk_power.power_plant_java.repository.field_list.FieldListItemRepo;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

/**
 * Builds the drift snapshot for the Maximo Field List bridge. Not gated by the same
 * feature flag as the bridge itself — the admin panel is safe to show even when the
 * feature is off (all buckets will just be zero-count), and hiding it based on config
 * would create a mystery panel that appears/disappears from the UI without explanation.
 *
 * All queries respect {@code @Where(deleted != true)} EXCEPT the cancel-pending query,
 * which explicitly targets deleted rows.
 */
@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class MaximoFieldListDriftService {

    private final FieldListItemRepo repo;

    /**
     * Terminal Maximo statuses — a record in one of these is done as far as Maximo is
     * concerned. Any local row still in an open status against a terminal Maximo status
     * is drift the admin should see.
     */
    private static final List<String> MAXIMO_TERMINAL = List.of(
            MaximoFieldListBridge.SR_STATUS_CANCELLED, // SR: CANCELLED
            "CLOSED",                                   // SR terminal
            MaximoFieldListBridge.WO_STATUS_COMPLETE,  // WO: COMP
            "CLOSE",                                    // WO: CLOSE
            MaximoFieldListBridge.WO_STATUS_CANCELLED  // WO: CAN
    );

    /**
     * Non-terminal WO statuses. Used to flag rows where the local status went to Closed
     * but the WO didn't get its COMP push through (the "wo-completion-status hit but
     * bridge.complete() failed silently" case). Restricted to WO because SR non-terminal
     * status against a local closed row is expected planner-side triage, not drift.
     */
    private static final List<String> MAXIMO_WO_OPEN = List.of(
            "WAPPR", "APPR", "WSCH", "INPRG"
    );

    /**
     * Local FieldListStatus names considered "open" (i.e. not-closed). Matches the same
     * set used by {@code NgFieldListItemService.OPEN_STATUSES} — kept in sync manually,
     * since duplication across a service + drift audit is smaller than pulling a shared
     * constant into a Value-service boundary.
     */
    private static final List<String> LOCAL_OPEN = List.of("Open", "In Progress");

    /** Local FieldListStatus name treated as "closed" for divergence checks. */
    private static final String LOCAL_CLOSED = "Closed";

    /**
     * Build the drift snapshot. {@code sampleLimit} caps how many rows are returned per
     * bucket for drill-down — counts always reflect the full table.
     */
    public MaximoFieldListDriftDto snapshot(int sampleLimit) {
        int cap = Math.max(1, Math.min(sampleLimit, 200));

        List<FieldListItem> createPendingRows = repo.findByMaximoSyncPendingTrueOrderByIdAsc();
        List<FieldListItem> cancelPendingRows = repo.findDeletedWithPendingCancel();
        List<FieldListItem> completePendingRows = repo.findByMaximoCompletePendingTrueOrderByIdAsc();
        List<FieldListItem> maximoClosedLocalOpen = repo.findMaximoClosedLocalOpen(MAXIMO_TERMINAL, LOCAL_OPEN);
        List<FieldListItem> localClosedMaximoOpen = repo.findLocalClosedMaximoOpen(MAXIMO_WO_OPEN, LOCAL_CLOSED);

        MaximoFieldListDriftDto out = new MaximoFieldListDriftDto();
        out.setComputedAt(Instant.now());
        out.setTotalRoutedToMaximo(repo.countByMaximoRecordIdIsNotNull());
        out.setCreatePending(bucket(createPendingRows, cap));
        out.setCancelPending(bucket(cancelPendingRows, cap));
        out.setCompletePending(bucket(completePendingRows, cap));
        out.setMaximoClosedLocalOpen(bucket(maximoClosedLocalOpen, cap));
        out.setLocalClosedMaximoOpen(bucket(localClosedMaximoOpen, cap));
        return out;
    }

    private MaximoFieldListDriftDto.BucketDto bucket(List<FieldListItem> rows, int cap) {
        MaximoFieldListDriftDto.BucketDto b = new MaximoFieldListDriftDto.BucketDto();
        b.setCount(rows == null ? 0 : rows.size());
        b.setOldestAgeDays(oldestAgeDays(rows));
        b.setSamples(toRowDtos(rows, cap));
        return b;
    }

    private static Long oldestAgeDays(List<FieldListItem> rows) {
        if (rows == null || rows.isEmpty()) return null;
        LocalDateTime oldest = null;
        for (FieldListItem r : rows) {
            LocalDateTime m = r.getDateModified();
            if (m == null) continue;
            if (oldest == null || m.isBefore(oldest)) oldest = m;
        }
        if (oldest == null) return null;
        long days = ChronoUnit.DAYS.between(oldest, LocalDateTime.now());
        return Math.max(0L, days);
    }

    private static List<MaximoFieldListDriftRowDto> toRowDtos(List<FieldListItem> rows, int cap) {
        if (rows == null || rows.isEmpty()) return Collections.emptyList();
        // Sort newest-first for drill-down UX (buckets fetched by different queries with
        // different orderings normalize here). Cancel-pending rows come deleted=true from
        // a native query and may lack dateModified; nulls sort last.
        List<FieldListItem> sorted = new ArrayList<>(rows);
        sorted.sort((a, b) -> {
            LocalDateTime da = a.getDateModified();
            LocalDateTime db = b.getDateModified();
            if (da == null && db == null) return 0;
            if (da == null) return 1;
            if (db == null) return -1;
            return db.compareTo(da);
        });
        List<MaximoFieldListDriftRowDto> out = new ArrayList<>(Math.min(cap, sorted.size()));
        int taken = 0;
        for (FieldListItem r : sorted) {
            if (taken++ >= cap) break;
            out.add(toRowDto(r));
        }
        return out;
    }

    private static MaximoFieldListDriftRowDto toRowDto(FieldListItem r) {
        MaximoFieldListDriftRowDto d = new MaximoFieldListDriftRowDto();
        d.setId(r.getId());
        d.setTitle(r.getTitle());
        d.setListTypeName(r.getListType() == null ? null : r.getListType().getName());
        d.setLocalStatus(r.getStatus() == null ? null : r.getStatus().getName());
        d.setMaximoRecordType(r.getMaximoRecordType());
        d.setMaximoRecordId(r.getMaximoRecordId());
        d.setMaximoStatus(r.getMaximoStatus());
        d.setMaximoSyncPending(r.getMaximoSyncPending());
        d.setMaximoCancelPending(r.getMaximoCancelPending());
        d.setMaximoCompletePending(r.getMaximoCompletePending());
        d.setDateModified(r.getDateModified());
        d.setSubmitterName(r.getSubmitterName());
        d.setDeleted(r.getDeleted());
        return d;
    }
}
