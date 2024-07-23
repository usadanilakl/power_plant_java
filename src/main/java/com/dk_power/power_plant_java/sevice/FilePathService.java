package com.dk_power.power_plant_java.sevice;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ClassPathResource;
import org.springframework.core.io.Resource;
import org.springframework.stereotype.Service;

import java.io.File;
import java.io.IOException;
import java.io.InputStream;

@Service
public class FilePathService {

    @Value("${file.path}")
    private String filePath;

    public String getFullPath(String filename) {
        ClassPathResource resource = new ClassPathResource(filePath  + filename);
        File file = null; // Converts the classpath resource to a File
        try {
            file = resource.getFile();
        } catch (IOException e) {
            throw new RuntimeException(e);
        }
        return file.getAbsolutePath();  // Returns the full path as a string
    }
    public InputStream getFileAsInputStream(String filename){
        Resource resource = new ClassPathResource(filename);
        try {
            return resource.getInputStream();
        } catch (IOException e) {
            throw new RuntimeException(e);
        }
    }
}
