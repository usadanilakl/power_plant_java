package com.dk_power.power_plant_java.api;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import java.util.HashMap;
import java.util.Map;

@Component
public class ElectronAppClient {

    private final RestTemplate restTemplate;
    private final String baseUrl = "http://localhost:3000";

    @Value("${server.port}")
    private String appPort;

    @Autowired
    public ElectronAppClient(RestTemplate restTemplate) {
        this.restTemplate = restTemplate;
    }

    public <T> ResponseEntity<T> get(String endpoint, Class<T> responseType) {
        String url = baseUrl + endpoint;
        return restTemplate.getForEntity(url, responseType);
    }

    public <T> ResponseEntity<T> post(String endpoint, Object body, Class<T> responseType) {
        String url = baseUrl + endpoint;
        return restTemplate.postForEntity(url, body, responseType);
    }

    public <T> ResponseEntity<T> put(String endpoint, Object body, Class<T> responseType) {
        String url = baseUrl + endpoint;
        return restTemplate.exchange(url, HttpMethod.PUT, new HttpEntity<>(body), responseType);
    }

    public void delete(String endpoint) {
        String url = baseUrl + endpoint;
        restTemplate.delete(url);
    }

    public void startIsCompleted() {
        Map<String, String> body = new HashMap<>();
        body.put("app", "power_plant_java");
        body.put("port", "http://localhost:"+appPort);
        post("/startup-complete", "power_plant_java", Void.class);
        System.out.println("Start completed event sent to electron app");
    }

    public String ping() {
        return get("/ping", String.class).getBody();
    }
}