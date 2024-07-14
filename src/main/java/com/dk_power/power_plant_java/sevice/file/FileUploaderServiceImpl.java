package com.dk_power.power_plant_java.sevice.file;

import com.dk_power.power_plant_java.dto.files.FileUploader;
import com.dk_power.power_plant_java.entities.FileObject;
import com.dk_power.power_plant_java.repository.FileRepo;
import com.dk_power.power_plant_java.sevice.categories.CategoryService;
import com.dk_power.power_plant_java.sevice.categories.ValueService;
import com.dk_power.power_plant_java.util.PropertyReader;
import lombok.AllArgsConstructor;
import org.apache.commons.io.IOUtils;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.rendering.PDFRenderer;
import org.kohsuke.github.GHContent;
import org.kohsuke.github.GHContentUpdateResponse;
import org.kohsuke.github.GHRepository;
import org.kohsuke.github.GitHub;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import javax.imageio.ImageIO;
import java.awt.image.BufferedImage;
import java.io.*;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardOpenOption;
import java.util.Base64;

@AllArgsConstructor
@Service
@Transactional
//@Configuration
//@PropertySource("classpath:messages.properties")
public class FileUploaderServiceImpl implements FileUploaderService {


    private final CategoryService categoryService;
    private final ValueService valueService;
    private final FileRepo fileRepo;


    public String uploadFilesToLocal(FileUploader files){
        String message = "Files are successfully uploaded.";
        try {
            for (MultipartFile file : files.getFiles()) {
                String name = file.getOriginalFilename();
                String baseLink = "/src/main/resources/static/uploads/";
                String folder = baseLink+files.getFolder()+"/";
                String rootFolder = "./uploads/"+files.getFolder()+"/";
                String baseDir = System.getProperty("user.dir") + folder;
                Path path = Paths.get(baseDir + name);
                Files.createDirectories(path.getParent());
                file.transferTo(path.toFile());

               FileObject newFile = new FileObject();
               newFile.setFileType(valueService.valueSetup("File Type",files.getType()));
               newFile.setVendor(valueService.valueSetup("Vendor",files.getVendor()));
               newFile.setFileNumber(name);
               newFile.setFolder(files.getFolder());
               newFile.setBaseLink(baseLink);
               newFile.buildFileLink();
               fileRepo.save(newFile);
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
                initialSave(file.getOriginalFilename(),path);
            }
        }catch (FileNotFoundException e) {
            createNewFolder(path);
            for (MultipartFile file : files.getFiles()) {
                uploadContentHandled(file,path);
                initialSave(file.getOriginalFilename(),path);
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
//        try {
//            repository = gitHub.getRepository("usadanilakl" + "/" + "power_plant_java");
//            GHContent fileContent = repository.getFileContent(path);
//            byte[] file = IOUtils.toByteArray(fileContent.read());
//            saveToFile(file,"display.pdf");
//            return file;
//        } catch (IOException e) {
//            throw new RuntimeException(e);
//        }


        try {
            repository = gitHub.getRepository("usadanilakl" + "/" + "power_plant_java");
            GHContent fileContent = repository.getFileContent(path);
            InputStream is = fileContent.read();
            ByteArrayOutputStream buffer = new ByteArrayOutputStream();
            int nRead;
            byte[] data = new byte[1024];
            while ((nRead = is.read(data, 0, data.length)) != -1) {
                buffer.write(data, 0, nRead);
            }
            buffer.flush();
            byte[] byteArray = buffer.toByteArray();
            saveToFile(byteArray, "display.pdf");
            return byteArray;
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
    public void PdfToJpgConverter(String pathToFile) {
        try {
            String sourceDir = pathToFile; // Pdf files are read from this folder
//            String destinationDir = "uploads/"; // converted images from pdf would be saved here
            String destinationDir = "src/main/resources/static/"; // converted images from pdf would be saved here

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
                System.err.println(sourceFile.toPath() +" File not exists");
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
    @Override
    public FileObject initialSave(String number, String link) {
        FileObject fileObjectObj = new FileObject();
        fileObjectObj.setFileLink(link+"/"+number);
        fileObjectObj.setFileNumber(number);
        return fileRepo.save(fileObjectObj);
    }
    @Override
    public File[] getListOfFolders(String path) {
        File directory = new File(path);
        File[] folders = directory.listFiles(File::isDirectory);
        return new File[0];
    }
    @Override
    public void deleteFile(String filePath) {
        Path path = Paths.get(filePath);
            try {
                Files.delete(path);
                System.out.println("File deleted successfully:" + path);
            } catch (IOException e) {
                System.out.println("An error occurred while deleting the file:" + path);
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
