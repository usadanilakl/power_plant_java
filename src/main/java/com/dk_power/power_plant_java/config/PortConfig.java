package com.dk_power.power_plant_java.config;

import org.springframework.boot.web.server.ConfigurableWebServerFactory;
import org.springframework.boot.web.server.WebServerFactoryCustomizer;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.net.ServerSocket;

@Component
public class PortConfig implements WebServerFactoryCustomizer<ConfigurableWebServerFactory> {

    private static final int PREFERRED_PORT = 8082;
    private static final int[] FALLBACK_PORTS = {8083, 8084, 8085, 8086, 8087, 8088, 8089, 8090};

    @Override
    public void customize(ConfigurableWebServerFactory factory) {
        int port = findAvailablePort();
        factory.setPort(port);
        System.out.println("Starting server on port: " + port);
    }

    private int findAvailablePort() {
        if (isPortAvailable(PREFERRED_PORT)) {
            return PREFERRED_PORT;
        }

        System.out.println("Port " + PREFERRED_PORT + " is busy, searching for alternative...");

        for (int port : FALLBACK_PORTS) {
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
