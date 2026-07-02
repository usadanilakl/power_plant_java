package com.dk_power.power_plant_java.config;

import lombok.Getter;
import lombok.extern.slf4j.Slf4j;
import org.apache.hc.client5.http.config.ConnectionConfig;
import org.apache.hc.client5.http.config.RequestConfig;
import org.apache.hc.client5.http.impl.classic.CloseableHttpClient;
import org.apache.hc.client5.http.impl.classic.HttpClients;
import org.apache.hc.client5.http.impl.io.PoolingHttpClientConnectionManager;
import org.apache.hc.client5.http.impl.io.PoolingHttpClientConnectionManagerBuilder;
import org.apache.hc.core5.util.Timeout;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.client.HttpComponentsClientHttpRequestFactory;
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

    @Value("${maximo.connect-timeout-ms:8000}")
    private int connectTimeoutMs;

    @Value("${maximo.read-timeout-ms:30000}")
    private int readTimeoutMs;

    /**
     * Maximo client backed by Apache HttpClient 5. Chosen over the JDK HttpClient specifically because
     * {@code maximo.jpowerusa.com} resolves to MULTIPLE IPs and one can be dead/filtered (SYN dropped) —
     * the JDK client connects to a single resolved address and does NOT fail over, so a dead IP hard-aborts
     * every call with "connect timed out". HttpClient 5's connection operator iterates ALL resolved
     * addresses and fails over to the next on a connect timeout, so it always reaches a live IP; a dead one
     * only costs one connect-timeout. Connections are pooled + kept alive, so warm calls skip the connect.
     *
     * Cookies are disabled: Maximo issues a JSESSIONID on every response, and if RestTemplate returned it
     * alongside the apikey, Maximo would prefer session auth (no creds) and 401 BMXAA0021E. apikey-only.
     */
    @Bean("maximoRestTemplate")
    public RestTemplate maximoRestTemplate() {
        ConnectionConfig connectionConfig = ConnectionConfig.custom()
                .setConnectTimeout(Timeout.ofMilliseconds(connectTimeoutMs))
                .setSocketTimeout(Timeout.ofMilliseconds(readTimeoutMs))
                .build();

        PoolingHttpClientConnectionManager connectionManager = PoolingHttpClientConnectionManagerBuilder.create()
                .setDefaultConnectionConfig(connectionConfig)
                .setMaxConnTotal(20)
                .setMaxConnPerRoute(20)
                .build();

        RequestConfig requestConfig = RequestConfig.custom()
                .setConnectionRequestTimeout(Timeout.ofMilliseconds(connectTimeoutMs))
                .setResponseTimeout(Timeout.ofMilliseconds(readTimeoutMs))
                .build();

        CloseableHttpClient httpClient = HttpClients.custom()
                .setConnectionManager(connectionManager)
                .setDefaultRequestConfig(requestConfig)
                .disableCookieManagement()      // apikey-only — never reuse Maximo's JSESSIONID
                .evictExpiredConnections()
                .build();

        HttpComponentsClientHttpRequestFactory factory = new HttpComponentsClientHttpRequestFactory(httpClient);

        RestTemplate rt = new RestTemplate(factory);
        rt.getInterceptors().add((req, body, exec) -> {
            HttpHeaders h = req.getHeaders();
            h.set("apikey", apiKey);
            if (!h.containsKey(HttpHeaders.ACCEPT)) {
                h.set(HttpHeaders.ACCEPT, MediaType.APPLICATION_JSON_VALUE);
            }
            return exec.execute(req, body);
        });
        log.info("[Maximo] Configured RestTemplate (HttpClient5, failover+pooled) baseUrl={} site={} connectTimeoutMs={}",
                baseUrl, defaultSite, connectTimeoutMs);
        return rt;
    }
}
