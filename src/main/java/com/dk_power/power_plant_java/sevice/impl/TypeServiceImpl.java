package com.dk_power.power_plant_java.sevice.impl;

import com.dk_power.power_plant_java.model.Type;
import com.dk_power.power_plant_java.repository.TypeRepo;
import com.dk_power.power_plant_java.sevice.TypeService;
import jakarta.persistence.EntityManager;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
@Service
@AllArgsConstructor
@Data
public class TypeServiceImpl implements TypeService {
    private final TypeRepo tr;
    private final EntityManager entityManager;
    @Override
    public void createNewType(String section, String name) {
        tr.save(Type.builder().section(section).name(name).build());
    }

    @Override
    public List<String> getAllSections() {
        return null;
    }

    @Override
    public List<Type> getAllTypes(String section) {
        return null;
    }


}
