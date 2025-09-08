package com.dk_power.power_plant_java.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpRequest;
import org.springframework.http.client.ClientHttpRequestExecution;
import org.springframework.http.client.ClientHttpRequestInterceptor;
import org.springframework.http.client.ClientHttpResponse;

import java.io.IOException;
import java.nio.charset.StandardCharsets;

public class LoggingInterceptor implements ClientHttpRequestInterceptor {
    private static final Logger logger = LoggerFactory.getLogger(LoggingInterceptor.class);

    @Override
    public ClientHttpResponse intercept(HttpRequest request, byte[] body, ClientHttpRequestExecution execution) throws IOException {
        logRequest(request, body);
        ClientHttpResponse response = execution.execute(request, body);
        logResponse(response);
        return response;
    }

    private void logRequest(HttpRequest request, byte[] body) {
        logger.debug("Request URI: {}", request.getURI());
        logger.debug("Request method: {}", request.getMethod());
        logger.debug("Request headers: {}", request.getHeaders());
        logger.debug("Request body: {}", new String(body, StandardCharsets.UTF_8));
    }

    private void logResponse(ClientHttpResponse response) throws IOException {
        logger.debug("Response status code: {}", response.getStatusCode());
        logger.debug("Response status text: {}", response.getStatusText());
        // To log response body, you'd need to buffer the response. Optional:
        // String responseBody = StreamUtils.copyToString(response.getBody(), StandardCharsets.UTF_8);
        // logger.debug("Response body: {}", responseBody);
    }
}
