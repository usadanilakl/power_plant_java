package com.dk_power.power_plant_java.sevice.logging;

import com.dk_power.power_plant_java.dto.logging.LogDiagnosticsEventDto;
import com.dk_power.power_plant_java.dto.logging.LogDiagnosticsEventsResponseDto;
import com.dk_power.power_plant_java.dto.logging.LogDiagnosticsSummaryDto;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.nio.charset.StandardCharsets;
import java.time.Clock;
import java.time.DateTimeException;
import java.time.Duration;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Base64;
import java.util.Comparator;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Objects;
import java.util.Set;
import java.util.function.Function;

@Service
public class LogDiagnosticsService {

    private static final Logger AUDIT_LOG = LoggerFactory.getLogger(
        "com.dk_power.power_plant_java.config.security.LogDiagnosticsAudit"
    );
    private static final String ALERTS_FILE = "power-plant-alerts.log";

    private final LogDiagnosticsFileService fileService;
    private final LogDiagnosticsRedactionService redactionService;
    private Clock clock = Clock.systemDefaultZone();

    @Value("${logging.diagnostics.query.max-limit:1000}")
    private int maxQueryLimit = 1000;

    @Value("${logging.diagnostics.query.max-range-minutes:10080}")
    private long maxQueryRangeMinutes = 7L * 24 * 60;

    @Value("${logging.diagnostics.query.max-filter-length:256}")
    private int maxFilterLength = 256;

    @Value("${logging.diagnostics.query.max-search-length:512}")
    private int maxSearchLength = 512;

    @Value("${logging.diagnostics.query.max-response-bytes:2097152}")
    private long maxResponseBytes = 2L * 1024 * 1024;

    @Value("${logging.diagnostics.query.max-option-values:500}")
    private int maxOptionValues = 500;

    public LogDiagnosticsService(
        LogDiagnosticsFileService fileService,
        LogDiagnosticsRedactionService redactionService
    ) {
        this.fileService = fileService;
        this.redactionService = redactionService;
    }

    /** Existing API retained while the UI migrates to absolute ranges and cursors. */
    public LogDiagnosticsEventsResponseDto getEvents(
        int windowMinutes,
        int limit,
        String level,
        String text,
        String sourceFile,
        String subsystem,
        String eventCode,
        String requestId,
        String syncRunId,
        String machineId
    ) {
        return getEvents(
            windowMinutes, limit, level, text, sourceFile, subsystem, eventCode,
            requestId, syncRunId, machineId, null, null, null, "desc"
        );
    }

