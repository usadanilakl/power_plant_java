package com.dk_power.power_plant_java.sevice.data_transfer;

import org.springframework.stereotype.Service;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;
import java.util.stream.Stream;

@Service
public class FileReaderService {

    public List<File> getFilesInFolderUsingFilesList(String folderPath){
        try (Stream<Path> paths = Files.list(Paths.get(folderPath))) {
            return paths.map(Path::toFile).toList();
        } catch (IOException e) {
            throw new RuntimeException(e);
        }
    }

    public File[] getFilesInFolderUsingFileClass(String folderPath) {
        File folder = new File(folderPath);
        if (!folder.isDirectory()) {
            System.err.println("The path is not a directory");
            return new File[0];
        }
        File[] files = folder.listFiles();
        if (files == null) {
            System.err.println("Error reading directory");
            return new File[0];
        }
        return files;
    }

}