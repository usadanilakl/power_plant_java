package com.dk_power.power_plant_java.sevice.angular.permits;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.kohsuke.github.GHContent;
import org.kohsuke.github.GHRepository;
import org.kohsuke.github.GitHub;
import org.kohsuke.github.HttpException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;

/**
 * {@link PwaDataSink} that writes datasets to the local {@code public/data} mirror and pushes them to
 * the GitHub Pages repo — the historical PWA data pipeline. Active only when
 * {@code pwa.data-target} is {@code github-pages} or {@code both} (default is {@code supabase}, so this
 * is dormant unless explicitly enabled). Kept as a safety net / rollback path.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class GitHubPagesSink implements PwaDataSink {

    private final GitHub gitHub;

    @Value("${pwa.data-target:supabase}")
    private String dataTarget;

    @Value("${pwa.data.path:${user.dir}/browser/ng-ui/public/data}")
    private String pwaDataPath;

    @Value("${pwa.github.repo:JacksonGeneration/permits}")
    private String pwaGitHubRepo;

    @Override
    public boolean isActive() {
        String t = dataTarget == null ? "" : dataTarget.trim().toLowerCase();
        return t.equals("github-pages") || t.equals("github") || t.equals("both");
    }

    @Override
    public String name() {
        return "github-pages";
    }

    @Override
    public void publishText(String datasetKey, String fileBaseName, String json) throws IOException {
        publishBinary(datasetKey, fileBaseName, json.getBytes(StandardCharsets.UTF_8));
    }

    @Override
    public void publishBinary(String datasetKey, String fileBaseName, byte[] content) throws IOException {
        writeLocal(fileBaseName, content);
        pushToGitHub("data/" + fileBaseName, content);
    }

    private void writeLocal(String fileBaseName, byte[] content) throws IOException {
        Path dir = Paths.get(pwaDataPath);
        Files.createDirectories(dir);
        Files.write(dir.resolve(fileBaseName), content);
    }

    private void pushToGitHub(String path, byte[] content) throws IOException {
        GHRepository repo = gitHub.getRepository(pwaGitHubRepo);
        try {
            GHContent existing = repo.getFileContent(path);
            existing.update(content, "Update " + path);
        } catch (HttpException e) {
            if (e.getResponseCode() != 404) throw e;
            repo.createContent(content, "Create " + path, path);
        }
        log.info("[PWA Publisher] github-pages: wrote {}", path);
    }
}
