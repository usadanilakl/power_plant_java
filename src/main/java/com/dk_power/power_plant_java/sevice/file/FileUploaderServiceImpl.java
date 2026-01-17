package com.dk_power.power_plant_java.sevice.file;

import com.dk_power.power_plant_java.dto.files.FileUploader;
import com.dk_power.power_plant_java.entities.files.FileObject;
import com.dk_power.power_plant_java.repository.file.FileRepo;
import com.dk_power.power_plant_java.sevice.categories.CategoryService;
import com.dk_power.power_plant_java.sevice.categories.ValueService;
import com.dk_power.power_plant_java.sevice.data_transfer.ExcelReaderService;
import com.dk_power.power_plant_java.sevice.data_transfer.FileReaderService;
import com.dk_power.power_plant_java.util.PropertyReader;
import lombok.AllArgsConstructor;
import org.apache.commons.io.IOUtils;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.PDPage;
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
import java.util.ArrayList;
import java.util.Base64;
import java.util.List;

@AllArgsConstructor
@Service
@Transactional
//@Configuration
//@PropertySource("classpath:messages.properties")
public class FileUploaderServiceImpl implements FileUploaderService {


    private final CategoryService categoryService;
    private final ValueService valueService;
    private final FileRepo fileRepo;
    private final FileReaderService fileReaderService;
    private final ExcelReaderService excelReaderService;


    public String uploadFilesToLocal(FileUploader files) {
        String message = "Files are successfully uploaded.";
        try {
            for (MultipartFile file : files.getFiles()) {
                String name = file.getOriginalFilename();
                String baseLink = "/src/main/resources/static/uploads/";
                String folder = baseLink + files.getFolder() + "/";
                String rootFolder = "./uploads/" + files.getFolder() + "/";
                String baseDir = System.getProperty("user.dir") + folder;
                Path path = Paths.get(baseDir + name);
                Files.createDirectories(path.getParent());
                file.transferTo(path.toFile());

                FileObject newFile = new FileObject();
                newFile.setFileType(valueService.valueSetup("File Type", files.getType()));
                newFile.setVendor(valueService.valueSetup("Vendor", files.getVendor()));
                newFile.setFileNumber(name);
                newFile.setFolder(files.getFolder());
                newFile.setBaseLink(baseLink);
                newFile.buildFileLink();
                fileRepo.save(newFile);
            }
        } catch (IOException e) {
            //throw new RuntimeException("failedUpload");
            message = "Upload Failed";
        }
        return message;
    }

