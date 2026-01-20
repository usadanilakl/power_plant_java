package com.dk_power.power_plant_java.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.IOException;
import java.io.InputStream;
import java.nio.file.*;
import java.nio.file.attribute.BasicFileAttributes;
import java.util.Properties;

/**
 * Utility class to clean up test data (database and uploads folder) before Spring Boot starts.
 * Must be called from main() BEFORE SpringApplication.run().
 *
 * Only runs when:
 * 1. The active profile is "test" (spring.profiles.active=test)
 * 2. Cleanup is enabled (test.cleanup.enabled=true)
 *
 * Configuration in application-test.properties:
 * - test.cleanup.enabled=true/false - Enable or disable cleanup
 * - test.cleanup.database-path - Path to the test database file
 * - test.cleanup.uploads-path - Path to the test uploads folder
 */
public class TestCleanupConfig {

    private static final Logger logger = LoggerFactory.getLogger(TestCleanupConfig.class);

    /**
     * Runs cleanup based on application properties settings.
     * Call this from main() before SpringApplication.run().
     */
    public static void runCleanup() {
        // First check if test profile is active
        Properties mainProps = loadProperties("application.properties");
        String activeProfile = mainProps.getProperty("spring.profiles.active", "");

        if (!"test".equalsIgnoreCase(activeProfile)) {
            logger.info("Test profile is not active (current: {}). Skipping test cleanup.", activeProfile);
            return;
        }

        // Load test profile properties
        Properties testProps = loadProperties("application-test.properties");

        boolean cleanupEnabled = Boolean.parseBoolean(testProps.getProperty("test.cleanup.enabled", "false"));

        if (!cleanupEnabled) {
            logger.info("Test cleanup is disabled. Skipping cleanup.");
            return;
        }

        logger.info("Test cleanup is enabled. Starting cleanup...");

        String databasePath = resolveProperty(testProps.getProperty("test.cleanup.database-path", ""));
        String uploadsPath = resolveProperty(testProps.getProperty("test.cleanup.uploads-path", ""));

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

    private static Properties loadProperties(String filename) {
        Properties props = new Properties();
        try (InputStream input = TestCleanupConfig.class.getClassLoader().getResourceAsStream(filename)) {
            if (input != null) {
                props.load(input);
            }
        } catch (IOException e) {
            logger.warn("Could not load {} for cleanup config: {}", filename, e.getMessage());
        }
        return props;
    }

    /**
     * Resolve property placeholders like ${user.dir}
     */
    private static String resolveProperty(String value) {
        if (value == null) return null;
        return value.replace("${user.dir}", System.getProperty("user.dir"));
    }

    private static void deleteFile(Path path, String description) {
        try {
            if (Files.exists(path)) {
                Files.delete(path);
                logger.info("Deleted {} file: {}", description, path.toAbsolutePath());
            } else {
                logger.debug("{} file does not exist, skipping: {}", description, path.toAbsolutePath());
            }
        } catch (IOException e) {
            logger.warn("Failed to delete {} file: {} - {}", description, path.toAbsolutePath(), e.getMessage());
        }
    }

    private static void deleteDirectory(Path path, String description) {
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
                logger.info("Deleted {} directory: {}", description, path.toAbsolutePath());
            } else {
                logger.debug("{} directory does not exist, skipping: {}", description, path.toAbsolutePath());
            }
        } catch (IOException e) {
            logger.warn("Failed to delete {} directory: {} - {}", description, path.toAbsolutePath(), e.getMessage());
        }
    }
}
