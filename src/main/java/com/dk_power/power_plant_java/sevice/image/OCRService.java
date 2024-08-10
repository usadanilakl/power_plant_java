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

            // Create Tesseract instance
            Tesseract tesseract = new Tesseract();
            tesseract.setDatapath("tessdata"); // Path to tessdata directory
            tesseract.setLanguage("eng"); // Specify the language

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
}