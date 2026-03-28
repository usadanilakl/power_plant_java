package com.dk_power.power_plant_java.sevice.angular.permits;

import com.dk_power.power_plant_java.entities.permits.WorkAreaMapShape;
import com.dk_power.power_plant_java.mappers.permits.WorkAreaMapper;
import com.dk_power.power_plant_java.repository.permits.ConfinedSpaceRepo;
import com.dk_power.power_plant_java.repository.permits.HotWorkRepo;
import com.dk_power.power_plant_java.repository.permits.SafeWorkRepo;
import com.dk_power.power_plant_java.repository.permits.WorkAreaMapShapeRepo;
import com.dk_power.power_plant_java.repository.permits.WorkAreaRepo;
import com.dk_power.power_plant_java.sevice.categories.ValueService;
import com.dk_power.power_plant_java.sevice.sync.ManagedEntityFileSyncService;
import jakarta.persistence.EntityManager;
import org.hibernate.SessionFactory;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class NgWorkAreaServiceTest {

    @Mock
    private WorkAreaRepo workAreaRepo;
    @Mock
    private WorkAreaMapShapeRepo shapeRepo;
    @Mock
    private WorkAreaMapper workAreaMapper;
    @Mock
    private SessionFactory sessionFactory;
    @Mock
    private EntityManager entityManager;
    @Mock
    private ValueService valueService;
    @Mock
    private SafeWorkRepo safeWorkRepo;
    @Mock
    private HotWorkRepo hotWorkRepo;
    @Mock
    private ConfinedSpaceRepo confinedSpaceRepo;
    @Mock
    private WorkAreaGitHubPublisher gitHubPublisher;
    @Mock
    private ManagedEntityFileSyncService managedEntityFileSyncService;

    @TempDir
    Path tempDir;

    @Test
    void getMapImagePathHydratesMissingMapImageFromManagedFiles() throws Exception {
        NgWorkAreaService service = new NgWorkAreaService(
                workAreaRepo,
                shapeRepo,
                workAreaMapper,
                sessionFactory,
                entityManager,
                valueService,
                safeWorkRepo,
                hotWorkRepo,
                confinedSpaceRepo,
                gitHubPublisher,
                managedEntityFileSyncService
        );
        ReflectionTestUtils.setField(service, "filesRootPath", tempDir.toString());
        ReflectionTestUtils.setField(service, "filesRelativePath", "/uploads-prod");

        WorkAreaMapShape marker = new WorkAreaMapShape();
        marker.setId(33L);
        marker.setName("__PLANT_MAP__");

        when(shapeRepo.findByName("__PLANT_MAP__")).thenReturn(marker);
        when(managedEntityFileSyncService.downloadEntityFiles(eq("WorkAreaMap"), eq(33L), any()))
                .thenAnswer(invocation -> {
                    @SuppressWarnings("unchecked")
                    java.util.function.Function<ManagedEntityFileSyncService.RemoteFileDescriptor, Path> resolver =
                            invocation.getArgument(2);
                    Path destination = resolver.apply(new ManagedEntityFileSyncService.RemoteFileDescriptor(
                            4L,
                            "plant-map.jpg",
                            "uploads-prod/jpg/work-area-map/plant-map.jpg",
                            "/api/files/download/4",
                            "image/jpeg",
                            111L
                    ));
                    Files.createDirectories(destination.getParent());
                    Files.writeString(destination, "jpg");
                    return true;
                });

        String path = service.getMapImagePath();

        assertThat(path).isEqualTo("/uploads-prod/jpg/work-area-map/plant-map.jpg");
        assertThat(tempDir.resolve("jpg/work-area-map/plant-map.jpg")).exists();
    }

    @Test
    void getMapImagePathRefreshesStaleMapImageWhenMarkerTokenChanges() throws Exception {
        NgWorkAreaService service = new NgWorkAreaService(
                workAreaRepo,
                shapeRepo,
                workAreaMapper,
                sessionFactory,
                entityManager,
                valueService,
                safeWorkRepo,
                hotWorkRepo,
                confinedSpaceRepo,
                gitHubPublisher,
                managedEntityFileSyncService
        );
        ReflectionTestUtils.setField(service, "filesRootPath", tempDir.toString());
        ReflectionTestUtils.setField(service, "filesRelativePath", "/uploads-prod");

        Path jpgPath = tempDir.resolve("jpg/work-area-map/plant-map.jpg");
        Files.createDirectories(jpgPath.getParent());
        Files.writeString(jpgPath, "old-jpg");
        Files.writeString(tempDir.resolve("jpg/work-area-map/.plant-map-sync-token"), "plant-map-sync:old");

        WorkAreaMapShape marker = new WorkAreaMapShape();
        marker.setId(44L);
        marker.setName("__PLANT_MAP__");
        marker.setLabel("plant-map-sync:new");

        when(shapeRepo.findByName("__PLANT_MAP__")).thenReturn(marker);
        when(managedEntityFileSyncService.downloadEntityFiles(eq("WorkAreaMap"), eq(44L), any()))
                .thenAnswer(invocation -> {
                    @SuppressWarnings("unchecked")
                    java.util.function.Function<ManagedEntityFileSyncService.RemoteFileDescriptor, Path> resolver =
                            invocation.getArgument(2);
                    Path destination = resolver.apply(new ManagedEntityFileSyncService.RemoteFileDescriptor(
                            5L,
                            "plant-map.jpg",
                            "uploads-prod/jpg/work-area-map/plant-map.jpg",
                            "/api/files/download/5",
                            "image/jpeg",
                            222L
                    ));
                    Files.createDirectories(destination.getParent());
                    Files.writeString(destination, "new-jpg");
                    return true;
                });

        String path = service.getMapImagePath();

        assertThat(path).isEqualTo("/uploads-prod/jpg/work-area-map/plant-map.jpg?v=plant-map-sync:new");
        assertThat(Files.readString(jpgPath)).isEqualTo("new-jpg");
        assertThat(Files.readString(tempDir.resolve("jpg/work-area-map/.plant-map-sync-token")))
                .isEqualTo("plant-map-sync:new");
    }

    @Test
    void getMapImagePathKeepsExistingMapWhenRefreshDownloadFails() throws Exception {
        NgWorkAreaService service = new NgWorkAreaService(
                workAreaRepo,
                shapeRepo,
                workAreaMapper,
                sessionFactory,
                entityManager,
                valueService,
                safeWorkRepo,
                hotWorkRepo,
                confinedSpaceRepo,
                gitHubPublisher,
                managedEntityFileSyncService
        );
        ReflectionTestUtils.setField(service, "filesRootPath", tempDir.toString());
        ReflectionTestUtils.setField(service, "filesRelativePath", "/uploads-prod");

        Path jpgPath = tempDir.resolve("jpg/work-area-map/plant-map.jpg");
        Path pdfPath = tempDir.resolve("pdf/work-area-map/plant-map.pdf");
        Files.createDirectories(jpgPath.getParent());
        Files.createDirectories(pdfPath.getParent());
        Files.writeString(jpgPath, "old-jpg");
        Files.writeString(pdfPath, "old-pdf");
        Files.writeString(tempDir.resolve("jpg/work-area-map/.plant-map-sync-token"), "plant-map-sync:old");

        WorkAreaMapShape marker = new WorkAreaMapShape();
        marker.setId(45L);
        marker.setName("__PLANT_MAP__");
        marker.setLabel("plant-map-sync:new");

        when(shapeRepo.findByName("__PLANT_MAP__")).thenReturn(marker);
        when(managedEntityFileSyncService.downloadEntityFiles(eq("WorkAreaMap"), eq(45L), any()))
                .thenThrow(new IOException("download failed"));

        String path = service.getMapImagePath();

        assertThat(path).isEqualTo("/uploads-prod/jpg/work-area-map/plant-map.jpg?v=plant-map-sync:old");
        assertThat(Files.readString(jpgPath)).isEqualTo("old-jpg");
        assertThat(Files.readString(pdfPath)).isEqualTo("old-pdf");
        assertThat(Files.readString(tempDir.resolve("jpg/work-area-map/.plant-map-sync-token")))
                .isEqualTo("plant-map-sync:old");
    }
}
