package com.dk_power.power_plant_java.sevice.hub;

import com.dk_power.power_plant_java.entities.hub.HubSyncedFile;
import com.dk_power.power_plant_java.repository.hub.HubSyncedFileRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.api.io.TempDir;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.nio.file.NoSuchFileException;
import java.nio.file.Path;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class HubFileServiceTest {

    @Mock
    private HubSyncedFileRepository syncedFileRepository;

    @TempDir
    Path tempDir;

    @Test
    void loadFileReportsMissingPhysicalContentWithoutMarkingClientSynced() {
        HubSyncedFile metadata = new HubSyncedFile();
        metadata.setId(17L);
        metadata.setStoragePath(tempDir.resolve("physically-missing.pdf").toString());
        when(syncedFileRepository.findById(17L)).thenReturn(Optional.of(metadata));

        HubFileService service = new HubFileService(syncedFileRepository);

        assertThatThrownBy(() -> service.loadFileForClient(17L, "CLIENT-B"))
            .isInstanceOf(NoSuchFileException.class);
        verify(syncedFileRepository, never()).save(metadata);
    }
}
