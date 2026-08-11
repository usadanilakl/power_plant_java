package com.dk_power.power_plant_java.sevice.maximo;

import lombok.extern.slf4j.Slf4j;
import org.bytedeco.javacpp.Loader;
import org.springframework.stereotype.Component;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.concurrent.TimeUnit;

/**
 * Converts HEIC/HEIF attachment bytes to JPEG using a bundled FFmpeg (JavaCPP) binary that self-extracts at
 * runtime — so there is NO separate software install on the hub. iPhones save photos as HEIC, which Maximo's
 * attachment whitelist rejects (BMXAA6583E "file type heic is not allowed") and which non-Apple devices can't
 * render; converting to JPEG fixes both. Non-HEIC bytes pass through untouched, and a conversion failure passes
 * the ORIGINAL bytes through (the caller then surfaces Maximo's real response) rather than blocking the upload.
 */
@Slf4j
@Component
public class HeicImageConverter {

    /** The (possibly converted) bytes plus the filename + content type they should be uploaded under. */
    public record Result(byte[] bytes, String fileName, String contentType) {}

    /** Path to the extracted ffmpeg executable — resolved once (JavaCPP extracts the bundled binary on first use). */
    private volatile String ffmpegPath;

    public Result ensureJpeg(byte[] bytes, String fileName, String contentType) {
        if (bytes == null || bytes.length == 0 || !isHeic(bytes, fileName, contentType)) {
            return new Result(bytes, fileName, contentType);
        }
        try {
            byte[] jpeg = convert(bytes);
            String jpegName = toJpegName(fileName);
            log.info("[HEIC] Converted {} ({} bytes) -> {} ({} bytes JPEG)", fileName, bytes.length, jpegName, jpeg.length);
            return new Result(jpeg, jpegName, "image/jpeg");
        } catch (Exception e) {
            // We DETECTED HEIC but couldn't transcode it. Never let the original bytes go out under a name/type that
            // claims JPEG — Maximo's whitelist keys on the file EXTENSION, so a mislabeled ".jpg" HEIC (iOS share
            // sheets routinely hand HEIC bytes over as photo.jpg / image/jpeg) would be ACCEPTED and silently stored
            // as an un-viewable file we'd report as a successful upload. Force a .heic name/type so Maximo rejects it
            // loudly (its real "heic not allowed" 4xx) and the caller surfaces the failure instead of storing junk.
            String heicName = toHeicName(fileName);
            log.warn("[HEIC] Conversion failed for {} ({}) — sending original as {} so Maximo rejects it rather than"
                    + " storing corrupt bytes", fileName, e.getMessage(), heicName);
            return new Result(bytes, heicName, "image/heic");
        }
    }

    /** ISOBMFF HEIF/HEIC detection: a "ftyp" box at offset 4 with a heif-family brand, or a .heic/.heif name/type. */
    static boolean isHeic(byte[] b, String name, String type) {
        if (name != null && name.toLowerCase().matches(".*\\.(heic|heif)$")) return true;
        if (type != null && type.toLowerCase().matches("image/hei[cf].*")) return true;
        if (b == null || b.length < 12) return false;
        if (!(b[4] == 'f' && b[5] == 't' && b[6] == 'y' && b[7] == 'p')) return false;
        String brand = new String(b, 8, 4, StandardCharsets.US_ASCII).toLowerCase();
        return switch (brand) {
            case "heic", "heix", "heim", "heis", "hevc", "hevm", "hevs", "mif1", "msf1" -> true;
            default -> false;
        };
    }

    private byte[] convert(byte[] heic) throws IOException, InterruptedException {
        Path in = Files.createTempFile("mx-attach-", ".heic");
        Path out = Files.createTempFile("mx-attach-", ".jpg");
        try {
            Files.write(in, heic);
            Process p = new ProcessBuilder(
                    ffmpeg(), "-hide_banner", "-loglevel", "error",
                    "-i", in.toString(), "-frames:v", "1", "-y", out.toString())
                    .redirectErrorStream(true)
                    .start();
            StringBuilder errLog = new StringBuilder();
            Thread drain = new Thread(() -> {
                try (BufferedReader r = new BufferedReader(new InputStreamReader(p.getInputStream(), StandardCharsets.UTF_8))) {
                    String line;
                    while ((line = r.readLine()) != null) errLog.append(line).append('\n');
                } catch (IOException ignored) { /* process closed */ }
            });
            drain.setDaemon(true);
            drain.start();
            if (!p.waitFor(60, TimeUnit.SECONDS)) {
                p.destroyForcibly();
                // destroyForcibly() is ASYNCHRONOUS on Windows (TerminateProcess); the ffmpeg process may still hold
                // its handles on `in`/`out` when we unwind. Wait for it to actually die so the finally-block delete
                // doesn't hit a sharing violation that masks this timeout and strands both temp files.
                p.waitFor(5, TimeUnit.SECONDS);
                throw new IOException("ffmpeg timed out");
            }
            drain.join(1000);
            byte[] jpeg = Files.readAllBytes(out);
            if (p.exitValue() != 0 || jpeg.length == 0) {
                throw new IOException("ffmpeg exit=" + p.exitValue() + " outBytes=" + jpeg.length + " log=" + errLog.toString().trim());
            }
            return jpeg;
        } finally {
            // Resilient cleanup: each delete is independent so one failure can neither mask the real exception nor
            // skip the other file.
            quietDelete(in);
            quietDelete(out);
        }
    }

    /** Best-effort temp cleanup that never throws. Retries once after a short pause for the brief Windows
     *  sharing-violation window that can follow a force-killed ffmpeg releasing its file handle. */
    private static void quietDelete(Path p) {
        for (int attempt = 0; attempt < 2; attempt++) {
            try {
                Files.deleteIfExists(p);
                return;
            } catch (IOException e) {
                if (attempt == 0) {
                    try { Thread.sleep(200); }
                    catch (InterruptedException ie) { Thread.currentThread().interrupt(); return; }
                } else {
                    log.warn("[HEIC] Could not delete temp file {}: {}", p, e.getMessage());
                }
            }
        }
    }

    private String ffmpeg() {
        String p = ffmpegPath;
        if (p == null) {
            synchronized (this) {
                if (ffmpegPath == null) ffmpegPath = Loader.load(org.bytedeco.ffmpeg.ffmpeg.class);
                p = ffmpegPath;
            }
        }
        return p;
    }

    private static String toJpegName(String name) {
        if (name == null || name.isBlank()) return "photo.jpg";
        int dot = name.lastIndexOf('.');
        return (dot > 0 ? name.substring(0, dot) : name) + ".jpg";
    }

    /** Force a .heic extension so a failed-conversion fallback can't slip HEIC bytes past Maximo's extension
     *  whitelist under a ".jpg"/other allowed name. */
    private static String toHeicName(String name) {
        if (name == null || name.isBlank()) return "photo.heic";
        int dot = name.lastIndexOf('.');
        return (dot > 0 ? name.substring(0, dot) : name) + ".heic";
    }
}
