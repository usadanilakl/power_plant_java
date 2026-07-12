package com.dk_power.power_plant_java.sevice.rounds;

import com.dk_power.power_plant_java.entities.rounds.RoundAnswerType;
import lombok.Getter;
import lombok.Setter;
import org.springframework.stereotype.Component;

import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Parses one row of a manually-exported WebView-AMS rounds Excel into a structured question hint.
 *
 * <p>Columns: A = <b>Loc/Asset</b> (category, with the equipment tag in a trailing paren when present),
 * B = <b>Label</b> (the question, sometimes with a range in a trailing paren), C = <b>Last Response</b> (a real sample
 * answer — drives the type + unit guess), D = <b>Alarm Config</b> (the authoritative abnormal condition, e.g.
 * {@code "HI: > 100 Deg F\nLO: < 38 Deg F"}, {@code "HI: <> Yes"}, {@code "HI: = Unsat"}).</p>
 *
 * <p>This is pure/deterministic (no POI, no Spring state) so it's unit-tested directly. Limits come from the alarm
 * config first (authoritative), falling back to a range paren in the label. Everything is a hint the admin can override.</p>
 */
@Component
public class RoundExcelRowParser {

    private static final Pattern TRAILING_PAREN = Pattern.compile("\\(([^()]*)\\)\\s*$");
    /** number then optional unit, e.g. "3.4 PSI", "77 Deg F", "90 %", "13". */
    private static final Pattern NUM_UNIT = Pattern.compile("^[-+]?\\d*\\.?\\d+\\s*(.*)$");
    private static final Pattern RANGE = Pattern.compile("^\\s*([-+]?[\\d.]+)\\s*(?:-|to)\\s*([-+]?[\\d.]+)\\s*(.*)$");
    private static final Pattern LT = Pattern.compile("^\\s*[<≤]=?\\s*([-+]?[\\d.]+)\\s*(.*)$");
    private static final Pattern GT = Pattern.compile("^\\s*[>≥]=?\\s*([-+]?[\\d.]+)\\s*(.*)$");
    /** One alarm-config clause: operator (>,<,>=,<=,<>,=) then a number+unit or a word. */
    private static final Pattern ALARM = Pattern.compile("(<>|>=|<=|=|>|<)\\s*(.+)$");
    private static final Pattern LEAD_NUM = Pattern.compile("^([-+]?[\\d.]+)\\s*(.*)$");

    public ParsedRow parse(String locAsset, String label, String sampleResponse, String alarmConfig) {
        ParsedRow p = new ParsedRow();
        String a = clean(locAsset), b = clean(label), c = clean(sampleResponse), d = clean(alarmConfig);
        p.sampleValue = c.isEmpty() ? null : c;
        p.alarmConfigRaw = d.isEmpty() ? null : d;

        // category + tag from col A (Loc/Asset) — a trailing paren is the equipment tag
        Matcher tm = TRAILING_PAREN.matcher(a);
        if (tm.find() && looksLikeTag(tm.group(1))) {
            p.tagCode = tm.group(1).trim();
            String cat = a.substring(0, tm.start()).trim();
            p.category = cat.isEmpty() ? null : coalesceArea(cat, p.tagCode);
        } else {
            p.category = a.isEmpty() ? null : a;
        }

        // limits/expected — alarm config is authoritative, label range is the fallback
        p.prompt = b;
        if (!d.isEmpty()) applyAlarmConfig(d, c, p);
        if (p.lowLimit == null && p.highLimit == null && blank(p.expectedValue)) applyLabelRange(b, p);
        if (p.unit == null && isNumeric(c)) p.unit = unitOf(c);

        p.suggestedType = classify(p, c);
        return p;
    }

    /** Parse "HI: > 100 Deg F", "LO: < 38 Deg F", "HI: <> Yes", "HI: = Unsat" into limits / expected value. */
    private void applyAlarmConfig(String d, String sample, ParsedRow p) {
        for (String raw : d.split("\\r?\\n")) {
            String line = raw.trim().replaceFirst("(?i)^(HI|LO|HH|LL)\\s*:\\s*", "");
            Matcher m = ALARM.matcher(line);
            if (!m.matches()) continue;
            String op = m.group(1);
            String rest = m.group(2).trim();
            Matcher n = LEAD_NUM.matcher(rest);
            if (n.matches()) {
                Double val = num(n.group(1));
                String u = unit(n.group(2));
                if (op.startsWith(">")) { p.highLimit = val; if (p.unit == null) p.unit = u; }
                else if (op.startsWith("<") && !op.equals("<>")) { p.lowLimit = val; if (p.unit == null) p.unit = u; }
            } else {
                String word = rest.trim();
                if (op.equals("<>")) p.expectedValue = word;              // abnormal when != word → pass = word
                else if (op.equals("=") && !word.isEmpty()) {             // abnormal when = word → pass = the normal sample
                    if (sample != null && !sample.isBlank() && !sample.equalsIgnoreCase(word)) p.expectedValue = sample;
                }
            }
        }
    }

