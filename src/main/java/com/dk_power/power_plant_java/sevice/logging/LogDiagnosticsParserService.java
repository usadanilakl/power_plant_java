package com.dk_power.power_plant_java.sevice.logging;

import com.dk_power.power_plant_java.dto.logging.LogDiagnosticsEventDto;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
public class LogDiagnosticsParserService {

    private static final DateTimeFormatter TS_FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss.SSS");
    private static final Pattern STRUCTURED_LINE = Pattern.compile(
        "^(?<ts>\\d{4}-\\d{2}-\\d{2} \\d{2}:\\d{2}:\\d{2}\\.\\d{3})\\s+" +
            "(?<level>TRACE|DEBUG|INFO|WARN|ERROR)\\s+" +
            "\\[(?<thread>[^\\]]+)\\]\\s+" +
            "\\[(?<mdc>[^\\]]*)\\]\\s+" +
            "(?<logger>.+?)\\s+-\\s+(?<message>.*)$"
    );
    private static final Pattern LEGACY_LINE = Pattern.compile(
        "^(?<ts>\\d{4}-\\d{2}-\\d{2} \\d{2}:\\d{2}:\\d{2}\\.\\d{3})\\s+" +
            "(?<level>TRACE|DEBUG|INFO|WARN|ERROR)\\s+" +
            "\\[(?<thread>[^\\]]+)\\]\\s+" +
            "(?<logger>.+?)\\s+-\\s+(?<message>.*)$"
    );
    private static final Pattern KEY_VALUE = Pattern.compile("(?<key>[A-Za-z][A-Za-z0-9]*)=(?<value>[^\\s]+)");

    public List<LogDiagnosticsEventDto> parse(String sourceFile, List<String> lines) {
        List<LogDiagnosticsEventDto> events = new ArrayList<>();
        ParsedEventBuilder current = null;

        for (String line : lines) {
            ParsedEventBuilder parsed = parseEventStart(sourceFile, line);
            if (parsed != null) {
                if (current != null) {
                    events.add(current.build());
                }
                current = parsed;
                continue;
            }

            if (current != null) {
                current.appendDetail(line);
            }
        }

        if (current != null) {
            events.add(current.build());
        }

        return events;
    }

    private ParsedEventBuilder parseEventStart(String sourceFile, String line) {
        Matcher matcher = STRUCTURED_LINE.matcher(line);
        if (matcher.matches()) {
            Map<String, String> mdcValues = parseMdc(matcher.group("mdc"));
            return new ParsedEventBuilder(
                parseTimestamp(matcher.group("ts")),
                matcher.group("level"),
                sourceFile,
                matcher.group("logger").trim(),
                matcher.group("thread"),
                matcher.group("message"),
                mdcValues
            );
        }

        Matcher legacyMatcher = LEGACY_LINE.matcher(line);
        if (legacyMatcher.matches()) {
            return new ParsedEventBuilder(
                parseTimestamp(legacyMatcher.group("ts")),
                legacyMatcher.group("level"),
                sourceFile,
                legacyMatcher.group("logger").trim(),
                legacyMatcher.group("thread"),
                legacyMatcher.group("message"),
                Map.of()
            );
        }

        return null;
    }

    private Instant parseTimestamp(String timestamp) {
        return LocalDateTime.parse(timestamp, TS_FORMATTER)
            .atZone(ZoneId.systemDefault())
            .toInstant();
    }

    private Map<String, String> parseMdc(String mdcText) {
        Map<String, String> values = new LinkedHashMap<>();
        for (String token : mdcText.split("\\s+")) {
            int separator = token.indexOf('=');
            if (separator <= 0) {
                continue;
            }
            String key = token.substring(0, separator);
            String value = token.substring(separator + 1);
            if ("-".equals(value) || value.isBlank()) {
                continue;
            }
            values.put(key, value);
        }
        return values;
    }

    private static final class ParsedEventBuilder {
        private final Instant timestamp;
        private final String level;
        private final String sourceFile;
        private final String logger;
        private final String thread;
        private final String message;
        private final Map<String, String> mdcValues;
        private final StringBuilder details = new StringBuilder();

