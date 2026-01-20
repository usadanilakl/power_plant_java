package com.dk_power.power_plant_java.config;

import jakarta.annotation.PostConstruct;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.nio.file.*;
import java.nio.file.attribute.BasicFileAttributes;

/**
 * Cleans up test data (database and uploads folder) on application startup
 * when the test profile is active and cleanup is enabled.
 *
 * Configuration in application-test.properties:
 * - test.cleanup.enabled=true/false - Enable or disable cleanup
 * - test.cleanup.database-path - Path to the test database file
 * - test.cleanup.uploads-path - Path to the test uploads folder
 */
@Component
@Profile("test")
public class TestCleanupConfig {

    private static final Logger logger = LoggerFactory.getLogger(TestCleanupConfig.class);

    @Value("${test.cleanup.enabled:false}")
    private boolean cleanupEnabled;

    @Value("${test.cleanup.database-path:}")
    private String databasePath;

    @Value("${test.cleanup.uploads-path:}")
    private String uploadsPath;

    @PostConstruct
    public void cleanupTestData() {
        if (!cleanupEnabled) {
            logger.info("Test cleanup is disabled. Skipping cleanup.");
            return;
        }

        logger.info("Test cleanup is enabled. Starting cleanup...");

        // Clean up database file
        if (databasePath != null && !databasePath.isEmpty()) {
            deleteFile(Paths.get(databasePath), "database");
            // Also delete the trace file if it exists
            String traceFilePath = databasePath.replace(".mv.db", ".trace.db");
            deleteFile(Paths.get(traceFilePath), "database trace");
        }

        // Clean up uploads folder
        if (uploadsPath != null && !uploadsPath.isEmpty()) {
            deleteDirectory(Paths.get(uploadsPath), "uploads");
        }

        logger.info("Test cleanup completed.");
    }

    private void deleteFile(Path path, String description) {
        try {
            if (Files.exists(path)) {
                Files.delete(path);
                logger.info("Deleted {} file: {}", description, path);
            } else {
                logger.debug("{} file does not exist, skipping: {}", description, path);
            }
        } catch (IOException e) {
            logger.warn("Failed to delete {} file: {} - {}", description, path, e.getMessage());
        }
    }

    private void deleteDirectory(Path path, String description) {
        try {
            if (Files.exists(path)) {
                Files.walkFileTree(path, new SimpleFileVisitor<>() {
                    @Override
                    public FileVisitResult visitFile(Path file, BasicFileAttributes attrs) throws IOException {
                        Files.delete(file);
                        return FileVisitResult.CONTINUE;
                    }

                    @Override
                    public FileVisitResult postVisitDirectory(Path dir, IOException exc) throws IOException {
                        Files.delete(dir);
                        return FileVisitResult.CONTINUE;
                    }
                });
                logger.info("Deleted {} directory: {}", description, path);
            } else {
                logger.debug("{} directory does not exist, skipping: {}", description, path);
            }
        } catch (IOException e) {
            logger.warn("Failed to delete {} directory: {} - {}", description, path, e.getMessage());
        }
    }
}
