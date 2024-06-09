package com.dk_power.power_plant_java.converter;

import com.dk_power.power_plant_java.entities.plant.EquipmentType;
import com.dk_power.power_plant_java.entities.plant.Group;
import com.dk_power.power_plant_java.sevice.plant.GroupService;
import org.springframework.boot.context.properties.ConfigurationPropertiesBinding;
import org.springframework.context.annotation.Lazy;
import org.springframework.core.convert.converter.Converter;
import org.springframework.stereotype.Component;

@Component
@ConfigurationPropertiesBinding
public class GroupConverter<T extends Group> implements Converter<String, T> {
    private final GroupService<T> service;

    public GroupConverter(@Lazy GroupService<T> servcie) {
        this.service = servcie;
    }

    @Override
    public T convert(String source) {
        if (source == null || source.equals("")) {
            return null;
        }
        return service.getById(Long.parseLong(source));
    }
}
