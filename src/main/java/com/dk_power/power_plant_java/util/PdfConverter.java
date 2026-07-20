package com.dk_power.power_plant_java.util;

import org.apache.pdfbox.multipdf.Splitter;
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
import java.nio.file.Files;
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
     * <p>Uses InputStream loading to avoid memory-mapping issues on Windows
     * that prevent temp file deletion.
     *
     * <p><strong>Splitter, not addPage or importPage.</strong> The original
     * code used {@code newDoc.addPage(sourcePdf.getPage(i))} which reparents
     * the source {@link PDPage}'s COSDictionary across all N iterations of a
     * still-open source doc — PDFBox's renderer then follows dangling /Parent
     * chains and renders the source's last page for every split (identical
     * broken JPGs, symptom the user actually reported). Switching to
     * {@code importPage} looked like a fix but in PDFBox 2.0.24 that call
     * only shallow-copies the page's COSDictionary and re-inlines /Contents
     * — the /Resources dict stays as indirect references into the still-open
     * source, so late-iteration splits get saved with dangling xref pointers
     * (verified in this repo: page 2 of a 2-page split came out as a 675-byte
     * PDF skeleton with no page content).
     *
     * <p>{@link org.apache.pdfbox.multipdf.Splitter} is the canonical PDFBox
     * 2.x split. It uses COSCloner to walk the page's full object graph and
     * emit self-contained per-page PDDocuments — resources, fonts, images
     * all deep-copied, no dangling refs.
     *
     * <p>Splits are written into a caller-provided temp directory (or a fresh
     * {@link Files#createTempDirectory} when {@code outputDir} is null). The
     * pre-fix version wrote to {@code new File(fileName)} with no directory,
     * so splits landed in the JVM CWD and {@code convertPdfToJpg}'s
     * {@code pdfFile.getParent()} returned null.
     */
    public static List<File> splitPdfIntoSinglePageFiles(File file, String baseName) throws IOException {
        return splitPdfIntoSinglePageFiles(file, baseName, null);
    }

    /** Overload allowing the caller to pass a specific output directory. */
    public static List<File> splitPdfIntoSinglePageFiles(File file, String baseName, File outputDir) throws IOException {
        String originalFileName = file.getName();
        int dotIndex = originalFileName.lastIndexOf('.');
        if (dotIndex > 0) {
            originalFileName = originalFileName.substring(0, dotIndex);
        }
        String finalName = baseName != null && !baseName.isEmpty() ? baseName : originalFileName;
        File targetDir = outputDir != null ? outputDir
            : Files.createTempDirectory("pdf-split-").toFile();

        // Use InputStream to avoid memory-mapping which locks files on Windows
        try (InputStream is = new BufferedInputStream(new FileInputStream(file));
             PDDocument pdf = PDDocument.load(is)) {
            return splitWithSplitter(pdf, finalName, targetDir);
        }
    }

    /**
     * Split a MultipartFile PDF into single-page PDF files. See the File overload
     * for the Splitter rationale and the temp-directory behavior.
     */
    public static List<File> splitPdfIntoSinglePageFiles(MultipartFile multipartFile, String baseName) throws IOException {
        return splitPdfIntoSinglePageFiles(multipartFile, baseName, null);
    }

    public static List<File> splitPdfIntoSinglePageFiles(MultipartFile multipartFile, String baseName, File outputDir) throws IOException {
        if (multipartFile == null || multipartFile.getOriginalFilename() == null || multipartFile.getOriginalFilename().isEmpty()) {
            throw new IOException("No file provided for conversion");
        }

        String originalFileName = multipartFile.getOriginalFilename();
        int dotIndex = originalFileName.lastIndexOf('.');
        if (dotIndex > 0) {
            originalFileName = originalFileName.substring(0, dotIndex);
        }
        String finalName = baseName != null && !baseName.isEmpty() ? baseName : originalFileName;
        File targetDir = outputDir != null ? outputDir
            : Files.createTempDirectory("pdf-split-").toFile();

        // Read directly from MultipartFile's InputStream - no temp file needed.
        try (InputStream is = new BufferedInputStream(multipartFile.getInputStream());
             PDDocument pdf = PDDocument.load(is)) {
            return splitWithSplitter(pdf, finalName, targetDir);
        }
    }

    /**
     * Shared split implementation. Uses PDFBox's {@link Splitter} to produce
     * fully self-contained single-page {@link PDDocument}s (each is closed
     * after save so the caller doesn't have to track resource lifecycle).
     */
    private static List<File> splitWithSplitter(PDDocument pdf, String finalName, File targetDir) throws IOException {
        List<File> result = new ArrayList<>();
        Splitter splitter = new Splitter();
        splitter.setSplitAtPage(1); // one page per output doc
        List<PDDocument> splits = splitter.split(pdf);
        int numberOfPages = splits.size();
        try {
            for (int i = 0; i < numberOfPages; i++) {
                PDDocument split = splits.get(i);
                String fileName = numberOfPages > 1
                    ? finalName + "_page_" + (i + 1) + ".pdf"
                    : finalName + ".pdf";
                File outputFile = new File(targetDir, fileName);
                split.save(outputFile);
                result.add(outputFile);
            }
        } finally {
            // Close every split PDDocument (Splitter returns them open).
            for (PDDocument s : splits) {
                try { s.close(); } catch (IOException ignored) { /* best-effort close */ }
            }
        }
        return result;
    }

    /**
     * Convert a PDF file to JPG (first page only).
     * Uses InputStream loading to avoid memory-mapping issues on Windows
     * that prevent temp file deletion.
     *
     * <p>Renders the source PDF directly — no "heal via importPage" step.
     * Freshly-split PDFs from {@link #splitPdfIntoSinglePageFiles} (which
     * now uses {@link Splitter}) are self-contained and PDFBox's renderer
     * handles them correctly. For PRE-FIX broken splits still on disk from
     * the old {@code addPage} code, a heal step here would NOT help either:
     * {@code importPage} in PDFBox 2.0.24 also shallow-copies, so the healed
     * doc inherits the same dangling references and produces the same broken
     * JPG. Recovery for those files requires re-uploading the original
     * multi-page source through the (now-fixed) split pipeline.
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
