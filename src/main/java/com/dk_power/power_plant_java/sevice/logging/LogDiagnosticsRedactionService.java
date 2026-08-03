package com.dk_power.power_plant_java.sevice.logging;

import com.dk_power.power_plant_java.dto.logging.LogDiagnosticsEventDto;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.net.Inet6Address;
import java.net.InetAddress;
import java.net.UnknownHostException;
import java.util.Locale;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * The single outbound sanitization boundary for diagnostics events.
 *
 * <p>The on-disk logs and the internal cache intentionally remain unchanged so operators can still
 * investigate locally. Every event returned by {@link LogDiagnosticsService}, including future
 * historical/streaming consumers built on that service, passes through this component.</p>
 */
@Service
public class LogDiagnosticsRedactionService {

    private static final String REDACTED = "[REDACTED]";
    private static final String TRUNCATED = "...[TRUNCATED]";

    private static final Pattern RESET_URL = Pattern.compile(
        "(?i)(?:https?://|/)[^\\s<>\\\"']*(?:reset|recover|forgot)[^\\s<>\\\"']*"
    );
    private static final Pattern SECRET_HEADER = Pattern.compile(
        "(?im)(\\b(?:authorization|proxy-authorization|cookie|set-cookie)\\s*:\\s*)[^\\r\\n]*"
    );
    private static final Pattern URL_QUERY_SECRET = Pattern.compile(
        "(?i)([?&](?:code|sig|signature|client_secret|access_token|refresh_token|id_token|" +
            "reset_token|token)=)[^&#\\s\\\"'<>]+"
    );
    private static final Pattern SECRET_ASSIGNMENT = Pattern.compile(
        "(?i)((?:[\\\"']?(?:authorization|password|passwd|pwd|secret|client[-_ ]?secret|" +
            "api[-_ ]?key|access[-_ ]?token|refresh[-_ ]?token|id[-_ ]?token|reset[-_ ]?token|" +
            "auth[-_ ]?token|signature|sig|token)[\\\"']?)\\s*(?:=|:)\\s*)" +
            "(?:\\\"[^\\\"\\r\\n]*\\\"|'[^'\\r\\n]*'|(?:Bearer\\s+)?[^\\s,;&}\\]]+)"
    );
    private static final Pattern BEARER_TOKEN = Pattern.compile(
        "(?i)(\\bBearer\\s+)[A-Za-z0-9._~+/=-]+"
    );
    private static final Pattern JWT = Pattern.compile(
        "(?<![A-Za-z0-9_-])[A-Za-z0-9_-]{8,}\\.[A-Za-z0-9_-]{8,}\\.[A-Za-z0-9_-]{8,}(?![A-Za-z0-9_-])"
    );
    private static final Pattern ACCESS_KEY = Pattern.compile("(?<![A-Z0-9])(?:AKIA|ASIA)[A-Z0-9]{16}(?![A-Z0-9])");
    private static final Pattern EMAIL = Pattern.compile(
        "(?i)([A-Z0-9._%+-])([A-Z0-9._%+-]*)(@[A-Z0-9.-]+\\.[A-Z]{2,})"
    );
    private static final Pattern IPV4 = Pattern.compile(
        "(?<!\\d)(25[0-5]|2[0-4]\\d|1?\\d?\\d)\\." +
            "(25[0-5]|2[0-4]\\d|1?\\d?\\d)\\." +
            "(25[0-5]|2[0-4]\\d|1?\\d?\\d)\\." +
            "(25[0-5]|2[0-4]\\d|1?\\d?\\d)(?!\\d)"
    );
    private static final Pattern IPV6_CANDIDATE = Pattern.compile(
        "(?i)(?<![0-9a-f:])\\[?(?:[0-9a-f]{0,4}:){2,7}[0-9a-f]{0,4}(?:%[a-z0-9_.-]+)?\\]?(?![0-9a-f:])"
    );

    @Value("${logging.diagnostics.redaction.max-message-length:4096}")
    private int maxMessageLength = 4096;

    @Value("${logging.diagnostics.redaction.max-details-length:16384}")
    private int maxDetailsLength = 16384;

    @Value("${logging.diagnostics.redaction.max-context-length:512}")
    private int maxContextLength = 512;

    @Value("${logging.diagnostics.redaction.max-path-length:2048}")
    private int maxPathLength = 2048;

    @Value("${logging.diagnostics.redaction.mask-email-addresses:true}")
    private boolean maskEmailAddresses = true;

    @Value("${logging.diagnostics.redaction.mask-ip-addresses:true}")
    private boolean maskIpAddresses = true;

