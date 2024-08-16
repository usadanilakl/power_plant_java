package com.dk_power.power_plant_java.sevice.image;

import org.springframework.stereotype.Component;

import java.awt.Graphics2D;
import javax.imageio.ImageIO;
import java.awt.image.BufferedImage;
import java.awt.geom.AffineTransform;
import java.awt.image.AffineTransformOp;
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

            if(cropWidth<cropHeight){
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

                // Save the rotated image
//                File outputfile = new File("rotated_image.jpg");
//                ImageIO.write(rotatedImage, "jpg", outputfile);
            }

            // Save the cropped image
            File outputfile = new File("cropped_image.jpg");
            ImageIO.write(croppedImage, "jpg", outputfile);



            System.out.println("Image cropped and saved successfully.");
        } catch (IOException e) {
            e.printStackTrace();
        }
    }
}