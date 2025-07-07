package com.dk_power.power_plant_java.util;

import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.IOException;
import java.nio.file.*;
import java.nio.file.attribute.PosixFilePermission;
import java.nio.file.attribute.PosixFilePermissions;
import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;
import java.util.stream.StreamSupport;

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

    public static List<File> getRevisionsByFileNumber(String oldFileNumber, String path) {
        // Get the directory path
        Path directory = Paths.get(path);
        System.out.println("Getting revisions for file number: " + oldFileNumber + " in directory: " + directory);

        // Get the file name without potential revision
        String baseFileName = oldFileNumber.replaceFirst("-rev\\d+$", "");
        System.out.println("Base file name: " + baseFileName);

        // Create a pattern to match the file name with or without any revision number and any extension
        String pattern = "^" + Pattern.quote(baseFileName) + "(-rev\\d+)?\\.[^.]+$";
        System.out.println("Pattern: " + pattern);

        try {
            // List all files in the directory that match the pattern
            List<File> matchingFiles = Files.list(directory)
                    .filter(filePath -> {
                        String fileName = filePath.getFileName().toString();
                        return fileName.matches(pattern);
                    })
                    .map(Path::toFile)
                    .sorted((f1, f2) -> {
                        // Sort files by their revision number (latest first),
                        // with non-revision files considered as the latest
                        int rev1 = extractRevisionNumber(f1.getName());
                        int rev2 = extractRevisionNumber(f2.getName());
                        if (rev1 == 0 && rev2 == 0) {
                            // Both files don't have revision numbers, sort by name
                            return f2.getName().compareTo(f1.getName());
                        }
                        return rev2 - rev1;
                    })
                    .collect(Collectors.toList());

            // If no matching files are found, log a message
            if (matchingFiles.isEmpty()) {
                System.out.println("No matching files found for " + oldFileNumber + " in directory: " + directory);
            }

            System.out.println("Matching files: " + matchingFiles);

            return matchingFiles;

        } catch (IOException e) {
            // Log the error
            System.err.println("Error listing files in directory: " + directory);
            System.err.println("Error message: " + e.getMessage());
            e.printStackTrace();

            // Check if the directory exists
            if (!Files.exists(directory)) {
                System.err.println("Directory does not exist: " + directory);
            } else if (!Files.isReadable(directory)) {
                System.err.println("No read permission for directory: " + directory);
            }

            // Return an empty list instead of throwing an exception
            return List.of();
        }
    }


    public static void moveFileAndCleanup(Path oldPath, Path newPath) throws IOException {
        // Check if the old path exists and is a file
        if (!Files.exists(oldPath) || !Files.isRegularFile(oldPath)) {
            System.out.println("Old path does not exist or is not a file: " + oldPath);
            return;
        }

        // Create the new directory if it doesn't exist
        Files.createDirectories(newPath.getParent());
        setPermissions(newPath.getParent());

        // Move the file
        Files.move(oldPath, newPath, StandardCopyOption.REPLACE_EXISTING);
        System.out.println("Moved file from " + oldPath + " to " + newPath);

        // Force garbage collection to release file handles
        System.gc();

        // Delete empty parent directories of the old path
        deleteEmptyDirectories(oldPath.getParent());
    }

    private static void deleteEmptyDirectories(Path path) throws IOException {
        while (path != null && Files.isDirectory(path)) {
            try {
                if (Files.list(path).findFirst().isPresent()) {
                    // Directory is not empty, stop here
                    break;
                }
                Files.delete(path);
                System.out.println("Deleted empty directory: " + path);
            } catch (DirectoryNotEmptyException e) {
                // Stop if the directory is not empty
                break;
            }
            path = path.getParent();
        }
    }

    public static void uploadAndKeepNLatest(String targetDirectory, Path sourcePath, String searchCriteria, Integer countOfLatestToKeep) {
        if(searchCriteria==null) searchCriteria = "*";
        if(countOfLatestToKeep==null) countOfLatestToKeep = 999999999;

        try {
            // Ensure the backup directory exists
            Files.createDirectories(Paths.get(targetDirectory));

            if (!targetDirectory.equals(sourcePath.getParent().toString())) {
                // Copy the file from source to target directory
                Path targetPath = Paths.get(targetDirectory, sourcePath.getFileName().toString());
                Files.copy(sourcePath, targetPath, StandardCopyOption.REPLACE_EXISTING);
                System.out.println("Copied file from " + sourcePath + " to " + targetPath);
            }

            // Keep only the n latest backups
            try (DirectoryStream<Path> stream = Files.newDirectoryStream(Paths.get(targetDirectory), searchCriteria)) {
                List<Path> files = StreamSupport.stream(stream.spliterator(), false)
                        .sorted(Comparator.comparing((Path path) -> {
                            try {
                                return Files.getLastModifiedTime(path).toMillis();
                            } catch (IOException e) {
                                return 0L;
                            }
                        }).reversed())
                        .collect(Collectors.toList());

                // Delete older backups
                for (int i = countOfLatestToKeep; i < files.size(); i++) {
                    try {
                        Files.delete(files.get(i));
                        System.out.println("Deleted old backup: " + files.get(i));
                    } catch (IOException e) {
                        System.err.println("Error deleting old backup: " + e.getMessage());
                    }
                }
            }
        } catch (IOException e) {
            System.err.println("Error during database backup process: " + e.getMessage());
        }
    }
    
