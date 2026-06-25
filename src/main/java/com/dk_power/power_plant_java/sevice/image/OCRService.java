package com.dk_power.power_plant_java.sevice.image;

import net.sourceforge.tess4j.Tesseract;
import net.sourceforge.tess4j.TesseractException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import javax.imageio.ImageIO;
import java.awt.image.BufferedImage;
import java.io.File;
import java.io.IOException;

@Service
public class OCRService {

    private static final Logger LOGGER = LoggerFactory.getLogger(OCRService.class);

    public String extractTextFromImage(File imageFile) {
        try {
            // Load the image
            BufferedImage bufferedImage = ImageIO.read(imageFile);
            if (bufferedImage == null) {
                throw new IOException("Unable to read cropped image: "
                        + (imageFile == null ? "null" : imageFile.getAbsolutePath()));
            }

            // Create Tesseract instance
            Tesseract tesseract = new Tesseract();
            tesseract.setDatapath(resolveTessdataPath()); // Path to tessdata directory
            tesseract.setLanguage("eng"); // Specify the language
            tesseract.setPageSegMode(6); // Set PSM for vertical text (PSM 5 or 6)

            // Perform OCR on the image
            String result = tesseract.doOCR(bufferedImage);
            return result;
        } catch (IOException e) {
            LOGGER.error("Error occurred while processing image.", e);
            return "Error occurred while processing image.";
        } catch (TesseractException e) {
            throw new RuntimeException(e);
        }
    }

    /**
     * Resolves the tessdata directory across deployments. The browser/dev run launches from the
     * project root where tessdata lives at "./tessdata"; the Electron desktop build copies it to
     * "./lib/tessdata" (relative to the JAR's working dir). Returns the first candidate that
     * actually contains the language data, falling back to "tessdata".
     */
    private String resolveTessdataPath() {
        String[] candidates = {"tessdata", "lib/tessdata"};
        for (String candidate : candidates) {
            File dir = new File(candidate);
            if (new File(dir, "eng.traineddata").exists()) {
                return dir.getAbsolutePath();
            }
        }
        LOGGER.warn("tessdata directory not found in {} — falling back to 'tessdata'", java.util.Arrays.toString(candidates));
        return "tessdata";
    }
}
