package com.dk_power.power_plant_java.sevice.maximo;

import lombok.extern.slf4j.Slf4j;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.PDPage;
import org.apache.pdfbox.pdmodel.PDPageContentStream;
import org.apache.pdfbox.pdmodel.common.PDRectangle;
import org.apache.pdfbox.pdmodel.font.PDType1Font;
import org.apache.pdfbox.pdmodel.graphics.image.PDImageXObject;
import org.apache.pdfbox.pdmodel.graphics.state.PDExtendedGraphicsState;
import org.apache.pdfbox.util.Matrix;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;

/**
 * Renders a completed task form to a tidy PDF (PDFBox) — the electronic replacement for the scanned paper.
 * Header (form name, WO, who/when) + each field's label/value grouped by section, with a signature line.
 * Simple top-down layout with word-wrap and automatic page breaks.
 */
@Slf4j
@Service
public class MaximoFormPdfService {

    private static final float MARGIN = 50f;
    private static final float LEADING = 15f;
    private static final float TITLE_SIZE = 16f;
    private static final float HEAD_SIZE = 12f;
    private static final float BODY_SIZE = 11f;

    /**
     * @param formName    display title
     * @param wonum       work order number
     * @param submittedBy who completed it
     * @param fields      the template field defs (each a map: name/label/type/unit/section/...)
     * @param values      fieldName → entered value
     */
    public byte[] render(String formName, String wonum, String submittedBy,
                         List<Map<String, Object>> fields, Map<String, Object> values,
                         byte[] signaturePng) {
        try (PDDocument doc = new PDDocument(); ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Cursor c = new Cursor(doc);
            byte[] logo = logoBytes();
            if (logo != null) {
                try { c.image(logo, 190f, 44f); c.gap(6); }
                catch (Exception ignore) { /* logo is decorative - never block the PDF */ }
            }
            c.line(nz(formName, "Task Form"), PDType1Font.HELVETICA_BOLD, TITLE_SIZE);
            c.gap(4);
            c.line("Work order: " + nz(wonum, "—"), PDType1Font.HELVETICA, BODY_SIZE);
            c.line("Completed by: " + nz(submittedBy, "—") + "     Date: " + LocalDate.now(),
                    PDType1Font.HELVETICA, BODY_SIZE);
            c.gap(10);

            String currentSection = null;
            if (fields != null) {
                for (Map<String, Object> f : fields) {
                    // Reference photos aren't data — skip them first so an image-only section
                    // (e.g. the indicator reference) never leaves an orphaned header behind.
                    if ("image".equalsIgnoreCase(str(f, "type"))) continue;
                    String section = str(f, "section");
                    if (section != null && !section.isBlank() && !section.equals(currentSection)) {
                        currentSection = section;
                        c.gap(6);
                        c.line(section, PDType1Font.HELVETICA_BOLD, HEAD_SIZE);
                    }
                    String label = nz(str(f, "label"), str(f, "name"));
                    String unit = str(f, "unit");
                    Object v = values == null ? null : values.get(str(f, "name"));
                    String value = formatValue(v);
                    if (unit != null && !unit.isBlank() && value != null && !value.isBlank()) value = value + " " + unit;
                    c.wrapped(label + ":  " + nz(value, "—"), PDType1Font.HELVETICA, BODY_SIZE);
                }
            }

            c.gap(24);
            boolean signed = false;
            if (signaturePng != null && signaturePng.length > 0) {
                try { c.image(signaturePng, 180f, 45f); signed = true; }
                catch (Exception imgEx) { log.warn("[MaximoForms] signature image draw failed: {}", imgEx.getMessage()); }
            }
            c.line(signed
                            ? "Signed by: " + nz(submittedBy, "-") + "     Date: " + LocalDate.now()
                            : "Signature: ______________________________     Date: " + LocalDate.now(),
                    PDType1Font.HELVETICA, BODY_SIZE);
            c.close();

            // Tamper-evident overlay drawn into every page's content (not an editable annotation).
            stampWatermark(doc, "COMPLETED  " + LocalDate.now());

            doc.save(out);
            return out.toByteArray();
        } catch (Exception e) {
            log.warn("[MaximoForms] PDF render failed: {}", e.getMessage());
            throw new RuntimeException("Could not render the form PDF: " + e.getMessage(), e);
        }
    }

    /** A simple top-down text cursor with page breaks + word wrap. */
    private static final class Cursor {
        private final PDDocument doc;
        private PDPage page;
        private PDPageContentStream cs;
        private float y;
        private final float width;

        Cursor(PDDocument doc) throws Exception {
            this.doc = doc;
            this.page = new PDPage(PDRectangle.LETTER);
            doc.addPage(page);
            this.cs = new PDPageContentStream(doc, page);
            this.y = page.getMediaBox().getHeight() - MARGIN;
            this.width = page.getMediaBox().getWidth() - 2 * MARGIN;
        }

        void gap(float h) { y -= h; }

        void line(String text, PDType1Font font, float size) throws Exception {
            ensureRoom();
            cs.beginText();
            cs.setFont(font, size);
            cs.newLineAtOffset(MARGIN, y);
            cs.showText(sanitize(text));
            cs.endText();
            y -= LEADING;
        }

