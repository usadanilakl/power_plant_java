package com.dk_power.power_plant_java.config;

import lombok.Getter;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.client.JdkClientHttpRequestFactory;
import org.springframework.web.client.RestTemplate;

import java.net.CookieManager;
import java.net.CookiePolicy;
import java.net.http.HttpClient;
import java.time.Duration;

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
        // Maximo issues JSESSIONID on every response. The default JVM CookieHandler may be set
        // by other libraries in this app, which would cause RestTemplate to send the session
        // cookie alongside the apikey on subsequent calls. Maximo then prefers session auth,
        // finds the session has no creds, and returns 401 BMXAA0021E.
        // Use a per-client CookieManager that rejects everything to keep each call apikey-only.
        HttpClient httpClient = HttpClient.newBuilder()
                .connectTimeout(Duration.ofMillis(connectTimeoutMs))
                .followRedirects(HttpClient.Redirect.NORMAL)
                .cookieHandler(new CookieManager(null, CookiePolicy.ACCEPT_NONE))
                .build();

        JdkClientHttpRequestFactory factory = new JdkClientHttpRequestFactory(httpClient);
        factory.setReadTimeout(Duration.ofMillis(readTimeoutMs));

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
