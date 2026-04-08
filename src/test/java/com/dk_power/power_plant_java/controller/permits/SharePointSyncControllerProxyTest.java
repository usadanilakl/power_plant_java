package com.dk_power.power_plant_java.controller.permits;

import com.dk_power.power_plant_java.config.SharePointSyncSettings;
import com.dk_power.power_plant_java.config.SyncConfig;
import com.dk_power.power_plant_java.controller.angular.NgApiResponse;
import com.dk_power.power_plant_java.dto.sharepoint.SyncResult;
import com.dk_power.power_plant_java.sevice.sharepoint.SharePointSyncOrchestrator;
import com.dk_power.power_plant_java.sevice.sync.CentralSyncService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.client.HttpServerErrorException;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.client.RestTemplate;

import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * Verifies that the SharePoint sync controller on a non-hub client respects
 * the hub's authoritative rejection (503) rather than falling back to local sync.
 *
 * Critical invariant: when the hub says "paused", the client must NOT run local
 * SharePoint sync because that would bypass the migration's consistency guarantee.
 */
@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class SharePointSyncControllerProxyTest {

    @Mock private SharePointSyncSettings syncSettings;
    @Mock private SharePointSyncOrchestrator orchestrator;
    @Mock private SyncConfig syncConfig;
    @Mock private CentralSyncService centralSyncService;
    @Mock private RestTemplate restTemplate;

    private SharePointSyncController controller;

    @BeforeEach
    void setUp() {
        controller = new SharePointSyncController(
            syncSettings, orchestrator, syncConfig, centralSyncService, restTemplate);

        // Client mode (not hub), hub is online → proxy path
        when(syncConfig.isHubMode()).thenReturn(false);
        when(centralSyncService.isServerAvailable()).thenReturn(true);
        when(syncConfig.getSyncServerUrl()).thenReturn("http://hub:8090");
        when(orchestrator.isClientSyncInProgress()).thenReturn(false);
    }

    @Test
    void syncEntityType_returns503_whenHubRejectsWith503() {
        // Hub returns 503 (migration in progress)
        HttpServerErrorException hub503 = HttpServerErrorException.create(
            HttpStatus.SERVICE_UNAVAILABLE, "Service Unavailable",
            org.springframework.http.HttpHeaders.EMPTY,
            "{\"message\":\"Sync paused — try again shortly\"}".getBytes(),
            null);
        when(restTemplate.postForEntity(any(String.class), any(), eq(NgApiResponse.class)))
            .thenThrow(hub503);

        ResponseEntity<NgApiResponse<SyncResult>> response = controller.syncEntityType("WorkRequest");

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.SERVICE_UNAVAILABLE);
        // Critical: local sync MUST NOT have been invoked
        verify(orchestrator, never()).syncEntityType(any());
    }

    @Test
    void syncEntityType_fallsBackToLocal_whenHubUnreachable() {
        // Connection refused — hub is offline
        when(restTemplate.postForEntity(any(String.class), any(), eq(NgApiResponse.class)))
            .thenThrow(new ResourceAccessException("Connection refused"));

        // Local sync returns a successful result
        SyncResult local = new SyncResult();
        local.setCreated(5);
        when(orchestrator.syncEntityType("WorkRequest")).thenReturn(local);

        ResponseEntity<NgApiResponse<SyncResult>> response = controller.syncEntityType("WorkRequest");

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        // Fallback to local is expected on transport failure
        verify(orchestrator).syncEntityType("WorkRequest");
    }

    @Test
    void syncAll_returns503_whenHubRejectsAnyEntity() {
        when(orchestrator.getRegisteredEntityTypes()).thenReturn(List.of("WorkRequest", "Jha"));

        HttpServerErrorException hub503 = HttpServerErrorException.create(
            HttpStatus.SERVICE_UNAVAILABLE, "Service Unavailable",
            org.springframework.http.HttpHeaders.EMPTY,
            "{\"message\":\"Sync paused\"}".getBytes(),
            null);
        when(restTemplate.postForEntity(any(String.class), any(), eq(NgApiResponse.class)))
            .thenThrow(hub503);

        ResponseEntity<NgApiResponse<List<SyncResult>>> response = controller.syncAll();

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.SERVICE_UNAVAILABLE);
        // Critical: local sync MUST NOT have been invoked for any entity
        verify(orchestrator, never()).syncEntityType(any());
    }

    @Test
    void syncAll_fallsBackToLocal_whenHubUnreachable() {
        when(orchestrator.getRegisteredEntityTypes()).thenReturn(List.of("WorkRequest"));

        when(restTemplate.postForEntity(any(String.class), any(), eq(NgApiResponse.class)))
            .thenThrow(new ResourceAccessException("Connection refused"));
        SyncResult local = new SyncResult();
        when(orchestrator.syncEntityType("WorkRequest")).thenReturn(local);

        ResponseEntity<NgApiResponse<List<SyncResult>>> response = controller.syncAll();

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        verify(orchestrator).syncEntityType("WorkRequest");
    }

    @Test
    void syncEntityType_returns503_whenLocalClientSyncInProgress() {
        when(orchestrator.isClientSyncInProgress()).thenReturn(true);

        ResponseEntity<NgApiResponse<SyncResult>> response = controller.syncEntityType("WorkRequest");

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.SERVICE_UNAVAILABLE);
        verify(orchestrator, never()).syncEntityType(any());
        verify(restTemplate, never()).postForEntity(any(String.class), any(), eq(NgApiResponse.class));
    }

    @Test
    void syncEntityType_successfulProxy_returnsHubResult() {
        // Hub returns 200 with a success payload
        NgApiResponse<Map<String, Object>> body = new NgApiResponse<>(
            Map.of("created", 3, "updated", 1, "autoClosed", 0, "skipped", 0, "failed", 0),
            "ok");
        ResponseEntity<NgApiResponse> hubResponse = ResponseEntity.ok((NgApiResponse) body);
        when(restTemplate.postForEntity(any(String.class), any(), eq(NgApiResponse.class)))
            .thenReturn(hubResponse);

        ResponseEntity<NgApiResponse<SyncResult>> response = controller.syncEntityType("WorkRequest");

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody().getResponseData().getCreated()).isEqualTo(3);
        // Local sync NOT invoked — hub's result is used
        verify(orchestrator, never()).syncEntityType(any());
    }
}
