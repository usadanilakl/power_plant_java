package com.dk_power.power_plant_java.sevice.image;

import org.springframework.stereotype.Component;

import javax.imageio.ImageIO;
import java.awt.image.BufferedImage;
import java.io.File;
import java.io.IOException;
@Component
public class ImageCropper {
    public void crop(String path, String coordinates) {
        try {
            // Load the image
            BufferedImage originalImage = ImageIO.read(new File(path));

            String[] coords = coordinates.split(",");

            // Define the crop area
            int cropX = Integer.parseInt(coords[0].substring(coords[0].indexOf(":")+1)) ; // starting X coordinate
            int cropY = Integer.parseInt(coords[1].substring(coords[1].indexOf(":")+1)); // starting Y coordinate
            int cropWidth = Integer.parseInt(coords[4].substring(coords[4].indexOf(":")+1)); // width of the crop area
            int cropHeight = Integer.parseInt(coords[5].substring(coords[5].indexOf(":")+1)); // height of the crop area

            // Crop the image
            BufferedImage croppedImage = originalImage.getSubimage(cropX, cropY, cropWidth, cropHeight);

            // Save the cropped image
            File outputfile = new File("cropped_image.jpg");
            ImageIO.write(croppedImage, "jpg", outputfile);

            System.out.println("Image cropped and saved successfully.");
        } catch (IOException e) {
            e.printStackTrace();
        }
    }
}