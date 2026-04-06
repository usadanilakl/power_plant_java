package com.dk_power.power_plant_java.sevice.hub;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.nio.file.DirectoryStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;

/**
 * PostgreSQL backup service for hub disaster recovery.
 * Uses pg_dump to create SQL dumps of the hub database.
 *
 * Only active when sync.role=hub — desktop clients use H2BackupService.
 */
@Service
@ConditionalOnProperty(name = "sync.role", havingValue = "hub")
@Slf4j
public class PostgresBackupService {

    @Value("${spring.datasource.url:}")
    private String datasourceUrl;

    @Value("${spring.datasource.username:}")
    private String dbUsername;

    @Value("${spring.datasource.password:}")
    private String dbPassword;

    @Value("${sync.backup.storage-path:./backup-storage}")
    private String backupStoragePath;

    @Value("${sync.backup.max-old-backups:3}")
    private int maxOldBackups;

    /**
     * Check if the hub is running on PostgreSQL.
     */
    public boolean isPostgres() {
        return datasourceUrl != null && datasourceUrl.startsWith("jdbc:postgresql:");
    }

    /**
     * Create a pg_dump backup of the hub database.
     *
     * @return path to the backup file, or null if not running on PostgreSQL
     */
    public Path createBackup() throws IOException, InterruptedException {
        if (!isPostgres()) {
            log.debug("Not running on PostgreSQL — skipping pg_dump backup");
            return null;
        }

        Path backupDir = Paths.get(backupStoragePath).toAbsolutePath().normalize();
        Files.createDirectories(backupDir);

        String timestamp = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd_HHmmss"));
        String backupFileName = "pg_backup_" + timestamp + ".sql";
        Path backupPath = backupDir.resolve(backupFileName);

        // Parse connection details from JDBC URL
        // Format: jdbc:postgresql://host:port/dbname
        String dbName = extractDbName(datasourceUrl);
        String host = extractHost(datasourceUrl);
        String port = extractPort(datasourceUrl);

        List<String> command = new ArrayList<>();
        command.add("pg_dump");
        command.add("--host=" + host);
        command.add("--port=" + port);
        command.add("--username=" + dbUsername);
        command.add("--format=custom");  // Custom format supports pg_restore
        command.add("--file=" + backupPath);
        command.add(dbName);

        ProcessBuilder pb = new ProcessBuilder(command);
        pb.environment().put("PGPASSWORD", dbPassword);
        pb.redirectErrorStream(true);

        log.info("Starting pg_dump backup to {}", backupPath);
        Process process = pb.start();

        // Read output for logging
        String output = new String(process.getInputStream().readAllBytes());
        int exitCode = process.waitFor();

        if (exitCode != 0) {
            log.error("pg_dump failed (exit code {}): {}", exitCode, output);
            Files.deleteIfExists(backupPath);
            throw new IOException("pg_dump failed with exit code " + exitCode + ": " + output);
        }

        long fileSize = Files.size(backupPath);
        log.info("pg_dump backup created: {} ({} bytes)", backupPath, fileSize);

        cleanupOldBackups(backupDir, backupPath);
        return backupPath;
    }

    /**
     * List available PostgreSQL backups.
     */
    public List<String> listBackups() throws IOException {
        Path backupDir = Paths.get(backupStoragePath);
        if (!Files.exists(backupDir)) return List.of();

        List<String> backups = new ArrayList<>();
        try (DirectoryStream<Path> stream = Files.newDirectoryStream(backupDir, "pg_backup_*.sql")) {
            for (Path file : stream) {
                backups.add(file.getFileName().toString());
            }
        }
        backups.sort((a, b) -> b.compareTo(a)); // newest first
        return backups;
    }

    private void cleanupOldBackups(Path backupDir, Path currentBackup) {
        try {
            List<Path> backupFiles = new ArrayList<>();
            try (DirectoryStream<Path> stream = Files.newDirectoryStream(backupDir, "pg_backup_*.sql")) {
                for (Path file : stream) {
                    if (!file.equals(currentBackup)) {
                        backupFiles.add(file);
                    }
                }
            }
            backupFiles.sort((a, b) -> b.getFileName().toString().compareTo(a.getFileName().toString()));
            for (int i = maxOldBackups; i < backupFiles.size(); i++) {
                try {
                    Files.deleteIfExists(backupFiles.get(i));
                    log.debug("Deleted old pg_dump backup: {}", backupFiles.get(i));
                } catch (IOException e) {
                    log.warn("Failed to delete old backup: {}", backupFiles.get(i));
                }
            }
        } catch (IOException e) {
            log.warn("Failed to cleanup old backups: {}", e.getMessage());
        }
    }

    private String extractDbName(String jdbcUrl) {
        // jdbc:postgresql://host:port/dbname
        String afterProtocol = jdbcUrl.substring("jdbc:postgresql://".length());
        String[] parts = afterProtocol.split("/", 2);
        if (parts.length < 2) return "power_plant";
        // Strip query params
        String dbName = parts[1];
        int qIdx = dbName.indexOf('?');
        return qIdx >= 0 ? dbName.substring(0, qIdx) : dbName;
    }

    private String extractHost(String jdbcUrl) {
        String afterProtocol = jdbcUrl.substring("jdbc:postgresql://".length());
        String hostPort = afterProtocol.split("/", 2)[0];
        String host = hostPort.split(":")[0];
        return host.isEmpty() ? "localhost" : host;
    }

    private String extractPort(String jdbcUrl) {
        String afterProtocol = jdbcUrl.substring("jdbc:postgresql://".length());
        String hostPort = afterProtocol.split("/", 2)[0];
        String[] parts = hostPort.split(":");
        return parts.length > 1 ? parts[1] : "5432";
    }
}
