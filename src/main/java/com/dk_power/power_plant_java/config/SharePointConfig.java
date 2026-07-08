package com.dk_power.power_plant_java.config;

import com.azure.identity.ClientCertificateCredential;
import com.azure.identity.ClientCertificateCredentialBuilder;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.web.client.RestTemplate;

import java.time.Duration;

@Slf4j
@Configuration
@ConditionalOnProperty(name = "sharepoint.azure.client-id")
public class SharePointConfig {

    @Value("${sharepoint.azure.client-id}")
    private String clientId;

    @Value("${sharepoint.azure.tenant-id}")
    private String tenantId;

    @Value("${sharepoint.azure.pfx-path}")
    private String pfxPath;

    @Value("${sharepoint.azure.pfx-password}")
    private String pfxPassword;

    @Bean
    public ClientCertificateCredential clientCertificateCredential() {
        log.info("[SharePoint] Building ClientCertificateCredential with clientId={}, tenantId={}", clientId, tenantId);
        return new ClientCertificateCredentialBuilder()
                .clientId(clientId)
                .tenantId(tenantId)
                .pfxCertificate(pfxPath, pfxPassword)
                .build();
    }

    @Bean("sharepointRestTemplate")
    public RestTemplate sharepointRestTemplate() {
        // Bounded timeouts so a hung SharePoint/Power-Automate endpoint can never pin the
        // calling thread (and, historically, a pooled DB connection) indefinitely.
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(Duration.ofSeconds(10));
        factory.setReadTimeout(Duration.ofSeconds(60));
        return new RestTemplate(factory);
    }
}
