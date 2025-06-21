package com.dk_power.power_plant_java.util;

import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.PDPage;
import org.apache.pdfbox.rendering.PDFRenderer;
import org.springframework.web.multipart.MultipartFile;

import javax.imageio.ImageIO;
import java.awt.image.BufferedImage;
import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.List;

public class PdfConverter {

    public static String PdfToJpgConverter(String pathToFile) {
        try {
            String sourceDir = pathToFile.replaceAll("jpg", "pdf"); // Pdf files are read from this folder
            String destinationDir = pathToFile; // converted images from pdf would be saved here

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
                    BufferedImage bim = pdfRenderer.renderImageWithDPI(i, 300); //216
                    ImageIO.write(bim, "jpg", new File(destinationDir));
                    break; //for now just converting first page;
                }

                document.close();
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

    public static List<File> splitPdfIntoSinglePageFiles(File file, String baseName) throws IOException {
        String originalFileName = file.getName();
        int dotIndex = originalFileName.lastIndexOf('.');
        if (dotIndex > 0) {
            originalFileName = originalFileName.substring(0, dotIndex);
        }
        String finalName = baseName !=null && !baseName.isEmpty()? baseName : originalFileName;
        PDDocument pdf = PDDocument.load(file);
        List<File> result = new ArrayList<>();
        try {
            for (int i = 0; i < pdf.getNumberOfPages(); i++) {
                PDDocument newDoc = new PDDocument();
                try {
                    PDPage page = pdf.getPage(i);
                    newDoc.addPage(page);
                    String fileName = finalName + "_page_" + (i + 1) + ".pdf";
                    File outputFile = new File(fileName);
                    newDoc.save(outputFile);
                    result.add(outputFile);
                } catch (IOException e) {
                    e.printStackTrace();
                } finally {
                    try {
                        newDoc.close();
                    } catch (IOException e) {
                        e.printStackTrace();
                    }
                }
            }
        } finally {
            try {
                pdf.close();
            } catch (IOException e) {
                e.printStackTrace();
            }
        }
        return result;
    }

    public static List<File> splitPdfIntoSinglePageFiles(MultipartFile multipartFile, String baseName) throws IOException {
        // Create a temporary file from the MultipartFile
        if(multipartFile==null || multipartFile.getOriginalFilename().isEmpty()) {
            throw new IOException("No file provided for conversion");
        }
        String originalFileName = multipartFile.getOriginalFilename();
        String extension = FileUtil.getFileExtension(originalFileName);
        originalFileName = originalFileName.substring(0, originalFileName.lastIndexOf('.'));
        Path tempFile = Files.createTempFile(originalFileName, extension);
        multipartFile.transferTo(tempFile.toFile());

        // Call the existing method with the temporary file
        List<File> result = splitPdfIntoSinglePageFiles(tempFile.toFile(), baseName);

        // Delete the temporary file
        Files.delete(tempFile);

        return result;
    }

    public static File convertPdfToJpg(File pdfFile) {
        try {
            if (pdfFile.exists()) {
                PDDocument document = PDDocument.load(pdfFile);
                PDFRenderer pdfRenderer = new PDFRenderer(document);

                // Create output JPG file
                String jpgFileName = pdfFile.getName();
                int lastDotIndex = jpgFileName.lastIndexOf('.');
                if (lastDotIndex > 0) {
                    jpgFileName = jpgFileName.substring(0, lastDotIndex);
                }
                jpgFileName += ".jpg";
                File outputFile = new File(pdfFile.getParent(), jpgFileName);

                // Convert only the first page
                BufferedImage bim = pdfRenderer.renderImageWithDPI(0, 300); // 0 for first page
                ImageIO.write(bim, "jpg", outputFile);

                document.close();
                System.out.println("JPG created: " + outputFile.getAbsolutePath());
                return outputFile;
            } else {
                System.err.println("File not found: " + pdfFile.getAbsolutePath());
                return null;
            }
        } catch (Exception e) {
            e.printStackTrace();
            return null;
        }
    }

}
