package com.dk_power.power_plant_java.config;

import lombok.Getter;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.web.client.RestTemplate;

@Slf4j
@Getter
@Configuration
@ConditionalOnProperty(name = "maximo.api-key")
public class MaximoConfig {

    @Value("${maximo.base-url}")
    private String baseUrl;

    @Value("${maximo.api-key}")
    private String apiKey;

    @Value("${maximo.default-site:JG}")
    private String defaultSite;

    @Value("${maximo.connect-timeout-ms:10000}")
    private int connectTimeoutMs;

    @Value("${maximo.read-timeout-ms:30000}")
    private int readTimeoutMs;

    @Bean("maximoRestTemplate")
    public RestTemplate maximoRestTemplate() {
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(connectTimeoutMs);
        factory.setReadTimeout(readTimeoutMs);

        RestTemplate rt = new RestTemplate(factory);
        rt.getInterceptors().add((req, body, exec) -> {
            HttpHeaders h = req.getHeaders();
            h.set("apikey", apiKey);
            if (!h.containsKey(HttpHeaders.ACCEPT)) {
                h.set(HttpHeaders.ACCEPT, MediaType.APPLICATION_JSON_VALUE);
            }
            return exec.execute(req, body);
        });
        log.info("[Maximo] Configured RestTemplate baseUrl={} site={}", baseUrl, defaultSite);
        return rt;
    }
}
