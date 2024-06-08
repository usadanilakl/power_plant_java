package com.dk_power.power_plant_java.sevice.files.impl;

import com.dk_power.power_plant_java.entities.files.FileUploader;
import com.dk_power.power_plant_java.repository.files.PidRepo;
import com.dk_power.power_plant_java.repository.plant.FileRepo;
import com.dk_power.power_plant_java.sevice.files.PidService;
import com.dk_power.power_plant_java.sevice.files.FileUploaderService;
import com.dk_power.power_plant_java.sevice.plant.GroupService;
import com.dk_power.power_plant_java.util.PropertyReader;
import lombok.AllArgsConstructor;
import lombok.Data;
import org.apache.commons.io.IOUtils;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.rendering.PDFRenderer;
import org.kohsuke.github.GHContent;
import org.kohsuke.github.GHContentUpdateResponse;
import org.kohsuke.github.GHRepository;
import org.kohsuke.github.GitHub;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.PropertySource;
import org.springframework.stereotype.Service;
import org.springframework.util.ResourceUtils;
import org.springframework.web.multipart.MultipartFile;

import javax.imageio.ImageIO;
import java.awt.image.BufferedImage;
import java.io.File;
import java.io.FileNotFoundException;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardOpenOption;
import java.util.Base64;

@AllArgsConstructor
@Data
@Service

@Configuration
@PropertySource("classpath:messages.properties")
public class FileUploaderServiceImpl implements FileUploaderService {

    private final PidService ps;
    private final PidRepo pr;
    private final FileRepo fileRepo;
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

                String number = file.getOriginalFilename();
                com.dk_power.power_plant_java.entities.plant.File fileObj = new com.dk_power.power_plant_java.entities.plant.File();
                fileObj.setLink(path+"/"+number);
                fileObj.setNumber(number);
                fileRepo.save(fileObj);
            }
        } catch (IOException e) {
            e.printStackTrace();
        }
        return "Message";
    }

    @Override
    public byte[] getFileFromGitHub(String path) {
        GitHub gitHub = connectToGitHub();
        GHRepository repository = null;
        try {
            repository = gitHub.getRepository("usadanilakl" + "/" + "power_plant_java");
            GHContent fileContent = repository.getFileContent(path);
            byte[] file = IOUtils.toByteArray(fileContent.read());
            saveToFile(file,"display.pdf");
            return file;
        } catch (IOException e) {
            throw new RuntimeException(e);
        }
    }

    @Override
    public void PdfToJpgConverter() {
        try {
            String sourceDir = "uploads/display.pdf"; // Pdf files are read from this folder
            String destinationDir = "uploads/"; // converted images from pdf would be saved here

            File sourceFile = new File(sourceDir);
            File destinationFile = new File(destinationDir);

            if (!destinationFile.exists()) {
                destinationFile.mkdir();
            }
            if (sourceFile.exists()) {
                PDDocument document = PDDocument.load(sourceFile);

                PDFRenderer pdfRenderer = new PDFRenderer(document);
                int numberOfPages = document.getNumberOfPages();

                for (int i = 0; i < numberOfPages; ++i) {
                    BufferedImage bim = pdfRenderer.renderImageWithDPI(i, 300);
                    ImageIO.write(bim, "jpg", new File(destinationDir + "/" + (i + 1) + ".jpg"));
                }

                document.close();
                System.out.println("Images created");
            } else {
                System.err.println(sourceFile.getName() +" File not exists");
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    private GitHub connectToGitHub(){
        try {
            return GitHub.connectUsingOAuth(new PropertyReader().token);
        } catch (IOException e) {
            throw new RuntimeException(e);
        }
    }
    private String uploadContent(MultipartFile file, String path) throws IOException {
        GitHub gitHub = connectToGitHub();
        byte[] bytes = IOUtils.toByteArray(file.getInputStream());
        GHContentUpdateResponse response = gitHub.getUser("usadanilakl")
                .getRepository("power_plant_java")
                .createContent(bytes, "automated file upload", path + "/" + file.getOriginalFilename());
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
    public void saveToFile(byte[] content, String fileName) {
        try {
            String userHome = System.getProperty("user.dir");
            File dir = new File(userHome + File.separator + "uploads");
            if (!dir.exists()) {
                dir.mkdir(); // create the directory if it doesn't exist
            }
            Path path = Paths.get(dir.getAbsolutePath(), fileName);
            Files.write(path, content, StandardOpenOption.CREATE);
            System.out.println("File downloaded:" + path);
        } catch (IOException e) {
            throw new RuntimeException(e);
        }
    }


}
