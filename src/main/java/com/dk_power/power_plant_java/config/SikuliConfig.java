package com.dk_power.power_plant_java.config;

import jakarta.annotation.PostConstruct;
import org.sikuli.script.OCR;
import org.springframework.stereotype.Component;

import java.io.File;
import java.io.IOException;
import java.io.UncheckedIOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;

@Component
public class SikuliConfig {

    @PostConstruct
    public void init() throws IOException {
        String appData = System.getenv("APPDATA");
        if (appData == null || appData.isEmpty()) {
//            throw new IllegalStateException("APPDATA environment variable is not set. Cannot determine SikuliX data folder.");
            System.out.println("APPDATA is not set");
            return;
        }

        Path sikuliTessdataPath = Paths.get(appData, "Sikulix", "SikulixTesseract", "tessdata");
        if (Files.notExists(sikuliTessdataPath)) {
            // Try extracting tessdata from your project's tessdata folder to SikuliX AppData location
            Path sourceTessdataDir = Paths.get(new File(".").getCanonicalPath(), "tessdata");
            if (Files.notExists(sourceTessdataDir) || !Files.isDirectory(sourceTessdataDir)) {
                sourceTessdataDir = Paths.get(new File(".").getCanonicalPath(), "lib", "tessdata");
            }
            if (Files.exists(sourceTessdataDir) && Files.isDirectory(sourceTessdataDir)) {
                copyFolder(sourceTessdataDir, sikuliTessdataPath);
                System.out.println("Copied tessdata folder to SikuliX AppData: " + sikuliTessdataPath);
            } else {
                throw new IllegalStateException("Source tessdata directory not found at " + sourceTessdataDir);
            }
        } else {
            System.out.println("Using existing tessdata folder at SikuliX AppData: " + sikuliTessdataPath);
        }

        // Do NOT set OCR.globalOptions().dataPath() here to let SikuliX use its default AppData location
    }

    private void copyFolder(Path source, Path target) throws IOException {
        Files.walk(source).forEach(path -> {
            try {
                Path targetPath = target.resolve(source.relativize(path).toString());
                if (Files.isDirectory(path)) {
                    if (Files.notExists(targetPath)) {
                        Files.createDirectories(targetPath);
                    }
                } else {
                    Files.copy(path, targetPath, StandardCopyOption.REPLACE_EXISTING);
                }
            } catch (IOException e) {
                throw new UncheckedIOException("Failed copying tessdata file: " + path, e);
            }
        });
    }

//    @PostConstruct
//    public void init() throws IOException {
//        String basePath = new File(".").getCanonicalPath();
//        File tessdataDir = new File(basePath, "tessdata");
//
//        if (!tessdataDir.exists() || !tessdataDir.isDirectory()) {
//            tessdataDir = new File(basePath, "lib/tessdata");
//        }
//
//        if (tessdataDir.exists() && tessdataDir.isDirectory()) {
//            File parentDir = tessdataDir.getParentFile();
//            OCR.globalOptions().dataPath(parentDir.getAbsolutePath());
//            System.out.println("Tessdata path set to: " + parentDir.getAbsolutePath());
//        } else {
//            throw new IllegalStateException("tessdata directory not found in " + basePath);
//        }
//    }
}
