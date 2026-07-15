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
 * <b>Sending strategy.</b> Uses Microsoft Graph's upload-session flow
 * ({@link com.dk_power.power_plant_java.sevice.email.ApiEmailService#sendEmailWithLargeAttachments})
 * so each email can carry up to {@link #MAX_TOTAL_MESSAGE_BYTES} of attachments (vastly more than
 * the ~4 MB {@code sendMail} cap). If the total attachment size exceeds that per-email cap,
 * attachments are split into a minimum number of "Part N of M" emails — a batch of 90 MB of
 * PDFs becomes ~5 emails rather than the ~100 we'd have needed under the sendMail cap.
 * <p>
 * The per-email cap exists because Exchange Online's mailbox message-size limit is a
 * tenant-level policy (typical default 25-50 MB); we can't discover it in advance, so we default
 * to a conservative value that works on the common configurations. If your tenant allows more,
 * override via the {@code sds.gap-report.email.max-message-mb} property.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class SdsGapReportEmailService {

    /**
     * Individual-attachment ceiling. Well above realistic SDS PDF sizes (typical is a few MB) and
     * safely under Microsoft Graph's per-attachment upload-session cap (~150 MB). If a PDF ever
     * hits this it's almost certainly corrupted or an unrelated file — skip and report.
     */
    private static final long MAX_SINGLE_ATTACHMENT_BYTES = 100L * 1024 * 1024;

    /**
     * Per-email combined-attachment ceiling. Exchange Online's default mailbox message-size limit
     * is 25 MB for many tenants; some are raised to 50 MB or 150 MB. 20 MB of raw PDF bytes,
     * after MIME/base64 encoding by Exchange, lands around 27 MB — comfortably under most
     * tenants' policy, and if yours is stricter you can lower it. If yours is more generous,
     * raise it via the property override.
     */
    @org.springframework.beans.factory.annotation.Value("${sds.gap-report.email.max-message-mb:20}")
    private int maxMessageMb;

    /** Convenience accessor — returns the configured cap in raw bytes. */
    private long maxTotalMessageBytes() { return maxMessageMb * 1024L * 1024L; }


    private final SdsSeedService seedService;
    private final PermitAttachmentRepo attachmentRepo;
    private final EmailFacadeService emailFacadeService;

    /** One PDF attachment paired with the chemical that owns it — used to track per-chunk content for the body. */
    private record AttachmentWithGap(SdsGapReportDto.Gap gap, EmailAttachment att, long size) {}

    public SdsGapReportEmailResultDto emailGapReport(String to, String cc,
                                                     List<SdsImportItemDto> scrapedCatalog,
                                                     boolean includeAttachments) {
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

        // Collect every PDF into a single flat list — no chunking. The upload-session flow on
        // ApiEmailService streams each attachment to a Graph pre-signed URL independently, so
        // combined attachment size is no longer bounded by the ~4 MB sendMail request cap.
        List<AttachmentWithGap> all = new ArrayList<>();
        if (includeAttachments) {
            for (SdsGapReportDto.Gap gap : report.getMissingFromEbinder()) {
                if (gap.getId() == null) continue;   // missing-from-eBinder always has a DB id
                // Skip tombstones — base64=null and receiver has no way to interpret them.
                List<PermitAttachment> atts = attachmentRepo.findByEntityTypeAndEntityIdAndDeletedFalse(
                        SdsChemicalMapper.ENTITY_TYPE, gap.getId());
                for (PermitAttachment att : atts) {
                    String b64 = att.getBase64Content();
                    if (b64 == null || b64.isBlank()) continue;
                    long size = approximateDecodedSize(b64);
                    if (size > MAX_SINGLE_ATTACHMENT_BYTES) {
                        // Realistically unreachable — no legitimate SDS PDF is 100 MB. Skip and
                        // surface so the operator can investigate that specific chemical.
                        result.setAttachmentsSkipped(result.getAttachmentsSkipped() + 1);
                        result.getSkippedReasons().add(String.format(
                                "%s — %s (single file %.1f MB exceeds %d MB per-attachment cap)",
                                displayName(gap), att.getFileName(),
                                size / (1024.0 * 1024.0), MAX_SINGLE_ATTACHMENT_BYTES / (1024 * 1024)));
                        continue;
                    }
                    EmailAttachment ea = EmailAttachment.builder()
                            .fileName(safeFileName(gap, att.getFileName()))
                            .contentType(att.getContentType() != null ? att.getContentType() : "application/pdf")
                            .base64Content(b64)
                            .build();
                    all.add(new AttachmentWithGap(gap, ea, size));
                }
            }
        }

        // First-fit pack into chunks whose total raw bytes stay under the tenant's mailbox
        // message-size policy. Each chunk becomes one outbound email; the recipient sees
        // "Part N of M" in the subject when there's more than one.
        List<List<AttachmentWithGap>> chunks = new ArrayList<>();
        List<AttachmentWithGap> current = new ArrayList<>();
        long currentBytes = 0;
        long capBytes = maxTotalMessageBytes();
        for (AttachmentWithGap a : all) {
            if (currentBytes + a.size() > capBytes && !current.isEmpty()) {
                chunks.add(current);
                current = new ArrayList<>();
                currentBytes = 0;
            }
            current.add(a);
            currentBytes += a.size();
        }
        if (!current.isEmpty()) chunks.add(current);
        if (chunks.isEmpty()) chunks.add(List.of());   // report-only path — still send one email

        int totalParts = chunks.size();
        long totalBytesAll = all.stream().mapToLong(AttachmentWithGap::size).sum();
        String baseSubject = "SDS Gap Report — " + LocalDate.now();
        int sentParts = 0;
        int sentAttachments = 0;
        long sentBytes = 0;
        List<String> failures = new ArrayList<>();

        for (int i = 0; i < totalParts; i++) {
            int partNum = i + 1;
            List<AttachmentWithGap> chunk = chunks.get(i);
            long chunkBytes = chunk.stream().mapToLong(AttachmentWithGap::size).sum();
            List<EmailAttachment> chunkAtts = chunk.stream().map(AttachmentWithGap::att).toList();
            String subject = totalParts > 1
                    ? baseSubject + " (Part " + partNum + " of " + totalParts + ")"
                    : baseSubject;
            String body = buildHtmlBody(report, chunk, chunkBytes, partNum, totalParts, result);

            EmailRequest req = EmailRequest.builder()
                    .to(to)
                    .cc((cc != null && !cc.isBlank()) ? cc : null)
                    .subject(subject)
                    .body(body)
                    .attachments(chunkAtts)
                    .html(true)
                    .build();

            try {
                if (chunkAtts.isEmpty()) {
                    // Report-only: sendMail is cheaper than the upload-session dance.
                    emailFacadeService.sendEmail(req);
                } else {
                    emailFacadeService.sendEmailLarge(req);
                }
                sentParts++;
                sentAttachments += chunkAtts.size();
                sentBytes += chunkBytes;
            } catch (Exception e) {
                failures.add("Part " + partNum + " of " + totalParts + ": " + e.getMessage());
                log.warn("[SDS] gap report part {}/{} failed ({} atts, {} MB): {}",
                        partNum, totalParts, chunkAtts.size(), chunkBytes / (1024.0 * 1024.0),
                        e.getMessage(), e);
            }
        }

        result.setAttachmentsSent(sentAttachments);
        result.setTotalAttachmentBytes(sentBytes);
        result.setPartsSent(sentParts);

        if (sentParts == totalParts) {
            result.setSent(true);
            if (!includeAttachments) {
                result.setMessage(String.format("Sent to %s — report only (no attachments)", to));
            } else if (totalParts == 1) {
                result.setMessage(String.format("Sent to %s — %d PDF(s) attached (%.1f MB total)",
                        to, sentAttachments, sentBytes / (1024.0 * 1024.0)));
            } else {
                result.setMessage(String.format("Sent to %s in %d parts — %d PDF(s), %.1f MB total (per-email cap %d MB)",
                        to, sentParts, sentAttachments, sentBytes / (1024.0 * 1024.0), maxMessageMb));
            }
        } else if (sentParts > 0) {
            result.setSent(true);   // partial delivery — some parts arrived, others didn't
            result.setMessage(String.format("Sent %d of %d parts to %s — %d PDF(s) delivered. Failures: %s",
                    sentParts, totalParts, to, sentAttachments, String.join("; ", failures)));
        } else {
            result.setSent(false);
            result.setMessage("All parts failed: " + String.join("; ", failures));
            log.warn("[SDS] gap report — every part failed (attempted {} atts, {} MB total)",
                    all.size(), totalBytesAll / (1024.0 * 1024.0));
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

    private String buildHtmlBody(SdsGapReportDto report, List<AttachmentWithGap> attachments,
                                 long chunkBytes, int partNum, int totalParts,
                                 SdsGapReportEmailResultDto result) {
        StringBuilder sb = new StringBuilder();
        sb.append("<html><body style='font-family:Segoe UI,Arial,sans-serif;color:#222;'>");
        sb.append("<h2 style='color:#8D6E63;margin:0 0 8px;'>SDS Gap Report");
        if (totalParts > 1) sb.append(" — Part ").append(partNum).append(" of ").append(totalParts);
        sb.append("</h2>");
        sb.append("<p style='margin:0 0 16px;color:#555;font-size:13px;'>Generated ")
          .append(LocalDate.now())
          .append(" — eBinder catalog: ").append(report.getCatalogCount())
          .append(" chemicals; local active: ").append(report.getActiveCount()).append(".</p>");

        if (totalParts > 1) {
            sb.append("<p style='margin:0 0 12px;padding:8px 12px;background:#fff8e1;border-left:4px solid #f9a825;font-size:13px;'>")
              .append("This is part ").append(partNum).append(" of ").append(totalParts)
              .append(". Attachments were split across multiple emails to stay under the mail server's ")
              .append("message-size policy — this part carries ").append(attachments.size())
              .append(" PDF(s) (").append(String.format("%.1f", chunkBytes / (1024.0 * 1024.0))).append(" MB).")
              .append("</p>");
        }

        sb.append("<h3 style='margin:16px 0 4px;'>Missing on eBinder (PDFs attached across all parts) — ")
          .append(report.getMissingFromEbinder().size()).append("</h3>");
        sb.append("<p style='margin:0 0 8px;color:#555;font-size:13px;'>These chemicals exist in the local inventory ")
          .append("but have no matching record in the live eBinder. The attached PDFs are theirs — please upload each ")
          .append("to the eBinder.</p>");
        appendTable(sb, report.getMissingFromEbinder());

        if (!attachments.isEmpty()) {
            sb.append("<h4 style='margin:12px 0 4px;'>PDFs attached to this ")
              .append(totalParts > 1 ? "part" : "email")
              .append(" (").append(attachments.size()).append(")</h4>");
            sb.append("<ul style='margin:0 0 12px 18px;font-size:13px;color:#444;'>");
            for (AttachmentWithGap a : attachments) {
                sb.append("<li>").append(escape(displayName(a.gap())))
                  .append(" — <span style='font-family:monospace;color:#666;'>").append(escape(a.att().getFileName())).append("</span>")
                  .append("</li>");
            }
            sb.append("</ul>");
        }

        sb.append("<h3 style='margin:16px 0 4px;'>Missing in the App — ").append(report.getMissingFromDb().size()).append("</h3>");
        sb.append("<p style='margin:0 0 8px;color:#555;font-size:13px;'>These chemicals are on the eBinder but not yet in the local app. The 'Close gaps' scrape can pull them.</p>");
        appendTable(sb, report.getMissingFromDb());

        sb.append("<h3 style='margin:16px 0 4px;'>Missing PDFs — ").append(report.getMissingPdf().size()).append("</h3>");
        sb.append("<p style='margin:0 0 8px;color:#555;font-size:13px;'>Chemicals in the app whose SDS PDF hasn't been attached locally yet.</p>");
        appendTable(sb, report.getMissingPdf());

        sb.append("<hr style='margin:16px 0;border:none;border-top:1px solid #ddd;'>");
        sb.append("<p style='margin:0;color:#555;font-size:13px;'>Attachments in this email: ")
          .append(attachments.size()).append(" — ")
          .append(String.format("%.1f", chunkBytes / (1024.0 * 1024.0))).append(" MB.");
        if (result.getAttachmentsSkipped() > 0) {
            sb.append(" <b>").append(result.getAttachmentsSkipped()).append(" file(s) skipped (over per-attachment cap)</b>:");
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
