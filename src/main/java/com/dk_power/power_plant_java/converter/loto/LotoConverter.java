package com.dk_power.power_plant_java.converter.loto;

import com.dk_power.power_plant_java.dto.permits.LotoDto;
import com.dk_power.power_plant_java.sevice.loto.LotoService;
import org.springframework.boot.context.properties.ConfigurationPropertiesBinding;
import org.springframework.context.annotation.Lazy;
import org.springframework.core.convert.converter.Converter;
import org.springframework.stereotype.Component;

@Component
@ConfigurationPropertiesBinding
public class LotoConverter implements Converter<String,LotoDto>{
    private final LotoService lotoService ;

    public LotoConverter(@Lazy LotoService lotoService) {
        this.lotoService = lotoService;
    }

    @Override
    public LotoDto convert(String source) {
        if (source == null || source.equals("")) {
            return null;
        }
        return lotoService.getDtoById(source);
    }
}
