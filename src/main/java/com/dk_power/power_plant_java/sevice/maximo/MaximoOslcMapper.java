package com.dk_power.power_plant_java.sevice.maximo;

import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.Objects;

/**
 * Helpers for parsing Maximo OSLC responses.
 * Maximo wraps members in "rdfs:member" and prefixes fields with "spi:" (smarter physical infrastructure namespace).
 * The href id sits in "rdf:about" as a full URL — we strip the trailing path segment.
 */
public final class MaximoOslcMapper {

    private MaximoOslcMapper() {}

    @SuppressWarnings("unchecked")
    public static List<Map<String, Object>> members(Map<String, Object> envelope) {
        if (envelope == null) return Collections.emptyList();
        Object m = envelope.get("rdfs:member");
        if (m instanceof List<?> list) return (List<Map<String, Object>>) list;
        return Collections.emptyList();
    }

    /** Extract href id from "rdf:about" URL. Returns the segment after the last "/". */
    public static String hrefId(Map<String, Object> record) {
        if (record == null) return null;
        Object about = record.get("rdf:about");
        if (about == null) return null;
        String s = about.toString();
        int slash = s.lastIndexOf('/');
        return slash >= 0 ? s.substring(slash + 1) : s;
    }

    public static String str(Map<String, Object> record, String key) {
        if (record == null) return null;
        Object v = record.get("spi:" + key);
        if (v == null) v = record.get(key);
        return v == null ? null : Objects.toString(v);
    }

    /** Read a value from a record under any of the given (already-prefixed) keys. */
    public static String strRaw(Map<String, Object> record, String... keys) {
        if (record == null) return null;
        for (String k : keys) {
            Object v = record.get(k);
            if (v != null) return Objects.toString(v);
        }
        return null;
    }

    /** Doclinks records nest the actual metadata in "wdrs:describedBy" — return that or the row itself. */
    @SuppressWarnings("unchecked")
    public static Map<String, Object> describedBy(Map<String, Object> record) {
        if (record == null) return null;
        Object inner = record.get("wdrs:describedBy");
        if (inner instanceof Map<?, ?> m) return (Map<String, Object>) m;
        return record;
    }

    public static Long longVal(Map<String, Object> record, String key) {
        String s = str(record, key);
        if (s == null || s.isBlank()) return null;
        try {
            return Long.parseLong(s);
        } catch (NumberFormatException e) {
            try {
                return (long) Double.parseDouble(s);
            } catch (NumberFormatException ex) {
                return null;
            }
        }
    }

    public static Boolean boolVal(Map<String, Object> record, String key) {
        Object v = record == null ? null : record.get("spi:" + key);
        if (v == null) v = record == null ? null : record.get(key);
        if (v == null) return null;
        if (v instanceof Boolean b) return b;
        return Boolean.parseBoolean(v.toString());
    }
}