        private ParsedEventBuilder(
            Instant timestamp,
            String level,
            String sourceFile,
            String logger,
            String thread,
            String message,
            Map<String, String> mdcValues
        ) {
            this.timestamp = timestamp;
            this.level = level;
            this.sourceFile = sourceFile;
            this.logger = logger;
            this.thread = thread;
            this.message = message;
            this.mdcValues = mdcValues;
        }

        private void appendDetail(String line) {
            if (details.length() > 0) {
                details.append('\n');
            }
            details.append(line);
        }

        private LogDiagnosticsEventDto build() {
            String normalizedMessage = message == null ? "" : message.trim();
            String entityValue = mdcValues.get("entity");
            String entityType = extractEntityType(entityValue);
            String entityId = extractEntityId(entityValue);
            return new LogDiagnosticsEventDto(
                timestamp,
                level,
                detectSubsystem(logger, normalizedMessage),
                sourceFile,
                logger,
                thread,
                detectEventCode(normalizedMessage),
                normalizedMessage,
                details.length() == 0 ? null : details.toString(),
                mdcValues.get("req"),
                mdcValues.get("user"),
                mdcValues.get("machine"),
                mdcValues.get("job"),
                mdcValues.get("jobRun"),
                mdcValues.get("sync"),
                entityType,
                entityId,
                mdcValues.get("sp"),
                extractField(normalizedMessage, "method"),
                extractField(normalizedMessage, "path"),
                extractField(normalizedMessage, "remoteIp"),
                extractIntegerField(normalizedMessage, "status"),
                extractLongField(normalizedMessage, "durationMs")
            );
        }

        private String extractEntityType(String entityValue) {
            if (entityValue == null || entityValue.isBlank()) {
                return null;
            }
            int separator = entityValue.indexOf('/');
            return separator >= 0 ? entityValue.substring(0, separator) : entityValue;
        }

        private String extractEntityId(String entityValue) {
            if (entityValue == null || entityValue.isBlank()) {
                return null;
            }
            int separator = entityValue.indexOf('/');
            if (separator < 0 || separator == entityValue.length() - 1) {
                return null;
            }
            String value = entityValue.substring(separator + 1);
            return "-".equals(value) ? null : value;
        }

        private static String detectSubsystem(String logger, String message) {
            String lowerLogger = logger.toLowerCase();
            String lowerMessage = message.toLowerCase();
            if (lowerMessage.startsWith("db.pool.") || lowerMessage.contains("hikaripool")) {
                return "Database";
            }
            if (lowerMessage.startsWith("http.request.")) {
                return "HTTP";
            }
            if (lowerLogger.contains(".config.security") || lowerLogger.contains(".controller.auth")) {
                return "Security";
            }
            if (lowerLogger.contains(".sevice.sharepoint")) {
                return "SharePoint";
            }
            if (lowerLogger.contains(".sevice.hub") || lowerLogger.contains(".controller.hub")) {
                return "Hub";
            }
            if (lowerLogger.contains(".sevice.sync") || lowerLogger.contains(".controller.sync")) {
                return "Sync";
            }
            return "Application";
        }

        private static String detectEventCode(String message) {
            if (message == null || message.isBlank()) {
                return null;
            }
            int firstSpace = message.indexOf(' ');
            String token = firstSpace >= 0 ? message.substring(0, firstSpace) : message;
            return token.contains(".") ? token : null;
        }

        private static String extractField(String message, String key) {
            Matcher matcher = KEY_VALUE.matcher(message);
            while (matcher.find()) {
                if (key.equals(matcher.group("key"))) {
                    String value = matcher.group("value");
                    return "-".equals(value) ? null : value;
                }
            }
            return null;
        }

        private static Integer extractIntegerField(String message, String key) {
            String value = extractField(message, key);
            if (value == null) {
                return null;
            }
            try {
                return Integer.parseInt(value);
            } catch (NumberFormatException ignored) {
                return null;
            }
        }

        private static Long extractLongField(String message, String key) {
            String value = extractField(message, key);
            if (value == null) {
                return null;
            }
            try {
                return Long.parseLong(value);
            } catch (NumberFormatException ignored) {
                return null;
            }
        }
    }
}
