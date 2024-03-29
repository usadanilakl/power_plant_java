package com.dk_power.power_plant_java.sevice.impl;

import com.dk_power.power_plant_java.model.FileUploader;
import com.dk_power.power_plant_java.repository.PidRepo;
import com.dk_power.power_plant_java.sevice.PidService;
import com.dk_power.power_plant_java.sevice.FileUploaderService;
import lombok.AllArgsConstructor;
import lombok.Data;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.PropertySource;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;

@AllArgsConstructor
@Data
@Service

@Configuration
@PropertySource("classpath:messages.properties")
public class FileUploaderServiceImpl implements FileUploaderService {

    private final PidService ps;
    private final PidRepo pr;
//    @Value("${message.success}")
//    private String sucessUpload;
//    @Value("${message.failed}")
//    private String failedUpload;

    public String uploadFiles(FileUploader files){
        String message = "Files are successfully uploaded.";
        try {
            for (MultipartFile file : files.getFiles()) {
                String name = file.getOriginalFilename();
                String folder = "/src/main/resources/static/uploads/"+files.getType()+"/";
                String rootFolder = "./uploads/"+files.getType()+"/";
                String baseDir = System.getProperty("user.dir") + folder;
                Path path = Paths.get(baseDir + name);
                Files.createDirectories(path.getParent());
                file.transferTo(path.toFile());

               ps.createNewPid("File",null, name, files.getVendor(), rootFolder, null);
            }
        }catch (IOException e){
            //throw new RuntimeException("failedUpload");
            message = "Upload Failed";
        }
        return message;
    }



}
