package com.dk_power.power_plant_java.sevice.sync;

import com.dk_power.power_plant_java.config.SyncConfig;
import com.dk_power.power_plant_java.config.logging.LoggingContext;
import com.dk_power.power_plant_java.entities.permits.PermitAttachment;
import com.dk_power.power_plant_java.repository.permits.PermitAttachmentRepo;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.*;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class AttachmentSyncHandler {

    private final SyncConfig syncConfig;
    private final PermitAttachmentRepo attachmentRepo;
    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper = new ObjectMapper();

    /**
     * Upload unsynced local attachments to sync-server.
     */
    @Scheduled(fixedDelay = 60000, initialDelay = 30000)
    public void uploadPendingAttachments() {
        if (!syncConfig.isServerSyncEnabled()) return;

        long start = System.currentTimeMillis();
        try (LoggingContext.Scope ignored = LoggingContext.openJobScope("attachment.uploadPendingAttachments")) {
            LoggingContext.setMachineId(syncConfig.getMachineId());
            List<PermitAttachment> unsynced = attachmentRepo.findBySyncedToServerFalseOrSyncedToServerIsNull();
            if (unsynced.isEmpty()) return;

            String baseUrl = syncConfig.getSyncServerUrl();
            if (baseUrl == null || baseUrl.isEmpty()) return;

            int uploaded = 0;
            log.debug("[Attachment Sync] Uploading {} pending attachments to sync server", unsynced.size());

            for (PermitAttachment att : unsynced) {
                try {
                    Map<String, Object> body = new LinkedHashMap<>();
                    body.put("entityType", att.getEntityType());
                    body.put("entityId", att.getEntityId());
                    body.put("fileName", att.getFileName());
                    body.put("contentType", att.getContentType());
                    body.put("attachmentType", att.getAttachmentType());
                    body.put("base64Content", att.getBase64Content());
                    body.put("originMachineId", att.getOriginMachineId());
                    body.put("contentHash", att.getContentHash() != null
                        ? att.getContentHash()
                        : computeContentHash(att.getBase64Content()));
                    // Tombstone + provenance ride the same channel so a delete on one machine
                    // reaches every other. Origin lets receivers distinguish scraper-owned rows.
                    body.put("deleted", att.isDeleted());
                    body.put("origin", att.getOrigin());

                    HttpHeaders headers = createHeaders();
                    HttpEntity<String> entity = new HttpEntity<>(objectMapper.writeValueAsString(body), headers);

                    ResponseEntity<String> response = restTemplate.exchange(
                            baseUrl + "/api/attachments/upload",
                            HttpMethod.POST, entity, String.class);

                    if (response.getStatusCode().is2xxSuccessful()) {
                        att.setSyncedToServer(true);
                        attachmentRepo.save(att);
                        uploaded++;
                        log.debug("[Attachment Sync] Uploaded attachment: {} for {}#{}",
                                att.getFileName(), att.getEntityType(), att.getEntityId());
                    }
                } catch (Exception e) {
                    log.warn("[Attachment Sync] Failed to upload attachment {}: {}",
                            att.getFileName(), e.getMessage());
                }
            }
            log.info("attachment.upload.complete pending={} uploaded={} durationMs={}",
                unsynced.size(), uploaded, System.currentTimeMillis() - start);
        }
    }

    /**
     * Download new attachments from sync-server.
     */
    @Scheduled(fixedDelay = 60000, initialDelay = 30000)
    public void downloadPendingAttachments() {
        if (!syncConfig.isServerSyncEnabled()) return;

        String baseUrl = syncConfig.getSyncServerUrl();
        if (baseUrl == null || baseUrl.isEmpty()) return;

        long start = System.currentTimeMillis();
        try (LoggingContext.Scope ignored = LoggingContext.openJobScope("attachment.downloadPendingAttachments")) {
            LoggingContext.setMachineId(syncConfig.getMachineId());
            HttpHeaders headers = createHeaders();
            HttpEntity<?> entity = new HttpEntity<>(headers);

            // Get pending attachment metadata
            ResponseEntity<String> response = restTemplate.exchange(
                    baseUrl + "/api/attachments/pending",
                    HttpMethod.GET, entity, String.class);

            if (!response.getStatusCode().is2xxSuccessful() || response.getBody() == null) return;

            List<Map<String, Object>> pending = objectMapper.readValue(
                    response.getBody(), new TypeReference<>() {});

            if (pending.isEmpty()) return;

            int downloaded = 0;
            log.info("[Attachment Sync] {} pending attachments from sync server", pending.size());

            for (Map<String, Object> meta : pending) {
                try {
                    String entityType = (String) meta.get("entityType");
                    Number entityIdNum = (Number) meta.get("entityId");
                    String fileName = (String) meta.get("fileName");
                    Number idNum = (Number) meta.get("id");

                    if (entityType == null || entityIdNum == null || fileName == null || idNum == null) continue;
                    Long entityId = entityIdNum.longValue();
                    Long serverId = idNum.longValue();

                    // Download full attachment
                    ResponseEntity<String> downloadResp = restTemplate.exchange(
                            baseUrl + "/api/attachments/download/" + serverId,
                            HttpMethod.GET, entity, String.class);

                    if (!downloadResp.getStatusCode().is2xxSuccessful() || downloadResp.getBody() == null) continue;

                    Map<String, Object> attData = objectMapper.readValue(
                            downloadResp.getBody(), new TypeReference<>() {});

                    String contentHash = (String) attData.get("contentHash");
                    if (contentHash == null || contentHash.isEmpty()) {
                        contentHash = computeContentHash((String) attData.get("base64Content"));
                    }
                    Boolean deletedFlag = (Boolean) attData.get("deleted");
                    boolean incomingIsTombstone = Boolean.TRUE.equals(deletedFlag);
                    String incomingOrigin = (String) attData.get("origin");

                    // Incoming tombstone → find matching local row and mark it deleted (or hard
                    // remove). The tombstone carries the same fileName + contentHash the original
                    // row had; we prefer hash match (content-authoritative) with filename fallback
                    // for legacy rows lacking a hash.
                    if (incomingIsTombstone) {
                        java.util.Optional<PermitAttachment> localOpt = contentHash != null && !contentHash.isEmpty()
                            ? attachmentRepo.findFirstByEntityTypeAndEntityIdAndContentHashAndDeletedFalseOrderByIdAsc(
                                entityType, entityId, contentHash)
                            : attachmentRepo.findFirstByEntityTypeAndEntityIdAndFileNameOrderByIdAsc(
                                entityType, entityId, fileName);
                        if (localOpt.isPresent()) {
                            PermitAttachment local = localOpt.get();
                            local.setDeleted(true);
                            local.setSyncedToServer(true);   // came from server; no re-upload needed
                            attachmentRepo.save(local);
                            downloaded++;
                            log.info("[Attachment Sync] Applied tombstone: {} for {}#{}", fileName, entityType, entityId);
                        }
                        // Whether the local existed or not, the pending row is consumed by the
                        // download call above (getAndMarkSynced marks it). Move on.
                        continue;
                    }

                    boolean exists = contentHash != null && !contentHash.isEmpty()
                        ? attachmentRepo.existsByEntityTypeAndEntityIdAndFileNameAndContentHash(
                            entityType, entityId, fileName, contentHash)
                        : attachmentRepo.existsByEntityTypeAndEntityIdAndFileName(entityType, entityId, fileName);
                    if (exists) {
                        continue;
                    }

                    PermitAttachment att = new PermitAttachment();
                    att.setEntityType(entityType);
                    att.setEntityId(entityId);
                    att.setFileName(fileName);
                    att.setContentType((String) attData.get("contentType"));
                    att.setAttachmentType((String) attData.get("attachmentType"));
                    att.setBase64Content((String) attData.get("base64Content"));
                    att.setContentHash(contentHash);
                    att.setOriginMachineId((String) attData.get("originMachineId"));
                    att.setOrigin(incomingOrigin);
                    att.setSyncedToServer(true);
                    attachmentRepo.save(att);
                    downloaded++;

                    log.debug("[Attachment Sync] Downloaded attachment: {} for {}#{}",
                            fileName, entityType, entityId);
                } catch (Exception e) {
                    log.warn("[Attachment Sync] Failed to download attachment: {}", e.getMessage());
                }
            }
            log.info("attachment.download.complete pending={} downloaded={} durationMs={}",
                pending.size(), downloaded, System.currentTimeMillis() - start);
        } catch (Exception e) {
            log.debug("[Attachment Sync] Failed to check pending attachments: {}", e.getMessage());
        }
    }

    private void markDownloaded(String baseUrl, Long serverId) {
        try {
            HttpHeaders headers = createHeaders();
            HttpEntity<?> entity = new HttpEntity<>(headers);
            restTemplate.exchange(
                    baseUrl + "/api/attachments/download/" + serverId,
                    HttpMethod.GET, entity, String.class);
        } catch (Exception ignored) {}
    }

    private HttpHeaders createHeaders() {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.set("Accept", "application/json");
        headers.set("X-Machine-Id", syncConfig.getMachineId());
        return headers;
    }

    private String computeContentHash(String base64Content) {
        if (base64Content == null || base64Content.isEmpty()) {
            return null;
        }

        try {
            byte[] bytes = java.util.Base64.getDecoder().decode(base64Content);
            byte[] hash = MessageDigest.getInstance("SHA-256").digest(bytes);
            StringBuilder sb = new StringBuilder(hash.length * 2);
            for (byte b : hash) {
                sb.append(String.format("%02x", b));
            }
            return sb.toString();
        } catch (Exception decodeError) {
            try {
                byte[] hash = MessageDigest.getInstance("SHA-256")
                    .digest(base64Content.getBytes(StandardCharsets.UTF_8));
                StringBuilder sb = new StringBuilder(hash.length * 2);
                for (byte b : hash) {
                    sb.append(String.format("%02x", b));
                }
                return sb.toString();
            } catch (Exception hashError) {
                log.warn("[Attachment Sync] Could not hash attachment payload: {}", hashError.getMessage());
                return null;
            }
        }
    }
}
