package com.dk_power.power_plant_java.sevice.users;

import com.dk_power.power_plant_java.entities.users.ShiftDay;
import com.dk_power.power_plant_java.repository.users.ShiftDayRepo;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

/**
 * Hub-side scheduled scanner that mirrors ShiftDay rows to Supabase whenever they change on the
 * hub. Complements the direct-push path inside {@link ShiftDayService#importSchedule} — that path
 * only fires when an Electron client POSTs to /ng/schedule/sync. For rows that arrive via CRDT
 * sync (any desktop pushes to its local Spring, sync propagates the change to hub, hub's
 * FieldChangeApplier applies rows to hub's ShiftDay table WITHOUT going through importSchedule),
 * this scanner is the mirror trigger.
 *
 * <p>Watermark is held in memory: hub restart re-mirrors the whole horizon on the first tick,
 * which is cheap (Supabase upsert is idempotent) and self-healing (any drift is corrected). If we
 * ever need a durable watermark, promote to a hub-local kv row.
 *
 * <p><b>Deletes / clears.</b> This scanner (and {@link ShiftDayService#importSchedule}'s direct
 * push) is upsert-only — there is no {@code DELETE} call against {@code plant_schedule_day}. That's
 * fine for the normal case: when the materialiser clears a day that no longer has any v2-placed
 * staffing ({@code ScheduleMaterialisationService}'s empty-day clearing), the H2 {@code ShiftDay}
 * row's JSON columns are written to {@code null} but the row itself is NOT deleted, so its
 * {@code dateModified} still bumps and the row still shows up in the next {@code findByDateModified
 * GreaterThan} scan. That re-upsert pushes {@link ShiftDayService#toSupabaseRow} for the row, which
 * always sends every bucket column (even when empty, as {@code []}) and — since the on-call-manager
 * fix above — always sends {@code on_call_manager_*} too, so the Supabase row is fully overwritten
 * to the cleared state (an upsert-based tombstone) rather than deleted. A true row-level delete would
 * require a {@code SupabaseAdminClient} DELETE method; the upsert-tombstone is the cleanest option
 * that fits this scanner without one, and the PWA already treats empty JSON arrays as "no one
 * scheduled". A genuinely hard/soft-deleted {@code ShiftDay} row (as opposed to cleared) would be
 * filtered out by {@code @Where(deleted IS NOT TRUE)} before this scan ever sees it — nothing in this
 * codebase currently hard-deletes {@code ShiftDay} rows, so that gap is latent, not active.
 *
 * <p>Hub-only: {@code @ConditionalOnProperty(sync.role=hub)}. Desktops don't have SupabaseAdminClient
 * credentials.
 */
@Slf4j
@Service
@RequiredArgsConstructor
@ConditionalOnProperty(name = "sync.role", havingValue = "hub")
public class HubScheduleSupabaseMirrorService {

    private final ShiftDayRepo shiftDayRepo;
    private final ShiftDayService shiftDayService;

    /**
     * Watermark: highest dateModified we've already mirrored. Starts at epoch on boot so the first
     * tick catches the whole current horizon.
     */
    private volatile LocalDateTime lastMirroredWatermark = LocalDateTime.of(1970, 1, 1, 0, 0);

    /**
     * Poll every 60 s for ShiftDay rows modified after the watermark and mirror them to Supabase.
     * Configurable via {@code hub.schedule-supabase-mirror.interval-ms} (default 60 000).
     */
    @Scheduled(fixedDelayString = "${hub.schedule-supabase-mirror.interval-ms:60000}",
               initialDelayString = "${hub.schedule-supabase-mirror.initial-delay-ms:30000}")
    public void mirrorTick() {
        try {
            List<ShiftDay> dirty = shiftDayRepo.findByDateModifiedGreaterThanOrderByDateModifiedAsc(lastMirroredWatermark);
            if (dirty.isEmpty()) return;

            List<Map<String, Object>> rows = new ArrayList<>(dirty.size());
            LocalDateTime highest = lastMirroredWatermark;
            for (ShiftDay row : dirty) {
                rows.add(shiftDayService.toSupabaseRow(row));
                if (row.getDateModified() != null && row.getDateModified().isAfter(highest)) {
                    highest = row.getDateModified();
                }
            }

            shiftDayService.mirrorRowsToSupabase(rows);
            lastMirroredWatermark = highest;
            log.info("[HubScheduleMirror] Mirrored {} ShiftDay rows to Supabase; watermark now {}",
                    rows.size(), lastMirroredWatermark);
        } catch (Exception e) {
            // Do NOT advance watermark on failure — next tick retries the same rows.
            log.warn("[HubScheduleMirror] Mirror tick failed (will retry): {}", e.getMessage());
        }
    }
}