        /** Word-wrap a line to the page width. */
        void wrapped(String text, PDType1Font font, float size) throws Exception {
            String t = sanitize(text);
            StringBuilder cur = new StringBuilder();
            for (String word : t.split(" ")) {
                String trial = cur.length() == 0 ? word : cur + " " + word;
                float w = font.getStringWidth(trial) / 1000f * size;
                if (w > width && cur.length() > 0) {
                    line(cur.toString(), font, size);
                    cur = new StringBuilder(word);
                } else {
                    cur = new StringBuilder(trial);
                }
            }
            if (cur.length() > 0) line(cur.toString(), font, size);
        }

        private void ensureRoom() throws Exception {
            if (y > MARGIN) return;
            cs.close();
            page = new PDPage(PDRectangle.LETTER);
            doc.addPage(page);
            cs = new PDPageContentStream(doc, page);
            y = page.getMediaBox().getHeight() - MARGIN;
        }

        /** Draw a raster image at the left margin at the current y, scaled to fit maxW x maxH (aspect preserved). */
        void image(byte[] bytes, float maxW, float maxH) throws Exception {
            PDImageXObject img = PDImageXObject.createFromByteArray(doc, bytes, "img");
            float iw = img.getWidth(), ih = img.getHeight();
            float scale = Math.min(maxW / iw, maxH / ih);
            if (!(scale > 0) || Float.isInfinite(scale)) scale = 1f;
            float w = iw * scale, h = ih * scale;
            if (y - h <= MARGIN) {   // not enough room - start a fresh page first
                cs.close();
                page = new PDPage(PDRectangle.LETTER);
                doc.addPage(page);
                cs = new PDPageContentStream(doc, page);
                y = page.getMediaBox().getHeight() - MARGIN;
            }
            cs.drawImage(img, MARGIN, y - h, w, h);
            y -= (h + 4);
        }

        void close() throws Exception { cs.close(); }
    }

    // Company logo, loaded once from the classpath (null when absent). Decorative — never fatal.
    private static volatile byte[] LOGO_CACHE;
    private static volatile boolean LOGO_LOADED;

    private static byte[] logoBytes() {
        if (LOGO_LOADED) return LOGO_CACHE;
        synchronized (MaximoFormPdfService.class) {
            if (!LOGO_LOADED) {
                try (var in = MaximoFormPdfService.class.getResourceAsStream("/maximo/jackson-logo.png")) {
                    LOGO_CACHE = (in == null) ? null : in.readAllBytes();
                } catch (Exception e) {
                    LOGO_CACHE = null;
                }
                LOGO_LOADED = true;
            }
            return LOGO_CACHE;
        }
    }

    /**
     * Overlay a large, faint, rotated "COMPLETED <date>" watermark on every page. It is drawn into each
     * page's content stream (not an editable form field/annotation), so casual editing won't remove it.
     * The authoritative copy is the one attached in Maximo (the system of record).
     */
    private void stampWatermark(PDDocument doc, String text) {
        try {
            PDType1Font font = PDType1Font.HELVETICA_BOLD;
            float size = 60f;
            String t = sanitize(text);
            float tw = font.getStringWidth(t) / 1000f * size;
            PDExtendedGraphicsState gs = new PDExtendedGraphicsState();
            gs.setNonStrokingAlphaConstant(0.12f);
            double ang = Math.toRadians(45);
            for (PDPage page : doc.getPages()) {
                PDRectangle box = page.getMediaBox();
                float cx = box.getWidth() / 2f, cy = box.getHeight() / 2f;
                float startX = (float) (cx - (tw / 2.0) * Math.cos(ang));
                float startY = (float) (cy - (tw / 2.0) * Math.sin(ang));
                try (PDPageContentStream cs = new PDPageContentStream(
                        doc, page, PDPageContentStream.AppendMode.APPEND, true, true)) {
                    cs.setGraphicsStateParameters(gs);
                    cs.setNonStrokingColor(new java.awt.Color(90, 90, 90));
                    cs.beginText();
                    cs.setFont(font, size);
                    cs.setTextMatrix(Matrix.getRotateInstance(ang, startX, startY));
                    cs.showText(t);
                    cs.endText();
                }
            }
        } catch (Exception e) {
            log.warn("[MaximoForms] watermark stamp failed (non-fatal): {}", e.getMessage());
        }
    }

    /** PDFBox's standard fonts can't render some Unicode; transliterate common glyphs, drop the rest. */
    private static String sanitize(String s) {
        if (s == null) return "";
        String t = s.replaceAll("[\\r\\n\\t]", " ")
                .replace("—", "-")    // em dash
                .replace("–", "-")    // en dash
                .replace("‘", "'")    // left single quote
                .replace("’", "'")    // right single quote / apostrophe
                .replace("“", "\"")   // left double quote
                .replace("”", "\"")   // right double quote
                .replace("…", "...")  // ellipsis
                .replace("→", "->")   // right arrow
                .replace("•", "*")    // bullet
                .replace(" ", " ");   // non-breaking space
        // Drop anything else the standard WinAnsi fonts can't render (no visible '?').
        return t.replaceAll("[^\\x20-\\x7E]", "");
    }

    private static String formatValue(Object v) {
        if (v == null) return "";
        if (v instanceof Boolean b) return b ? "Yes" : "No";
        if (v instanceof List<?> list) {
            StringBuilder sb = new StringBuilder();
            for (Object o : list) { if (sb.length() > 0) sb.append(", "); sb.append(o); }
            return sb.toString();
        }
        return String.valueOf(v);
    }

    private static String str(Map<String, Object> m, String k) {
        Object o = m == null ? null : m.get(k);
        return o == null ? null : String.valueOf(o);
    }
    private static String nz(String s, String dflt) { return (s == null || s.isBlank()) ? dflt : s; }
}
