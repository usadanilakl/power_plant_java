package com.dk_power.power_plant_java.sevice.schedule;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Pure, dependency-free parser for a forwarded workforce-system time-off email — no Spring, no
 * persistence, so it is trivially unit-testable (sibling to {@link SchedulePatternMath}).
 *
 * <p><b>Tuned to WorkForce Software / WTA</b> (sender {@code naes.payroll@wfs.cloud}), whose
 * notification body is one regular sentence:
 * <pre>Employee &lt;Last, First M&gt; has submitted a time off request for MM/dd/yyyy to MM/dd/yyyy. &lt;url&gt;</pre>
 * The precise "Employee … has submitted … for … to …" pattern pulls the name + both dates in one
 * shot; the {@code ShowPage.do?id=N} link (even inside a Checkpoint {@code protect.checkpoint.com}
 * URL-defense wrapper) yields the external request id. Generic label / min-max heuristics remain as
 * a fallback for other formats.
 *
 * <p><b>Fail-safe by design.</b> Whatever can't be pulled with confidence is left {@code null}; the
 * intake service then routes the request to {@code PENDING_MANUAL_REVIEW} rather than guessing, so a
 * mis-parse never silently auto-approves the wrong person or dates.
 */
public final class PtoEmailParser {

    private PtoEmailParser() {}

    private static final int CI = Pattern.CASE_INSENSITIVE;

    /** {@code ShowPage.do?id=12345} — external workforce request id (primary dedup key). Hard contract. */
    private static final Pattern SOURCE_ID = Pattern.compile("ShowPage\\.do\\?id=(\\d+)", CI);

    /** WorkForce Software notification sentence: name + both dates in one match. */
    private static final Pattern EMPLOYEE_SENTENCE = Pattern.compile(
            "Employee\\s+(.+?)\\s+has\\s+submitted[^.]*?\\bfor\\s+"
                    + "(\\d{1,2}/\\d{1,2}/\\d{4})\\s+(?:to|through|thru|-|–|—)\\s+(\\d{1,2}/\\d{1,2}/\\d{4})", CI);

    /** Just the name portion of the notification sentence, if the date half didn't match. */
    private static final Pattern EMPLOYEE_NAME = Pattern.compile("Employee\\s+(.+?)\\s+has\\s+submitted", CI);

    /** A "for D1 to/through D2" range anywhere (safe: anchored on "for"). */
    private static final Pattern RANGE = Pattern.compile(
            "\\bfor\\s+(\\d{1,2}/\\d{1,2}/\\d{4})\\s+(?:to|through|thru|-|–|—)\\s+(\\d{1,2}/\\d{1,2}/\\d{4})", CI);

    /** Any {@code M/d/yyyy} / {@code MM/dd/yyyy} token. */
    private static final Pattern MDY = Pattern.compile("\\b(\\d{1,2}/\\d{1,2}/\\d{4})\\b");

    /** Labeled start date: "Start Date: 07/28/2025", "From: 7/1/2025", "Beginning 7/1/2025". */
    private static final Pattern START_LABEL =
            Pattern.compile("(?:start|from|begin(?:ning)?)\\s*(?:date)?\\s*[:\\-]?\\s*(\\d{1,2}/\\d{1,2}/\\d{4})", CI);
    /** Labeled end date: "End Date: 08/01/2025", "Through 8/1/2025", "Return 8/2/2025". */
    private static final Pattern END_LABEL =
            Pattern.compile("(?:end(?:ing)?|thru|through|return(?:ing)?)\\s*(?:date)?\\s*[:\\-]?\\s*(\\d{1,2}/\\d{1,2}/\\d{4})", CI);

    /** Labeled requester name: "Employee: John Smith", "Requested by: John Smith", "Name - John Smith". */
    private static final Pattern NAME_LABEL =
            Pattern.compile("(?:employee|requested\\s+by|requestor|requester|name)\\s*[:\\-]\\s*"
                    + "([A-Za-z][A-Za-z .,'\\-]{1,60})", CI);

