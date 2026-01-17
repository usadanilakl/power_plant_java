package com.dk_power.power_plant_java.util;

import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.PDPage;
import org.apache.pdfbox.rendering.PDFRenderer;
import org.springframework.web.multipart.MultipartFile;

import javax.imageio.ImageIO;
import java.awt.image.BufferedImage;
import java.io.BufferedInputStream;
import java.io.File;
import java.io.FileInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.util.ArrayList;
import java.util.List;

public class PdfConverter {

    /**
     * Convert PDF to JPG.
     * Uses InputStream loading to avoid memory-mapping issues on Windows
     * that prevent temp file deletion.
     */
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
     * Split a PDF file into single-page PDF files.
     * Uses InputStream loading to avoid memory-mapping issues on Windows
     * that prevent temp file deletion.
     */
    public static List<File> splitPdfIntoSinglePageFiles(File file, String baseName) throws IOException {
        String originalFileName = file.getName();
        int dotIndex = originalFileName.lastIndexOf('.');
        if (dotIndex > 0) {
            originalFileName = originalFileName.substring(0, dotIndex);
        }
        String finalName = baseName != null && !baseName.isEmpty() ? baseName : originalFileName;
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
                    String fileName = numberOfPages > 1 ? finalName + "_page_" + (i + 1) + ".pdf" : finalName + ".pdf";
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

    /**
     * Split a MultipartFile PDF into single-page PDF files.
     * Reads directly from the MultipartFile's InputStream to avoid creating
     * temp files that may be locked on Windows.
     */
    public static List<File> splitPdfIntoSinglePageFiles(MultipartFile multipartFile, String baseName) throws IOException {
        if (multipartFile == null || multipartFile.getOriginalFilename() == null || multipartFile.getOriginalFilename().isEmpty()) {
            throw new IOException("No file provided for conversion");
        }

        String originalFileName = multipartFile.getOriginalFilename();
        int dotIndex = originalFileName.lastIndexOf('.');
        if (dotIndex > 0) {
            originalFileName = originalFileName.substring(0, dotIndex);
        }
        String finalName = baseName != null && !baseName.isEmpty() ? baseName : originalFileName;
        List<File> result = new ArrayList<>();

        // Read directly from MultipartFile's InputStream - no temp file needed!
        // This avoids the Windows file locking issue entirely.
        try (InputStream is = new BufferedInputStream(multipartFile.getInputStream());
             PDDocument pdf = PDDocument.load(is)) {

            int numberOfPages = pdf.getNumberOfPages();
            for (int i = 0; i < numberOfPages; i++) {
                PDDocument newDoc = new PDDocument();
                try {
                    PDPage page = pdf.getPage(i);
                    newDoc.addPage(page);
                    String fileName = numberOfPages > 1 ? finalName + "_page_" + (i + 1) + ".pdf" : finalName + ".pdf";
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

    /**
     * Convert a PDF file to JPG (first page only).
     * Uses InputStream loading to avoid memory-mapping issues on Windows
     * that prevent temp file deletion.
     */
    public static File convertPdfToJpg(File pdfFile) {
        try {
            if (pdfFile.exists()) {
                // Create output JPG file
                String jpgFileName = pdfFile.getName();
                int lastDotIndex = jpgFileName.lastIndexOf('.');
                if (lastDotIndex > 0) {
                    jpgFileName = jpgFileName.substring(0, lastDotIndex);
                }
                jpgFileName += ".jpg";
                File outputFile = new File(pdfFile.getParent(), jpgFileName);

                // Use InputStream to avoid memory-mapping which locks files on Windows
                try (InputStream is = new BufferedInputStream(new FileInputStream(pdfFile));
                     PDDocument document = PDDocument.load(is)) {

                    PDFRenderer pdfRenderer = new PDFRenderer(document);

                    // Convert only the first page
                    BufferedImage bim = pdfRenderer.renderImageWithDPI(0, 300);
                    ImageIO.write(bim, "jpg", outputFile);
                }

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
