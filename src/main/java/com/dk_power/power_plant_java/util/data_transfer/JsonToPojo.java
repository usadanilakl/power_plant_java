package com.dk_power.power_plant_java.util.data_transfer;

import com.dk_power.power_plant_java.entities.plant.Point;
import com.dk_power.power_plant_java.entities.plant.files.FileObject;
import com.dk_power.power_plant_java.sevice.plant.impl.FileServiceImpl;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.AllArgsConstructor;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.io.InputStream;
import java.util.Collections;
import java.util.List;

public class JsonToPojo<T> {
    public List<T> readProductsFromFile(String filename) {
        ObjectMapper objectMapper = new ObjectMapper();
        TypeReference<List<T>> typeReference = new TypeReference<>() {};
        InputStream inputStream = TypeReference.class.getResourceAsStream(filename);
        try {
            return objectMapper.readValue(inputStream, typeReference);
        } catch (IOException e) {
            System.err.println("Unable to read products from file: " + e.getMessage());
            return Collections.emptyList();
        }
    }

    public List<T> readProductsFromFile(String filename, Class<T> typeParameterClass) {
        ObjectMapper objectMapper = new ObjectMapper();
        InputStream inputStream = TypeReference.class.getResourceAsStream(filename);
        try {
            return objectMapper.readValue(inputStream, objectMapper.getTypeFactory().constructCollectionType(List.class, typeParameterClass));
        } catch (IOException e) {
            System.err.println("Unable to read products from file: " + e.getMessage());
            return Collections.emptyList();
        }
    }




}
