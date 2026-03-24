package com.dk_power.power_plant_java.sevice.sync;

import com.dk_power.power_plant_java.config.SyncConfig;
import com.dk_power.power_plant_java.entities.hub.HubSyncedFile;
import com.dk_power.power_plant_java.sevice.hub.HubFileService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.client.RestTemplate;

import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ManagedEntityFileSyncServiceTest {

    @Mock
    private SyncConfig syncConfig;

    @Mock
    private RestTemplate restTemplate;

    @Mock
    private HubFileService hubFileService;

    @TempDir
    Path tempDir;

    @Test
    void replaceTrackedFilesInHubModeDeletesPreviousAndRegistersCurrentFiles() throws Exception {
        ManagedEntityFileSyncService service = new ManagedEntityFileSyncService(syncConfig, restTemplate);
        ReflectionTestUtils.setField(service, "hubFileService", hubFileService);

        when(syncConfig.isHubMode()).thenReturn(true);
        when(syncConfig.getMachineId()).thenReturn("CLIENT-A");

        Path file = tempDir.resolve("template.lbrn2");
        Files.writeString(file, "template");

        service.replaceTrackedFiles("EngraverTemplate", 42L, List.of(file));

        verify(hubFileService).deleteFilesForEntity("EngraverTemplate", 42L);
        verify(hubFileService).registerLocalFile(file.toFile(), "EngraverTemplate", 42L, file.toString(), "CLIENT-A");
        verifyNoInteractions(restTemplate);
    }

    @Test
    void getRemoteFilesInServerModeParsesDownloadInfoResponse() {
        ManagedEntityFileSyncService service = new ManagedEntityFileSyncService(syncConfig, restTemplate);

        when(syncConfig.isHubMode()).thenReturn(false);
        when(syncConfig.isServerSyncEnabled()).thenReturn(true);
        when(syncConfig.getSyncServerUrl()).thenReturn("http://server:8082");
        when(syncConfig.getMachineId()).thenReturn("CLIENT-B");
        when(syncConfig.getDeviceNumber()).thenReturn(7);

        Map<String, Object> responseBody = Map.of(
                "files", List.of(Map.of(
                        "id", 99L,
                        "fileName", "plant-map.jpg",
                        "originalPath", "C:/uploads-prod/jpg/work-area-map/plant-map.jpg",
                        "downloadUrl", "/api/files/download/99",
                        "contentType", "image/jpeg",
                        "fileSize", 1234L
                )));

        when(restTemplate.exchange(
                eq("http://server:8082/api/files/entity/WorkAreaMap/15/download-info"),
                eq(HttpMethod.GET),
                any(HttpEntity.class),
                eq(Map.class)))
                .thenReturn(new ResponseEntity<>(responseBody, HttpStatus.OK));

        List<ManagedEntityFileSyncService.RemoteFileDescriptor> files =
                service.getRemoteFiles("WorkAreaMap", 15L);

        assertThat(files).hasSize(1);
        assertThat(files.getFirst().fileName()).isEqualTo("plant-map.jpg");
        assertThat(files.getFirst().downloadUrl()).isEqualTo("/api/files/download/99");
    }

    @Test
    void downloadEntityFilesInServerModeWritesMissingFilesToResolvedDestinations() throws Exception {
        ManagedEntityFileSyncService service = new ManagedEntityFileSyncService(syncConfig, restTemplate);

        when(syncConfig.isHubMode()).thenReturn(false);
        when(syncConfig.isServerSyncEnabled()).thenReturn(true);
        when(syncConfig.getSyncServerUrl()).thenReturn("http://server:8082");
        when(syncConfig.getMachineId()).thenReturn("CLIENT-C");
        when(syncConfig.getDeviceNumber()).thenReturn(3);

        Map<String, Object> responseBody = Map.of(
                "files", List.of(Map.of(
                        "id", 12L,
                        "fileName", "template.lbrn2",
                        "originalPath", "engraver_data/template.lbrn2",
                        "downloadUrl", "/api/files/download/12",
                        "contentType", "application/octet-stream",
                        "fileSize", 55L
                )));

        when(restTemplate.exchange(
                eq("http://server:8082/api/files/entity/EngraverTemplate/8/download-info"),
                eq(HttpMethod.GET),
                any(HttpEntity.class),
                eq(Map.class)))
                .thenReturn(new ResponseEntity<>(responseBody, HttpStatus.OK));

        when(restTemplate.exchange(
                eq("http://server:8082/api/files/download/12"),
                eq(HttpMethod.GET),
                any(HttpEntity.class),
                eq(byte[].class)))
                .thenReturn(new ResponseEntity<>("managed-template".getBytes(StandardCharsets.UTF_8), HttpStatus.OK));

        Path destination = tempDir.resolve("engraver_data/template.lbrn2");
        boolean downloaded = service.downloadEntityFiles(
                "EngraverTemplate",
                8L,
                remote -> destination);

        assertThat(downloaded).isTrue();
        assertThat(Files.readString(destination)).isEqualTo("managed-template");
    }
}
