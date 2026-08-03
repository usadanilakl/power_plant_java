package com.dk_power.power_plant_java.sevice.logging;

import com.dk_power.power_plant_java.dto.logging.LogDiagnosticsEventDto;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.nio.ByteBuffer;
import java.nio.channels.FileChannel;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.LinkOption;
import java.nio.file.Path;
import java.nio.file.StandardOpenOption;
import java.nio.file.attribute.BasicFileAttributes;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.ArrayDeque;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Base64;
import java.util.Collections;
import java.util.Deque;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.locks.ReentrantLock;

/**
 * Incrementally tails the small, fixed allowlist of application log files.
 *
 * <p>No caller-controlled value is ever resolved as a filesystem path. Each file has an independent
 * lock and byte offset, so concurrent diagnostics queries share one append read instead of reparsing
 * the active file. A provisional final event is rebuilt until the next event header arrives; this
 * preserves stack traces that are appended over several writes.</p>
 */
@Service
@Slf4j
public class LogDiagnosticsFileService {

    private static final List<String> LOG_FILE_NAMES = List.of(
        "power-plant-alerts.log",
        "power-plant-sync.log",
        "power-plant-security.log",
        "power-plant-logger.log"
    );
    private static final int READ_BUFFER_BYTES = 16 * 1024;
    private static final int IDENTITY_PREFIX_BYTES = 256;

    @Value("${logging.diagnostics.directory:./logs}")
    private String logsDirectory = "./logs";

    @Value("${logging.diagnostics.cache.max-events-per-file:10000}")
    private int maxEventsPerFile = 10000;

    @Value("${logging.diagnostics.cache.max-line-bytes:65536}")
    private int maxLineBytes = 65536;

    @Value("${logging.diagnostics.cache.max-event-characters:32768}")
    private int maxEventCharacters = 32768;

    @Value("${logging.diagnostics.cache.max-characters-per-file:8388608}")
    private long maxCharactersPerFile = 8L * 1024 * 1024;

    private final LogDiagnosticsParserService parserService;
    private final Map<String, CachedLogFile> cache = new ConcurrentHashMap<>();

    public LogDiagnosticsFileService(LogDiagnosticsParserService parserService) {
        this.parserService = parserService;
    }

    public List<String> getSourceFileNames() {
        return LOG_FILE_NAMES;
    }

    /** Compatibility view for existing callers. */
    public List<LogDiagnosticsEventDto> getAllEvents() {
        return getSnapshot().events();
    }

    public LogFilesSnapshot getSnapshot() {
        List<LogDiagnosticsEventDto> allEvents = new ArrayList<>();
        boolean truncated = false;
        Path logsDir = Path.of(logsDirectory).toAbsolutePath().normalize();

        for (String fileName : LOG_FILE_NAMES) {
            // fileName comes only from LOG_FILE_NAMES. The startsWith check is a defense-in-depth
            // invariant should that constant ever be changed incorrectly.
            Path filePath = logsDir.resolve(fileName).normalize();
            if (!filePath.startsWith(logsDir)) {
                log.error("log.diagnostics.file.path_rejected file={}", fileName);
                truncated = true;
                continue;
            }
            FileEventsSnapshot snapshot = getEventsForFile(fileName, filePath);
            allEvents.addAll(snapshot.events());
            truncated |= snapshot.truncated();
        }

        return new LogFilesSnapshot(allEvents, truncated);
    }

    private FileEventsSnapshot getEventsForFile(String fileName, Path filePath) {
        CachedLogFile cached = cache.computeIfAbsent(fileName, ignored -> new CachedLogFile());
        cached.lock.lock();
        try {
            if (!Files.isRegularFile(filePath, LinkOption.NOFOLLOW_LINKS)) {
                cached.markFileMissing(
                    fileName, parserService, safeMaxEvents(), safeMaxCachedCharacters()
                );
                return cached.snapshot(
                    fileName, parserService, safeMaxEvents(), safeMaxCachedCharacters()
                );
            }

            refresh(fileName, filePath, cached, true);
            return cached.snapshot(
                fileName, parserService, safeMaxEvents(), safeMaxCachedCharacters()
            );
        } catch (IOException | RuntimeException e) {
            // Preserve the last successfully parsed snapshot during a transient rotate/read race.
            log.warn("log.diagnostics.file.read_failed file={} error={}", fileName, e.getMessage());
            return cached.snapshot(
                fileName, parserService, safeMaxEvents(), safeMaxCachedCharacters()
            ).withTruncated();
        } finally {
            cached.lock.unlock();
        }
    }

