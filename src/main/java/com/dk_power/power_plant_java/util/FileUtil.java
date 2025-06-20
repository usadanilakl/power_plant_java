package com.dk_power.power_plant_java.util;

import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

public class FileUtil {
    public static String uploadFileToLocal(MultipartFile file, String directory, boolean override) throws IOException {
        // Create directory if it doesn't exist
        Path directoryPath = Paths.get(directory);
        Files.createDirectories(directoryPath);

        String fileName = file.getOriginalFilename();
        Path filePath = directoryPath.resolve(fileName);

        if (!override && Files.exists(filePath)) {
            // Find the latest revision number
            int latestRevision = 0;
            String fileNameWithoutExtension = fileName.substring(0, fileName.lastIndexOf('.'));
            String fileExtension = fileName.substring(fileName.lastIndexOf('.'));

            Pattern pattern = Pattern.compile(fileNameWithoutExtension + "-rev(\\d+)" + Pattern.quote(fileExtension));
            for (Path path : Files.list(directoryPath).collect(Collectors.toList())) {
                Matcher matcher = pattern.matcher(path.getFileName().toString());
                if (matcher.matches()) {
                    int revision = Integer.parseInt(matcher.group(1));
                    latestRevision = Math.max(latestRevision, revision);
                }
            }

            // Create new file name with incremented revision number
            fileName = String.format("%s-rev%d%s", fileNameWithoutExtension, latestRevision + 1, fileExtension);
            filePath = directoryPath.resolve(fileName);
        }

        // Save the file
        Files.copy(file.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);

        return filePath.toString();
    }

    public static String uploadFileToLocal(File file, String directory, boolean override) throws IOException {
        // Create directory if it doesn't exist
        Path directoryPath = Paths.get(directory);
        Files.createDirectories(directoryPath);

        String fileName = file.getName();
        Path filePath = directoryPath.resolve(fileName);

        if (!override && Files.exists(filePath)) {
            // Find the latest revision number
            int latestRevision = 0;
            String fileNameWithoutExtension = fileName.substring(0, fileName.lastIndexOf('.'));
            String fileExtension = fileName.substring(fileName.lastIndexOf('.'));

            Pattern pattern = Pattern.compile(fileNameWithoutExtension + "-rev(\\d+)" + Pattern.quote(fileExtension));
            for (Path path : Files.list(directoryPath).collect(Collectors.toList())) {
                Matcher matcher = pattern.matcher(path.getFileName().toString());
                if (matcher.matches()) {
                    int revision = Integer.parseInt(matcher.group(1));
                    latestRevision = Math.max(latestRevision, revision);
                }
            }

            // Create new file name with incremented revision number
            fileName = String.format("%s-rev%d%s", fileNameWithoutExtension, latestRevision + 1, fileExtension);
            filePath = directoryPath.resolve(fileName);
        }

        // Save the file
        Files.copy(file.toPath(), filePath, StandardCopyOption.REPLACE_EXISTING);

        return filePath.toString();
    }

    public static boolean checkFileExists(Path filePath) {
        return Files.exists(filePath);
    }

    public static boolean checkFileExists(String filePath) {
        return checkFileExists(Paths.get(filePath));
    }

    public static boolean deleteFile(Path path) throws IOException {
        return Files.deleteIfExists(path);
    }

    public static String getFileExtension(String fileLink) {
        int lastIndexOf = fileLink.lastIndexOf('.');
        if (lastIndexOf == -1) {
            return "";
        }
        return fileLink.substring(lastIndexOf + 1);
    }
}
