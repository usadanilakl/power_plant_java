package com.dk_power.power_plant_java.util;

import lombok.extern.slf4j.Slf4j;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.List;
import java.util.Locale;

/**
 * Parses the free-form date strings permits carry.
 *
 * <p>Work request / job dates are stored as {@code String}, not {@code LocalDate}, because they
 * arrive from three writers that disagree about format: the PWA sends ISO ({@code 2026-08-23}),
 * SharePoint sends an ISO date-time ({@code 2026-08-23T00:00:00Z}), and the older Excel-backed
 * rows carry US short dates ({@code 8/23/26}). Every consumer that needs to reason about the date
 * had to re-implement the same tolerant parse, so it lives here once.
 *
 * <p>Returns {@code null} rather than throwing: an unparseable date means "we don't know when",
 * and callers decide what that implies. Nothing here should be able to fail a page load or a
 * scheduled sweep.
 */
@Slf4j
public final class PermitDates {

    private static final List<DateTimeFormatter> FORMATTERS = List.of(
            DateTimeFormatter.ISO_LOCAL_DATE,
            DateTimeFormatter.ofPattern("M/d/uuuu", Locale.US),
            DateTimeFormatter.ofPattern("M/d/uu", Locale.US),
            DateTimeFormatter.ofPattern("MM/dd/uuuu", Locale.US),
            DateTimeFormatter.ofPattern("MM/dd/uu", Locale.US)
    );

    private PermitDates() {
    }

    /** The date this string denotes, or null if it is blank or in no format we recognise. */
    public static LocalDate parse(String dateStr) {
        if (dateStr == null || dateStr.isBlank()) return null;
        String trimmed = dateStr.trim();

        if (trimmed.contains("T")) {
            try {
                return LocalDateTime.parse(trimmed.replace("Z", "")).toLocalDate();
            } catch (DateTimeParseException ignored) {
                String datePart = trimmed.split("T", 2)[0];
                if (!datePart.isBlank()) {
                    trimmed = datePart;
                }
            }
        }

        for (DateTimeFormatter formatter : FORMATTERS) {
            try {
                return LocalDate.parse(trimmed, formatter);
            } catch (DateTimeParseException ignored) {
                // Try the next supported date format.
            }
        }

        log.debug("[PermitDates] Unrecognised date format: '{}'", dateStr);
        return null;
    }
}