    private void refresh(String fileName, Path filePath, CachedLogFile cached, boolean retryOnRace) throws IOException {
        BasicFileAttributes before = Files.readAttributes(
            filePath, BasicFileAttributes.class, LinkOption.NOFOLLOW_LINKS
        );
        FileIdentity incomingIdentity = FileIdentity.from(before);

        boolean identityChanged = cached.identity != null && !cached.identity.equals(incomingIdentity);
        boolean truncated = cached.identity != null && before.size() < cached.readOffset;
        boolean prefixChanged = cached.identity != null && cached.prefix.length > 0
            && !Arrays.equals(cached.prefix, readPrefix(filePath, cached.prefix.length));

        if (cached.identity == null || identityChanged || truncated || prefixChanged) {
            cached.beginGeneration(
                fileName,
                incomingIdentity,
                readPrefix(filePath, IDENTITY_PREFIX_BYTES),
                parserService,
                safeMaxEvents(),
                safeMaxCachedCharacters()
            );
        }

        readAppendedBytes(fileName, filePath, cached);

        BasicFileAttributes after = Files.readAttributes(
            filePath, BasicFileAttributes.class, LinkOption.NOFOLLOW_LINKS
        );
        FileIdentity finalIdentity = FileIdentity.from(after);
        if (retryOnRace && (!finalIdentity.equals(cached.identity) || after.size() < cached.readOffset)) {
            cached.beginGeneration(
                fileName,
                finalIdentity,
                readPrefix(filePath, IDENTITY_PREFIX_BYTES),
                parserService,
                safeMaxEvents(),
                safeMaxCachedCharacters()
            );
            refresh(fileName, filePath, cached, false);
        } else if (cached.prefix.length == 0 && after.size() > 0) {
            cached.prefix = readPrefix(filePath, IDENTITY_PREFIX_BYTES);
        }
    }

    private void readAppendedBytes(String fileName, Path filePath, CachedLogFile cached) throws IOException {
        try (FileChannel channel = FileChannel.open(filePath, StandardOpenOption.READ)) {
            channel.position(cached.readOffset);
            ByteBuffer buffer = ByteBuffer.allocate(READ_BUFFER_BYTES);
            long absoluteOffset = cached.readOffset;
            int bytesRead;
            while ((bytesRead = channel.read(buffer)) > 0) {
                cached.totalBytesRead += bytesRead;
                buffer.flip();
                while (buffer.hasRemaining()) {
                    cached.acceptByte(
                        fileName,
                        buffer.get(),
                        absoluteOffset++,
                        parserService,
                        safeMaxLineBytes(),
                        safeMaxEventCharacters(),
                        safeMaxEvents(),
                        safeMaxCachedCharacters()
                    );
                }
                cached.readOffset = absoluteOffset;
                buffer.clear();
            }
        }
    }

    private byte[] readPrefix(Path filePath, int requestedLength) throws IOException {
        if (requestedLength <= 0) {
            return new byte[0];
        }
        int length = (int) Math.min(Files.size(filePath), requestedLength);
        if (length == 0) {
            return new byte[0];
        }
        ByteBuffer buffer = ByteBuffer.allocate(length);
        try (FileChannel channel = FileChannel.open(filePath, StandardOpenOption.READ)) {
            while (buffer.hasRemaining() && channel.read(buffer) >= 0) {
                // Fill the small prefix or stop at EOF.
            }
        }
        return buffer.position() == length ? buffer.array() : Arrays.copyOf(buffer.array(), buffer.position());
    }

    private int safeMaxEvents() {
        return Math.max(1, maxEventsPerFile);
    }

    private int safeMaxLineBytes() {
        return Math.max(256, maxLineBytes);
    }

    private int safeMaxEventCharacters() {
        return (int) Math.min(Math.max(1024, maxEventCharacters), safeMaxCachedCharacters());
    }

    private long safeMaxCachedCharacters() {
        return Math.max(64L * 1024, maxCharactersPerFile);
    }

    long getBytesReadForTesting(String fileName) {
        CachedLogFile cached = cache.get(fileName);
        if (cached == null) {
            return 0;
        }
        cached.lock.lock();
        try {
            return cached.totalBytesRead;
        } finally {
            cached.lock.unlock();
        }
    }

    public record LogFilesSnapshot(List<LogDiagnosticsEventDto> events, boolean truncated) {
        public LogFilesSnapshot {
            events = List.copyOf(events);
        }
    }

    private record FileEventsSnapshot(List<LogDiagnosticsEventDto> events, boolean truncated) {
        private FileEventsSnapshot {
            events = List.copyOf(events);
        }

        private static FileEventsSnapshot empty() {
            return new FileEventsSnapshot(Collections.emptyList(), false);
        }

        private FileEventsSnapshot withTruncated() {
            return new FileEventsSnapshot(events, true);
        }
    }

