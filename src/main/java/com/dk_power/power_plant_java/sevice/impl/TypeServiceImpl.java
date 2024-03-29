package com.dk_power.power_plant_java.sevice.impl;

import com.dk_power.power_plant_java.model.Type;
import com.dk_power.power_plant_java.repository.TypeRepo;
import com.dk_power.power_plant_java.sevice.TypeService;
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
    @Override
    public void createNewType(String category, String group, String type) {
        tr.save(Type.builder().category(category).group(group).type(type).build());
    }

    @Override
    public List<Type> getAllGroups(String group) {
        return tr.findByGroup(group);
    }

    @Override
    public List<Type> getAllCategories(String category) {
        return tr.findByCategory(category);
    }


}
