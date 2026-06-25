package com.dk_power.power_plant_java.sevice.image;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.awt.Graphics2D;
import javax.imageio.ImageIO;
import java.awt.image.BufferedImage;
import java.awt.geom.AffineTransform;
import java.io.File;
import java.io.IOException;
import java.util.UUID;
@Component
public class ImageCropper {

    // Absolute, profile-specific uploads root (e.g. ${user.dir}/uploads-prod).
    // The stored fileLink uses the hard-coded "uploads" baseLink, which only matches the
    // filesystem folder in the default profile. Resolving against this root makes cropping
    // work under every profile (desktop/Electron prod, hub, dev) regardless of working dir.
    @Value("${files.root.path}")
    private String filesRootPath;

    /**
     * Crops the region described by {@code coordinates} out of the image referenced by
     * {@code path} (fileLink) and writes it to a fresh temp file, returning that file.
     *
     * @return the cropped image file (caller is responsible for deleting it)
     * @throws IOException if the source image cannot be read or the crop cannot be written
     */
    public File crop(String path, String coordinates) throws IOException {
        String jpgPath = path.replaceAll("pdf", "jpg");

        File inputFile = resolveInputFile(jpgPath);
        BufferedImage originalImage = ImageIO.read(inputFile);
        if (originalImage == null) {
            throw new IOException("Unable to read source image: " + inputFile.getAbsolutePath());
        }

        String[] coords = coordinates.split(",");

        // Define the crop area
        int cropX = Integer.parseInt(coords[0].substring(coords[0].indexOf(":") + 1)); // starting X coordinate
        int cropY = Integer.parseInt(coords[1].substring(coords[1].indexOf(":") + 1)); // starting Y coordinate
        int cropWidth = Integer.parseInt(coords[4].substring(coords[4].indexOf(":") + 1)); // width of the crop area
        int cropHeight = Integer.parseInt(coords[5].substring(coords[5].indexOf(":") + 1)); // height of the crop area

        // Crop the image
        BufferedImage croppedImage = originalImage.getSubimage(cropX, cropY, cropWidth, cropHeight);

        if (cropWidth < cropHeight) {
            // Rotate the cropped image by 90 degrees clockwise
            double rotationRequired = Math.toRadians(90);
            double centerX = (double) croppedImage.getWidth() / 2;
            double centerY = (double) croppedImage.getHeight() / 2;

            AffineTransform tx = new AffineTransform();
            tx.translate(centerY, centerX);
            tx.rotate(rotationRequired);
            tx.translate(-centerX, -centerY);

            // Create a new image with swapped width and height
            BufferedImage rotatedImage = new BufferedImage(croppedImage.getHeight(), croppedImage.getWidth(), croppedImage.getType());
            Graphics2D g2d = rotatedImage.createGraphics();
            g2d.setTransform(tx);
            g2d.drawImage(croppedImage, 0, 0, null);
            g2d.dispose();

            croppedImage = rotatedImage;
        }

        // Save the cropped image to a unique temp file (absolute path, independent of CWD).
        File outputFile = File.createTempFile("cropped_image_" + UUID.randomUUID(), ".jpg");
        ImageIO.write(croppedImage, "jpg", outputFile);

        System.out.println("Image cropped and saved successfully: " + outputFile.getAbsolutePath());
        return outputFile;
    }

    /**
     * Resolves the stored fileLink (e.g. "uploads/jpg/PID/vendor/123.jpg") to an actual file on
     * disk. The fileLink baseLink ("uploads") is hard-coded and does not match the profile-specific
     * uploads folder, so we strip the leading segment and resolve it under {@link #filesRootPath}.
     * Falls back to treating the path as-is when those candidates do not exist.
     */
    private File resolveInputFile(String fileLink) {
        // 1) Already an absolute, existing path.
        File direct = new File(fileLink);
        if (direct.isAbsolute() && direct.exists()) return direct;

        if (filesRootPath != null && !filesRootPath.isBlank()) {
            // 2) Strip the leading baseLink segment ("uploads/") and resolve under the real root.
            String relative = fileLink.replaceFirst("^/?[^/]+/", "");
            File underRoot = new File(filesRootPath, relative);
            if (underRoot.exists()) return underRoot;

            // 3) Some callers may already pass a root-relative path without the baseLink segment.
            File underRootRaw = new File(filesRootPath, fileLink.replaceFirst("^/", ""));
            if (underRootRaw.exists()) return underRootRaw;
        }

        // 4) Last resort: original CWD-relative path (works in the default profile).
        return direct;
    }
}
