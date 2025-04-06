package com.dk_power.power_plant_java.sevice.app_services;

import org.h2.tools.Restore;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.nio.file.DirectoryStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.SQLException;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Comparator;
import java.util.List;
import java.util.stream.Collectors;
import java.util.stream.StreamSupport;

@Service
public class H2BackupService {

    @Value("${spring.datasource.url}")
    private String dbUrl;

    @Value("${spring.datasource.username}")
    private String dbUsername;

    @Value("${spring.datasource.password}")
    private String dbPassword;

    @Value("${h2.backup.directory}")
    private String backupDirectory;

    //@Scheduled(cron = "0 0 1 * * ?") // Run at 1:00 AM every day
    public void backupDatabase(){
        backupDatabase(null);
    }
    public void backupDatabase(String backupFileName) {
        if (backupFileName == null || backupFileName.isEmpty()) {
            backupFileName = "backup_" + LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd_HHmmss")) + ".zip";
        }

        Path backupPath = Paths.get(backupDirectory, backupFileName);

        try {
            // Ensure the backup directory exists
            Files.createDirectories(Paths.get(backupDirectory));

            // Perform the backup
            try (Connection conn = DriverManager.getConnection(dbUrl, dbUsername, dbPassword)) {
                String backupSql = "BACKUP TO '" + backupPath.toString() + "'";
                conn.createStatement().execute(backupSql);
                System.out.println("Database backup created successfully: " + backupPath);
            }

            // Keep only the 5 latest backups
            try (DirectoryStream<Path> stream = Files.newDirectoryStream(Paths.get(backupDirectory), "backup_*.zip")) {
                List<Path> backupFiles = StreamSupport.stream(stream.spliterator(), false)
                        .sorted(Comparator.comparing((Path path) -> {
                            try {
                                return Files.getLastModifiedTime(path).toMillis();
                            } catch (IOException e) {
                                return 0L;
                            }
                        }).reversed())
                        .collect(Collectors.toList());

                // Delete older backups
                for (int i = 5; i < backupFiles.size(); i++) {
                    try {
                        Files.delete(backupFiles.get(i));
                        System.out.println("Deleted old backup: " + backupFiles.get(i));
                    } catch (IOException e) {
                        System.err.println("Error deleting old backup: " + e.getMessage());
                    }
                }
            }
        } catch (SQLException | IOException e) {
            System.err.println("Error during database backup process: " + e.getMessage());
        }
    }

    public void restoreDatabase(String backupFileName) throws SQLException, IOException {
        Path backupPath = Paths.get(backupDirectory, backupFileName);
        if (!Files.exists(backupPath)) {
            throw new IOException("Backup file not found: " + backupPath);
        }

        // Close all existing connections to the database
        try (Connection conn = DriverManager.getConnection(dbUrl, dbUsername, dbPassword)) {
            conn.createStatement().execute("SHUTDOWN");
        }

        // Extract the database name and path from the JDBC URL
        String dbName = extractDatabaseName(dbUrl);
        String dbPath = extractDatabasePath(dbUrl);

        // Perform the restore
        try {
            Restore.execute(backupPath.toString(), dbPath, dbName);
            System.out.println("Database restored successfully from: " + backupPath);
        } catch (Exception e) {
            throw new IOException("Error restoring database: " + e.getMessage(), e);
        }
    }

    private String extractDatabaseName(String jdbcUrl) {
        // Extract the part after "jdbc:h2:"
        String[] parts = jdbcUrl.split("jdbc:h2:");
        if (parts.length < 2) {
            throw new IllegalArgumentException("Invalid JDBC URL format");
        }

        // Split by semicolon to get the database path
        String[] dbParts = parts[1].split(";");

        // Get the last part of the path (the database name)
        String[] pathParts = dbParts[0].split("/");
        String dbName = pathParts[pathParts.length - 1];

        // Remove any file extension if present
        if (dbName.endsWith(".mv.db")) {
            dbName = dbName.substring(0, dbName.length() - 6);
        }

        return dbName;
    }

    private String extractDatabasePath(String jdbcUrl) {
        // Extract the part after "jdbc:h2:"
        String[] parts = jdbcUrl.split("jdbc:h2:");
        if (parts.length < 2) {
            throw new IllegalArgumentException("Invalid JDBC URL format");
        }

        // Split by semicolon to get the database path
        String[] dbParts = parts[1].split(";");

        // Get the directory path
        String[] pathParts = dbParts[0].split("/");
        StringBuilder path = new StringBuilder();
        for (int i = 0; i < pathParts.length - 1; i++) {
            if (i > 0) {
                path.append("/");
            }
            path.append(pathParts[i]);
        }

        return path.toString();
    }

    public List<String> listBackups() throws IOException {
        try (DirectoryStream<Path> stream = Files.newDirectoryStream(Paths.get(backupDirectory), "backup_*.zip")) {
            return StreamSupport.stream(stream.spliterator(), false)
                    .map(Path::getFileName)
                    .map(Path::toString)
                    .sorted(Comparator.reverseOrder())
                    .collect(Collectors.toList());
        }
    }
}