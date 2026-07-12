package com.dk_power.power_plant_java.sevice.rounds;

import com.dk_power.power_plant_java.entities.rounds.RoundAnswerType;
import lombok.Getter;
import lombok.Setter;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Parses a WebView-AMS round column header into structured hints for the Rounds import.
 *
 * <p>The real WebView format is a <b>single line</b>: {@code <CATEGORY>[ (<tag>)] <prompt>[ (<range/limit incl unit>)] [(<ordinal>)]}.
 * e.g. {@code "ACC MCC (01-ACC-MCC) Building Temperature (65-85 F) (3)"} → category "ACC MCC", tag "01-ACC-MCC",
 * prompt "Building Temperature", low 65, high 85, unit "F", READING. A legacy multi-line variant (category on line 0,
 * prompt on the next) is still handled. The {@code questionKey} = ordinal-stripped header (stable de-dupe/link key).</p>
 *
 * <p>Single-line splitting is heuristic (WebView carries no field boundaries): strip the trailing ordinal, peel off a
 * trailing <i>range</i> paren, then split category from prompt at a <i>tag</i> paren if present, else at the first
 * mixed-case word (leading ALL-CAPS tokens = the system/category). The admin can override any of it in the workbench.</p>
 */
@Component
public class RoundHeaderParser {

    private static final Pattern ORDINAL_TAIL = Pattern.compile("\\s*\\(\\d+\\)\\s*$");
    private static final Pattern ORDINAL_LINE = Pattern.compile("\\(\\d+\\)");
    private static final Pattern ANY_PAREN = Pattern.compile("\\(([^()]*)\\)");
    private static final Pattern TRAILING_PAREN = Pattern.compile("\\(([^()]*)\\)\\s*$");
    private static final Pattern RANGE = Pattern.compile("^\\s*([-+]?[\\d.]+)\\s*(?:-|to|–)\\s*([-+]?[\\d.]+)\\s*(.*)$");
    private static final Pattern LT = Pattern.compile("^\\s*[<≤]=?\\s*([-+]?[\\d.]+)\\s*(.*)$");
    private static final Pattern GT = Pattern.compile("^\\s*[>≥]=?\\s*([-+]?[\\d.]+)\\s*(.*)$");
    private static final Pattern SINGLE = Pattern.compile("^\\s*[-+]?[\\d.]+\\s*(.*)$");
    /** A Maximo-style tag: alnum groups joined by dashes, containing at least one letter (so a numeric range isn't a tag). */
    private static final Pattern TAG_CONTENT = Pattern.compile("(?=.*[A-Za-z])[0-9A-Za-z]+(?:-[0-9A-Za-z]+)+");

    public ParsedHeader parse(String rawHeader) {
        ParsedHeader p = new ParsedHeader();
        if (rawHeader == null) return p;
        String raw = rawHeader.trim();
        p.sourceRaw = raw;
        p.questionKey = stripOrdinal(raw);

        List<String> lines = new ArrayList<>();
        for (String ln : raw.split("\\r?\\n")) {
            String t = ln.trim();
            if (t.isEmpty() || ORDINAL_LINE.matcher(t).matches()) continue;
            lines.add(t);
        }
        if (lines.isEmpty()) return p;

        if (lines.size() >= 2) {
            parseMultiLine(lines, p);
        } else {
            parseSingleLine(stripOrdinal(lines.get(0)), p);
        }

        p.suggestedType = classify(p);
        return p;
    }

    // ── legacy multi-line: category on line 0, prompt on the rest ──
    private void parseMultiLine(List<String> lines, ParsedHeader p) {
        String categoryLine = lines.get(0);
        String promptLine = stripOrdinal(String.join(" ", lines.subList(1, lines.size())));

        Matcher m = TRAILING_PAREN.matcher(categoryLine);
        if (m.find()) {
            p.tagCode = m.group(1).trim();
            p.category = categoryLine.substring(0, m.start()).trim();
        } else {
            p.category = categoryLine;
        }
        peelRangeAndSetPrompt(promptLine, p);
    }