    private record FileIdentity(String fileKey, long creationTimeMillis) {
        private static FileIdentity from(BasicFileAttributes attributes) {
            return new FileIdentity(
                Objects.toString(attributes.fileKey(), "no-file-key"),
                attributes.creationTime().toMillis()
            );
        }

        private String stableKey() {
            return fileKey + ':' + creationTimeMillis;
        }
    }

    private static final class CachedLogFile {
        private final ReentrantLock lock = new ReentrantLock();
        private final Deque<LogDiagnosticsEventDto> finalizedEvents = new ArrayDeque<>();
        private final ByteArrayOutputStream partialLine = new ByteArrayOutputStream();
        private final List<String> currentEventLines = new ArrayList<>();

        private FileIdentity identity;
        private byte[] prefix = new byte[0];
        private long readOffset;
        private long totalBytesRead;
        private boolean lineStarted;
        private long lineStartOffset;
        private boolean lineTruncated;
        private long currentEventStartOffset;
        private int currentEventCharacters;
        private boolean currentEventTruncated;
        private boolean resultTruncated;
        private long finalizedEventCharacters;
        private long generationSequence;
        private long currentGeneration;

        private void beginGeneration(
            String sourceFile,
            FileIdentity newIdentity,
            byte[] newPrefix,
            LogDiagnosticsParserService parserService,
            int maxEvents,
            long maxCachedCharacters
        ) {
            if (identity != null) {
                finalizeCurrent(sourceFile, parserService, maxEvents, maxCachedCharacters);
                // The old active pathname is already gone/replaced, so bytes appended after our
                // last snapshot cannot be proven complete without scanning archives.
                resultTruncated = true;
            }
            currentGeneration = ++generationSequence;
            identity = newIdentity;
            prefix = Arrays.copyOf(newPrefix, newPrefix.length);
            readOffset = 0;
            lineStarted = false;
            lineStartOffset = 0;
            lineTruncated = false;
            partialLine.reset();
            currentEventLines.clear();
            currentEventStartOffset = 0;
            currentEventCharacters = 0;
            currentEventTruncated = false;
            enforceBounds(maxEvents, maxCachedCharacters);
        }

        private void markFileMissing(
            String sourceFile,
            LogDiagnosticsParserService parserService,
            int maxEvents,
            long maxCachedCharacters
        ) {
            if (identity != null) {
                finalizeCurrent(sourceFile, parserService, maxEvents, maxCachedCharacters);
                resultTruncated = true;
            }
            identity = null;
            prefix = new byte[0];
            readOffset = 0;
            lineStarted = false;
            lineTruncated = false;
            partialLine.reset();
            currentEventLines.clear();
            currentEventCharacters = 0;
            currentEventTruncated = false;
        }

        private void acceptByte(
            String sourceFile,
            byte value,
            long absoluteOffset,
            LogDiagnosticsParserService parserService,
            int maxLineBytes,
            int maxEventCharacters,
            int maxEvents,
            long maxCachedCharacters
        ) {
            if (!lineStarted) {
                lineStarted = true;
                lineStartOffset = absoluteOffset;
            }

            if (value == '\n') {
                String line = new String(partialLine.toByteArray(), StandardCharsets.UTF_8);
                if (line.endsWith("\r")) {
                    line = line.substring(0, line.length() - 1);
                }
                if (lineTruncated) {
                    line += "...[TRUNCATED]";
                    resultTruncated = true;
                }
                acceptLine(
                    sourceFile, line, lineStartOffset, parserService, maxEventCharacters,
                    maxEvents, maxCachedCharacters
                );
                partialLine.reset();
                lineStarted = false;
                lineTruncated = false;
                return;
            }

            if (partialLine.size() < maxLineBytes) {
                partialLine.write(value);
            } else {
                lineTruncated = true;
            }
        }

        private void acceptLine(
            String sourceFile,
            String line,
            long startOffset,
            LogDiagnosticsParserService parserService,
            int maxEventCharacters,
            int maxEvents,
            long maxCachedCharacters
        ) {
            if (parserService.startsEvent(line)) {
                finalizeCurrent(sourceFile, parserService, maxEvents, maxCachedCharacters);
                currentEventStartOffset = startOffset;
                currentEventLines.clear();
                currentEventCharacters = 0;
                currentEventTruncated = false;
                appendCurrentLine(line, maxEventCharacters);
            } else if (!currentEventLines.isEmpty()) {
                appendCurrentLine(line, maxEventCharacters);
            }
        }

        private void appendCurrentLine(String line, int maxEventCharacters) {
            int separatorCharacters = currentEventLines.isEmpty() ? 0 : 1;
            int remaining = maxEventCharacters - currentEventCharacters - separatorCharacters;
            if (remaining <= 0) {
                markCurrentEventTruncated();
                return;
            }

            if (line.length() > remaining) {
                currentEventLines.add(line.substring(0, remaining) + "...[TRUNCATED]");
                currentEventCharacters += remaining + separatorCharacters;
                markCurrentEventTruncated();
            } else {
                currentEventLines.add(line);
                currentEventCharacters += line.length() + separatorCharacters;
            }
        }

