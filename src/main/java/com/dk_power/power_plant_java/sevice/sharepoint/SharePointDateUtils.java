package com.dk_power.power_plant_java.sevice.sharepoint;

import lombok.extern.slf4j.Slf4j;

import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.time.format.DateTimeFormatter;

@Slf4j
public final class SharePointDateUtils {

    private SharePointDateUtils() {}

    /**
     * Parse a combined UTC datetime from SharePoint (e.g. "2026-02-15T20:30:00Z")
     * into [date, time] in Central Time (e.g. ["2026-02-15", "14:30"]).
     */
    public static String[] fromSharePointDateTime(String raw) {
        if (raw == null || raw.isEmpty()) return new String[]{ null, null };
        try {
            String cleaned = raw.replace("Z", "").replace("z", "");
            if (!cleaned.contains("T")) return new String[]{ raw, null };
            LocalDateTime utcLdt = LocalDateTime.parse(cleaned);
            ZonedDateTime utc = utcLdt.atZone(ZoneId.of("UTC"));
            ZonedDateTime central = utc.withZoneSameInstant(ZoneId.of("America/Chicago"));
            String date = central.toLocalDate().toString();
            String time = String.format("%02d:%02d", central.getHour(), central.getMinute());
            return new String[]{ date, time };
        } catch (Exception e) {
            log.warn("[SharePoint] Failed to parse datetime '{}': {}", raw, e.getMessage());
            if (raw.contains("T")) {
                String[] parts = raw.split("T");
                String timePart = parts[1].length() >= 5 ? parts[1].substring(0, 5) : parts[1];
                return new String[]{ parts[0], timePart };
            }
            return new String[]{ raw, null };
        }
    }

    /**
     * Combine date + time (assumed Central Time) into ISO with Central Time offset.
     * Used by certificate access (SharePoint REST API handles timezone display).
     */
    public static String toCentralIso(String date, String time) {
        if (date == null || date.isEmpty()) return "";
        String timeStr = (time != null && !time.isEmpty()) ? time : "00:00";
        if (timeStr.length() == 5) timeStr += ":00";
        try {
            LocalDateTime ldt = LocalDateTime.parse(date + "T" + timeStr);
            ZonedDateTime central = ldt.atZone(ZoneId.of("America/Chicago"));
            return central.format(DateTimeFormatter.ISO_OFFSET_DATE_TIME);
        } catch (Exception e) {
            log.warn("[SharePoint] Failed to format date/time: {} / {}", date, time);
            return date + "T" + timeStr;
        }
    }

    /**
     * Combine date + time (assumed Central Time) into UTC ISO.
     * Used by Power Automate (PA applies its own timezone handling).
     */
    public static String toUtcIso(String date, String time) {
        if (date == null || date.isEmpty()) return "";
        String timeStr = (time != null && !time.isEmpty()) ? time : "00:00";
        if (timeStr.length() == 5) timeStr += ":00";
        try {
            LocalDateTime ldt = LocalDateTime.parse(date + "T" + timeStr);
            ZonedDateTime central = ldt.atZone(ZoneId.of("America/Chicago"));
            ZonedDateTime utc = central.withZoneSameInstant(ZoneId.of("UTC"));
            return utc.format(DateTimeFormatter.ISO_LOCAL_DATE_TIME) + "Z";
        } catch (Exception e) {
            log.warn("[SharePoint] Failed to format date/time to UTC: {} / {}", date, time);
            return date + "T" + timeStr;
        }
    }

    public static String orEmpty(String val) {
        return val != null ? val : "";
    }

    public static String str(java.util.Map<String, Object> map, String key) {
        Object val = map.get(key);
        return val != null ? val.toString() : null;
    }
}
