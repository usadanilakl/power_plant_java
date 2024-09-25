package com.dk_power.power_plant_java.sevice.data_transfer;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.io.File;
import java.io.IOException;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class JsonWriterService {
    public void writeJsonFile(String filePath, Object data) {
        ObjectMapper objectMapper = new ObjectMapper();
        objectMapper.enable(SerializationFeature.INDENT_OUTPUT);

        File file = new File(filePath);
        try {
            List<Object> jsonData = new ArrayList<>();
            if (file.exists()) {
                // Read existing data
                jsonData = objectMapper.readValue(file, new TypeReference<List<Object>>(){});
            }
            // Add new data
            jsonData.add(data);

            // Write updated data back to file
            objectMapper.writeValue(file, jsonData);
            System.out.println("JSON data has been added to the file at: " + filePath);
        } catch (IOException e) {
            System.out.println("An error occurred while writing to the JSON file:");
            e.printStackTrace();
        }
    }
}
