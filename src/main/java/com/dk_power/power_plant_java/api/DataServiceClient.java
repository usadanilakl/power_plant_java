package com.dk_power.power_plant_java.api;

import com.dk_power.power_plant_java.dto.data_service_project_dtos.ApiResponse;
import com.dk_power.power_plant_java.dto.data_service_project_dtos.equipment.DS_EquipmentDto;
import com.dk_power.power_plant_java.dto.data_service_project_dtos.equipment.DS_LotoPointDto;
import com.dk_power.power_plant_java.dto.data_service_project_dtos.files.DS_FileElementDto;
import com.dk_power.power_plant_java.dto.data_service_project_dtos.files.DS_FileObjectDtoDS;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.apache.poi.ss.formula.functions.T;
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
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class DataServiceClient {

    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;
    private final String baseUrl = "http://localhost:8081";


    public ResponseEntity<DS_FileElementDto> createFileElement(String fileId, DS_FileElementDto fileElementDto) {
        String url = baseUrl + "/api/file-elements/" + fileId;
        return executePost(url, fileElementDto, DS_FileElementDto.class);
    }

    public DS_FileElementDto getFileElementByEqId(UUID id) {
        String url = baseUrl + "/api/file-elements/" + id;
        ResponseEntity<ApiResponse<DS_FileElementDto>> response = executeGet(url, new ParameterizedTypeReference<ApiResponse<DS_FileElementDto>>() {});
        if (response!= null && response.getBody()!= null) {
            return response.getBody().getData();
        }
        return null;
    }

    public DS_FileObjectDtoDS getFileObjectById(UUID id) {
        String url = baseUrl + "/api/files/" + id;
        ResponseEntity<ApiResponse<DS_FileObjectDtoDS>> response = executeGet(url, new ParameterizedTypeReference<ApiResponse<DS_FileObjectDtoDS>>() {});
        if (response != null && response.getBody() != null) {
            return response.getBody().getData();
        }
        return null;
    }

    public ResponseEntity<DS_EquipmentDto> createEquipment(String fileId, DS_EquipmentDto equipmentDto) {
        String url = baseUrl + "/api/equipment/" + fileId;
        return executePost(url, equipmentDto, DS_EquipmentDto.class);
    }

    public DS_EquipmentDto getEquipmentById(UUID dataServiceItemId) {
        String url = baseUrl + "/api/equipment/" + dataServiceItemId;
        ResponseEntity<ApiResponse<DS_EquipmentDto>> response = executeGet(url, new ParameterizedTypeReference<ApiResponse<DS_EquipmentDto>>() {});
        if (response!= null && response.getBody()!= null) {
            return response.getBody().getData();
        }
        return null;
    }

    public ResponseEntity<DS_LotoPointDto> createOrUpdateLotoPoint(String fileId, DS_LotoPointDto lotoPointDto) {
        String url = baseUrl + "/api/loto-points/" + fileId;
        return executePost(url, lotoPointDto, DS_LotoPointDto.class);
    }

    public ResponseEntity<DS_LotoPointDto> createOrUpdateLotoPoint(DS_LotoPointDto lotoPointDto) {
        String url = baseUrl + "/api/loto-points";
        return executePost(url, lotoPointDto, DS_LotoPointDto.class);
    }

    public DS_LotoPointDto getLotoPointById(UUID lotoPointId) {
        String url = baseUrl + "/api/loto-points/" + lotoPointId;
        ResponseEntity<DS_LotoPointDto> response = executeGet(url, DS_LotoPointDto.class);
        assert response != null;
        return response.getBody();
    }

    public ResponseEntity<String> createConnector(String fileElementId, String fileObjectId) {
        String url = baseUrl + "/api/file-elements/connector/" + fileElementId + "/" + fileObjectId;
        return executePost(url, null, String.class);
    }

    public DS_FileObjectDtoDS transferFile(DS_FileObjectDtoDS newFileObject, File file) throws IOException {
        String url = baseUrl + "/api/files";

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.MULTIPART_FORM_DATA);

        MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
        body.add("fileDto", newFileObject);
        body.add("file", new FileSystemResource(file));

        HttpEntity<MultiValueMap<String, Object>> requestEntity = new HttpEntity<>(body, headers);

        try {
            ResponseEntity<ApiResponse<DS_FileObjectDtoDS>> response = restTemplate.exchange(
                    url,
                    HttpMethod.POST,
                    requestEntity,
                    new ParameterizedTypeReference<ApiResponse<DS_FileObjectDtoDS>>() {}
            );

            if (response.getStatusCode() == HttpStatus.OK && response.getBody() != null) {
                return response.getBody().getData();
            }
            throw new RuntimeException("Error creating file. Status: " + response.getStatusCode());
        } catch (HttpClientErrorException | HttpServerErrorException e) {
            throw new RuntimeException("Error during file transfer: " + e.getStatusCode() + " " + e.getResponseBodyAsString(), e);
        } catch (Exception e) {
            throw new RuntimeException("Unexpected error during file transfer: " + e.getMessage(), e);
        }
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