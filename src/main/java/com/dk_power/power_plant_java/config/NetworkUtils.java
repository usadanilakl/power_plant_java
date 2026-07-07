package com.dk_power.power_plant_java.config;

import jakarta.servlet.http.HttpServletRequest;

import java.net.Inet6Address;
import java.net.InetAddress;
import java.net.UnknownHostException;

public class NetworkUtils {

    private NetworkUtils() {}

    /**
     * Check if the request originates from an internal/private network.
     * Covers RFC 1918 IPv4 ranges, loopback, IPv4 link-local,
     * and common IPv6 LAN ranges (link-local and unique-local).
     */
    public static boolean isInternalRequest(HttpServletRequest request) {
        // A request that arrived through the reverse proxy is external by definition on this
        // deployment: internal clients connect to the app directly (no forwarding headers),
        // external clients come via IIS (which adds them). Presence-only check — the header
        // value is never trusted, so a client cannot forge its way to "internal".
        if (arrivedViaProxy(request)) {
            return false;
        }
        return isInternalIp(getClientIp(request));
    }

    /**
     * Check if the request originates from localhost (loopback only).
     *
     * SECURITY: a genuinely local request carries NO proxy-forwarding headers. If any
     * proxy touched the request it is not loopback, whatever IP it resolves to — so we
     * reject it up front. This keeps the highest-value loopback gates (desktop
     * auto-auth, /server/stop) robust even if RemoteIpValve were misconfigured.
     */
    public static boolean isLoopbackRequest(HttpServletRequest request) {
        if (arrivedViaProxy(request)) {
            return false;
        }
        return isLoopbackIp(getClientIp(request));
    }

    /**
     * True if the request carries reverse-proxy forwarding headers, i.e. it did NOT connect to
     * the app directly. On this deployment only IIS (external traffic) adds these; internal LAN
     * clients connect straight to Tomcat. Presence-only check — the value is never read, so a
     * client cannot forge its way to "internal"/"loopback" by adding a header.
     */
    private static boolean arrivedViaProxy(HttpServletRequest request) {
        return request.getHeader("X-Forwarded-For") != null
                || request.getHeader("X-Real-IP") != null
                || request.getHeader("Forwarded") != null;
    }

    public static boolean isLoopbackIp(String ip) {
        if (ip == null) return false;
        ip = stripZoneId(normalizeIp(ip));
        if ("0:0:0:0:0:0:0:1".equals(ip) || "::1".equals(ip)) return true;
        return ip.startsWith("127.");
    }

    public static boolean isInternalIp(String ip) {
        if (ip == null) return false;

        ip = stripZoneId(normalizeIp(ip));

        if ("0:0:0:0:0:0:0:1".equals(ip) || "::1".equals(ip)) return true;
        if (ip.startsWith("127.")) return true;
        if (ip.startsWith("10.")) return true;
        if (ip.startsWith("192.168.")) return true;

        if (ip.startsWith("172.")) {
            try {
                int secondOctet = Integer.parseInt(ip.split("\\.")[1]);
                if (secondOctet >= 16 && secondOctet <= 31) return true;
            } catch (NumberFormatException ignored) {
                // Continue to other checks.
            }
        }

        if (ip.startsWith("169.254.")) return true;

        String lowerIp = ip.toLowerCase();
        if (lowerIp.startsWith("fe80:") || lowerIp.startsWith("fe90:")
                || lowerIp.startsWith("fea0:") || lowerIp.startsWith("feb0:")
                || lowerIp.startsWith("fc") || lowerIp.startsWith("fd")
                || lowerIp.startsWith("fec") || lowerIp.startsWith("fed")
                || lowerIp.startsWith("fee") || lowerIp.startsWith("fef")) {
            return true;
        }

        try {
            InetAddress address = InetAddress.getByName(ip);
            if (address.isAnyLocalAddress() || address.isLoopbackAddress()
                    || address.isLinkLocalAddress() || address.isSiteLocalAddress()) {
                return true;
            }
            if (address instanceof Inet6Address inet6Address) {
                byte[] bytes = inet6Address.getAddress();
                return bytes.length > 0 && (bytes[0] & (byte) 0xFE) == (byte) 0xFC;
            }
        } catch (UnknownHostException ignored) {
            return false;
        }

        return false;
    }

    /**
     * Normalize IP address by stripping IPv6-mapped IPv4 prefixes.
     * Java on Windows returns addresses like "::ffff:10.10.190.123" or
     * "0:0:0:0:0:0:ffff:a0a:be7b" for IPv4 LAN peers connecting over IPv6 sockets.
     */
    private static String normalizeIp(String ip) {
        if (ip == null) return null;
        if (ip.startsWith("::ffff:") && ip.indexOf('.') > 0) {
            return ip.substring(7);
        }
        if (ip.startsWith("0:0:0:0:0:0:ffff:") || ip.startsWith("0:0:0:0:0:ffff:")) {
            String hexPart = ip.substring(ip.lastIndexOf("ffff:") + 5);
            String[] hexOctets = hexPart.split(":");
            if (hexOctets.length == 2) {
                try {
                    int hi = Integer.parseInt(hexOctets[0], 16);
                    int lo = Integer.parseInt(hexOctets[1], 16);
                    return (hi >> 8) + "." + (hi & 0xFF) + "." + (lo >> 8) + "." + (lo & 0xFF);
                } catch (NumberFormatException ignored) {
                    // Not a valid mapped address.
                }
            }
        }
        return ip;
    }

    private static String stripZoneId(String ip) {
        if (ip == null) return null;
        int zoneIndex = ip.indexOf('%');
        return zoneIndex >= 0 ? ip.substring(0, zoneIndex) : ip;
    }

    /**
     * Client IP for AUTHORIZATION decisions.
     *
     * SECURITY: uses only the real socket peer — resolved, behind the IIS reverse proxy,
     * by Tomcat's RemoteIpValve (see server.tomcat.remoteip.internal-proxies on the
     * 'server' profile). It deliberately does NOT read X-Forwarded-For / X-Real-IP here:
     * those are client-settable, and trusting them previously let a remote caller forge a
     * loopback/LAN address and bypass every IP-based gate. Use header values for logging
     * only, never for trust decisions.
     */
    public static String getClientIp(HttpServletRequest request) {
        return request.getRemoteAddr();
    }
}