    public LogDiagnosticsEventsResponseDto getEvents(
        int windowMinutes,
        int limit,
        String level,
        String text,
        String sourceFile,
        String subsystem,
        String eventCode,
        String requestId,
        String syncRunId,
        String machineId,
        Instant from,
        Instant to,
        String cursor,
        String sort
    ) {
        SortDirection direction = parseSort(sort);
        QueryWindow queryWindow = resolveWindow(windowMinutes, from, to);
        int cappedLimit = validateLimit(limit);
        validateFilters(level, text, sourceFile, subsystem, eventCode, requestId, syncRunId, machineId);
        CursorPosition cursorPosition = decodeCursor(cursor, direction);

        LogDiagnosticsFileService.LogFilesSnapshot fileSnapshot = fileService.getSnapshot();
        // Sanitize before every caller-controlled comparison. Otherwise a caller could probe for a
        // guessed secret through totalMatched/summary even though the returned message is redacted.
        List<LogDiagnosticsEventDto> retainedEvents = removeMirroredAlertEvents(fileSnapshot.events()).stream()
            .map(redactionService::redact)
            .toList();

        List<LogDiagnosticsEventDto> matching = retainedEvents.stream()
            .filter(event -> event.timestamp() != null)
            .filter(event -> !event.timestamp().isBefore(queryWindow.from()))
            .filter(event -> !event.timestamp().isAfter(queryWindow.to()))
            .filter(event -> matchesLevel(event, level))
            .filter(event -> matchesSource(event, sourceFile))
            .filter(event -> matchesSubsystem(event, subsystem))
            .filter(event -> matchesEventCode(event, eventCode))
            .filter(event -> matchesText(event, text))
            .filter(event -> matchesValue(event.requestId(), requestId))
            .filter(event -> matchesValue(event.syncRunId(), syncRunId))
            .filter(event -> matchesValue(event.machineId(), machineId))
            .sorted(eventComparator(direction))
            .toList();

        int total = matching.size();
        LogDiagnosticsSummaryDto summary = summarize(matching);
        long optionBudget = Math.max(1024, safeMaxResponseBytes() / 8);
        OptionValues subsystems = sanitizedOptions(
            matching, LogDiagnosticsEventDto::subsystem, optionBudget
        );
        OptionValues eventCodes = sanitizedOptions(
            matching, LogDiagnosticsEventDto::eventCode, optionBudget
        );

        List<LogDiagnosticsEventDto> eligible = matching.stream()
            .filter(event -> isAfterCursor(event, cursorPosition, direction))
            .toList();

        long responseBudget = safeMaxResponseBytes();
        long estimatedBytes = 2048 + estimateBytes(fileService.getSourceFileNames())
            + estimateBytes(subsystems.values()) + estimateBytes(eventCodes.values());
        boolean responseTruncated = false;
        List<LogDiagnosticsEventDto> rawPage = new ArrayList<>(Math.min(cappedLimit, eligible.size()));
        List<LogDiagnosticsEventDto> sanitizedPage = new ArrayList<>(Math.min(cappedLimit, eligible.size()));
        for (LogDiagnosticsEventDto rawEvent : eligible) {
            if (sanitizedPage.size() >= cappedLimit) {
                break;
            }
            LogDiagnosticsEventDto sanitized = rawEvent;
            long eventBytes = estimateBytes(sanitized);
            if (estimatedBytes + eventBytes > responseBudget) {
                responseTruncated = true;
                break;
            }
            rawPage.add(rawEvent);
            sanitizedPage.add(sanitized);
            estimatedBytes += eventBytes;
        }

        boolean hasMore = eligible.size() > rawPage.size();
        String nextCursor = hasMore && !rawPage.isEmpty()
            ? encodeCursor(rawPage.getLast(), direction)
            : null;
        boolean truncated = fileSnapshot.truncated() || responseTruncated
            || subsystems.truncated() || eventCodes.truncated();

        LogDiagnosticsEventsResponseDto response = new LogDiagnosticsEventsResponseDto(
            total,
            summary,
            fileService.getSourceFileNames(),
            subsystems.values(),
            eventCodes.values(),
            sanitizedPage,
            nextCursor,
            hasMore,
            truncated
        );
        auditQuery(
            queryWindow, cappedLimit, direction, activeFilterNames(
                level, text, sourceFile, subsystem, eventCode, requestId, syncRunId, machineId
            ), sanitizedPage.size(), estimatedBytes, hasMore, truncated
        );
        return response;
    }

    private List<LogDiagnosticsEventDto> removeMirroredAlertEvents(List<LogDiagnosticsEventDto> events) {
        Set<DuplicateKey> domainEventKeys = new HashSet<>();
        for (LogDiagnosticsEventDto event : events) {
            if (!ALERTS_FILE.equalsIgnoreCase(event.sourceFile())) {
                domainEventKeys.add(DuplicateKey.from(event));
            }
        }
        return events.stream()
            .filter(event -> !ALERTS_FILE.equalsIgnoreCase(event.sourceFile())
                || !domainEventKeys.contains(DuplicateKey.from(event)))
            .toList();
    }

    private QueryWindow resolveWindow(int windowMinutes, Instant from, Instant to) {
        Instant now = clock.instant();
        long safeMaxRange = Math.max(1, maxQueryRangeMinutes);
        Instant effectiveFrom;
        Instant effectiveTo;

        try {
            if (from != null || to != null) {
                effectiveTo = to == null ? now : to;
                effectiveFrom = from == null
                    ? effectiveTo.minus(Duration.ofMinutes(safeMaxRange))
                    : from;
            } else {
                if (windowMinutes < 1) {
                    throw badRequest("windowMinutes must be positive");
                }
                long boundedWindow = Math.min((long) windowMinutes, safeMaxRange);
                effectiveTo = now;
                effectiveFrom = now.minus(Duration.ofMinutes(boundedWindow));
            }

            if (effectiveFrom.isAfter(effectiveTo)) {
                throw badRequest("from must not be after to");
            }
            if (Duration.between(effectiveFrom, effectiveTo).compareTo(Duration.ofMinutes(safeMaxRange)) > 0) {
                throw badRequest("Requested diagnostics range is too large");
            }
        } catch (DateTimeException | ArithmeticException e) {
            throw badRequest("Invalid diagnostics time range");
        }
        return new QueryWindow(effectiveFrom, effectiveTo);
    }

