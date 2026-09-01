package com.dk_power.power_plant_java.sevice.esp;

import java.util.HashMap;
import java.util.Map;

/**
 * Single source of truth for the physical LED layout — what the WLED
 * controllers on the two ESPs actually have wired up. Duplicated (deliberately)
 * from {@code LotoBoxInitializationService} so runtime write paths in
 * {@link EspLedService} can pin against the canonical values instead of the
 * DB rows.
 *
 * <p><b>Why the runtime pins against these constants.</b> {@code LedStrip} and
 * {@code LotoBox} both extend {@code BaseIdEntity} → sync across devices via
 * {@code FieldChangeEntityListener}. A stale snapshot pulled from the hub (or
 * another desktop that ran a bad heal) can drift {@code totalLeds},
 * {@code sequence}, {@code rangeStart} or {@code rangeEnd} at runtime — and
 * because the startup-time heal in {@code LotoBoxInitializationService.seedLotoBoxData}
 * only runs at boot, nothing catches that drift until the next restart. The
 * failure mode is a whole-row LED shift: a strip's {@code totalLeds} growing by
 * one box-worth of LEDs pushes every box on subsequent strips down by that
 * many pixels, and clicking box #41 lights box #47 (or on strip 3→5 boundary,
 * lights a whole row down).
 *
 * <p>{@link EspLedService#syncFullLedArray} looks up strip sizes and box ranges
 * here first and only falls back to the DB row when this map has no entry (e.g.
 * a new box added after this map was last updated). Any DB value that disagrees
 * with canonical is logged as a WARN and healed opportunistically at write time.
 *
 * <p>ESP identity is resolved by IP address (the value seeded in
 * {@code LotoBoxInitializationService.initializeEspDevices} — 192.168.190.145 =
 * ESP-1, 192.168.190.146 = ESP-2). Name-based matching is intentionally not used
 * because {@code EspDevice.name} is sync-mutable and has drifted in the past.
 */
public final class CanonicalLedLayout {

    /** IP of ESP that owns strips 0, 1, 2 (physical layout: rows 1-6). */
    public static final String ESP1_IP = "192.168.190.145";
    /** IP of ESP that owns strips 3, 4, 5 (physical layout: rows 7-12). */
    public static final String ESP2_IP = "192.168.190.146";

    /**
     * Per-strip LED counts, indexed by {@code LedStrip.stripNumber} (0..2)
     * within each ESP. Mirrors {@code LotoBoxInitializationService.esp1LedCounts}
     * / {@code esp2LedCounts}. WLED will HTTP 400 any write that exceeds these
     * lengths, so pinning here also protects against a "260 for every strip"
     * regression.
     */
    private static final int[] ESP1_STRIP_TOTAL_LEDS = {240, 237, 237};
    private static final int[] ESP2_STRIP_TOTAL_LEDS = {245, 245, 260};

    /** Per-box canonical LED range, indexed by box number (1..72). */
    private static final Map<Integer, int[]> BOX_RANGE = buildBoxRanges();

    private CanonicalLedLayout() {}

    /**
     * Canonical {@code totalLeds} for the given ESP IP + strip number, or
     * {@code null} when we don't recognise the ESP (falls back to DB value).
     */
    public static Integer canonicalStripTotalLeds(String espIp, Integer stripNumber) {
        if (espIp == null || stripNumber == null) return null;
        if (stripNumber < 0 || stripNumber > 2) return null;
        if (ESP1_IP.equals(espIp)) return ESP1_STRIP_TOTAL_LEDS[stripNumber];
        if (ESP2_IP.equals(espIp)) return ESP2_STRIP_TOTAL_LEDS[stripNumber];
        return null;
    }

    /** Canonical {@code rangeStart} for a box number, or {@code null} when unknown. */
    public static Integer canonicalRangeStart(Integer boxNumber) {
        int[] r = BOX_RANGE.get(boxNumber);
        return r == null ? null : r[0];
    }

    /** Canonical {@code rangeEnd} for a box number, or {@code null} when unknown. */
    public static Integer canonicalRangeEnd(Integer boxNumber) {
        int[] r = BOX_RANGE.get(boxNumber);
        return r == null ? null : r[1];
    }

    /**
     * Which physical strip (0..5) a box lives on — the outer strip index,
     * where 0..2 are on ESP-1 and 3..5 are on ESP-2. Derived from box number
     * via a straight 12-boxes-per-strip mapping.
     */
    public static Integer canonicalPhysicalStrip(Integer boxNumber) {
        if (boxNumber == null || boxNumber < 1 || boxNumber > 72) return null;
        return (boxNumber - 1) / 12;
    }

