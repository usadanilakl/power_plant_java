package com.dk_power.power_plant_java.controller.hub;

import com.dk_power.power_plant_java.sevice.hub.HubFileService;
import com.dk_power.power_plant_java.sevice.hub.HubSseService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;

import java.nio.file.NoSuchFileException;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class HubFileControllerTest {

    @Mock
    private HubFileService hubFileService;

    @Mock
    private HubSseService hubSseService;

    @Test
    void downloadReturnsGoneWhenMetadataExistsButPhysicalFileIsMissing() throws Exception {
        HubFileController controller = new HubFileController(hubFileService, hubSseService);
        when(hubFileService.loadFileForClient(42L, "CLIENT-A"))
            .thenThrow(new NoSuchFileException("missing.pdf"));

        var response = controller.downloadFile(42L, "CLIENT-A");

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.GONE);
        assertThat(response.getBody()).isInstanceOf(Map.class);
        Map<?, ?> body = (Map<?, ?>) response.getBody();
        assertThat(body.get("code")).isEqualTo("FILE_CONTENT_MISSING");
        assertThat(body.get("fileId")).isEqualTo(42L);
        verify(hubFileService, never()).getFileById(42L);
    }
}