    private int validateLimit(int limit) {
        if (limit < 1) {
            throw badRequest("limit must be positive");
        }
        return Math.min(limit, Math.max(1, maxQueryLimit));
    }

    private void validateFilters(
        String level,
        String text,
        String sourceFile,
        String subsystem,
        String eventCode,
        String requestId,
        String syncRunId,
        String machineId
    ) {
        validateLength("text", text, Math.max(1, maxSearchLength));
        validateLength("level", level, 16);
        validateLength("sourceFile", sourceFile, Math.max(1, maxFilterLength));
        validateLength("subsystem", subsystem, Math.max(1, maxFilterLength));
        validateLength("eventCode", eventCode, Math.max(1, maxFilterLength));
        validateLength("requestId", requestId, Math.max(1, maxFilterLength));
        validateLength("syncRunId", syncRunId, Math.max(1, maxFilterLength));
        validateLength("machineId", machineId, Math.max(1, maxFilterLength));

        if (level != null && !level.isBlank() && !"ALL".equalsIgnoreCase(level)
            && List.of("TRACE", "DEBUG", "INFO", "WARN", "ERROR").stream()
                .noneMatch(candidate -> candidate.equalsIgnoreCase(level))) {
            throw badRequest("Unsupported log level");
        }
        if (sourceFile != null && !sourceFile.isBlank() && !"ALL".equalsIgnoreCase(sourceFile)
            && fileService.getSourceFileNames().stream()
                .noneMatch(candidate -> candidate.equalsIgnoreCase(sourceFile))) {
            throw badRequest("Unsupported diagnostics source");
        }
    }

    private void validateLength(String name, String value, int maxLength) {
        if (value != null && value.length() > maxLength) {
            throw badRequest(name + " is too long");
        }
    }

    private SortDirection parseSort(String sort) {
        if (sort == null || sort.isBlank() || "desc".equalsIgnoreCase(sort)) {
            return SortDirection.DESC;
        }
        if ("asc".equalsIgnoreCase(sort)) {
            return SortDirection.ASC;
        }
        throw badRequest("sort must be asc or desc");
    }

    private Comparator<LogDiagnosticsEventDto> eventComparator(SortDirection direction) {
        Comparator<LogDiagnosticsEventDto> comparator = Comparator
            .comparing(LogDiagnosticsEventDto::timestamp)
            .thenComparing(event -> Objects.toString(event.eventId(), ""));
        return direction == SortDirection.ASC ? comparator : comparator.reversed();
    }

    private boolean isAfterCursor(
        LogDiagnosticsEventDto event,
        CursorPosition cursor,
        SortDirection direction
    ) {
        if (cursor == null) {
            return true;
        }
        int timestampComparison = event.timestamp().compareTo(cursor.timestamp());
        if (direction == SortDirection.ASC) {
            return timestampComparison > 0
                || timestampComparison == 0
                    && Objects.toString(event.eventId(), "").compareTo(cursor.eventId()) > 0;
        }
        return timestampComparison < 0
            || timestampComparison == 0
                && Objects.toString(event.eventId(), "").compareTo(cursor.eventId()) < 0;
    }

    private String encodeCursor(LogDiagnosticsEventDto event, SortDirection direction) {
        return encodeCursor(event.timestamp(), event.eventId(), direction);
    }

    /** Creates the same opaque position cursor used by event responses for internal stream adapters. */
    public String createCursor(Instant timestamp, String eventId, String sort) {
        if (timestamp == null || eventId == null || !eventId.matches("[A-Za-z0-9_-]{8,128}")) {
            throw badRequest("Invalid diagnostics cursor position");
        }
        return encodeCursor(timestamp, eventId, parseSort(sort));
    }

    private String encodeCursor(Instant timestamp, String eventId, SortDirection direction) {
        String payload = "v1|" + direction.name().toLowerCase(Locale.ROOT) + '|'
            + timestamp.getEpochSecond() + '|' + timestamp.getNano() + '|' + eventId;
        return Base64.getUrlEncoder().withoutPadding()
            .encodeToString(payload.getBytes(StandardCharsets.UTF_8));
    }