    /** Which ESP IP a box lives on — box 1-36 = ESP-1, 37-72 = ESP-2. */
    public static String canonicalEspIp(Integer boxNumber) {
        Integer strip = canonicalPhysicalStrip(boxNumber);
        if (strip == null) return null;
        return strip < 3 ? ESP1_IP : ESP2_IP;
    }

    /** Which {@code stripNumber} (0..2 within an ESP) a box lives on. */
    public static Integer canonicalStripNumber(Integer boxNumber) {
        Integer physical = canonicalPhysicalStrip(boxNumber);
        if (physical == null) return null;
        return physical % 3;
    }

    private static Map<Integer, int[]> buildBoxRanges() {
        Map<Integer, int[]> m = new HashMap<>(72);
        // Strip 0 (Boxes 1-12)
        m.put(1, new int[]{0, 17});    m.put(2, new int[]{20, 37});
        m.put(3, new int[]{40, 57});   m.put(4, new int[]{60, 77});
        m.put(5, new int[]{80, 97});   m.put(6, new int[]{100, 117});
        m.put(7, new int[]{120, 137}); m.put(8, new int[]{140, 157});
        m.put(9, new int[]{160, 177}); m.put(10, new int[]{180, 197});
        m.put(11, new int[]{202, 219}); m.put(12, new int[]{222, 240});
        // Strip 1 (Boxes 13-24)
        m.put(13, new int[]{0, 17});   m.put(14, new int[]{21, 37});
        m.put(15, new int[]{41, 57});  m.put(16, new int[]{60, 77});
        m.put(17, new int[]{82, 98});  m.put(18, new int[]{100, 117});
        m.put(19, new int[]{120, 137}); m.put(20, new int[]{140, 156});
        m.put(21, new int[]{158, 175}); m.put(22, new int[]{177, 194});
        m.put(23, new int[]{197, 214}); m.put(24, new int[]{217, 237});
        // Strip 2 (Boxes 25-36)
        m.put(25, new int[]{0, 17});   m.put(26, new int[]{20, 37});
        m.put(27, new int[]{40, 57});  m.put(28, new int[]{60, 77});
        m.put(29, new int[]{80, 97});  m.put(30, new int[]{100, 117});
        m.put(31, new int[]{120, 137}); m.put(32, new int[]{139, 156});
        m.put(33, new int[]{159, 176}); m.put(34, new int[]{178, 195});
        m.put(35, new int[]{197, 214}); m.put(36, new int[]{217, 237});
        // Strip 3 (Boxes 37-48)
        m.put(37, new int[]{0, 24});   m.put(38, new int[]{28, 43});
        m.put(39, new int[]{46, 63});  m.put(40, new int[]{65, 83});
        m.put(41, new int[]{85, 103}); m.put(42, new int[]{105, 123});
        m.put(43, new int[]{125, 143}); m.put(44, new int[]{145, 163});
        m.put(45, new int[]{165, 182}); m.put(46, new int[]{184, 201});
        m.put(47, new int[]{203, 220}); m.put(48, new int[]{222, 245});
        // Strip 4 (Boxes 49-60)
        m.put(49, new int[]{0, 17});   m.put(50, new int[]{20, 37});
        m.put(51, new int[]{43, 57});  m.put(52, new int[]{62, 81});
        m.put(53, new int[]{83, 100}); m.put(54, new int[]{102, 120});
        m.put(55, new int[]{123, 140}); m.put(56, new int[]{142, 160});
        m.put(57, new int[]{162, 180}); m.put(58, new int[]{182, 200});
        m.put(59, new int[]{202, 220}); m.put(60, new int[]{222, 245});
        // Strip 5 (Boxes 61-72)
        m.put(61, new int[]{0, 27});   m.put(62, new int[]{30, 47});
        m.put(63, new int[]{50, 69});  m.put(64, new int[]{72, 90});
        m.put(65, new int[]{92, 110}); m.put(66, new int[]{112, 130});
        m.put(67, new int[]{136, 154}); m.put(68, new int[]{157, 177});
        m.put(69, new int[]{177, 197}); m.put(70, new int[]{199, 217});
        m.put(71, new int[]{220, 237}); m.put(72, new int[]{245, 260});
        return m;
    }
}
