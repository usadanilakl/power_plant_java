package com.dk_power.power_plant_java.sevice.angular.file.upload;

import com.dk_power.power_plant_java.util.FileUtil;
import com.dk_power.power_plant_java.util.PdfConverter;
import com.dk_power.power_plant_java.util.RenamedMultipartFile;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.ArrayList;
import java.util.List;

/**
 * Handles PDF uploads. Behavior depends on {@link UploadTarget#convertToJpg()}:
 *
 * <ul>
 *   <li><b>true (legacy P&ID behavior)</b>: splits the PDF into single-page PDFs
 *       and generates a jpg per page. Each split page becomes its own FileObject.
 *       Result extensions: {@code [pdf, jpg]}.</li>
 *   <li><b>false</b>: writes the original PDF as-is, no splitting, no jpg derivative.
 *       Single result with extensions: {@code [pdf]}. JPG can be generated on demand
 *       later via {@code POST /ng/files/{id}/ensure-jpg}.</li>
 * </ul>
 */
@Component
@Order(1) // run before DirectUploadStrategy (which is the fallback)
@Slf4j
public class PdfPageSplitUploadStrategy implements UploadStrategy {

    @Value("${files.root.path}")
    private String filesRootPath;

    @Override
    public boolean supports(String extension) {
        return "pdf".equalsIgnoreCase(extension);
    }

    @Override
    public List<UploadedFile> upload(MultipartFile file, UploadTarget target, boolean override) throws IOException {
        if (file.getOriginalFilename() == null || !file.getOriginalFilename().toLowerCase().endsWith(".pdf")) {
            throw new RuntimeException("PdfPageSplitUploadStrategy requires a .pdf file");
        }

        Path pdfFolder = Paths.get(filesRootPath, "pdf", target.fileTypeName(), target.vendorName());

        if (!target.convertToJpg()) {
            // Plain PDF upload — no split, no jpg derivative.
            MultipartFile renamed = new RenamedMultipartFile(file, target.fileNumber() + ".pdf");
            String written = FileUtil.uploadFileToLocal(renamed, pdfFolder.toString(), override);
            String writtenName = Paths.get(written).getFileName().toString();
            String writtenFileNumber = FileUtil.getNameFromPathWithoutExtension(writtenName);
            return List.of(new UploadedFile(writtenFileNumber, "pdf", List.of("pdf")));
        }

        Path jpgFolder = Paths.get(filesRootPath, "jpg", target.fileTypeName(), target.vendorName());

        // Rename incoming file so split-page naming is deterministic
        MultipartFile renamed = new RenamedMultipartFile(file, target.fileNumber() + ".pdf");
        List<File> splitPages = PdfConverter.splitPdfIntoSinglePageFiles(renamed, target.fileNumber());

        List<UploadedFile> results = new ArrayList<>();
        for (File pdfPage : splitPages) {
            try {
                String writtenPdf = FileUtil.uploadFileToLocal(pdfPage, pdfFolder.toString(), override);
                File jpg = PdfConverter.convertPdfToJpg(pdfPage);
                FileUtil.uploadFileToLocal(jpg, jpgFolder.toString(), override);
                Files.deleteIfExists(pdfPage.toPath());
                Files.deleteIfExists(jpg.toPath());

                String writtenName = Paths.get(writtenPdf).getFileName().toString();
                String writtenFileNumber = FileUtil.getNameFromPathWithoutExtension(writtenName);
                results.add(new UploadedFile(writtenFileNumber, "pdf", List.of("pdf", "jpg")));
            } catch (IOException e) {
                log.warn("Failed to write split page {}: {}", pdfPage.getName(), e.getMessage());
            }
        }
        return results;
    }
}