    private CursorPosition decodeCursor(String cursor, SortDirection direction) {
        if (cursor == null || cursor.isBlank()) {
            return null;
        }
        if (cursor.length() > 512) {
            throw badRequest("Invalid diagnostics cursor");
        }
        try {
            String decoded = new String(Base64.getUrlDecoder().decode(cursor), StandardCharsets.UTF_8);
            String[] parts = decoded.split("\\|", -1);
            if (parts.length != 5 || !"v1".equals(parts[0])
                || !direction.name().equalsIgnoreCase(parts[1])
                || !parts[4].matches("[A-Za-z0-9_-]{8,128}")) {
                throw badRequest("Invalid diagnostics cursor");
            }
            Instant timestamp = Instant.ofEpochSecond(Long.parseLong(parts[2]), Integer.parseInt(parts[3]));
            return new CursorPosition(timestamp, parts[4]);
        } catch (IllegalArgumentException | DateTimeException e) {
            if (e instanceof ResponseStatusException responseStatusException) {
                throw responseStatusException;
            }
            throw badRequest("Invalid diagnostics cursor");
        }
    }

    private LogDiagnosticsSummaryDto summarize(List<LogDiagnosticsEventDto> events) {
        int infoCount = 0;
        int warnCount = 0;
        int errorCount = 0;
        for (LogDiagnosticsEventDto event : events) {
            String normalizedLevel = Objects.toString(event.level(), "").toUpperCase(Locale.ROOT);
            switch (normalizedLevel) {
                case "INFO" -> infoCount++;
                case "WARN" -> warnCount++;
                case "ERROR" -> errorCount++;
                default -> {
                    // TRACE/DEBUG remain represented by totalEvents.
                }
            }
        }
        return new LogDiagnosticsSummaryDto(events.size(), infoCount, warnCount, errorCount);
    }

    private OptionValues sanitizedOptions(
        List<LogDiagnosticsEventDto> events,
        Function<LogDiagnosticsEventDto, String> extractor,
        long byteBudget
    ) {
        List<String> values = events.stream()
            .map(extractor)
            .filter(value -> value != null && !value.isBlank())
            .map(redactionService::redactListValue)
            .distinct()
            .sorted()
            .toList();
        int limit = Math.max(1, Math.min(maxOptionValues, 1000));
        int retained = 0;
        long bytes = 0;
        while (retained < values.size() && retained < limit) {
            long nextBytes = 8L + utf8Length(values.get(retained));
            if (bytes + nextBytes > byteBudget) {
                break;
            }
            bytes += nextBytes;
            retained++;
        }
        return new OptionValues(values.subList(0, retained), retained < values.size());
    }

    private boolean matchesLevel(LogDiagnosticsEventDto event, String level) {
        return level == null || level.isBlank() || "ALL".equalsIgnoreCase(level)
            || level.equalsIgnoreCase(event.level());
    }

    private boolean matchesSource(LogDiagnosticsEventDto event, String sourceFile) {
        return sourceFile == null || sourceFile.isBlank() || "ALL".equalsIgnoreCase(sourceFile)
            || sourceFile.equalsIgnoreCase(event.sourceFile());
    }

    private boolean matchesSubsystem(LogDiagnosticsEventDto event, String subsystem) {
        return subsystem == null || subsystem.isBlank() || "ALL".equalsIgnoreCase(subsystem)
            || subsystem.equalsIgnoreCase(event.subsystem());
    }

    private boolean matchesEventCode(LogDiagnosticsEventDto event, String eventCode) {
        if (eventCode == null || eventCode.isBlank()) {
            return true;
        }
        String actual = event.eventCode();
        return actual != null && actual.toLowerCase(Locale.ROOT)
            .contains(eventCode.toLowerCase(Locale.ROOT));
    }

    private boolean matchesValue(String actual, String expected) {
        return expected == null || expected.isBlank()
            || Objects.equals(normalize(actual), normalize(expected));
    }

    private boolean matchesText(LogDiagnosticsEventDto event, String text) {
        if (text == null || text.isBlank()) {
            return true;
        }
        String needle = text.toLowerCase(Locale.ROOT);
        return contains(event.message(), needle)
            || contains(event.details(), needle)
            || contains(event.logger(), needle)
            || contains(event.subsystem(), needle)
            || contains(event.eventCode(), needle)
            || contains(event.path(), needle);
    }

