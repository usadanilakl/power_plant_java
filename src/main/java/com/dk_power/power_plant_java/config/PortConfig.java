package com.dk_power.power_plant_java.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.web.server.ConfigurableWebServerFactory;
import org.springframework.boot.web.server.WebServerFactoryCustomizer;
import org.springframework.boot.web.context.WebServerInitializedEvent;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.net.ServerSocket;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;

@Component
public class PortConfig implements WebServerFactoryCustomizer<ConfigurableWebServerFactory> {

    @Value("${server.port:8082}")
    private int preferredPort;

    private static final int[] FALLBACK_PORTS = {8082, 8083, 8084, 8085, 8086, 8087, 8088, 8089, 8090};

    @Override
    public void customize(ConfigurableWebServerFactory factory) {
        int port = findAvailablePort();
        factory.setPort(port);
        System.out.println("Starting server on port: " + port);
    }

    @EventListener
    public void onServerInitialized(WebServerInitializedEvent event) {
        int actualPort = event.getWebServer().getPort();
        writePortToFile(actualPort);
    }

    private void writePortToFile(int port) {
        try {
            Path portFile = Paths.get("backend-port.txt");
            Files.writeString(portFile, String.valueOf(port));
            System.out.println("Wrote backend port " + port + " to " + portFile.toAbsolutePath());
        } catch (IOException e) {
            System.err.println("Failed to write backend port to file: " + e.getMessage());
        }
    }

    private int findAvailablePort() {
        if (isPortAvailable(preferredPort)) {
            return preferredPort;
        }

        System.out.println("Port " + preferredPort + " is busy, searching for alternative...");

        for (int port : FALLBACK_PORTS) {
            if (port == preferredPort) continue;
            if (isPortAvailable(port)) {
                System.out.println("Found available port: " + port);
                return port;
            }
        }

        // If all specified ports are busy, let the OS assign one
        System.out.println("All preferred ports are busy, using random available port");
        return 0;
    }

    private boolean isPortAvailable(int port) {
        try (ServerSocket socket = new ServerSocket(port)) {
            socket.setReuseAddress(true);
            return true;
        } catch (IOException e) {
            return false;
        }
    }
}