    public LogDiagnosticsEventDto redact(LogDiagnosticsEventDto event) {
        if (event == null) {
            return null;
        }
        return new LogDiagnosticsEventDto(
            event.timestamp(),
            sanitize(event.level(), 16),
            sanitize(event.subsystem(), 128),
            sanitize(event.sourceFile(), 128),
            sanitize(event.logger(), maxContextLength),
            sanitize(event.thread(), maxContextLength),
            sanitize(event.eventCode(), 256),
            sanitize(event.message(), maxMessageLength),
            sanitize(event.details(), maxDetailsLength),
            sanitize(event.requestId(), maxContextLength),
            sanitize(event.userId(), maxContextLength),
            sanitize(event.machineId(), maxContextLength),
            sanitize(event.jobName(), maxContextLength),
            sanitize(event.jobRunId(), maxContextLength),
            sanitize(event.syncRunId(), maxContextLength),
            sanitize(event.entityType(), maxContextLength),
            sanitize(event.entityId(), maxContextLength),
            sanitize(event.sharepointId(), maxContextLength),
            sanitize(event.method(), 32),
            sanitize(event.path(), maxPathLength),
            sanitizeIpField(event.remoteIp()),
            event.status(),
            event.durationMs(),
            event.eventId(),
            event.logicalEventId()
        );
    }

    public String redactListValue(String value) {
        return sanitize(value, 256);
    }

    private String sanitizeIpField(String value) {
        if (value == null) {
            return null;
        }
        return sanitize(value, maxContextLength);
    }

    String sanitize(String value, int configuredLimit) {
        if (value == null) {
            return null;
        }

        String sanitized = RESET_URL.matcher(value).replaceAll("[REDACTED:RESET_URL]");
        sanitized = replaceSecretValue(SECRET_HEADER, sanitized);
        sanitized = replaceSecretValue(URL_QUERY_SECRET, sanitized);
        sanitized = replaceSecretValue(SECRET_ASSIGNMENT, sanitized);
        sanitized = replaceSecretValue(BEARER_TOKEN, sanitized);
        sanitized = JWT.matcher(sanitized).replaceAll("[REDACTED:JWT]");
        sanitized = ACCESS_KEY.matcher(sanitized).replaceAll("[REDACTED:ACCESS_KEY]");

        if (maskEmailAddresses) {
            sanitized = maskEmails(sanitized);
        }
        if (maskIpAddresses) {
            sanitized = maskIpv4Addresses(sanitized);
            sanitized = maskIpv6Addresses(sanitized);
        }

        return truncate(sanitized, configuredLimit);
    }

    private String replaceSecretValue(Pattern pattern, String value) {
        Matcher matcher = pattern.matcher(value);
        StringBuilder result = new StringBuilder(value.length());
        while (matcher.find()) {
            String prefix = matcher.groupCount() > 0 ? matcher.group(1) : "";
            matcher.appendReplacement(result, Matcher.quoteReplacement(prefix + REDACTED));
        }
        matcher.appendTail(result);
        return result.toString();
    }

    private String maskEmails(String value) {
        Matcher matcher = EMAIL.matcher(value);
        StringBuilder result = new StringBuilder(value.length());
        while (matcher.find()) {
            matcher.appendReplacement(
                result,
                Matcher.quoteReplacement(matcher.group(1) + "***" + matcher.group(3).toLowerCase(Locale.ROOT))
            );
        }
        matcher.appendTail(result);
        return result.toString();
    }

    private String maskIpv4Addresses(String value) {
        Matcher matcher = IPV4.matcher(value);
        StringBuilder result = new StringBuilder(value.length());
        while (matcher.find()) {
            matcher.appendReplacement(
                result,
                Matcher.quoteReplacement(matcher.group(1) + "." + matcher.group(2) + ".x.x")
            );
        }
        matcher.appendTail(result);
        return result.toString();
    }

    private String maskIpv6Addresses(String value) {
        Matcher matcher = IPV6_CANDIDATE.matcher(value);
        StringBuilder result = new StringBuilder(value.length());
        while (matcher.find()) {
            String candidate = matcher.group();
            String address = candidate;
            if (address.startsWith("[") && address.endsWith("]")) {
                address = address.substring(1, address.length() - 1);
            }
            int zoneIndex = address.indexOf('%');
            String addressWithoutZone = zoneIndex >= 0 ? address.substring(0, zoneIndex) : address;
            if (isIpv6Address(addressWithoutZone)) {
                matcher.appendReplacement(result, "[IPV6:MASKED]");
            } else {
                matcher.appendReplacement(result, Matcher.quoteReplacement(candidate));
            }
        }
        matcher.appendTail(result);
        return result.toString();
    }

    private boolean isIpv6Address(String candidate) {
        try {
            InetAddress parsed = InetAddress.getByName(candidate);
            return parsed instanceof Inet6Address;
        } catch (UnknownHostException ignored) {
            return false;
        }
    }

    private String truncate(String value, int configuredLimit) {
        int limit = Math.max(TRUNCATED.length() + 1, configuredLimit);
        if (value.length() <= limit) {
            return value;
        }
        int prefixLength = limit - TRUNCATED.length();
        if (prefixLength > 0 && Character.isHighSurrogate(value.charAt(prefixLength - 1))) {
            prefixLength--;
        }
        return value.substring(0, prefixLength) + TRUNCATED;
    }
}
