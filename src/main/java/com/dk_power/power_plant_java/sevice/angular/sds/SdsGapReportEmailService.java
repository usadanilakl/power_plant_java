package com.dk_power.power_plant_java.sevice.angular.sds;

import com.dk_power.power_plant_java.dto.email.EmailAttachment;
import com.dk_power.power_plant_java.dto.email.EmailRequest;
import com.dk_power.power_plant_java.dto.sds.SdsGapReportDto;
import com.dk_power.power_plant_java.dto.sds.SdsGapReportEmailResultDto;
import com.dk_power.power_plant_java.dto.sds.SdsImportItemDto;
import com.dk_power.power_plant_java.entities.permits.PermitAttachment;
import com.dk_power.power_plant_java.mappers.sds.SdsChemicalMapper;
import com.dk_power.power_plant_java.repository.permits.PermitAttachmentRepo;
import com.dk_power.power_plant_java.sevice.email.EmailFacadeService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

/**
 * Builds and sends the SDS gap report email. The body is a self-contained HTML summary of all
 * three gap categories; every missing-from-eBinder chemical's local PDFs are attached so the
 * recipient can upload them to the eBinder.
 * <p>
 * Total attachment size is capped at 20 MB (well under typical email provider limits). Files
 * skipped because the cap was hit are listed in the result so the operator can rerun for the
 * remainder. We don't auto-split into multiple emails — it's better that the operator sees the
 * cap and chooses how to handle it.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class SdsGapReportEmailService {

    /** Total decoded-bytes ceiling for the attachment set. Hard cap; survivors are reported. */
    private static final long MAX_ATTACHMENT_BYTES = 20L * 1024 * 1024;

    private final SdsSeedService seedService;
    private final PermitAttachmentRepo attachmentRepo;
    private final EmailFacadeService emailFacadeService;

    public SdsGapReportEmailResultDto emailGapReport(String to, String cc, List<SdsImportItemDto> scrapedCatalog) {
        SdsGapReportEmailResultDto result = new SdsGapReportEmailResultDto();
        result.setTo(to);
        result.setCc(cc);

        if (to == null || to.isBlank()) {
            result.setSent(false);
            result.setMessage("Recipient email is required");
            return result;
        }

        SdsGapReportDto report = seedService.gapReport(scrapedCatalog);
        result.setMissingFromDbCount(report.getMissingFromDb().size());
        result.setMissingPdfCount(report.getMissingPdf().size());
        result.setMissingFromEbinderCount(report.getMissingFromEbinder().size());

        // Pull attachments for missing-from-eBinder rows up to the size cap.
        List<EmailAttachment> attachments = new ArrayList<>();
        long runningBytes = 0;
        for (SdsGapReportDto.Gap gap : report.getMissingFromEbinder()) {
            if (gap.getId() == null) continue;   // shouldn't happen — missing-from-eBinder always has a DB id
            List<PermitAttachment> atts = attachmentRepo.findByEntityTypeAndEntityId(
                    SdsChemicalMapper.ENTITY_TYPE, gap.getId());
            for (PermitAttachment att : atts) {
                String b64 = att.getBase64Content();
                if (b64 == null || b64.isBlank()) continue;
                long size = approximateDecodedSize(b64);
                if (runningBytes + size > MAX_ATTACHMENT_BYTES) {
                    result.setAttachmentsSkipped(result.getAttachmentsSkipped() + 1);
                    result.getSkippedReasons().add(String.format(
                            "%s — %s (would exceed %d MB cap)",
                            displayName(gap), att.getFileName(), MAX_ATTACHMENT_BYTES / (1024 * 1024)));
                    continue;
                }
                attachments.add(EmailAttachment.builder()
                        .fileName(safeFileName(gap, att.getFileName()))
                        .contentType(att.getContentType() != null ? att.getContentType() : "application/pdf")
                        .base64Content(b64)
                        .build());
                runningBytes += size;
            }
        }
        result.setAttachmentsSent(attachments.size());
        result.setTotalAttachmentBytes(runningBytes);

        String subject = "SDS Gap Report — " + LocalDate.now();
        String body = buildHtmlBody(report, result);

        try {
            emailFacadeService.sendEmail(EmailRequest.builder()
                    .to(to)
                    .cc((cc != null && !cc.isBlank()) ? cc : null)
                    .subject(subject)
                    .body(body)
                    .attachments(attachments)
                    .build());
            result.setSent(true);
            result.setMessage(String.format("Sent to %s — %d missing-from-eBinder PDF(s) attached",
                    to, attachments.size()));
        } catch (Exception e) {
            result.setSent(false);
            result.setMessage("Send failed: " + e.getMessage());
            log.warn("[SDS] gap report email failed: {}", e.getMessage(), e);
        }
        return result;
    }

    /** Prefix the attachment filename with the chemical's primary name so the recipient can pair
     *  PDF ↔ chemical without opening every file. */
    private String safeFileName(SdsGapReportDto.Gap gap, String original) {
        String name = (gap.getName() != null ? gap.getName() : "chemical").replaceAll("[\\\\/:*?\"<>|]", "_").trim();
        if (original == null || original.isBlank()) return name + ".pdf";
        if (original.toLowerCase().startsWith(name.toLowerCase())) return original;   // already labelled
        return name + " — " + original;
    }

    private String displayName(SdsGapReportDto.Gap gap) {
        StringBuilder sb = new StringBuilder(gap.getName() != null ? gap.getName() : "(unnamed)");
        if (gap.getBookNumber() != null && gap.getSectionNumber() != null) {
            sb.append(" [Book ").append(gap.getBookNumber()).append(" / Sec ").append(gap.getSectionNumber()).append("]");
        }
        if (gap.getSourceId() != null && !gap.getSourceId().isBlank()) {
            sb.append(" (id ").append(gap.getSourceId()).append(")");
        }
        return sb.toString();
    }

    /** Base64 length × 0.75 is the standard size estimate without doing a full decode. */
    private static long approximateDecodedSize(String base64) {
        int padding = 0;
        int len = base64.length();
        if (len > 0 && base64.charAt(len - 1) == '=') padding++;
        if (len > 1 && base64.charAt(len - 2) == '=') padding++;
        return (long) ((len * 0.75) - padding);
    }

    private String buildHtmlBody(SdsGapReportDto report, SdsGapReportEmailResultDto result) {
        StringBuilder sb = new StringBuilder();
        sb.append("<html><body style='font-family:Segoe UI,Arial,sans-serif;color:#222;'>");
        sb.append("<h2 style='color:#8D6E63;margin:0 0 8px;'>SDS Gap Report</h2>");
        sb.append("<p style='margin:0 0 16px;color:#555;font-size:13px;'>Generated ")
          .append(LocalDate.now())
          .append(" — eBinder catalog: ").append(report.getCatalogCount())
          .append(" chemicals; local active: ").append(report.getActiveCount()).append(".</p>");

        sb.append("<h3 style='margin:16px 0 4px;'>Missing on eBinder (PDFs attached) — ")
          .append(report.getMissingFromEbinder().size()).append("</h3>");
        sb.append("<p style='margin:0 0 8px;color:#555;font-size:13px;'>These chemicals exist in the local inventory ")
          .append("but have no matching record in the live eBinder. The attached PDFs are theirs — please upload each ")
          .append("to the eBinder.</p>");
        appendTable(sb, report.getMissingFromEbinder());

        sb.append("<h3 style='margin:16px 0 4px;'>Missing in the App — ").append(report.getMissingFromDb().size()).append("</h3>");
        sb.append("<p style='margin:0 0 8px;color:#555;font-size:13px;'>These chemicals are on the eBinder but not yet in the local app. The 'Close gaps' scrape can pull them.</p>");
        appendTable(sb, report.getMissingFromDb());

        sb.append("<h3 style='margin:16px 0 4px;'>Missing PDFs — ").append(report.getMissingPdf().size()).append("</h3>");
        sb.append("<p style='margin:0 0 8px;color:#555;font-size:13px;'>Chemicals in the app whose SDS PDF hasn't been attached locally yet.</p>");
        appendTable(sb, report.getMissingPdf());

        sb.append("<hr style='margin:16px 0;border:none;border-top:1px solid #ddd;'>");
        sb.append("<p style='margin:0;color:#555;font-size:13px;'>Attachments included: ")
          .append(result.getAttachmentsSent()).append(" — total ")
          .append(String.format("%.1f", result.getTotalAttachmentBytes() / (1024.0 * 1024.0))).append(" MB.");
        if (result.getAttachmentsSkipped() > 0) {
            sb.append(" <b>").append(result.getAttachmentsSkipped()).append(" attachment(s) skipped</b> (size cap):");
            sb.append("<ul style='margin:4px 0 0 16px;'>");
            for (String reason : result.getSkippedReasons()) sb.append("<li>").append(escape(reason)).append("</li>");
            sb.append("</ul>");
        }
        sb.append("</p></body></html>");
        return sb.toString();
    }

    private void appendTable(StringBuilder sb, List<SdsGapReportDto.Gap> gaps) {
        if (gaps.isEmpty()) {
            sb.append("<p style='margin:0;color:#888;font-style:italic;'>None.</p>");
            return;
        }
        sb.append("<table cellpadding='6' cellspacing='0' style='border-collapse:collapse;font-size:13px;width:100%;'>");
        sb.append("<thead><tr style='background:#f5f5f5;'><th style='text-align:left;border-bottom:1px solid #ccc;'>Chemical</th>")
          .append("<th style='text-align:left;border-bottom:1px solid #ccc;'>Book / Section</th>")
          .append("<th style='text-align:left;border-bottom:1px solid #ccc;'>Source ID</th></tr></thead><tbody>");
        for (SdsGapReportDto.Gap g : gaps) {
            sb.append("<tr style='border-bottom:1px solid #eee;'>");
            sb.append("<td>").append(escape(g.getName())).append("</td>");
            sb.append("<td>");
            if (g.getBookNumber() != null && g.getSectionNumber() != null) {
                sb.append(g.getBookNumber()).append(" / ").append(g.getSectionNumber());
            } else {
                sb.append("—");
            }
            sb.append("</td>");
            sb.append("<td>").append(escape(g.getSourceId() != null ? g.getSourceId() : "—")).append("</td>");
            sb.append("</tr>");
        }
        sb.append("</tbody></table>");
    }

    private static String escape(String s) {
        if (s == null) return "";
        return s.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")
                .replace("\"", "&quot;").replace("'", "&#39;");
    }
}