        private void markCurrentEventTruncated() {
            if (!currentEventTruncated) {
                currentEventTruncated = true;
                resultTruncated = true;
            }
        }

        private void finalizeCurrent(
            String sourceFile,
            LogDiagnosticsParserService parserService,
            int maxEvents,
            long maxCachedCharacters
        ) {
            LogDiagnosticsEventDto parsed = parseCurrent(sourceFile, parserService);
            if (parsed == null) {
                return;
            }
            finalizedEvents.addLast(parsed);
            finalizedEventCharacters += estimateCharacters(parsed);
            enforceBounds(maxEvents, maxCachedCharacters);
        }

        private LogDiagnosticsEventDto parseCurrent(
            String sourceFile,
            LogDiagnosticsParserService parserService
        ) {
            if (currentEventLines.isEmpty()) {
                return null;
            }
            List<LogDiagnosticsEventDto> parsed = parserService.parse(sourceFile, currentEventLines);
            if (parsed.isEmpty()) {
                return null;
            }
            LogDiagnosticsEventDto event = parsed.getFirst();
            String logicalEventId = createLogicalEventId(
                sourceFile, currentEventStartOffset, identity, currentGeneration, event);
            // The final active event is provisional until another header arrives. Version its
            // cursor identity as content grows so an ASC/SSE cursor can observe late stack lines,
            // while logicalEventId lets consumers replace the earlier representation.
            String eventId = logicalEventId + "_" + "%08x".formatted(currentEventCharacters);
            return event.withEventIdentity(eventId, logicalEventId);
        }

        private FileEventsSnapshot snapshot(
            String sourceFile,
            LogDiagnosticsParserService parserService,
            int maxEvents,
            long maxCachedCharacters
        ) {
            List<LogDiagnosticsEventDto> events = new ArrayList<>(finalizedEvents);
            LogDiagnosticsEventDto provisional = parseCurrent(sourceFile, parserService);
            if (provisional != null) {
                events.add(provisional);
            }

            boolean snapshotTruncated = resultTruncated;
            long snapshotCharacters = finalizedEventCharacters
                + (provisional == null ? 0 : estimateCharacters(provisional));
            int firstRetained = 0;
            while (events.size() - firstRetained > maxEvents || snapshotCharacters > maxCachedCharacters) {
                snapshotCharacters -= estimateCharacters(events.get(firstRetained++));
                snapshotTruncated = true;
            }
            if (firstRetained > 0) {
                events = new ArrayList<>(events.subList(firstRetained, events.size()));
            }
            return new FileEventsSnapshot(events, snapshotTruncated);
        }

        private void enforceBounds(int maxEvents, long maxCachedCharacters) {
            while (finalizedEvents.size() > maxEvents || finalizedEventCharacters > maxCachedCharacters) {
                LogDiagnosticsEventDto evicted = finalizedEvents.removeFirst();
                finalizedEventCharacters -= estimateCharacters(evicted);
                resultTruncated = true;
            }
        }

        private static long estimateCharacters(LogDiagnosticsEventDto event) {
            return 64L
                + length(event.level()) + length(event.subsystem()) + length(event.sourceFile())
                + length(event.logger()) + length(event.thread()) + length(event.eventCode())
                + length(event.message()) + length(event.details()) + length(event.requestId())
                + length(event.userId()) + length(event.machineId()) + length(event.jobName())
                + length(event.jobRunId()) + length(event.syncRunId()) + length(event.entityType())
                + length(event.entityId()) + length(event.sharepointId()) + length(event.method())
                + length(event.path()) + length(event.remoteIp()) + length(event.eventId())
                + length(event.logicalEventId());
        }

        private static int length(String value) {
            return value == null ? 0 : value.length();
        }

        private static String createLogicalEventId(
            String sourceFile,
            long eventOffset,
            FileIdentity identity,
            long generation,
            LogDiagnosticsEventDto event
        ) {
            String input = sourceFile + '\n' + identity.stableKey() + '\n' + generation + '\n'
                + eventOffset + '\n' + event.timestamp();
            try {
                byte[] digest = MessageDigest.getInstance("SHA-256")
                    .digest(input.getBytes(StandardCharsets.UTF_8));
                return Base64.getUrlEncoder().withoutPadding().encodeToString(Arrays.copyOf(digest, 18));
            } catch (NoSuchAlgorithmException impossible) {
                throw new IllegalStateException("SHA-256 is unavailable", impossible);
            }
        }
    }
}
