package com.dk_power.power_plant_java.config;

import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.client.RestTemplate;

/**
 * Configuration for email services.
 * Provides RestTemplate bean for Microsoft Graph API email sending.
 * Reuses existing ClientCertificateCredential from SharePointConfig.
 */
@Slf4j
@Configuration
@ConditionalOnProperty(name = "sharepoint.azure.client-id")
public class EmailConfig {

    @Bean("emailRestTemplate")
    public RestTemplate emailRestTemplate() {
        log.info("[Email] Creating emailRestTemplate bean");
        return new RestTemplate();
    }
}