    // ── real single-line format ──
    private void parseSingleLine(String s, ParsedHeader p) {
        s = s.trim();
        // 1. peel a trailing range/limit paren (e.g. "(65-85 F)", "(<10)"), leaving the body
        String body = s;
        Matcher tp = TRAILING_PAREN.matcher(s);
        if (tp.find()) {
            String inner = tp.group(1).trim();
            if (isRangeSpec(inner)) {
                applyRange(inner, p);
                body = s.substring(0, tp.start()).trim();
            }
        }
        // 2. split category/tag from prompt at a tag paren if present
        Matcher any = ANY_PAREN.matcher(body);
        int tagStart = -1, tagEnd = -1;
        String tag = null;
        while (any.find()) {
            String c = any.group(1).trim();
            if (TAG_CONTENT.matcher(c).matches()) { tag = c; tagStart = any.start(); tagEnd = any.end(); break; }
        }
        if (tag != null) {
            p.tagCode = tag;
            String cat = body.substring(0, tagStart).trim();
            p.category = cat.isEmpty() ? null : cat;
            String prompt = body.substring(tagEnd).trim();
            p.prompt = prompt.isEmpty() ? (p.category != null ? p.category : body) : prompt;
            return;
        }
        // 3. no tag: leading ALL-CAPS tokens = category, the rest = prompt
        String[] toks = body.split("\\s+");
        int i = 0;
        StringBuilder cat = new StringBuilder();
        while (i < toks.length && isUpperToken(toks[i])) { cat.append(toks[i]).append(' '); i++; }
        if (i == 0 || i >= toks.length) {
            p.prompt = body; // no leading caps, or the whole thing is caps → treat as prompt
        } else {
            p.category = cat.toString().trim();
            p.prompt = String.join(" ", java.util.Arrays.copyOfRange(toks, i, toks.length));
        }
    }

    /** A token that carries the category: has letters/digits but no lowercase (e.g. "AMMONIA", "1A", "2C/ECA"). */
    private boolean isUpperToken(String t) {
        if (t == null || t.isEmpty()) return false;
        boolean hasAlnum = false;
        for (int i = 0; i < t.length(); i++) {
            char c = t.charAt(i);
            if (Character.isLowerCase(c)) return false;
            if (Character.isLetterOrDigit(c)) hasAlnum = true;
        }
        return hasAlnum;
    }

    private void peelRangeAndSetPrompt(String promptLine, ParsedHeader p) {
        Matcher pm = TRAILING_PAREN.matcher(promptLine);
        if (pm.find()) {
            p.prompt = promptLine.substring(0, pm.start()).trim();
            applyRange(pm.group(1).trim(), p);
        } else {
            p.prompt = promptLine;
        }
    }

    /** Does the paren content read as a numeric range/limit (vs. a tag or free text)? */
    private boolean isRangeSpec(String inner) {
        return RANGE.matcher(inner).matches() || LT.matcher(inner).matches() || GT.matcher(inner).matches();
    }

    private void applyRange(String spec, ParsedHeader p) {
        Matcher r;
        if ((r = RANGE.matcher(spec)).matches()) {
            p.lowLimit = num(r.group(1));
            p.highLimit = num(r.group(2));
            p.unit = unit(r.group(3));
        } else if ((r = LT.matcher(spec)).matches()) {
            p.highLimit = num(r.group(1));
            p.unit = unit(r.group(2));
        } else if ((r = GT.matcher(spec)).matches()) {
            p.lowLimit = num(r.group(1));
            p.unit = unit(r.group(2));
        } else if ((r = SINGLE.matcher(spec)).matches()) {
            p.unit = unit(r.group(1)); // a bare number (a target, not a range) — keep only its unit
        } else {
            p.unit = unit(spec);
        }
    }

    private RoundAnswerType classify(ParsedHeader p) {
        if (p.lowLimit != null || p.highLimit != null || (p.unit != null && !p.unit.isBlank())) return RoundAnswerType.READING;
        String prompt = p.prompt == null ? "" : p.prompt.toLowerCase();
        if (prompt.contains("which shift") || prompt.equals("shift")) return RoundAnswerType.SELECTOR;
        if (prompt.endsWith("?")) return RoundAnswerType.PASS_FAIL;
        return RoundAnswerType.TEXT;
    }

    private String stripOrdinal(String s) {
        return s == null ? null : ORDINAL_TAIL.matcher(s).replaceAll("").trim();
    }

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
    public static class ParsedHeader {
        private String questionKey;
        private String sourceRaw;
        private String category;
        private String tagCode;
        private String prompt;
        private Double lowLimit;
        private Double highLimit;
        private String unit;
        private RoundAnswerType suggestedType = RoundAnswerType.TEXT;
    }
}
