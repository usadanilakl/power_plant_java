package com.dk_power.power_plant_java.sevice.angular.permits;

/**
 * A destination for the PWA reference datasets produced by {@code WorkAreaGitHubPublisher}. The
 * publisher builds each dataset's JSON once and hands it to every <b>active</b> sink, so the transport
 * (GitHub Pages vs Supabase) is a swappable, flag-selected concern.
 *
 * <p>Selected by the {@code pwa.data-target} property: {@code supabase} (default), {@code github-pages},
 * or {@code both}. See project/architecture/supabase/reference-data.md.
 */
public interface PwaDataSink {

    /** Whether this sink should receive writes right now (based on {@code pwa.data-target} + availability). */
    boolean isActive();

    /** Short name for logging (e.g. "github-pages", "supabase"). */
    String name();

    /**
     * Publish a JSON dataset.
     * @param datasetKey   stable key (e.g. "loto_points") — the Supabase snapshot key / the PWA read key
     * @param fileBaseName the historical file name (e.g. "loto-points.json") — used for GitHub/local paths
     * @param json         the dataset serialized as a JSON array
     */
    void publishText(String datasetKey, String fileBaseName, String json) throws Exception;

    /** Publish a binary asset (e.g. the work-area map image). */
    void publishBinary(String datasetKey, String fileBaseName, byte[] content) throws Exception;
}