    private boolean contains(String value, String needle) {
        return value != null && value.toLowerCase(Locale.ROOT).contains(needle);
    }

    private String normalize(String value) {
        return value == null ? null : value.trim();
    }

    private long estimateBytes(LogDiagnosticsEventDto event) {
        return 256L
            + utf8Length(event.eventId()) + utf8Length(event.logicalEventId())
            + utf8Length(event.level()) + utf8Length(event.subsystem())
            + utf8Length(event.sourceFile()) + utf8Length(event.logger()) + utf8Length(event.thread())
            + utf8Length(event.eventCode()) + utf8Length(event.message()) + utf8Length(event.details())
            + utf8Length(event.requestId()) + utf8Length(event.userId()) + utf8Length(event.machineId())
            + utf8Length(event.jobName()) + utf8Length(event.jobRunId()) + utf8Length(event.syncRunId())
            + utf8Length(event.entityType()) + utf8Length(event.entityId()) + utf8Length(event.sharepointId())
            + utf8Length(event.method()) + utf8Length(event.path()) + utf8Length(event.remoteIp());
    }

    private int utf8Length(String value) {
        return value == null ? 0 : value.getBytes(StandardCharsets.UTF_8).length;
    }

    private long estimateBytes(List<String> values) {
        return values.stream().mapToLong(value -> 8L + utf8Length(value)).sum();
    }

    private long safeMaxResponseBytes() {
        return Math.max(64L * 1024, maxResponseBytes);
    }

    private List<String> activeFilterNames(String... filters) {
        String[] names = {
            "level", "text", "sourceFile", "subsystem", "eventCode", "requestId", "syncRunId", "machineId"
        };
        List<String> active = new ArrayList<>();
        for (int index = 0; index < filters.length && index < names.length; index++) {
            if (filters[index] != null && !filters[index].isBlank()
                && !"ALL".equalsIgnoreCase(filters[index])) {
                active.add(names[index]);
            }
        }
        return active;
    }

    private void auditQuery(
        QueryWindow window,
        int limit,
        SortDirection direction,
        List<String> activeFilters,
        int returned,
        long estimatedBytes,
        boolean hasMore,
        boolean truncated
    ) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String principal = authentication == null ? "unauthenticated" : safeAuditIdentity(authentication.getName());
        AUDIT_LOG.info(
            "log.diagnostics.query principal={} from={} to={} limit={} sort={} filters={} " +
                "returned={} estimatedBytes={} hasMore={} truncated={}",
            principal, window.from(), window.to(), limit, direction.name().toLowerCase(Locale.ROOT),
            activeFilters, returned, estimatedBytes, hasMore, truncated
        );
    }

    private String safeAuditIdentity(String identity) {
        if (identity == null || identity.isBlank()) {
            return "unknown";
        }
        String singleLine = identity.replaceAll("[\\r\\n\\t]", "_");
        return singleLine.substring(0, Math.min(singleLine.length(), 128));
    }

    private ResponseStatusException badRequest(String reason) {
        return new ResponseStatusException(HttpStatus.BAD_REQUEST, reason);
    }

    private enum SortDirection {
        ASC,
        DESC
    }

    private record QueryWindow(Instant from, Instant to) {
    }

    private record CursorPosition(Instant timestamp, String eventId) {
    }

    private record OptionValues(List<String> values, boolean truncated) {
        private OptionValues {
            values = List.copyOf(values);
        }
    }

    private record DuplicateKey(
        Instant timestamp,
        String level,
        String logger,
        String thread,
        String eventCode,
        String message,
        String details,
        String requestId,
        String userId,
        String machineId,
        String jobName,
        String jobRunId,
        String syncRunId,
        String entityType,
        String entityId,
        String sharepointId,
        String method,
        String path,
        String remoteIp,
        Integer status,
        Long durationMs
    ) {
        private static DuplicateKey from(LogDiagnosticsEventDto event) {
            return new DuplicateKey(
                event.timestamp(), event.level(), event.logger(), event.thread(), event.eventCode(),
                event.message(), event.details(), event.requestId(), event.userId(), event.machineId(),
                event.jobName(), event.jobRunId(), event.syncRunId(), event.entityType(), event.entityId(),
                event.sharepointId(), event.method(), event.path(), event.remoteIp(), event.status(),
                event.durationMs()
            );
        }
    }
}
