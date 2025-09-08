package com.dk_power.power_plant_java.clients;

import com.dk_power.power_plant_java.dto.permits.WorkRequestDto;
import com.dk_power.power_plant_java.repository.permits.WorkRequestRepo;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Component
@RequiredArgsConstructor
public class PowerAutomateClient {

    private static final String WORK_REQUEST_URL = "https://defaultaad523c05eba4f99a71343a0609578.cb.environment.api.powerplatform.com:443/powerautomate/automations/direct/workflows/b6c024f8020c42a4b697425a84a97653/triggers/manual/paths/invoke?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=qWEExDdL83FWcObWTykEQEG01HKHWAnvKBzA-ttwvms";

    public List<WorkRequestDto> getAllRequests() {
        Map<String, String> reqBody = new HashMap<>();
        reqBody.put("actionType", "getAllRequests");

        try {
            // Call your HttpClient-based method directly and get the list
            List<WorkRequestDto> workRequests = getWorkRequestsHttp(reqBody);
            return workRequests != null ? workRequests : Collections.emptyList();
        } catch (IOException | InterruptedException e) {
            System.err.println("Error fetching work requests: " + e.getMessage());
            return Collections.emptyList();
        }
    }


    public List<WorkRequestDto> getWorkRequestsHttp(Map<String, String> requestBody) throws IOException, InterruptedException {
        HttpClient client = HttpClient.newHttpClient();
        ObjectMapper mapper = new ObjectMapper();

        // Serialize Map to JSON string
        String jsonBody = mapper.writeValueAsString(requestBody);

        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(WORK_REQUEST_URL))
                .header("Content-Type", "application/json")
                .POST(HttpRequest.BodyPublishers.ofString(jsonBody))
                .build();

        HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());

        int statusCode = response.statusCode();

        if (statusCode == 200) {
            String responseBody = response.body();
            // Deserialize JSON array to List<WorkRequestDto>
            return mapper.readValue(responseBody, new TypeReference<List<WorkRequestDto>>() {});
        } else {
            throw new IOException("HTTP request failed with status code: " + statusCode + ", response: " + response.body());
        }
    }


    public void archiveWorkRequests(){
        try {
            getWorkRequestsHttp(Map.of("actionType","archive"));
        } catch (IOException e) {
            throw new RuntimeException(e);
        } catch (InterruptedException e) {
            throw new RuntimeException(e);

        }
    }
}