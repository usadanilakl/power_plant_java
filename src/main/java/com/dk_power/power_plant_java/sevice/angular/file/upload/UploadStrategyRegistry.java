package com.dk_power.power_plant_java.sevice.angular.file.upload;

import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.util.Arrays;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * Picks an {@link UploadStrategy} for a given file extension and enforces the
 * configured extension whitelist.
 *
 * Strategy selection iterates registered strategies in order and returns the
 * first one whose {@link UploadStrategy#supports(String)} returns true, so more
 * specific strategies (e.g. {@link PdfPageSplitUploadStrategy}) must be
 * declared with higher precedence than fallbacks like {@link DirectUploadStrategy}.
 */
@Component
@RequiredArgsConstructor
public class UploadStrategyRegistry {

    private final List<UploadStrategy> strategies;

    @Value("${files.allowed-extensions:pdf,png,jpg,jpeg,tif,tiff,dwg,dxf,xlsx,xls,docx,doc}")
    private String allowedExtensionsConfig;

    private Set<String> allowedExtensionSet() {
        return Arrays.stream(allowedExtensionsConfig.split(","))
                .map(String::trim)
                .map(String::toLowerCase)
                .filter(s -> !s.isBlank())
                .collect(Collectors.toCollection(java.util.LinkedHashSet::new));
    }

    /** Ordered list of allowed extensions (lowercase, no dots) as configured. */
    public List<String> allowedExtensions() {
        return List.copyOf(allowedExtensionSet());
    }

    /** Throws if the extension is not in the whitelist. */
    public void validate(String extension) {
        if (extension == null || extension.isBlank()) {
            throw new RuntimeException("File extension is required");
        }
        if (!allowedExtensionSet().contains(extension.toLowerCase())) {
            throw new RuntimeException("File extension not allowed: " + extension
                    + ". Allowed: " + allowedExtensions());
        }
    }

    /** Pick the first strategy that supports the extension. */
    public UploadStrategy get(String extension) {
        return strategies.stream()
                .filter(s -> s.supports(extension))
                .findFirst()
                .orElseThrow(() -> new RuntimeException("No upload strategy for extension: " + extension));
    }
}
