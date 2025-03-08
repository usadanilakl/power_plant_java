package com.dk_power.power_plant_java.api;

import com.dk_power.power_plant_java.dto.data_service_project_dtos.ApiResponse;
import com.dk_power.power_plant_java.dto.data_service_project_dtos.equipment.DS_EquipmentDto;
import com.dk_power.power_plant_java.dto.data_service_project_dtos.equipment.DS_LotoPointDto;
import com.dk_power.power_plant_java.dto.data_service_project_dtos.files.DS_FileElementDto;
import com.dk_power.power_plant_java.dto.data_service_project_dtos.files.DS_FileObjectDtoDS;
import com.dk_power.power_plant_java.entities.base_entities.BaseIdEntity;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.core.io.FileSystemResource;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.HttpServerErrorException;
import org.springframework.web.client.RestTemplate;

import java.io.File;
import java.io.IOException;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class SyncClient {

    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;
    @Value("${sync.server.url}")
    private String baseUrl;


    public <T extends BaseIdEntity> void sendChangesToServer(String entityName, List<T> changes) {
        String url = baseUrl + "/api/sync/" + entityName;
        executePost(url, changes, Void.class);
    }

    public <T extends BaseIdEntity> List<T> getChangesFromServer(String entityName, LocalDateTime since) {
        String url = baseUrl + "/api/sync/" + entityName + "?since=" + since;
        ResponseEntity<List<T>> response = executeGet(url, new ParameterizedTypeReference<List<T>>() {});
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