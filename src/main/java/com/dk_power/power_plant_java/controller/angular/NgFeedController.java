package com.dk_power.power_plant_java.controller.angular;

import com.dk_power.power_plant_java.dto.feed.FeedItemDto;
import com.dk_power.power_plant_java.sevice.angular.feed.FeedAggregationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Serves the desktop "Updates / News" feed — a merged, newest-first view of recent activity across
 * work requests, plant conversations and schedule changes. Read-only; authenticated automatically
 * for localhost callers via {@code DesktopAutoAuthFilter} (same path the Electron shell already uses
 * for {@code /ng/schedule/**}), so no explicit auth plumbing is required from the Electron NewsManager.
 */
@RestController
@RequestMapping("/ng/feed")
@RequiredArgsConstructor
@Slf4j
public class NgFeedController {

    private final FeedAggregationService feedAggregationService;

    /**
     * @param since optional ISO-8601 date-time lower bound (drops older items)
     * @param limit total item cap (default 50)
     */
    @GetMapping("/recent")
    public ResponseEntity<NgApiResponse<List<FeedItemDto>>> recent(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime since,
            @RequestParam(required = false, defaultValue = "50") int limit) {
        List<FeedItemDto> items = feedAggregationService.recent(since, limit);
        return ResponseEntity.ok(new NgApiResponse<>(items, "Recent updates"));
    }
}
