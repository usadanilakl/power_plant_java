package com.dk_power.power_plant_java.config;

import jakarta.persistence.EntityManagerFactory;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Configuration;
import org.springframework.orm.jpa.support.OpenEntityManagerInViewInterceptor;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
@RequiredArgsConstructor
public class JpaWebRequestConfig implements WebMvcConfigurer {

    private final EntityManagerFactory entityManagerFactory;
    private final org.springframework.core.env.Environment environment;

    @Override
    public void addInterceptors(InterceptorRegistry registry) {
        // Hub mode: do NOT register the open-in-view interceptor at all.
        // All hub endpoints use explicit @Transactional or TransactionTemplate.
        // The interceptor holds a DB connection for the entire HTTP request,
        // causing connection leaks when sync exchange or heal endpoints run long.
        for (String profile : environment.getActiveProfiles()) {
            if ("hub".equalsIgnoreCase(profile)) {
                return;
            }
        }

        OpenEntityManagerInViewInterceptor interceptor = new OpenEntityManagerInViewInterceptor();
        interceptor.setEntityManagerFactory(entityManagerFactory);

        registry.addWebRequestInterceptor(interceptor)
            .addPathPatterns("/**")
            .excludePathPatterns("/api/sync/sse/**")
            .excludePathPatterns("/api/sync-updates/**");
    }
}
