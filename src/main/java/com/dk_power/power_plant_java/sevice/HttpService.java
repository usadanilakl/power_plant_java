package com.dk_power.power_plant_java.sevice;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;

import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;

public class HttpService {

    private static final HttpClient client = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(10))
            .build();

    private static final ObjectMapper mapper = new ObjectMapper();

    /**
     * Generic HTTP POST request supporting any response type (object, list, etc.)
     *
     * @param requestBody Request payload (any serializable object)
     * @param url API endpoint
     * @param typeRef Type reference defining expected response type (e.g., new TypeReference<List<MyDto>>() {})
     */
    public static <T> T postRequest(Object requestBody, String url, TypeReference<T> typeRef)
            throws IOException, InterruptedException {

        String jsonBody = mapper.writeValueAsString(requestBody);

        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(url))
                .timeout(Duration.ofSeconds(30))
                .header("Content-Type", "application/json")
                .POST(HttpRequest.BodyPublishers.ofString(jsonBody))
                .build();

        HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());
        int statusCode = response.statusCode();

        if (statusCode >= 200 && statusCode < 300) {
            return mapper.readValue(response.body(), typeRef);
        }

        String error = String.format("HTTP %d: %s -> %s",
                statusCode, url, response.body());
        throw new IOException(error);
    }
}