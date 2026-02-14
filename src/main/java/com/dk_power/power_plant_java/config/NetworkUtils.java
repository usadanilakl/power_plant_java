package com.dk_power.power_plant_java.config;

import jakarta.servlet.http.HttpServletRequest;

public class NetworkUtils {

    private NetworkUtils() {}

    /**
     * Check if the request originates from an internal/private network.
     * Covers RFC 1918 ranges, loopback, and link-local addresses.
     */
    public static boolean isInternalRequest(HttpServletRequest request) {
        String ip = getClientIp(request);
        return isInternalIp(ip);
    }

    public static boolean isInternalIp(String ip) {
        if (ip == null) return false;

        // IPv6 loopback
        if ("0:0:0:0:0:0:0:1".equals(ip) || "::1".equals(ip)) return true;

        // IPv4 loopback
        if (ip.startsWith("127.")) return true;

        // RFC 1918 private ranges
        if (ip.startsWith("10.")) return true;
        if (ip.startsWith("192.168.")) return true;

        // 172.16.0.0 - 172.31.255.255
        if (ip.startsWith("172.")) {
            try {
                int secondOctet = Integer.parseInt(ip.split("\\.")[1]);
                if (secondOctet >= 16 && secondOctet <= 31) return true;
            } catch (NumberFormatException e) {
                // Not a valid IP
            }
        }

        // Link-local
        if (ip.startsWith("169.254.")) return true;

        return false;
    }

    /**
     * Extract client IP, checking X-Forwarded-For for proxied requests.
     */
    public static String getClientIp(HttpServletRequest request) {
        String forwarded = request.getHeader("X-Forwarded-For");
        if (forwarded != null && !forwarded.isBlank()) {
            // X-Forwarded-For can contain multiple IPs: client, proxy1, proxy2
            // The first one is the original client
            return forwarded.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }
}
