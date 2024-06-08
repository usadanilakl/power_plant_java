package com.dk_power.power_plant_java.sevice.files.impl;

import com.dk_power.power_plant_java.entities.files.FileUploader;
import com.dk_power.power_plant_java.repository.files.PidRepo;
import com.dk_power.power_plant_java.sevice.files.PidService;
import com.dk_power.power_plant_java.sevice.files.FileUploaderService;
import lombok.AllArgsConstructor;
import lombok.Data;
import org.apache.commons.io.IOUtils;
import org.kohsuke.github.GHContent;
import org.kohsuke.github.GHContentUpdateResponse;
import org.kohsuke.github.GitHub;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.PropertySource;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.FileNotFoundException;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.Base64;

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

    public String uploadFilesToLocal(FileUploader files){
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

    @Override
    public String uploadFilesToGitHub(FileUploader files, String path) {
        try {

            for (MultipartFile file : files.getFiles()) {
                uploadContent(file,path);
            }

        }catch (FileNotFoundException e) {
            createNewFolder(path);
            for (MultipartFile file : files.getFiles()) {
                uploadContentHandled(file,path);
            }
        } catch (IOException e) {
            e.printStackTrace();
        }
        return "Message";
    }

    private GitHub connectToGitHub(){
        try {
            return GitHub.connectUsingOAuth("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");
        } catch (IOException e) {
            throw new RuntimeException(e);
        }
    }
    private String uploadContent(MultipartFile file, String path) throws IOException {
        GitHub gitHub = connectToGitHub();
        byte[] bytes = IOUtils.toByteArray(file.getInputStream());
        String encodedContent = Base64.getEncoder().encodeToString(bytes);
        GHContentUpdateResponse response = gitHub.getUser("usadanilakl")
                .getRepository("power_plant_java")
                .createContent(encodedContent, "automated file upload", path + "/" + file.getOriginalFilename());
        return "Message";
    }
    private String uploadContentHandled(MultipartFile file, String path) {
        try {
            GitHub gitHub = connectToGitHub();
            byte[] bytes = IOUtils.toByteArray(file.getInputStream());
            String encodedContent = Base64.getEncoder().encodeToString(bytes);
            GHContentUpdateResponse response = gitHub.getUser("usadanilakl")
                    .getRepository("power_plant_java")
                    .createContent(encodedContent, "automated file upload", path + "/" + file.getOriginalFilename());
        } catch (IOException e) {
            throw new RuntimeException(e);
        }

        return "Message";
    }
    private String createNewFolder(String folderName){
        try {
            GitHub gitHub = connectToGitHub();
            GHContentUpdateResponse response = gitHub.getUser("usadanilakl")
                    .getRepository("power_plant_java")
                    .createContent("", "Create new directory", folderName+"/.gitkeep");

        } catch (IOException e) {
            e.printStackTrace();
        }
        return "Message";
    }


}
