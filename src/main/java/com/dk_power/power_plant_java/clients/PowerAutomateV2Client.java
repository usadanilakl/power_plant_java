package com.dk_power.power_plant_java.clients;


import com.dk_power.power_plant_java.dto.pa.PaRequestDto;
import com.dk_power.power_plant_java.dto.pa.PaResponseDto;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;

/**
 * Generic Power Automate client for V2 flows (SharePoint List-based).
 * All flows share the same request/response schema.
 */
@Slf4j
@Component
public class PowerAutomateV2Client {

    @Value("${pa.flow.work-request-url:}")
    private String workRequestFlowUrl;

    @Value("${pa.flow.jha-url:}")
    private String jhaFlowUrl;

    @Value("${pa.flow.confined-space-url:}")
    private String confinedSpaceFlowUrl;

    @Value("${pa.flow.safe-work-url:}")
    private String safeWorkFlowUrl;

    @Value("${pa.flow.hot-work-url:}")
    private String hotWorkFlowUrl;

    @Value("${pa.flow.loto-url:}")
    private String lotoFlowUrl;

    @Value("${pa.flow.energized-work-url:}")
    private String energizedWorkFlowUrl;

    @Value("${pa.flow.excavation-url:}")
    private String excavationFlowUrl;

    @Value("${pa.flow.venting-url:}")
    private String ventingFlowUrl;

    @Value("${pa.flow.instrument-url:}")
    private String instrumentFlowUrl;

    @Value("${pa.flow.instrument-log-url:}")
    private String instrumentLogFlowUrl;

    @Value("${pa.flow.field-list-url:}")
    private String fieldListFlowUrl;

    @Value("${pa.flow.inventory-url:}")
    private String inventoryFlowUrl;

    @Value("${pa.flow.sds-url:}")
    private String sdsFlowUrl;

    private final ObjectMapper mapper = new ObjectMapper();

    /**
     * Send a request to a Power Automate flow and parse the standardized response.
     */
    public PaResponseDto sendRequest(String flowUrl, PaRequestDto request) {
        if (flowUrl == null || flowUrl.isBlank()) {
            throw new IllegalStateException("Flow URL is not configured");
        }

        try {
            String jsonBody = mapper.writeValueAsString(request);
            log.info("[PA-V2] Sending to flow: actionType={}, url={}...{}",
                    request.getActionType(),
                    flowUrl.substring(0, Math.min(60, flowUrl.length())),
                    flowUrl.length() > 60 ? "..." : "");
            log.debug("[PA-V2] Request body: {}", jsonBody);

            HttpClient client = HttpClient.newBuilder()
                    .connectTimeout(Duration.ofSeconds(30))
                    .build();

            HttpRequest httpRequest = HttpRequest.newBuilder()
                    .uri(URI.create(flowUrl))
                    .header("Content-Type", "application/json")
                    .timeout(Duration.ofSeconds(60))
                    .POST(HttpRequest.BodyPublishers.ofString(jsonBody))
                    .build();

            HttpResponse<String> response = client.send(httpRequest, HttpResponse.BodyHandlers.ofString());

            log.info("[PA-V2] Response: status={}", response.statusCode());
            log.debug("[PA-V2] Response body: {}", response.body());

            if (response.statusCode() == 200 || response.statusCode() == 201 || response.statusCode() == 202) {
                return mapper.readValue(response.body(), PaResponseDto.class);
            } else {
                PaResponseDto errorResponse = new PaResponseDto();
                errorResponse.setSuccess(false);
                errorResponse.setMessage("PA flow returned status " + response.statusCode() + ": " + response.body());
                return errorResponse;
            }

        } catch (IOException | InterruptedException e) {
            log.error("[PA-V2] Request failed: {}", e.getMessage());
            if (e instanceof InterruptedException) {
                Thread.currentThread().interrupt();
            }
            throw new RuntimeException("Power Automate V2 request failed: " + e.getMessage(), e);
        }
    }

    public PaResponseDto workRequest(PaRequestDto request) {
        return sendRequest(workRequestFlowUrl, request);
    }