    /** Subject "…Notification: Ziegler, Kody W" (WorkForce Software subject). */
    private static final Pattern SUBJECT_NOTIFICATION = Pattern.compile("notification\\s*:\\s*(.+?)\\s*$", CI);

    /** Subject-embedded name after "for" or a dash: "PTO Request for John Smith", "Time Off - John Smith". */
    private static final Pattern SUBJECT_NAME =
            Pattern.compile("(?:\\bfor\\b|[-–—])\\s*([A-Z][A-Za-z'\\-]+(?:\\s+[A-Z][A-Za-z.'\\-]+){1,2})");

    /** Reply/forward subject prefixes to strip before mining the subject for a name. */
    private static final Pattern REPLY_PREFIX = Pattern.compile("^\\s*(?:re|fw|fwd)\\s*:\\s*", CI);

    /** "Last, First [M[iddle]]" → captured last + first for reordering to matcher-friendly "First Last". */
    private static final Pattern LAST_FIRST = Pattern.compile(
            "^\\s*([A-Za-z][A-Za-z'\\-]+)\\s*,\\s*([A-Za-z][A-Za-z'\\-]+)(?:\\s+[A-Za-z][A-Za-z'.\\-]*)*\\s*$");

    /** Forward-header lines whose dates are chrome (mail metadata), never the PTO range. */
    private static final Pattern CHROME_LINE = Pattern.compile("^\\s*(?:sent|received|date|on)\\b.*", CI);

    private static final DateTimeFormatter US_DATE = DateTimeFormatter.ofPattern("M/d/yyyy");

    /**
     * Extracted fields from one time-off email. Any field may be {@code null} when not confidently found.
     * {@link #hasDates()} / {@link #hasName()} let the caller decide auto-approve vs manual review.
     */
    public record ParsedPto(String name, LocalDate startDate, LocalDate endDate, String sourceRequestId) {
        public boolean hasDates() { return startDate != null && endDate != null; }
        public boolean hasName() { return name != null && !name.isBlank(); }
        public boolean isEmpty() { return !hasName() && startDate == null && endDate == null && sourceRequestId == null; }
    }

    /**
     * Parse a subject + body (plain or HTML) into a {@link ParsedPto}. Never throws — unparseable
     * fields come back {@code null}.
     */
    public static ParsedPto parse(String subject, String rawBody) {
        String subj = subject == null ? "" : subject;
        String text = toPlainText(rawBody);

        // Source id must be mined from the RAW body: in HTML mail (and Checkpoint-wrapped links) the
        // ShowPage.do link lives in an <a href="..."> attribute, which tag-stripping would delete.
        String sourceId = firstGroup(SOURCE_ID, subj + "\n" + (rawBody == null ? "" : rawBody));

        LocalDate start = null, end = null;

        // Primary: the WorkForce Software "Employee … has submitted … for D1 to D2" sentence.
        Matcher es = EMPLOYEE_SENTENCE.matcher(text);
        if (es.find()) {
            start = parseDate(es.group(2));
            end = parseDate(es.group(3));
        }
        // Next: a "for D1 to/through D2" range anywhere.
        if (start == null || end == null) {
            Matcher rm = RANGE.matcher(text);
            if (rm.find()) {
                if (start == null) start = parseDate(rm.group(1));
                if (end == null) end = parseDate(rm.group(2));
            }
        }
        // Next: individually labeled bounds.
        if (start == null) start = parseDate(firstGroup(START_LABEL, text));
        if (end == null) end = parseDate(firstGroup(END_LABEL, text));
        // Fallback: min/max of the body's non-chrome dates for whichever bound is still missing.
        if (start == null || end == null) {
            List<LocalDate> dates = collectBodyDates(text);
            if (!dates.isEmpty()) {
                if (start == null) start = Collections.min(dates);
                if (end == null) end = Collections.max(dates);
            }
        }
        // A single-day request often prints one date; mirror the known bound onto the missing one.
        if (start != null && end == null) end = start;
        if (end != null && start == null) start = end;
        // Guard against inverted bounds from a label/heuristic mismatch.
        if (start != null && end != null && end.isBefore(start)) {
            LocalDate t = start; start = end; end = t;
        }

        return new ParsedPto(extractName(subj, text), start, end, sourceId);
    }

