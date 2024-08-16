package com.dk_power.power_plant_java.converter.loto;

import com.dk_power.power_plant_java.dto.permits.BoxDto;
import com.dk_power.power_plant_java.sevice.loto.BoxService;
import org.springframework.boot.context.properties.ConfigurationPropertiesBinding;
import org.springframework.context.annotation.Lazy;
import org.springframework.core.convert.converter.Converter;
import org.springframework.stereotype.Component;

@Component
@ConfigurationPropertiesBinding
public class BoxConverter implements Converter<String, BoxDto> {
    private final BoxService boxService;

    public BoxConverter(@Lazy BoxService boxService) {
        this.boxService = boxService;
    }

    @Override
    public BoxDto convert(String source) {
        if (source == null || source.equals("")) {
            return null;
        }
        return boxService.getBoxDtoById(Long.parseLong(source));
    }
}
