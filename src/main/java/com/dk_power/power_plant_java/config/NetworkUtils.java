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

    /**
     * Check if the request originates from localhost (loopback only).
     */
    public static boolean isLoopbackRequest(HttpServletRequest request) {
        String ip = getClientIp(request);
        return isLoopbackIp(ip);
    }

    public static boolean isLoopbackIp(String ip) {
        if (ip == null) return false;
        ip = normalizeIp(ip);
        if ("0:0:0:0:0:0:0:1".equals(ip) || "::1".equals(ip)) return true;
        return ip.startsWith("127.");
    }

    public static boolean isInternalIp(String ip) {
        if (ip == null) return false;

        // Normalize: strip IPv6-mapped IPv4 prefix (::ffff:10.x.x.x → 10.x.x.x)
        // Java on Windows often returns these for LAN connections.
        ip = normalizeIp(ip);

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
     * Normalize IP address by stripping IPv6-mapped IPv4 prefixes.
     * Java on Windows returns addresses like "::ffff:10.10.190.123" or
     * "0:0:0:0:0:0:ffff:a0a:be7b" for IPv4 LAN peers connecting over IPv6 sockets.
     */
    private static String normalizeIp(String ip) {
        if (ip == null) return null;
        // "::ffff:10.10.190.123" → "10.10.190.123"
        if (ip.startsWith("::ffff:") && ip.indexOf('.') > 0) {
            return ip.substring(7);
        }
        // "0:0:0:0:0:0:ffff:a0a:be7b" → convert hex octets to dotted decimal
        if (ip.startsWith("0:0:0:0:0:0:ffff:") || ip.startsWith("0:0:0:0:0:ffff:")) {
            String hexPart = ip.substring(ip.lastIndexOf("ffff:") + 5);
            String[] hexOctets = hexPart.split(":");
            if (hexOctets.length == 2) {
                try {
                    int hi = Integer.parseInt(hexOctets[0], 16);
                    int lo = Integer.parseInt(hexOctets[1], 16);
                    return (hi >> 8) + "." + (hi & 0xFF) + "." + (lo >> 8) + "." + (lo & 0xFF);
                } catch (NumberFormatException e) {
                    // Not a valid mapped address
                }
            }
        }
        return ip;
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
