package com.dk_power.power_plant_java.sevice.angular.file.upload;

import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;

/**
 * Encapsulates how an uploaded file is written to disk for a {@code FileObject}.
 * Different extensions need different handling:
 *   - PDFs go through page-split + jpg-conversion ({@link PdfPageSplitUploadStrategy})
 *   - Everything else is written straight to disk ({@link DirectUploadStrategy})
 *
 * Strategies handle only the I/O step. Entity construction and persistence stays
 * in {@code NgFileService}; strategies just tell it what ended up on disk via
 * {@link UploadedFile} records so it can build matching {@code FileObject}s.
 */
public interface UploadStrategy {

    /** True if this strategy can handle the given extension (without the dot). */
    boolean supports(String extension);

    /**
     * Writes the uploaded file to disk and returns one {@link UploadedFile} per
     * resulting canonical source file. For PDFs this is one entry per split page;
     * for direct uploads this is a single entry.
     *
     * @param file           the uploaded multipart file
     * @param target         destination metadata (where to place the file on disk)
     * @param override       whether to overwrite existing files (otherwise revision suffix is added)
     */
    List<UploadedFile> upload(MultipartFile file, UploadTarget target, boolean override) throws IOException;

    /**
     * Destination metadata used by strategies to build the on-disk path.
     * Matches the FileObject path scheme: {@code {filesRoot}/{ext}/{fileType}/{vendor}/{fileNumber}.{ext}}.
     *
     * @param fileNumber    base name of the file(s) without extension
     * @param fileTypeName  the FileObject's fileType name (e.g. "PID", "Manual")
     * @param vendorName    the FileObject's vendor name
     * @param convertToJpg  for PDF uploads: whether to split pages + generate jpg derivatives.
     *                      Ignored by non-PDF strategies. True = legacy P&ID behavior.
     */
    record UploadTarget(String fileNumber, String fileTypeName, String vendorName, boolean convertToJpg) {
        public UploadTarget(String fileNumber, String fileTypeName, String vendorName) {
            this(fileNumber, fileTypeName, vendorName, true);
        }
    }

    /**
     * One canonical source file that ended up on disk. The caller (NgFileService)
     * builds and persists one FileObject per entry.
     *
     * @param fileNumber     base name for the resulting FileObject
     * @param sourceExtension the extension of the canonical source file ("pdf", "png", ...)
     *                        — this is what the FileObject's {@code fileHash} will hash
     * @param allExtensions  all extensions that now exist on disk for this upload
     *                        (e.g. ["pdf","jpg"] for the split strategy, ["png"] for direct)
     */
    record UploadedFile(String fileNumber, String sourceExtension, List<String> allExtensions) {}
}