    // ---- name ---------------------------------------------------------------

    /** Pull the requester name from the body sentence, a label, or the subject; reorder "Last, First". */
    private static String extractName(String subject, String text) {
        String raw = firstGroup(EMPLOYEE_NAME, text);
        if (raw == null) raw = firstGroup(NAME_LABEL, text);
        if (raw == null) raw = firstGroup(SUBJECT_NOTIFICATION, subject);
        if (raw == null) raw = firstGroup(SUBJECT_NAME, REPLY_PREFIX.matcher(subject).replaceAll(""));
        return normalizeName(raw);
    }

    /** Reorder "Last, First M" → "First Last" (matcher-friendly); else tidy + cap at 3 words. */
    private static String normalizeName(String raw) {
        if (raw == null) return null;
        String s = raw.replaceAll("\\s+", " ").trim();
        if (s.isEmpty()) return null;

        Matcher lf = LAST_FIRST.matcher(s);
        if (lf.matches()) return lf.group(2) + " " + lf.group(1);   // First Last

        // Non-comma form: cut at stray punctuation, drop trailing initials, cap at 3 words.
        int cut = indexOfAny(s, new char[]{';', '|', '('});
        if (cut > 0) s = s.substring(0, cut).trim();
        if (s.isBlank()) return null;
        String[] words = s.split(" ");
        if (words.length > 3) s = String.join(" ", words[0], words[1], words[2]);
        return s.isBlank() ? null : s;
    }

    // ---- dates --------------------------------------------------------------

    /** Collect all {@code M/d/yyyy} dates from body lines that are not forward/reply header chrome. */
    private static List<LocalDate> collectBodyDates(String text) {
        List<LocalDate> out = new ArrayList<>();
        for (String line : text.split("\\r?\\n")) {
            if (CHROME_LINE.matcher(line).find()) continue;
            Matcher m = MDY.matcher(line);
            while (m.find()) {
                LocalDate d = parseDate(m.group(1));
                if (d != null) out.add(d);
            }
        }
        return out;
    }

    // ---- shared helpers -----------------------------------------------------

    private static String firstGroup(Pattern p, String s) {
        if (s == null) return null;
        Matcher m = p.matcher(s);
        return m.find() ? m.group(1) : null;
    }

    private static LocalDate parseDate(String mdy) {
        if (mdy == null) return null;
        try {
            return LocalDate.parse(mdy.trim(), US_DATE);
        } catch (Exception e) {
            return null;
        }
    }

    private static int indexOfAny(String s, char[] chars) {
        int best = -1;
        for (char c : chars) {
            int i = s.indexOf(c);
            if (i >= 0 && (best < 0 || i < best)) best = i;
        }
        return best;
    }

    /**
     * Reduce HTML to readable plain text (block tags → newlines, strip the rest, unescape common
     * entities). Plain-text bodies pass through essentially unchanged.
     */
    static String toPlainText(String body) {
        if (body == null || body.isBlank()) return "";
        String s = body;
        if (s.indexOf('<') >= 0) {
            s = s.replaceAll("(?i)<\\s*(br|/p|/div|/tr|/li|/h[1-6])\\s*/?>", "\n");
            s = s.replaceAll("(?is)<\\s*(script|style)[^>]*>.*?<\\s*/\\s*\\1\\s*>", " ");
            s = s.replaceAll("<[^>]+>", " ");
        }
        s = s.replace("&nbsp;", " ")
             .replace("&amp;", "&")
             .replace("&lt;", "<")
             .replace("&gt;", ">")
             .replace("&quot;", "\"")
             .replace("&#39;", "'")
             .replace("&apos;", "'");
        // Normalise runs of blank lines / trailing spaces without losing line structure.
        s = s.replaceAll("[ \\t]+", " ");
        s = s.replaceAll("(?m)[ \\t]+$", "");
        s = s.replaceAll("\\n{3,}", "\n\n");
        return s.trim();
    }
}
