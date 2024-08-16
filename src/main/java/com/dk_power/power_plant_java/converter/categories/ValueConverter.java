package com.dk_power.power_plant_java.converter.categories;

import com.dk_power.power_plant_java.dto.categories.ValueDto;
import com.dk_power.power_plant_java.dto.permits.LotoDto;
import com.dk_power.power_plant_java.sevice.categories.ValueService;
import com.dk_power.power_plant_java.sevice.loto.LotoService;
import org.springframework.boot.context.properties.ConfigurationPropertiesBinding;
import org.springframework.context.annotation.Lazy;
import org.springframework.core.convert.converter.Converter;
import org.springframework.stereotype.Component;

@Component
@ConfigurationPropertiesBinding
public class ValueConverter implements Converter<String, ValueDto>{
    private final ValueService valueService;

    public ValueConverter(@Lazy ValueService valueService) {
        this.valueService = valueService;
    }

    @Override
    public ValueDto convert(String source) {
        if (source == null || source.equals("")) {
            return null;
        }
        return valueService.getDtoById(source);
    }
}
