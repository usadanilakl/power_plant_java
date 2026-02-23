package com.dk_power.power_plant_java.sevice.sync;

import com.dk_power.power_plant_java.config.SyncConfig;
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

import java.util.Base64;
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

        List<PermitAttachment> unsynced = attachmentRepo.findBySyncedToServerFalseOrSyncedToServerIsNull();
        if (unsynced.isEmpty()) return;

        String baseUrl = syncConfig.getSyncServerUrl();
        if (baseUrl == null || baseUrl.isEmpty()) return;

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

                HttpHeaders headers = createHeaders();
                HttpEntity<String> entity = new HttpEntity<>(objectMapper.writeValueAsString(body), headers);

                ResponseEntity<String> response = restTemplate.exchange(
                        baseUrl + "/api/attachments/upload",
                        HttpMethod.POST, entity, String.class);

                if (response.getStatusCode().is2xxSuccessful()) {
                    att.setSyncedToServer(true);
                    attachmentRepo.save(att);
                    log.debug("[Attachment Sync] Uploaded attachment: {} for {}#{}",
                            att.getFileName(), att.getEntityType(), att.getEntityId());
                }
            } catch (Exception e) {
                log.warn("[Attachment Sync] Failed to upload attachment {}: {}",
                        att.getFileName(), e.getMessage());
            }
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

        try {
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

                    // Dedup check
                    if (attachmentRepo.existsByEntityTypeAndEntityIdAndFileName(entityType, entityId, fileName)) {
                        // Still mark as downloaded on server
                        markDownloaded(baseUrl, serverId);
                        continue;
                    }

                    // Download full attachment
                    ResponseEntity<String> downloadResp = restTemplate.exchange(
                            baseUrl + "/api/attachments/download/" + serverId,
                            HttpMethod.GET, entity, String.class);

                    if (!downloadResp.getStatusCode().is2xxSuccessful() || downloadResp.getBody() == null) continue;

                    Map<String, Object> attData = objectMapper.readValue(
                            downloadResp.getBody(), new TypeReference<>() {});

                    PermitAttachment att = new PermitAttachment();
                    att.setEntityType(entityType);
                    att.setEntityId(entityId);
                    att.setFileName(fileName);
                    att.setContentType((String) attData.get("contentType"));
                    att.setAttachmentType((String) attData.get("attachmentType"));
                    att.setBase64Content((String) attData.get("base64Content"));
                    att.setOriginMachineId((String) attData.get("originMachineId"));
                    att.setSyncedToServer(true);
                    attachmentRepo.save(att);

                    log.debug("[Attachment Sync] Downloaded attachment: {} for {}#{}",
                            fileName, entityType, entityId);
                } catch (Exception e) {
                    log.warn("[Attachment Sync] Failed to download attachment: {}", e.getMessage());
                }
            }
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
}
