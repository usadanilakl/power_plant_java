package com.dk_power.power_plant_java.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpRequest;
import org.springframework.http.MediaType;
import org.springframework.http.client.ClientHttpRequestExecution;
import org.springframework.http.client.ClientHttpRequestInterceptor;
import org.springframework.http.client.ClientHttpResponse;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.Set;

public class LoggingInterceptor implements ClientHttpRequestInterceptor {
    private static final Logger logger = LoggerFactory.getLogger(LoggingInterceptor.class);

    // Content types that should not have their body logged
    private static final Set<String> BINARY_CONTENT_TYPES = Set.of(
        "application/octet-stream",
        "application/pdf",
        "image/",
        "audio/",
        "video/",
        "multipart/form-data"
    );

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

        // Skip logging body for binary/multipart requests
        if (body != null && body.length > 0 && !isBinaryContent(request.getHeaders().getContentType())) {
            // Limit body logging to prevent huge logs
            if (body.length > 1000) {
                logger.debug("Request body: {} ... ({} bytes total)",
                    new String(body, 0, 1000, StandardCharsets.UTF_8), body.length);
            } else {
                logger.debug("Request body: {}", new String(body, StandardCharsets.UTF_8));
            }
        } else if (body != null && body.length > 0) {
            logger.debug("Request body: [binary data, {} bytes]", body.length);
        }
    }

    private void logResponse(ClientHttpResponse response) throws IOException {
        logger.debug("Response status code: {}", response.getStatusCode());
        logger.debug("Response status text: {}", response.getStatusText());
    }

    private boolean isBinaryContent(MediaType contentType) {
        if (contentType == null) {
            return false;
        }
        String type = contentType.toString().toLowerCase();
        return BINARY_CONTENT_TYPES.stream().anyMatch(type::contains);
    }
}
