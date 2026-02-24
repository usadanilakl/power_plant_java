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

}
