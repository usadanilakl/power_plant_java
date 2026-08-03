package com.dk_power.power_plant_java.sevice.users;

import com.dk_power.power_plant_java.dto.users.ShiftDayDto;
import com.dk_power.power_plant_java.dto.users.ShiftEntry;
import com.dk_power.power_plant_java.entities.users.User;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;

/**
 * Builds a text/calendar (iCalendar / RFC 5545) feed of a single user's schedule so shift workers
 * can subscribe to it from Google Calendar / Apple Calendar / Outlook and get their shifts on
 * their phones without opening the PWA. Time zone is the plant's local zone (America/Chicago).
 *
 * <p>Shift windows match the parser's convention (see personnel.manager.ts): the day boundary
 * that decides "which day owns a night shift" flips at 05:00 local; concrete VEVENT windows are:
 * <pre>
 *   Day Shift        05:00 -> 17:00 local
 *   Night Shift      17:00 -> 05:00 next day
 *   On-Call Manager  00:00 -> 24:00 (all-day)
 *   Leads Meeting    05:00 -> 06:00
 *   PTO / Training / Unscheduled / Off — all-day markers
 * </pre>
 *
 * <p>Only events that involve the requesting user are emitted; matches are done by
 * {@code ShiftEntry.userId == user.id} when available, falling back to
 * {@code ShiftEntry.name equals user.name} for unresolved rosters.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class IcalScheduleService {

    private static final ZoneId PLANT_ZONE = ZoneId.of("America/Chicago");
    private static final ZoneId UTC_ZONE = ZoneId.of("UTC");
    private static final DateTimeFormatter UTC_FMT =
            DateTimeFormatter.ofPattern("yyyyMMdd'T'HHmmss'Z'");
    private static final DateTimeFormatter DATE_FMT =
            DateTimeFormatter.ofPattern("yyyyMMdd");

    private final ShiftDayService shiftDayService;

    /**
     * Build a full iCalendar document containing the user's shifts across the given date range.
     * Called by the public /ical endpoint; the calling code is responsible for authorising the
     * request (via the signed URL token).
     */
    public String buildFeed(User user, LocalDate from, LocalDate to) {
        List<ShiftDayDto> days = shiftDayService.getRange(from, to);
        String userName = user.getName();
        Long userId = user.getId();

        StringBuilder sb = new StringBuilder();
        // RFC 5545: CRLF line endings.
        appendLine(sb, "BEGIN:VCALENDAR");
        appendLine(sb, "VERSION:2.0");
        appendLine(sb, "PRODID:-//JGPower//Schedule//EN");
        appendLine(sb, "CALSCALE:GREGORIAN");
        appendLine(sb, "METHOD:PUBLISH");
        // Plain ASCII hyphen in the calendar name — some clients trip on non-ASCII in header
        // fields even though UTF-8 is declared. Event times are all UTC (Z-suffixed) below so no
        // VTIMEZONE block is needed.
        appendLine(sb, "X-WR-CALNAME:" + safe((userName == null ? "My" : userName) + " - Plant Schedule"));
        appendLine(sb, "X-WR-TIMEZONE:America/Chicago");
        appendLine(sb, "REFRESH-INTERVAL;VALUE=DURATION:PT1H");
        appendLine(sb, "X-PUBLISHED-TTL:PT1H");

        String stamp = ZonedDateTime.now(ZoneId.of("UTC")).format(UTC_FMT);

        for (ShiftDayDto day : days) {
            LocalDate date = day.getDate();
            emitIfMatch(sb, day.getDayShift(), userName, userId, date, stamp, ShiftKind.DAY);
            emitIfMatch(sb, day.getNightShift(), userName, userId, date, stamp, ShiftKind.NIGHT);
            emitIfMatch(sb, day.getPto(), userName, userId, date, stamp, ShiftKind.PTO);
            emitIfMatch(sb, day.getTraining(), userName, userId, date, stamp, ShiftKind.TRAINING);
            emitIfMatch(sb, day.getUnscheduled(), userName, userId, date, stamp, ShiftKind.UNSCHEDULED);
            if (matchesOcm(day, userName, userId)) {
                emitEvent(sb, ShiftKind.OCM, date, stamp, userId);
            }
        }

        appendLine(sb, "END:VCALENDAR");
        return sb.toString();
    }

    // ── Matching + emission ──────────────────────────────────────────────────

    private void emitIfMatch(StringBuilder sb, List<ShiftEntry> pool, String userName, Long userId,
                             LocalDate date, String stamp, ShiftKind kind) {
        if (pool == null) return;
        for (ShiftEntry e : pool) {
            if (matches(e, userName, userId)) {
                emitEvent(sb, kind, date, stamp, userId);
                return; // one event per day per kind is enough — no dupes if roster lists twice
            }
        }
    }

    private boolean matches(ShiftEntry e, String userName, Long userId) {
        if (e == null) return false;
        if (userId != null && e.getUserId() != null && userId.equals(e.getUserId())) return true;
        if (userName != null && !userName.isBlank() && e.getName() != null
                && userName.equalsIgnoreCase(e.getName())) return true;
        return false;
    }

    private boolean matchesOcm(ShiftDayDto day, String userName, Long userId) {
        if (userId != null && day.getOnCallManagerUserId() != null
                && userId.equals(day.getOnCallManagerUserId())) return true;
        return userName != null && !userName.isBlank() && day.getOnCallManagerName() != null
                && userName.equalsIgnoreCase(day.getOnCallManagerName());
    }

    private void emitEvent(StringBuilder sb, ShiftKind kind, LocalDate date, String stamp,
                           Long userId) {
        appendLine(sb, "BEGIN:VEVENT");
        // UID: (kind, date, userId) globally unique. Including userId prevents Google Calendar
        // from de-duping across multiple users' feeds sharing the same account.
        appendLine(sb, "UID:" + kind.name() + "-" + date + "-u" + (userId == null ? "x" : userId)
                + "@jgportal-schedule");
        appendLine(sb, "DTSTAMP:" + stamp);
        appendLine(sb, "SUMMARY:" + kind.summary);
        if (kind.category != null) appendLine(sb, "CATEGORIES:" + kind.category);

        if (kind.allDay) {
            appendLine(sb, "DTSTART;VALUE=DATE:" + date.format(DATE_FMT));
            appendLine(sb, "DTEND;VALUE=DATE:" + date.plusDays(1).format(DATE_FMT));
        } else {
            // Emit UTC (Z-suffixed) instead of TZID=America/Chicago. Google Calendar rejects TZID
            // references without a matching VTIMEZONE block in the feed — the events silently
            // disappear. UTC with Z is universally understood, DST-safe (via ZonedDateTime
            // conversion), and doesn't require us to embed a full VTIMEZONE definition.
            ZonedDateTime start = date.atTime(kind.startHour, 0).atZone(PLANT_ZONE);
            ZonedDateTime end = (kind.endsNextDay
                    ? date.plusDays(1).atTime(kind.endHour, 0)
                    : date.atTime(kind.endHour, 0)).atZone(PLANT_ZONE);
            appendLine(sb, "DTSTART:" + start.withZoneSameInstant(UTC_ZONE).format(UTC_FMT));
            appendLine(sb, "DTEND:" + end.withZoneSameInstant(UTC_ZONE).format(UTC_FMT));
        }
        appendLine(sb, "END:VEVENT");
    }

    // ── Helpers ──────────────────────────────────────────────────────────────

    /** Append a line with CRLF (RFC 5545 mandatory). No folding — line length is well under 75. */
    private static void appendLine(StringBuilder sb, String line) {
        sb.append(line).append("\r\n");
    }

    /** Escape iCalendar text (comma, semicolon, backslash, newline). */
    private static String safe(String s) {
        if (s == null) return "";
        return s.replace("\\", "\\\\")
                .replace(",", "\\,")
                .replace(";", "\\;")
                .replace("\n", "\\n");
    }

    private enum ShiftKind {
        DAY("Day Shift", "SHIFT", 5, 17, false, false),
        NIGHT("Night Shift", "SHIFT", 17, 5, true, false),
        OCM("On Call Manager", "ON-CALL", 0, 0, false, true),
        PTO("PTO", "PTO", 0, 0, false, true),
        TRAINING("Training", "TRAINING", 0, 0, false, true),
        UNSCHEDULED("Unscheduled", "OTHER", 0, 0, false, true);

        final String summary;
        final String category;
        final int startHour;
        final int endHour;
        final boolean endsNextDay;
        final boolean allDay;

        ShiftKind(String summary, String category, int startHour, int endHour,
                  boolean endsNextDay, boolean allDay) {
            this.summary = summary;
            this.category = category;
            this.startHour = startHour;
            this.endHour = endHour;
            this.endsNextDay = endsNextDay;
            this.allDay = allDay;
        }
    }
}
