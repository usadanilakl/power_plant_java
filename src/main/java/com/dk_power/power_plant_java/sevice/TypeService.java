package com.dk_power.power_plant_java.sevice;

import com.dk_power.power_plant_java.model.Type;

import java.util.List;

public interface TypeService {
    void createNewType(String category, String group, String type);
    List<Type> getAllGroups(String group);
    List<Type> getAllCategories(String category);
}
