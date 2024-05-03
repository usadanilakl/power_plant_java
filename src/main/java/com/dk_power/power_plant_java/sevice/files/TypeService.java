package com.dk_power.power_plant_java.sevice.files;

import com.dk_power.power_plant_java.entities.files.Type;

import java.util.List;

public interface TypeService {
    void createNewType(String section, String name);
    List<String> getAllSections();
    List<Type> getAllTypes(String section);
}
