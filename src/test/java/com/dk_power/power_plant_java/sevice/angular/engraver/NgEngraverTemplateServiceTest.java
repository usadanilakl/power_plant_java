package com.dk_power.power_plant_java.sevice.angular.engraver;

import com.dk_power.power_plant_java.dto.engraver.EngraverTemplateDto;
import com.dk_power.power_plant_java.entities.engraver.EngraverTemplate;
import com.dk_power.power_plant_java.mappers.engraver.EngraverTemplateMapper;
import com.dk_power.power_plant_java.repository.engraver.EngraverTemplateRepo;
import com.dk_power.power_plant_java.sevice.sync.ManagedEntityFileSyncService;
import jakarta.persistence.EntityManager;
import org.hibernate.SessionFactory;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class NgEngraverTemplateServiceTest {

    @Mock
    private EngraverTemplateRepo repo;

    @Mock
    private EngraverTemplateMapper mapper;

    @Mock
    private SessionFactory sessionFactory;

    @Mock
    private EntityManager entityManager;

    @Mock
    private ManagedEntityFileSyncService managedEntityFileSyncService;

    @TempDir
    Path tempDir;

    @Test
    void getAvailableTemplateFilenamesReturnsDistinctSortedNonBlankEntries() {
        NgEngraverTemplateService service = createService();

        EngraverTemplate a = new EngraverTemplate();
        a.setFilename("b-template.lbrn2");
        EngraverTemplate b = new EngraverTemplate();
        b.setFilename("a-template.lbrn2");
        EngraverTemplate c = new EngraverTemplate();
        c.setFilename("b-template.lbrn2");
        EngraverTemplate d = new EngraverTemplate();
        d.setFilename("  ");

        when(repo.findAll()).thenReturn(List.of(a, b, c, d));

        assertThat(service.getAvailableTemplateFilenames())
                .containsExactly("a-template.lbrn2", "b-template.lbrn2");
    }

    @Test
    void ensureTemplateFileAvailableDownloadsMissingManagedFile() throws Exception {
        NgEngraverTemplateService service = createService();

        EngraverTemplate template = new EngraverTemplate();
        template.setId(14L);
        template.setFilename("remote-template.lbrn2");

        when(repo.findFirstByFilename("remote-template.lbrn2")).thenReturn(Optional.of(template));
        when(managedEntityFileSyncService.downloadEntityFiles(
                eq(NgEngraverTemplateService.ENGRAVER_TEMPLATE_ENTITY_TYPE),
                eq(14L),
                any()))
                .thenAnswer(invocation -> {
                    @SuppressWarnings("unchecked")
                    java.util.function.Function<ManagedEntityFileSyncService.RemoteFileDescriptor, Path> resolver =
                            invocation.getArgument(2);
                    Path destination = resolver.apply(new ManagedEntityFileSyncService.RemoteFileDescriptor(
                            9L,
                            "remote-template.lbrn2",
                            "engraver_data/remote-template.lbrn2",
                            "/api/files/download/9",
                            "application/octet-stream",
                            10L
                    ));
                    Files.createDirectories(destination.getParent());
                    Files.writeString(destination, "remote template");
                    return true;
                });

        Path result = service.ensureTemplateFileAvailable("remote-template.lbrn2");

        assertThat(result).exists();
        assertThat(Files.readString(result)).isEqualTo("remote template");
    }

    private NgEngraverTemplateService createService() {
        NgEngraverTemplateService service = new NgEngraverTemplateService(
                repo,
                mapper,
                sessionFactory,
                entityManager,
                managedEntityFileSyncService
        );
        ReflectionTestUtils.setField(service, "engraverDataPath", tempDir.toString());
        return service;
    }
}