    @Override
    public String uploadFilesToGitHub(FileUploader files, String path) {
        try {

            for (MultipartFile file : files.getFiles()) {
                uploadContent(file, path);
                initialSave(file.getOriginalFilename(), path);
            }
        } catch (FileNotFoundException e) {
            createNewFolder(path);
            for (MultipartFile file : files.getFiles()) {
                uploadContentHandled(file, path);
                initialSave(file.getOriginalFilename(), path);
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

    /**
     * Convert PDF to JPG.
     * Uses InputStream loading to avoid memory-mapping issues on Windows.
     */
    @Override
    public void PdfToJpgConverter() {
        try {
            String sourceDir = "uploads/display.pdf";
            String destinationDir = "uploads/";

            File sourceFile = new File(sourceDir);
            File destinationFile = new File(destinationDir);

            if (!destinationFile.exists()) {
                destinationFile.mkdir();
            }
            if (sourceFile.exists()) {
                // Use InputStream to avoid memory-mapping which locks files on Windows
                try (InputStream is = new BufferedInputStream(new FileInputStream(sourceFile));
                     PDDocument document = PDDocument.load(is)) {

                    PDFRenderer pdfRenderer = new PDFRenderer(document);
                    int numberOfPages = document.getNumberOfPages();

                    for (int i = 0; i < numberOfPages; ++i) {
                        BufferedImage bim = pdfRenderer.renderImageWithDPI(i, 300);
                        ImageIO.write(bim, "jpg", new File(destinationDir + "/" + (i + 1) + ".jpg"));
                    }
                }
                System.out.println("Images created");
            } else {
                System.err.println(sourceFile.getName() + " File not exists");
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    /**
     * Convert PDF to JPG.
     * Uses InputStream loading to avoid memory-mapping issues on Windows.
     */
    public String PdfToJpgConverter(String pathToFile) {
        try {
            String sourceDir = pathToFile.replaceAll("jpg", "pdf");
            String destinationDir = pathToFile;

            File sourceFile = new File(sourceDir);
            File destinationFile = new File(destinationDir);

            if (!destinationFile.exists()) {
                destinationFile.mkdir();
            }
            if (sourceFile.exists()) {
                // Use InputStream to avoid memory-mapping which locks files on Windows
                try (InputStream is = new BufferedInputStream(new FileInputStream(sourceFile));
                     PDDocument document = PDDocument.load(is)) {

                    PDFRenderer pdfRenderer = new PDFRenderer(document);

                    // Convert only first page
                    BufferedImage bim = pdfRenderer.renderImageWithDPI(0, 300);
                    ImageIO.write(bim, "jpg", new File(destinationDir));
                }
                String result = "Images created";
                System.out.println(result);
                return result;
            } else {
                String result = sourceFile.toPath() + " File not found";
                System.err.println(result);
                return result;
            }
        } catch (Exception e) {
            e.printStackTrace();
            return e.getMessage();
        }
    }

    /**
     * Split PDF into single-page files.
     * Uses InputStream loading to avoid memory-mapping issues on Windows.
     */
    public List<File> splitPdfIntoSinglePageFiles(File file) throws IOException {
        String originalFileName = file.getName();
        int dotIndex = originalFileName.lastIndexOf('.');
        if (dotIndex > 0) {
            originalFileName = originalFileName.substring(0, dotIndex);
        }
        List<File> result = new ArrayList<>();

        // Use InputStream to avoid memory-mapping which locks files on Windows
        try (InputStream is = new BufferedInputStream(new FileInputStream(file));
             PDDocument pdf = PDDocument.load(is)) {

            int numberOfPages = pdf.getNumberOfPages();
            for (int i = 0; i < numberOfPages; i++) {
                PDDocument newDoc = new PDDocument();
                try {
                    PDPage page = pdf.getPage(i);
                    newDoc.addPage(page);
                    String fileName = originalFileName + "_page_" + (i + 1) + ".pdf";
                    File outputFile = new File(fileName);
                    newDoc.save(outputFile);
                    result.add(outputFile);
                } finally {
                    newDoc.close();
                }
            }
        }
        return result;
    }

    @Override
    public void convertAllToJpg() {
        List<FileObject> all = fileRepo.findAll();
        all.forEach(f -> {
            String fileLink = f.getFileLink();
            File file = new File(fileLink);
            if (!file.exists()) {
                PdfToJpgConverter(fileLink);
            }
        });
    }

    @Override
    public FileObject initialSave(String number, String link) {
        FileObject fileObjectObj = new FileObject();
        fileObjectObj.setFileLink(link + "/" + number);
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
    public File[] getListOfFiles(String path) {
        File directory = new File(path);
        File[] files = directory.listFiles(File::isFile);
        return files;
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

    @Override
    public void scanDirectoryAndCreateObjectsForNewFiles(String dir) {

    }

    @Override
    public void createObjectsFromDirectoryUsingMetaDataExcel(String dir) {
        String root = System.getProperty("user.dir").replaceAll("\\\\", "/");
        String fullPath = root + "/" + dir;
        fileReaderService.getFilesInFolderUsingFilesList(fullPath);

    }

    private GitHub connectToGitHub() {
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

    private String createNewFolder(String folderName) {
        try {
            GitHub gitHub = connectToGitHub();
            GHContentUpdateResponse response = gitHub.getUser("usadanilakl")
                    .getRepository("power_plant_java")
                    .createContent("", "Create new directory", folderName + "/.gitkeep");

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
