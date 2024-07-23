package com.dk_power.power_plant_java.sevice.data_transfer.json;

import com.dk_power.power_plant_java.sevice.FilePathService;
import com.fasterxml.jackson.core.JsonParser;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.apache.poi.ss.formula.functions.T;

import java.io.FileInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.util.Collections;
import java.util.List;

public interface JsonToPojoService<T> {
    FilePathService getFilePathService();
    T getEntity();
//    default List<T> getPojoList(String filename) {
//        ObjectMapper objectMapper = new ObjectMapper();
//        objectMapper.configure(JsonParser.Feature.ALLOW_COMMENTS, true);
//        String fullPath = getFilePathService().getFullPath(filename);
//        System.err.println("=========================");
//        System.err.println(fullPath);
//        InputStream inputStream = TypeReference.class.getResourceAsStream(fullPath);
//        try {
//            return objectMapper.readValue(inputStream, objectMapper.getTypeFactory().constructCollectionType(List.class, getEntity().getClass()));
//        } catch (IOException e) {
//            System.err.println("Unable to read products from file: " + e.getMessage());
//            return Collections.emptyList();
//        }
//    }
default List<T> getPojoList(String filename) {
    ObjectMapper objectMapper = new ObjectMapper();
    objectMapper.configure(JsonParser.Feature.ALLOW_COMMENTS, true);

    try (InputStream inputStream = getFilePathService().getFileAsInputStream(filename)) {
        return objectMapper.readValue(inputStream, objectMapper.getTypeFactory().constructCollectionType(List.class, getEntity().getClass()));
    } catch (IOException e) {
        System.err.println("Unable to read products from file: " + e.getMessage());
        return Collections.emptyList();
    }
}
}
