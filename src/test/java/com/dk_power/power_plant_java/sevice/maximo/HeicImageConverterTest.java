package com.dk_power.power_plant_java.sevice.maximo;

import org.junit.jupiter.api.Test;

import java.nio.file.Files;
import java.nio.file.Path;

import static org.junit.jupiter.api.Assertions.*;

/** Plain unit test (no Spring context) proving the bundled-FFmpeg HEIC→JPEG conversion works on a real HEIC. */
class HeicImageConverterTest {

    private static final Path SAMPLE = Path.of(
            "C:/Users/usada/AppData/Local/Temp/claude/c--Users-usada-my-projects-power-plant-java/"
                    + "19c688af-ac63-4180-8438-40d5c1eb318b/scratchpad/sample.heic");

    @Test
    void convertsRealHeicToJpeg() throws Exception {
        assertTrue(Files.exists(SAMPLE), "sample.heic not found at " + SAMPLE);
        byte[] heic = Files.readAllBytes(SAMPLE);
        assertTrue(HeicImageConverter.isHeic(heic, "sample.heic", "image/heic"), "sample should be detected as HEIC");

        HeicImageConverter.Result r = new HeicImageConverter().ensureJpeg(heic, "IMG_1234.HEIC", "image/heic");

        assertEquals("image/jpeg", r.contentType(), "should have converted to JPEG");
        assertEquals("IMG_1234.jpg", r.fileName(), "should rename to .jpg");
        assertTrue(r.bytes().length > 2000, "JPEG output too small: " + r.bytes().length);
        // JPEG SOI magic FF D8 FF
        assertEquals((byte) 0xFF, r.bytes()[0]);
        assertEquals((byte) 0xD8, r.bytes()[1]);
        assertEquals((byte) 0xFF, r.bytes()[2]);

        Files.write(SAMPLE.getParent().resolve("converted.jpg"), r.bytes());
        System.out.println("[HEIC-TEST] " + heic.length + " bytes HEIC -> " + r.bytes().length
                + " bytes JPEG (" + r.fileName() + "); wrote converted.jpg");
    }

    @Test
    void passesNonHeicThroughUntouched() {
        byte[] jpg = {(byte) 0xFF, (byte) 0xD8, (byte) 0xFF, (byte) 0xE0, 0, 0, 0, 0, 0, 0, 0, 0};
        HeicImageConverter.Result r = new HeicImageConverter().ensureJpeg(jpg, "photo.jpg", "image/jpeg");
        assertSame(jpg, r.bytes(), "non-HEIC bytes must pass through unchanged");
        assertEquals("photo.jpg", r.fileName());
        assertEquals("image/jpeg", r.contentType());
    }

    /**
     * Finding-1 regression: a MISLABELED HEIC — real HEIC magic (ftyp/heic) but undecodable bytes, arriving as
     * "photo.jpg" / "image/jpeg" (as iOS share sheets hand them over) — must NOT fall back to the original .jpg
     * name/type on conversion failure. That would sneak un-viewable HEIC past Maximo's extension whitelist and be
     * reported as a successful upload. The fallback must relabel to .heic / image/heic so Maximo rejects it loudly.
     */
    @Test
    void mislabeledHeicThatFailsConversionIsRelabeledSoMaximoRejectsIt() {
        // 12 bytes: size + "ftyp" + "heic" brand → isHeic() true via magic bytes, but ffmpeg can't decode it.
        byte[] fakeHeic = {0, 0, 0, 0x0C, 'f', 't', 'y', 'p', 'h', 'e', 'i', 'c'};
        assertTrue(HeicImageConverter.isHeic(fakeHeic, "photo.jpg", "image/jpeg"),
                "ftyp/heic magic must be detected even when name/type claim JPEG");

        HeicImageConverter.Result r = new HeicImageConverter().ensureJpeg(fakeHeic, "photo.jpg", "image/jpeg");

        assertSame(fakeHeic, r.bytes(), "undecodable bytes pass through (best-effort), but relabeled");
        assertEquals("photo.heic", r.fileName(), "must be relabeled .heic, not left as .jpg");
        assertEquals("image/heic", r.contentType(), "content-type must match the real format so Maximo rejects it");
    }
}
