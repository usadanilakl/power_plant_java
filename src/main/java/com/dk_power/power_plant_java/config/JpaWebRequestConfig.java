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

    @Override
    public void addInterceptors(InterceptorRegistry registry) {
        OpenEntityManagerInViewInterceptor interceptor = new OpenEntityManagerInViewInterceptor();
        interceptor.setEntityManagerFactory(entityManagerFactory);

        registry.addWebRequestInterceptor(interceptor)
            .addPathPatterns("/**")
            // SSE subscriptions are intentionally long-lived; keeping an EntityManager
            // open for the full stream lifetime can hold JDBC resources far too long.
            .excludePathPatterns("/api/sync/sse/**");
    }
}
