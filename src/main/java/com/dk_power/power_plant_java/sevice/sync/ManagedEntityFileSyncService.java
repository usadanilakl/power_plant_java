package com.dk_power.power_plant_java.sevice.sync;

import com.dk_power.power_plant_java.config.SyncConfig;
import com.dk_power.power_plant_java.sevice.hub.HubFileService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestTemplate;

import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.function.Function;

@Service
@RequiredArgsConstructor
@Slf4j
public class ManagedEntityFileSyncService {

    private final SyncConfig syncConfig;
    private final RestTemplate restTemplate;

    @Autowired(required = false)
    private HubFileService hubFileService;

    public void replaceTrackedFiles(String entityType, Long entityId, List<Path> filePaths) throws IOException {
        List<Path> existingFiles = filePaths == null ? List.of() : filePaths.stream()
                .filter(Objects::nonNull)
                .filter(Files::exists)
                .toList();

        if (syncConfig.isHubMode()) {
            if (hubFileService == null) {
                return;
            }
            hubFileService.deleteFilesForEntity(entityType, entityId);
            for (Path filePath : existingFiles) {
                hubFileService.registerLocalFile(
                        filePath.toFile(),
                        entityType,
                        entityId,
                        filePath.toString(),
                        syncConfig.getMachineId());
            }
            return;
        }

        if (!syncConfig.isServerSyncEnabled()) {
            return;
        }

        deleteTrackedFilesOnServer(entityType, entityId);
        for (Path filePath : existingFiles) {
            uploadFileToServer(entityType, entityId, filePath);
        }
    }

    public void deleteTrackedFiles(String entityType, Long entityId) {
        if (syncConfig.isHubMode()) {
            if (hubFileService != null) {
                hubFileService.deleteFilesForEntity(entityType, entityId);
            }
            return;
        }

        if (!syncConfig.isServerSyncEnabled()) {
            return;
        }

        deleteTrackedFilesOnServer(entityType, entityId);
    }

    public boolean downloadEntityFiles(String entityType, Long entityId,
                                       Function<RemoteFileDescriptor, Path> destinationResolver) throws IOException {
        boolean downloadedAny = false;
        for (RemoteFileDescriptor remoteFile : getRemoteFiles(entityType, entityId)) {
            Path destination = destinationResolver.apply(remoteFile);
            if (destination == null || Files.exists(destination)) {
                continue;
            }
            downloadRemoteFile(remoteFile, destination);
            downloadedAny = true;
        }
        return downloadedAny;
    }

    public List<RemoteFileDescriptor> getRemoteFiles(String entityType, Long entityId) {
        if (syncConfig.isHubMode()) {
            if (hubFileService == null) {
                return List.of();
            }
            return hubFileService.getFilesForEntity(entityType, entityId).stream()
                    .map(file -> new RemoteFileDescriptor(
                            file.getId(),
                            file.getFileName(),
                            file.getOriginalPath(),
                            "/api/files/download/" + file.getId(),
                            file.getContentType(),
                            file.getFileSize() != null ? file.getFileSize() : 0L))
                    .toList();
        }

        if (!syncConfig.isServerSyncEnabled()) {
            return List.of();
        }

        String url = buildServerUrl("/api/files/entity/" + entityType + "/" + entityId + "/download-info");
        ResponseEntity<Map> response = restTemplate.exchange(
                url,
                HttpMethod.GET,
                new HttpEntity<>(createMachineHeaders()),
                Map.class);

        if (!response.getStatusCode().is2xxSuccessful() || response.getBody() == null) {
            return List.of();
        }

        Object filesObject = response.getBody().get("files");
        if (!(filesObject instanceof List<?> filesList)) {
            return List.of();
        }

        List<RemoteFileDescriptor> descriptors = new ArrayList<>();
        for (Object item : filesList) {
            if (!(item instanceof Map<?, ?> fileMap)) {
                continue;
            }
            descriptors.add(new RemoteFileDescriptor(
                    toLong(fileMap.get("id")),
                    Objects.toString(fileMap.get("fileName"), null),
                    Objects.toString(fileMap.get("originalPath"), null),
                    Objects.toString(fileMap.get("downloadUrl"), null),
                    Objects.toString(fileMap.get("contentType"), MediaType.APPLICATION_OCTET_STREAM_VALUE),
                    toLong(fileMap.get("fileSize"))));
        }
        return descriptors;
    }

    private void deleteTrackedFilesOnServer(String entityType, Long entityId) {
        restTemplate.exchange(
                buildServerUrl("/api/files/entity/" + entityType + "/" + entityId),
                HttpMethod.DELETE,
                new HttpEntity<>(createMachineHeaders()),
                Map.class);
    }

    private void uploadFileToServer(String entityType, Long entityId, Path filePath) {
        HttpHeaders headers = createMachineHeaders();
        headers.setContentType(MediaType.MULTIPART_FORM_DATA);

        MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
        body.add("file", new FileSystemResource(filePath));
        body.add("entityType", entityType);
        body.add("entityId", entityId.toString());
        body.add("originalPath", filePath.toString());

        ResponseEntity<Map> response = restTemplate.postForEntity(
                buildServerUrl("/api/files/upload"),
                new HttpEntity<>(body, headers),
                Map.class);

        if (!response.getStatusCode().is2xxSuccessful()) {
            throw new IllegalStateException("Failed to upload managed file: " + filePath.getFileName());
        }
    }

    private void downloadRemoteFile(RemoteFileDescriptor remoteFile, Path destination) throws IOException {
        Files.createDirectories(destination.getParent());

        if (syncConfig.isHubMode() && hubFileService != null) {
            Resource resource = hubFileService.loadFileForClient(remoteFile.id(), syncConfig.getMachineId());
            try (InputStream inputStream = resource.getInputStream()) {
                Files.copy(inputStream, destination);
            }
            return;
        }

        if (!syncConfig.isServerSyncEnabled()) {
            return;
        }

        String downloadUrl = remoteFile.downloadUrl();
        if (downloadUrl == null || downloadUrl.isBlank()) {
            throw new IOException("Missing managed file download URL for " + remoteFile.fileName());
        }

        String absoluteUrl = downloadUrl.startsWith("http") ? downloadUrl : buildServerUrl(downloadUrl);
        ResponseEntity<byte[]> response = restTemplate.exchange(
                absoluteUrl,
                HttpMethod.GET,
                new HttpEntity<>(createMachineHeaders()),
                byte[].class);

        if (!response.getStatusCode().is2xxSuccessful() || response.getBody() == null) {
            throw new IOException("Failed to download managed file: " + remoteFile.fileName());
        }

        Files.write(destination, response.getBody());
    }

    private HttpHeaders createMachineHeaders() {
        HttpHeaders headers = new HttpHeaders();
        headers.set("X-Machine-Id", syncConfig.getMachineId());
        headers.set("X-Device-Number", String.valueOf(syncConfig.getDeviceNumber()));
        return headers;
    }

    private String buildServerUrl(String path) {
        String baseUrl = syncConfig.getSyncServerUrl();
        if (baseUrl == null || baseUrl.isBlank()) {
            throw new IllegalStateException("Sync server URL is not configured");
        }
        return path.startsWith("/") ? baseUrl + path : baseUrl + "/" + path;
    }

    private long toLong(Object value) {
        if (value instanceof Number number) {
            return number.longValue();
        }
        if (value == null) {
            return 0L;
        }
        return Long.parseLong(value.toString());
    }

    public record RemoteFileDescriptor(
            Long id,
            String fileName,
            String originalPath,
            String downloadUrl,
            String contentType,
            long fileSize
    ) {}
}
