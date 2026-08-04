package com.dk_power.power_plant_java.sevice.sync;

import com.dk_power.power_plant_java.config.SyncConfig;
import com.dk_power.power_plant_java.entities.files.FileObject;
import com.dk_power.power_plant_java.entities.sync.PendingFileSync;
import com.dk_power.power_plant_java.entities.sync.PendingFileSync.SyncDirection;
import com.dk_power.power_plant_java.entities.sync.PendingFileSync.SyncStatus;
import com.dk_power.power_plant_java.repository.categories.ValueRepo;
import com.dk_power.power_plant_java.repository.file.FileRepo;
import com.dk_power.power_plant_java.repository.sync.PendingFileSyncRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.EnumSource;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.client.RestTemplate;

import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.LongStream;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class FileObjectSyncHandlerMissingDownloadTest {

    private static final long ENTITY_ID = 7L;
    private static final long HUB_FILE_ID = 91L;
    private static final String SERVER_URL = "http://hub:8085";

    @Mock
    private SyncConfig syncConfig;

    @Mock
    private RestTemplate restTemplate;

    @Mock
    private FileRepo fileRepo;

    @Mock
    private SyncContext syncContext;

    @Mock
    private PendingFileSyncRepository pendingFileSyncRepository;

    @Mock
    private ValueRepo valueRepo;

    @ParameterizedTest
    @EnumSource(value = HttpStatus.class, names = {"NOT_FOUND", "GONE"})
    void permanentlyMissingDownloadCompletesTerminally(HttpStatus missingStatus) {
        FileObjectSyncHandler handler = handlerWithPendingDownload();
        PendingFileSync task = pendingDownload();
        stubPendingDownload(task);
        when(restTemplate.exchange(
            eq(SERVER_URL + "/api/files/download/" + HUB_FILE_ID),
            eq(HttpMethod.GET),
            any(HttpEntity.class),
            eq(byte[].class)))
            .thenThrow(HttpClientErrorException.create(
                missingStatus, missingStatus.getReasonPhrase(), new HttpHeaders(),
                new byte[0], StandardCharsets.UTF_8));

        handler.processDownloadQueue();

        assertThat(task.getStatus()).isEqualTo(SyncStatus.COMPLETED);
        assertThat(task.getRetryCount()).isZero();
        assertThat(task.getLastError()).startsWith("PERMANENT: ");
        assertThat(task.getLastError()).contains("permanently unavailable");
    }

    @Test
    void transientDownloadFailureIsScheduledForRetry() {
        FileObjectSyncHandler handler = handlerWithPendingDownload();
        PendingFileSync task = pendingDownload();
        stubPendingDownload(task);
        when(restTemplate.exchange(
            eq(SERVER_URL + "/api/files/download/" + HUB_FILE_ID),
            eq(HttpMethod.GET),
            any(HttpEntity.class),
            eq(byte[].class)))
            .thenThrow(new ResourceAccessException("connection timed out"));

        handler.processDownloadQueue();

        assertThat(task.getStatus()).isEqualTo(SyncStatus.PENDING);
        assertThat(task.getRetryCount()).isEqualTo(1);
        assertThat(task.getNextRetryTime()).isAfter(task.getLastAttemptTime());
        assertThat(task.getLastError()).contains("transient file download");
    }

    @Test
    void exhaustedTransientFailureRemainsRecoverable() {
        FileObjectSyncHandler handler = handlerWithPendingDownload();
        PendingFileSync task = pendingDownload();
        task.setRetryCount(10);
        task.markFailed("connection timed out");
        FileObject fileObject = activeFileObject();
        when(pendingFileSyncRepository.findByDirectionAndStatusIn(
            SyncDirection.DOWNLOAD, List.of(SyncStatus.FAILED)))
            .thenReturn(List.of(task));
        when(fileRepo.findById(ENTITY_ID)).thenReturn(Optional.of(fileObject));

        handler.recoverFailedDownloads();

        assertThat(task.getStatus()).isEqualTo(SyncStatus.PENDING);
        assertThat(task.getRetryCount()).isZero();
        verify(pendingFileSyncRepository).save(task);
    }

    @Test
    void downloadBatchLimitCountsFailedAttempts() {
        FileObjectSyncHandler handler = handlerWithPendingDownload();
        List<PendingFileSync> tasks = LongStream.rangeClosed(1, 11)
            .mapToObj(this::pendingDownload)
            .toList();
        when(pendingFileSyncRepository.findPendingDownloads()).thenReturn(tasks);
        when(fileRepo.findById(anyLong())).thenThrow(new IllegalStateException("database unavailable"));

        handler.processDownloadQueue();

        assertThat(tasks.subList(0, 10))
            .allSatisfy(task -> assertThat(task.getRetryCount()).isEqualTo(1));
        assertThat(tasks.get(10).getRetryCount()).isZero();
        verify(fileRepo, times(10)).findById(anyLong());
    }

    private FileObjectSyncHandler handlerWithPendingDownload() {
        when(syncConfig.isServerSyncEnabled()).thenReturn(true);
        return new FileObjectSyncHandler(
            syncConfig, restTemplate, fileRepo, syncContext, pendingFileSyncRepository, valueRepo);
    }

    private void stubPendingDownload(PendingFileSync task) {
        when(syncConfig.getSyncServerUrl()).thenReturn(SERVER_URL);
        when(syncConfig.getMachineId()).thenReturn("CLIENT-C");
        when(syncConfig.getDeviceNumber()).thenReturn(3);
        when(pendingFileSyncRepository.findPendingDownloads()).thenReturn(List.of(task));
        when(fileRepo.findById(ENTITY_ID)).thenReturn(Optional.of(activeFileObject()));

        Map<String, Object> responseBody = Map.of(
            "files", List.of(Map.of(
                "id", HUB_FILE_ID,
                "fileName", "missing.pdf",
                "extension", "pdf",
                "fileHash", "")));

        when(restTemplate.exchange(
            eq(SERVER_URL + "/api/files/entity/FileObject/" + ENTITY_ID + "/download-info"),
            eq(HttpMethod.GET),
            any(HttpEntity.class),
            org.mockito.ArgumentMatchers.<ParameterizedTypeReference<Map>>any()))
            .thenReturn(ResponseEntity.ok(responseBody));
    }

    private PendingFileSync pendingDownload() {
        return pendingDownload(ENTITY_ID);
    }

    private PendingFileSync pendingDownload(long entityId) {
        return new PendingFileSync(
            entityId, SyncDirection.DOWNLOAD, "FILE-" + entityId, "pdf",
            "uploads/pdf/FILE-" + entityId + ".pdf");
    }

    private FileObject activeFileObject() {
        FileObject fileObject = new FileObject("FILE-7");
        fileObject.setId(ENTITY_ID);
        fileObject.setDeleted(false);
        return fileObject;
    }
}
