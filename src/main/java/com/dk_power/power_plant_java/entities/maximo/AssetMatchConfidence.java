package com.dk_power.power_plant_java.entities.maximo;

/**
 * How confident the tag matcher is about the asset it identified for a Maximo ticket.
 * <ul>
 *   <li>EXACT   — the ticket already carried a valid Maximo assetnum (Maximo itself linked it).</li>
 *   <li>STRONG  — a full tag in the ticket text resolved to exactly one real asset (exact or delimiter-insensitive).</li>
 *   <li>PARTIAL — only partial/ambiguous tags were found; the row carries suggested candidate assets.</li>
 *   <li>NONE    — no asset could be identified or suggested from the ticket.</li>
 * </ul>
 */
public enum AssetMatchConfidence {
    EXACT,
    STRONG,
    PARTIAL,
    NONE
}
