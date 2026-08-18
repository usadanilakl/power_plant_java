package com.dk_power.power_plant_java.sevice.hub;

import com.dk_power.power_plant_java.entities.categories.Value;
import com.dk_power.power_plant_java.entities.files.FileObject;
import com.dk_power.power_plant_java.entities.hub.HubSyncedFile;
import com.dk_power.power_plant_java.repository.file.FileRepo;
import com.dk_power.power_plant_java.repository.hub.HubSyncedFileRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.api.io.TempDir;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.util.ReflectionTestUtils;

import java.nio.file.Files;
import java.nio.file.NoSuchFileException;
import java.nio.file.Path;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class HubFileServiceTest {

    @Mock
    private HubSyncedFileRepository syncedFileRepository;
    @Mock
    private FileRepo fileRepo;

    @TempDir
    Path tempDir;

    private HubFileService service() {
        HubFileService s = new HubFileService(syncedFileRepository, fileRepo);
        ReflectionTestUtils.setField(s, "filesRootPath", tempDir.toString());
        return s;
    }

    private FileObject fileObjectWith(long id, String type, String vendor, String number) {
        Value ft = new Value();
        ft.setName(type);
        Value vd = new Value();
        vd.setName(vendor);
        FileObject fo = new FileObject();
        fo.setId(id);
        fo.setFileType(ft);
        fo.setVendor(vd);
        fo.setFileNumber(number);
        fo.setExtensions("pdf");
        return fo;
    }

    @Test
    void loadFileReportsMissingPhysicalContentWithoutMarkingClientSynced() {
        HubSyncedFile metadata = new HubSyncedFile();
        metadata.setId(17L);
        metadata.setStoragePath(tempDir.resolve("physically-missing.pdf").toString());
        when(syncedFileRepository.findById(17L)).thenReturn(Optional.of(metadata));

        assertThatThrownBy(() -> service().loadFileForClient(17L, "CLIENT-B"))
            .isInstanceOf(NoSuchFileException.class);
        verify(syncedFileRepository, never()).save(metadata);
    }

    @Test
    void newFileObjectFileIsStoredAtCanonicalPathNotClientPathFallback() throws Exception {
        FileObject fo = fileObjectWith(200L, "PID", "Beta", "DOC-9");
        when(fileRepo.findById(200L)).thenReturn(Optional.of(fo));
        when(syncedFileRepository.findByFileHashAndEntityTypeAndEntityIdAndDeletedFalse(any(), any(), any()))
            .thenReturn(Optional.empty());
        when(syncedFileRepository.save(any(HubSyncedFile.class))).thenAnswer(inv -> inv.getArgument(0));

        MockMultipartFile upload = new MockMultipartFile(
            "file", "DOC-9.pdf", "application/pdf", "hello".getBytes());
        // originalPath is deliberately NON-standard: the old substring match would have fallen back to
        // FileObject/200/DOC-9.pdf. The canonical derivation must ignore it and use the FileObject metadata.
        service().storeFile(upload, "FileObject", 200L, "C:/weird/place/DOC-9.pdf", "CLIENT-A");

        Path canonical = tempDir.resolve("pdf/PID/Beta/DOC-9.pdf");
        assertThat(Files.exists(canonical)).as("stored at canonical path, not a client-path fallback").isTrue();
        assertThat(Files.readString(canonical)).isEqualTo("hello");
        assertThat(Files.exists(tempDir.resolve("FileObject/200/DOC-9.pdf"))).isFalse();
    }

    @Test
    void newUploadDoesNotClobberADifferentEntityAtTheSameCanonicalPath() throws Exception {
        // A and B are DISTINCT FileObjects that resolve to the SAME canonical path (shared fileNumber+type
        // +vendor+ext). B's upload must NOT truncate A's already-stored bytes.
        FileObject a = fileObjectWith(300L, "Spec", "Zeta", "SHARED-1");
        FileObject b = fileObjectWith(301L, "Spec", "Zeta", "SHARED-1");
        when(fileRepo.findById(300L)).thenReturn(Optional.of(a));
        when(fileRepo.findById(301L)).thenReturn(Optional.of(b));
        when(syncedFileRepository.findByFileHashAndEntityTypeAndEntityIdAndDeletedFalse(any(), any(), any()))
            .thenReturn(Optional.empty());
        when(syncedFileRepository.save(any(HubSyncedFile.class))).thenAnswer(inv -> inv.getArgument(0));

        HubFileService svc = service();
        svc.storeFile(new MockMultipartFile("file", "SHARED-1.pdf", "application/pdf", "A-bytes".getBytes()),
            "FileObject", 300L, "x/SHARED-1.pdf", "CLIENT-A");
        Path canonical = tempDir.resolve("pdf/Spec/Zeta/SHARED-1.pdf");
        assertThat(Files.readString(canonical)).isEqualTo("A-bytes");

        // B uploads DIFFERENT bytes to the same canonical name.
        svc.storeFile(new MockMultipartFile("file", "SHARED-1.pdf", "application/pdf", "B-bytes".getBytes()),
            "FileObject", 301L, "x/SHARED-1.pdf", "CLIENT-A");

        assertThat(Files.readString(canonical)).as("A's bytes survive B's colliding upload").isEqualTo("A-bytes");
        assertThat(Files.readString(tempDir.resolve("FileObject/301/SHARED-1.pdf")))
            .as("B is stored under its own entity-scoped path").isEqualTo("B-bytes");
    }

    @Test
    void relocateSkipsWhenCanonicalTargetHoldsADifferentFile() throws Exception {
        // Two distinct FileObjects can resolve to the same canonical path (shared fileNumber+type+vendor+ext).
        // Re-homing one must NEVER overwrite the other's bytes.
        FileObject fo = fileObjectWith(100L, "Manual", "Acme", "TEMP-001");
        when(fileRepo.findById(100L)).thenReturn(Optional.of(fo));

        // This entity's legacy fallback copy (the source to be relocated).
        Path legacy = tempDir.resolve("FileObject/100/TEMP-001.pdf");
        Files.createDirectories(legacy.getParent());
        Files.write(legacy, "A-content".getBytes());

        // A DIFFERENT file already occupies the canonical target.
        Path canonical = tempDir.resolve("pdf/Manual/Acme/TEMP-001.pdf");
        Files.createDirectories(canonical.getParent());
        Files.write(canonical, "B-different-content".getBytes());

        HubSyncedFile existing = new HubSyncedFile();
        existing.setEntityType("FileObject");
        existing.setEntityId(100L);
        existing.setStoragePath(legacy.toString());
        existing.setExtension("pdf");
        existing.setFileName("TEMP-001.pdf");
        existing.setFileHash("hash-of-A-that-does-not-match-B"); // != sha256(B) → collision → must skip
        when(syncedFileRepository.findByFileHashAndEntityTypeAndEntityIdAndDeletedFalse(any(), eq("FileObject"), eq(100L)))
            .thenReturn(Optional.of(existing));

        MockMultipartFile upload = new MockMultipartFile(
            "file", "TEMP-001.pdf", "application/pdf", "A-content".getBytes());
        service().storeFile(upload, "FileObject", 100L, "/x/uploads-prod/pdf/Manual/Acme/TEMP-001.pdf", "CLIENT-A");

        // The OTHER file's bytes are intact; the legacy source is untouched; storagePath is NOT repointed.
        assertThat(Files.readString(canonical)).isEqualTo("B-different-content");
        assertThat(Files.exists(legacy)).isTrue();
        assertThat(existing.getStoragePath()).isEqualTo(legacy.toString());
    }
}
