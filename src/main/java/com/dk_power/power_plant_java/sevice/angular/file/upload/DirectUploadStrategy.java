package com.dk_power.power_plant_java.sevice.angular.file.upload;

import com.dk_power.power_plant_java.util.FileUtil;
import com.dk_power.power_plant_java.util.RenamedMultipartFile;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;

/**
 * Writes the uploaded file straight to disk at the standard path scheme.
 * Used for anything that isn't a PDF — images (png/jpg/tif), CAD (dwg/dxf),
 * Office docs (xlsx/docx), etc. No splitting, no derivatives.
 *
 * Registered with {@code @Order(Ordered.LOWEST_PRECEDENCE)} so it serves as the
 * fallback — more specific strategies (like {@link PdfPageSplitUploadStrategy})
 * are picked first when they {@link #supports(String) support} the extension.
 */
@Component
@Order // lowest precedence by default → acts as fallback
@Slf4j
public class DirectUploadStrategy implements UploadStrategy {

    @Value("${files.root.path}")
    private String filesRootPath;

    @Override
    public boolean supports(String extension) {
        // Fallback — supports anything. The registry should try more specific
        // strategies first.
        return extension != null && !extension.isBlank();
    }

    @Override
    public List<UploadedFile> upload(MultipartFile file, UploadTarget target, boolean override) throws IOException {
        String originalName = file.getOriginalFilename();
        if (originalName == null) {
            throw new RuntimeException("Uploaded file has no original filename");
        }
        String extension = FileUtil.getFileExtension(originalName).toLowerCase();
        if (extension.isBlank()) {
            throw new RuntimeException("Uploaded file has no extension: " + originalName);
        }

        Path targetFolder = Paths.get(filesRootPath, extension, target.fileTypeName(), target.vendorName());
        MultipartFile renamed = new RenamedMultipartFile(file, target.fileNumber() + "." + extension);

        String written = FileUtil.uploadFileToLocal(renamed, targetFolder.toString(), override);
        String writtenName = Paths.get(written).getFileName().toString();
        String writtenFileNumber = FileUtil.getNameFromPathWithoutExtension(writtenName);

        log.debug("Direct upload wrote {} to {}", writtenName, targetFolder);
        return List.of(new UploadedFile(writtenFileNumber, extension, List.of(extension)));
    }
}
