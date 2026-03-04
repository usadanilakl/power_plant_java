package com.dk_power.power_plant_java.config;

import com.google.genai.Client;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Slf4j
@Configuration
@ConditionalOnProperty(name = "gemini.api.key")
public class GeminiConfig {

    @Value("${gemini.api.key}")
    private String apiKey;

    @Value("${gemini.model:gemini-2.5-flash}")
    private String modelName;

    @Bean
    public Client geminiClient() {
        log.info("[Gemini] Initializing client with model={}", modelName);
        return Client.builder().apiKey(apiKey).build();
    }

    @Bean("geminiModelName")
    public String geminiModelName() {
        return modelName;
    }
}
