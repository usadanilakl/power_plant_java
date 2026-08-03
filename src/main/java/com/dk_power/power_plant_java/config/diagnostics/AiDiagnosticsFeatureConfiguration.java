package com.dk_power.power_plant_java.config.diagnostics;

import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Configuration;

/**
 * Registers the opt-in AI diagnostics settings. The API itself is absent unless
 * {@code logging.ai-diagnostics.enabled=true}.
 */
@Configuration(proxyBeanMethods = false)
@EnableConfigurationProperties(AiDiagnosticsProperties.class)
public class AiDiagnosticsFeatureConfiguration {
}
