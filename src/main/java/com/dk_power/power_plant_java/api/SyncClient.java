package com.dk_power.power_plant_java.api;

import com.dk_power.power_plant_java.config.SyncConfig;
import com.dk_power.power_plant_java.entities.base_entities.BaseIdEntity;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.HttpServerErrorException;
import org.springframework.web.client.RestTemplate;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class SyncClient {

    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;
    private final SyncConfig syncConfig;


    public <T extends BaseIdEntity> void sendChangesToServer(String entityName, List<T> changes) {
        String url = syncConfig.getSyncServerUrl() + "/api/sync/" + entityName;
        ResponseEntity<Void> voidResponseEntity = executePost(url, changes, Void.class);
        System.out.println("Sent changes to server: " + voidResponseEntity);
    }

    public <T extends BaseIdEntity> List<T> getChangesFromServer(String entityName, LocalDateTime since) {
        String url = syncConfig.getSyncServerUrl() + "/api/sync/" + entityName + "?since=" + since;
        System.out.println("getting data from: " + url);
        ResponseEntity<List<T>> response = executeGet(url, new ParameterizedTypeReference<List<T>>() {
        });
        System.out.println(response);
        return response != null ? response.getBody() : null;
    }

    public <T extends BaseIdEntity> List<T> getChangesFromServer(String entityName, LocalDateTime since, int limit) {
        String url = syncConfig.getSyncServerUrl() + "/api/sync/" + entityName + "?since=" + since + "&limit=" + limit;
        System.out.println("Getting data from: " + url);
        ResponseEntity<List<T>> response = executeGet(url, new ParameterizedTypeReference<List<T>>() {
        });
        System.out.println("Response status: " + (response != null ? response.getStatusCode() : "N/A"));
        return response != null ? response.getBody() : null;
    }

    public <T extends BaseIdEntity> List<T> getChangesFromServer(String entityName, LocalDateTime since, int limit, LocalDateTime until) {
        String url = syncConfig.getSyncServerUrl() + "/api/sync/" + entityName + "?since=" + since + "&limit=" + limit + "&until=" + until;
        System.out.println("Getting data from: " + url);
        ResponseEntity<List<T>> response = executeGet(url, new ParameterizedTypeReference<List<T>>() {
        });
        System.out.println("Response status: " + (response != null ? response.getStatusCode() : "N/A"));
        return response != null ? response.getBody() : null;
    }




    private <T> ResponseEntity<T> executeGet(String url, ParameterizedTypeReference<T> responseType) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);

        HttpEntity<?> requestEntity = new HttpEntity<>(headers);

        try {
            return restTemplate.exchange(url, HttpMethod.GET, requestEntity, responseType);
        } catch (HttpClientErrorException | HttpServerErrorException e) {
            System.out.println("Error executing GET request: " + e.getStatusCode() + " " + e.getResponseBodyAsString());
            return null;
        } catch (Exception e) {
            System.out.println("Unexpected error executing GET request: " + e.getMessage());
            e.printStackTrace();
            return null;
        }
    }

    private <T> ResponseEntity<T> executeGet(String url, Class<T> responseType) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);

        HttpEntity<?> requestEntity = new HttpEntity<>(headers);

        try {
            return restTemplate.exchange(url, HttpMethod.GET, requestEntity, responseType);
        } catch (HttpClientErrorException | HttpServerErrorException e) {
            System.out.println("Error executing GET request: " + e.getStatusCode() + " " + e.getResponseBodyAsString());
            return null;
        } catch (Exception e) {
            System.out.println("Unexpected error executing GET request: " + e.getMessage());
            e.printStackTrace();
            return null;
        }
    }

    private <T> ResponseEntity<T> executePost(String url, Object body, Class<T> responseType) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);

        HttpEntity<?> requestEntity = new HttpEntity<>(body, headers);

        try {
            return restTemplate.exchange(url, HttpMethod.POST, requestEntity, responseType);
        } catch (HttpClientErrorException | HttpServerErrorException e) {
            System.out.println("Error executing request: " + e.getStatusCode() + " " + e.getResponseBodyAsString());
            return null;
        } catch (Exception e) {
            System.out.println("Unexpected error executing request: " + e.getMessage());
            e.printStackTrace();
            return null;
        }
    }

}