    public PaResponseDto jha(PaRequestDto request) {
        return sendRequest(jhaFlowUrl, request);
    }

    public PaResponseDto confinedSpace(PaRequestDto request) {
        return sendRequest(confinedSpaceFlowUrl, request);
    }

    public boolean isWorkRequestConfigured() {
        return workRequestFlowUrl != null && !workRequestFlowUrl.isBlank();
    }

    public boolean isJhaConfigured() {
        return jhaFlowUrl != null && !jhaFlowUrl.isBlank();
    }

    public boolean isConfinedSpaceConfigured() {
        return confinedSpaceFlowUrl != null && !confinedSpaceFlowUrl.isBlank();
    }

    public PaResponseDto safeWork(PaRequestDto request) {
        return sendRequest(safeWorkFlowUrl, request);
    }

    public PaResponseDto hotWork(PaRequestDto request) {
        return sendRequest(hotWorkFlowUrl, request);
    }

    public PaResponseDto loto(PaRequestDto request) {
        return sendRequest(lotoFlowUrl, request);
    }

    public PaResponseDto energizedWork(PaRequestDto request) {
        return sendRequest(energizedWorkFlowUrl, request);
    }

    public PaResponseDto excavation(PaRequestDto request) {
        return sendRequest(excavationFlowUrl, request);
    }

    public PaResponseDto venting(PaRequestDto request) {
        return sendRequest(ventingFlowUrl, request);
    }

    public boolean isSafeWorkConfigured() {
        return safeWorkFlowUrl != null && !safeWorkFlowUrl.isBlank();
    }

    public boolean isHotWorkConfigured() {
        return hotWorkFlowUrl != null && !hotWorkFlowUrl.isBlank();
    }

    public boolean isLotoConfigured() {
        return lotoFlowUrl != null && !lotoFlowUrl.isBlank();
    }

    public boolean isEnergizedWorkConfigured() {
        return energizedWorkFlowUrl != null && !energizedWorkFlowUrl.isBlank();
    }

    public boolean isExcavationConfigured() {
        return excavationFlowUrl != null && !excavationFlowUrl.isBlank();
    }

    public boolean isVentingConfigured() {
        return ventingFlowUrl != null && !ventingFlowUrl.isBlank();
    }

    public PaResponseDto instrument(PaRequestDto request) {
        return sendRequest(instrumentFlowUrl, request);
    }

    public PaResponseDto instrumentLog(PaRequestDto request) {
        return sendRequest(instrumentLogFlowUrl, request);
    }

    public boolean isInstrumentConfigured() {
        return instrumentFlowUrl != null && !instrumentFlowUrl.isBlank();
    }

    public boolean isInstrumentLogConfigured() {
        return instrumentLogFlowUrl != null && !instrumentLogFlowUrl.isBlank();
    }

    public PaResponseDto fieldList(PaRequestDto request) {
        return sendRequest(fieldListFlowUrl, request);
    }

    public boolean isFieldListConfigured() {
        return fieldListFlowUrl != null && !fieldListFlowUrl.isBlank();
    }

    /**
     * Single Inventory flow — serves both the "Inventory" and "Inventory Usage"
     * SharePoint lists. The request's {@code entity} field ("item" | "usage")
     * tells the flow which list to act on.
     */
    public PaResponseDto inventory(PaRequestDto request) {
        return sendRequest(inventoryFlowUrl, request);
    }

    public boolean isInventoryConfigured() {
        return inventoryFlowUrl != null && !inventoryFlowUrl.isBlank();
    }

    /**
     * Single SDS flow — serves BOTH the "SDS" and "SDS Audit" SharePoint lists. The request's
     * {@code entity} discriminator ("chemical" | "audit") tells the flow which list to act on.
     */
    public PaResponseDto sds(PaRequestDto request) {
        return sendRequest(sdsFlowUrl, request);
    }

    public boolean isSdsConfigured() {
        return sdsFlowUrl != null && !sdsFlowUrl.isBlank();
    }

}
