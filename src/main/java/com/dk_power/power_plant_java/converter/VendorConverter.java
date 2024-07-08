package com.dk_power.power_plant_java.converter;

import org.springframework.boot.context.properties.ConfigurationPropertiesBinding;
import org.springframework.context.annotation.Lazy;
import org.springframework.core.convert.converter.Converter;
import org.springframework.stereotype.Component;

@Component
@ConfigurationPropertiesBinding
public class VendorConverter implements Converter<String, VendorDto> {
    private final VendorServiceImpl service;

    public VendorConverter(@Lazy VendorServiceImpl service) {
        this.service = service;
    }

    @Override
    public VendorDto convert(String source) {
        if (source == null || source.equals("")) {
            return null;
        }
        return service.getDtoById(Long.parseLong(source), VendorDto.class);
    }
}
