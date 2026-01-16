package com.dk_power.power_plant_java.config;

import org.apache.hc.client5.http.classic.HttpClient;
import org.apache.hc.client5.http.config.RequestConfig;
import org.apache.hc.client5.http.impl.classic.HttpClientBuilder;
import org.apache.hc.client5.http.impl.io.PoolingHttpClientConnectionManager;
import org.apache.hc.core5.util.Timeout;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.io.ClassPathResource;
import org.springframework.core.io.Resource;
import org.springframework.http.client.HttpComponentsClientHttpRequestFactory;
import org.springframework.http.converter.FormHttpMessageConverter;
import org.springframework.http.converter.json.MappingJackson2HttpMessageConverter;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.ViewControllerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;
import org.springframework.web.servlet.resource.PathResourceResolver;

import java.io.IOException;

@Configuration
public class WebConfigurer implements WebMvcConfigurer {
    @Value("${project.root}")
    String projectRoot;

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        registry.addResourceHandler("/uploads/**")
                .addResourceLocations("file:./uploads/");
        // New configuration for Angular
//        registry.addResourceHandler("/angular/**")
//                .addResourceLocations("classpath:/static/angular/");
        registry.addResourceHandler("/angular/**")
                .addResourceLocations("classpath:/static/angular/")
                .setCachePeriod(3600)
                .resourceChain(true)
                .addResolver(new PathResourceResolver() {
                    @Override
                    protected Resource getResource(String resourcePath, Resource location) throws IOException {
                        Resource requestedResource = location.createRelative(resourcePath);
                        return requestedResource.exists() && requestedResource.isReadable() ? requestedResource
                                : new ClassPathResource("/static/angular/browser/index.html");
                    }
                });


        registry.addResourceHandler("/brady/**")
                .addResourceLocations("classpath:/static/brady/")
                .resourceChain(true)
                .addResolver(new PathResourceResolver() {
                    @Override
                    protected Resource getResource(String resourcePath, Resource location) throws IOException {
                        if (resourcePath.equals("print/list")) {
                            return null; // Let the controller handle this
                        }
                        Resource requestedResource = location.createRelative(resourcePath);
                        return requestedResource.exists() && requestedResource.isReadable() ? requestedResource
                                : new ClassPathResource("/static/brady/index.html");
                    }
                });

        // Configuration for Browser
        String resourceLocation = "file:" + projectRoot + "/browser/";
        registry.addResourceHandler("/browser/**")
                .addResourceLocations(resourceLocation)
                .setCachePeriod(3600)
                .resourceChain(true)
                .addResolver(new PathResourceResolver() {
                    @Override
                    protected Resource getResource(String resourcePath, Resource location) throws IOException {
                        Resource requestedResource = location.createRelative(resourcePath);
                        return requestedResource.exists() && requestedResource.isReadable()
                                ? requestedResource
                                : new ClassPathResource("/browser/index.html");
                    }
                });

        // Configuration for Browser
//        String workRequestLocation = "file:" + projectRoot + "/browser/automation/permits/work-request/work-request-table/index.html";
//        registry.addResourceHandler("/work-request/**")
//                .addResourceLocations(workRequestLocation)
//                .setCachePeriod(3600)
//                .resourceChain(true)
//                .addResolver(new PathResourceResolver() {
//                    @Override
//                    protected Resource getResource(String resourcePath, Resource location) throws IOException {
//                        Resource requestedResource = location.createRelative(resourcePath);
//                        return requestedResource.exists() && requestedResource.isReadable()
//                                ? requestedResource
//                                : new ClassPathResource("/work-request/index.html");
//                    }
//                });


    }

    @Override
    public void addViewControllers(ViewControllerRegistry registry) {
        registry.addViewController("/app/**").setViewName("forward:/angular/browser/index.csr.html");
        registry.addViewController("/print/**").setViewName("forward:/brady/index.html");
        registry.addViewController("/brows/**").setViewName("forward:/browser/index.html");
        registry.addViewController("/work-request").setViewName("forward:/browser/automation/permits/work-request/work-request-table/index.html");
    }


    @Bean
    public RestTemplate restTemplate() {
        // Configure connection pooling and timeouts for sync operations
        PoolingHttpClientConnectionManager connectionManager = new PoolingHttpClientConnectionManager();
        connectionManager.setMaxTotal(100); // Max total connections
        connectionManager.setDefaultMaxPerRoute(20); // Max connections per route

        RequestConfig requestConfig = RequestConfig.custom()
            .setConnectionRequestTimeout(Timeout.ofSeconds(30))
            .setResponseTimeout(Timeout.ofMinutes(5)) // Allow longer for large sync transfers
            .build();

        HttpClient httpClient = HttpClientBuilder.create()
            .setConnectionManager(connectionManager)
            .setDefaultRequestConfig(requestConfig)
            .build();

        HttpComponentsClientHttpRequestFactory requestFactory =
            new HttpComponentsClientHttpRequestFactory(httpClient);

        RestTemplate restTemplate = new RestTemplate(requestFactory);

        // Add FormHttpMessageConverter to handle multipart requests
        restTemplate.getMessageConverters().add(new FormHttpMessageConverter());

        // Ensure JSON conversion is available
        restTemplate.getMessageConverters().add(new MappingJackson2HttpMessageConverter());

        restTemplate.getInterceptors().add(new LoggingInterceptor());

        return restTemplate;
    }
}