public static boolean checkAccess(Path filePath) {
    // Get the root path (drive letter for Windows, or root directory for Unix-like systems)
    Path rootPath = filePath.getRoot();
    
    if (rootPath == null) {
        System.err.println("Unable to determine root path for: " + filePath);
        return false;
    }

    try {
        // Check if the root path exists and is accessible
        if (!Files.exists(rootPath)) {
            System.out.println("Drive does not exist or is not accessible: " + rootPath);
            return false;
        }

        // Check read permission
        boolean readable = Files.isReadable(rootPath);
        
        // Check write permission
        boolean writable = Files.isWritable(rootPath);
        
        // Check execute permission (for directories)
        boolean executable = Files.isExecutable(rootPath);

        boolean accessible = readable ;//&& writable && executable;

        if (!accessible) {
            System.out.println("Drive " + rootPath + " is not fully accessible.");
            System.out.println("Read: " + readable + ", Write: " + writable + ", Execute: " + executable);
        } else {
            System.out.println("Drive " + rootPath + " is accessible.");
        }

        return accessible;
    } catch (SecurityException e) {
        System.err.println("Security exception when checking access for drive: " + rootPath);
        e.printStackTrace();
        return false;
    }
}


//    public static List<File> getRevisionsByFileNumber(String oldFileNumber, String path) {
//
//
//        try {
//            List<File> matchingFiles = Files.list(Paths.get(path))
//                    .filter(filePath -> filePath.getFileName().toString().contains(oldFileNumber))
//                    .map(Path::toFile)
//                    .sorted((f1, f2) -> f2.getName().compareTo(f1.getName())) // Sort in descending order
//                    .collect(Collectors.toList());
//
//            System.out.println("Matching files: " + matchingFiles);
//            return matchingFiles;
//        } catch (IOException e) {
//            System.err.println("Error listing files in directory: " + path);
//            e.printStackTrace();
//            return List.of(); // Return an empty list if there's an error
//        }
//    }

    public static int extractRevisionNumber(String fileName) {
        // Extract the revision number from the file name
        Pattern pattern = Pattern.compile("-rev(\\d+)");
        Matcher matcher = pattern.matcher(fileName);
        if (matcher.find()) {
            return Integer.parseInt(matcher.group(1));
        }
        return 0; // Return 0 for files without a revision number
    }

    public static boolean checkFileExists(Path filePath) {
        return Files.exists(filePath);
    }

    public static boolean checkFileExists(String filePath) {
        return checkFileExists(Paths.get(filePath));
    }

    public static boolean deleteFile(Path path) throws IOException {
        System.out.println("Deleting file: " + path);

        return Files.deleteIfExists(path);
    }

    public static String getFileExtension(String fileLink) {
        int lastIndexOf = fileLink.lastIndexOf('.');
        if (lastIndexOf == -1) {
            return "";
        }
        return fileLink.substring(lastIndexOf + 1);
    }

    public static String getNameFromPath(String path) {
        int lastIndex = path.lastIndexOf(File.separator);
        return (lastIndex != -1) ? path.substring(lastIndex + 1) : path;
    }

    public static String getNameFromPathWithoutExtension(String path) {
        String extension = getFileExtension(path);
        int lastIndex = path.lastIndexOf(File.separator);
        return (lastIndex != -1) ? path.substring(lastIndex + 1).replace("." + extension, "") : path.replace("." + extension, "");
    }

    private static void setPermissions(Path path) throws IOException {
        if (System.getProperty("os.name").toLowerCase().contains("win")) {
            // For Windows
            path.toFile().setWritable(true, false);
            path.toFile().setReadable(true, false);
            path.toFile().setExecutable(true, false);
        } else {
            // For Unix-like systems
            Set<PosixFilePermission> permissions = PosixFilePermissions.fromString("rwxrwxrwx");
            Files.setPosixFilePermissions(path, permissions);
        }
    }

    public static boolean isDirectoryEmpty(Path path) throws IOException {
        try (DirectoryStream<Path> dirStream = Files.newDirectoryStream(path)) {
            return !dirStream.iterator().hasNext();
        }
    }

    public static List<File> getFilesFromDirectory(String qaDirectory) {
        File directory = new File(qaDirectory);
        File[] files = directory.listFiles();
        if (files!= null) {
            return Arrays.asList(files);
        }
        return Collections.emptyList();
    }
}
