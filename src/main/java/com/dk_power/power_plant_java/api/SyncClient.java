package com.dk_power.power_plant_java.api;

import com.dk_power.power_plant_java.config.SyncConfig;
import com.dk_power.power_plant_java.entities.base_entities.BaseIdEntity;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
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
@Slf4j
public class SyncClient {

    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;
    private final SyncConfig syncConfig;


    public <T extends BaseIdEntity> void sendChangesToServer(String entityName, List<T> changes) {
        String url = syncConfig.getSyncServerUrl() + "/api/sync/" + entityName;
        ResponseEntity<Void> voidResponseEntity = executePost(url, changes, Void.class);
        log.debug("sync.client.send.complete entityType={} status={}", entityName,
                voidResponseEntity != null ? voidResponseEntity.getStatusCode() : null);
    }

    public <T extends BaseIdEntity> List<T> getChangesFromServer(String entityName, LocalDateTime since) {
        String url = syncConfig.getSyncServerUrl() + "/api/sync/" + entityName + "?since=" + since;
        ResponseEntity<List<T>> response = executeGet(url, new ParameterizedTypeReference<List<T>>() {
        });
        log.debug("sync.client.receive.complete entityType={} status={}", entityName,
                response != null ? response.getStatusCode() : null);
        return response != null ? response.getBody() : null;
    }

    public <T extends BaseIdEntity> List<T> getChangesFromServer(String entityName, LocalDateTime since, int limit) {
        String url = syncConfig.getSyncServerUrl() + "/api/sync/" + entityName + "?since=" + since + "&limit=" + limit;
        ResponseEntity<List<T>> response = executeGet(url, new ParameterizedTypeReference<List<T>>() {
        });
        log.debug("sync.client.receive.complete entityType={} status={}", entityName,
                response != null ? response.getStatusCode() : null);
        return response != null ? response.getBody() : null;
    }

    public <T extends BaseIdEntity> List<T> getChangesFromServer(String entityName, LocalDateTime since, int limit, LocalDateTime until) {
        String url = syncConfig.getSyncServerUrl() + "/api/sync/" + entityName + "?since=" + since + "&limit=" + limit + "&until=" + until;
        ResponseEntity<List<T>> response = executeGet(url, new ParameterizedTypeReference<List<T>>() {
        });
        log.debug("sync.client.receive.complete entityType={} status={}", entityName,
                response != null ? response.getStatusCode() : null);
        return response != null ? response.getBody() : null;
    }




    private <T> ResponseEntity<T> executeGet(String url, ParameterizedTypeReference<T> responseType) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);

        HttpEntity<?> requestEntity = new HttpEntity<>(headers);

        try {
            return restTemplate.exchange(url, HttpMethod.GET, requestEntity, responseType);
        } catch (HttpClientErrorException | HttpServerErrorException e) {
            log.warn("sync.client.get.rejected status={}", e.getStatusCode());
            return null;
        } catch (Exception e) {
            log.error("sync.client.get.failed exception={}", e.getClass().getSimpleName(), e);
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
            log.warn("sync.client.get.rejected status={}", e.getStatusCode());
            return null;
        } catch (Exception e) {
            log.error("sync.client.get.failed exception={}", e.getClass().getSimpleName(), e);
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
            log.warn("sync.client.post.rejected status={}", e.getStatusCode());
            return null;
        } catch (Exception e) {
            log.error("sync.client.post.failed exception={}", e.getClass().getSimpleName(), e);
            return null;
        }
    }

}