    private void applyLabelRange(String label, ParsedRow p) {
        Matcher m = TRAILING_PAREN.matcher(label);
        if (!m.find()) return;
        String inner = m.group(1).trim();
        Matcher r;
        boolean matched = true;
        if ((r = RANGE.matcher(inner)).matches()) { p.lowLimit = num(r.group(1)); p.highLimit = num(r.group(2)); p.unit = unit(r.group(3)); }
        else if ((r = LT.matcher(inner)).matches()) { p.highLimit = num(r.group(1)); p.unit = unit(r.group(2)); }
        else if ((r = GT.matcher(inner)).matches()) { p.lowLimit = num(r.group(1)); p.unit = unit(r.group(2)); }
        else matched = false;
        if (matched) p.prompt = label.substring(0, m.start()).trim();
    }

    private RoundAnswerType classify(ParsedRow p, String sample) {
        String prompt = p.prompt == null ? "" : p.prompt.toLowerCase();
        if (prompt.contains("which shift") || prompt.equals("shift")) return RoundAnswerType.SELECTOR;
        if (p.lowLimit != null || p.highLimit != null || isNumeric(sample)) return RoundAnswerType.READING;
        String s = sample == null ? "" : sample.trim().toLowerCase();
        if (s.equals("yes") || s.equals("no") || s.equals("sat") || s.equals("unsat")
                || s.equals("satisfactory") || s.equals("unsatisfactory")) return RoundAnswerType.PASS_FAIL;
        if (!blank(p.expectedValue)) return RoundAnswerType.PASS_FAIL;
        if (p.prompt != null && p.prompt.trim().endsWith("?")) return RoundAnswerType.PASS_FAIL;
        return RoundAnswerType.TEXT;
    }

    /**
     * Collapse a per-instance category to its area: if the category ends with a short position token (e.g. "01A", "1A",
     * "2C") that also appears in the tag, drop it — so "AIR COOLED HEAT EXCHANGER FAN 01A" (tag 01-CCW-FAN-01A) groups
     * with its siblings as "AIR COOLED HEAT EXCHANGER FAN" instead of being singled out. Each question keeps its own tag.
     */
    private String coalesceArea(String category, String tag) {
        String[] toks = category.split("\\s+");
        if (toks.length < 2 || tag == null) return category;
        String last = toks[toks.length - 1];
        String lastN = last.toUpperCase().replaceAll("[^A-Z0-9]", "");
        String tagN = tag.toUpperCase().replaceAll("[^A-Z0-9]", "");
        if (lastN.length() >= 1 && lastN.length() <= 4 && lastN.matches("\\d*[A-Z]?\\d*[A-Z]?\\d*") && tagN.contains(lastN)) {
            return String.join(" ", java.util.Arrays.copyOfRange(toks, 0, toks.length - 1)).trim();
        }
        return category;
    }

    /** A trailing paren in col A reads as an equipment tag: no spaces, and either has a dash or mixes letters+digits. */
    private boolean looksLikeTag(String s) {
        if (s == null) return false;
        String t = s.trim();
        if (t.isEmpty() || t.contains(" ") || !t.matches("[0-9A-Za-z][0-9A-Za-z-]*")) return false;
        boolean dash = t.indexOf('-') >= 0;
        boolean hasLetter = t.matches(".*[A-Za-z].*");
        boolean hasDigit = t.matches(".*[0-9].*");
        return dash || (hasLetter && hasDigit);
    }

    private boolean isNumeric(String s) {
        return s != null && !s.isBlank() && NUM_UNIT.matcher(s.trim()).matches();
    }

    private String unitOf(String s) {
        Matcher m = NUM_UNIT.matcher(s.trim());
        return m.matches() ? unit(m.group(1)) : null;
    }

    private static String clean(String s) {
        return s == null ? "" : s.replace('\u00A0', ' ').trim();
    }

    private static boolean blank(String s) { return s == null || s.isBlank(); }

    private Double num(String s) {
        try { return Double.parseDouble(s.trim()); } catch (NumberFormatException e) { return null; }
    }

    private String unit(String s) {
        if (s == null) return null;
        String t = s.trim();
        return t.isEmpty() ? null : t;
    }

    @Getter
    @Setter
    public static class ParsedRow {
        private String category;
        private String tagCode;
        private String prompt;
        private Double lowLimit;
        private Double highLimit;
        private String unit;
        private String expectedValue;
        private String sampleValue;
        private String alarmConfigRaw;
        private RoundAnswerType suggestedType = RoundAnswerType.TEXT;
    }
}
