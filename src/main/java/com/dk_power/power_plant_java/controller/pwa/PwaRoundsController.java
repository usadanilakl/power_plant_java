package com.dk_power.power_plant_java.controller.pwa;

import com.dk_power.power_plant_java.controller.angular.NgApiResponse;
import com.dk_power.power_plant_java.dto.rounds.RoundPerformDtos.*;
import com.dk_power.power_plant_java.sevice.rounds.RoundPerformService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Mobile (PWA) Rounds perform flow for Plant staff — under {@code /api/pwa/secured/rounds/**} (JWT + ROLE_PLANT/ADMIN).
 * List active rounds, grab one (creates an IN_PROGRESS instance — online required, like a Maximo PM grab), submit
 * answers with out-of-range issue reconciliation, and drive the Active Out-of-Range dashboard. Thin proxy over
 * {@link RoundPerformService}.
 */
@RestController
@RequestMapping("/api/pwa/secured/rounds")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin(originPatterns = {"https://dk-power.github.io", "https://jacksongeneration.github.io", "http://localhost:*", "http://127.0.0.1:*"}, allowCredentials = "true")
public class PwaRoundsController {

    private final RoundPerformService perform;

    @GetMapping
    public ResponseEntity<NgApiResponse<List<RoundListItem>>> list() {
        return ok(new NgApiResponse<>(perform.listActiveRounds(), "active rounds"));
    }

    @GetMapping("/{roundId}")
    public ResponseEntity<NgApiResponse<RoundPerform>> get(@PathVariable Long roundId) {
        RoundPerform rp = perform.getRoundForPerform(roundId);
        if (rp == null) return ResponseEntity.badRequest().body(new NgApiResponse<>(null, "round not found"));
        return ok(new NgApiResponse<>(rp, "ok"));
    }

    @PostMapping("/{roundId}/grab")
    public ResponseEntity<NgApiResponse<GrabResult>> grab(@PathVariable Long roundId, @RequestParam(required = false) String shift) {
        try {
            return ok(new NgApiResponse<>(perform.grab(roundId, shift), "grabbed"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, e.getMessage()));
        }
    }

    @GetMapping("/questions/{questionId}/history")
    public ResponseEntity<NgApiResponse<List<AnswerHistory>>> history(@PathVariable Long questionId, @RequestParam(defaultValue = "10") int limit) {
        return ok(new NgApiResponse<>(perform.questionHistory(questionId, limit), "history"));
    }

    @PostMapping("/instances/{instanceId}/submit")
    public ResponseEntity<NgApiResponse<SubmitResult>> submit(@PathVariable Long instanceId, @RequestBody SubmitRoundRequest body) {
        try {
            return ok(new NgApiResponse<>(perform.submit(instanceId, body), "submitted"));
        } catch (Exception e) {
            log.warn("[Rounds] submit {} failed: {}", instanceId, e.getMessage());
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, e.getMessage()));
        }
    }

    // ── Active Out-of-Range dashboard ──

    @GetMapping("/issues")
    public ResponseEntity<NgApiResponse<List<RoundIssueDto>>> issues(@RequestParam(defaultValue = "true") boolean openOnly) {
        return ok(new NgApiResponse<>(perform.listIssues(openOnly), "issues"));
    }

    @GetMapping("/issues/{id}/comments")
    public ResponseEntity<NgApiResponse<List<IssueCommentDto>>> issueComments(@PathVariable Long id) {
        return ok(new NgApiResponse<>(perform.issueComments(id), "comments"));
    }

    @PostMapping("/issues/{id}/comments")
    public ResponseEntity<NgApiResponse<IssueCommentDto>> addComment(@PathVariable Long id, @RequestBody IssueCommentRequest body) {
        try {
            return ok(new NgApiResponse<>(perform.commentIssue(id, body == null ? null : body.text()), "added"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, e.getMessage()));
        }
    }

    @PostMapping("/issues/{id}/resolve")
    public ResponseEntity<NgApiResponse<RoundIssueDto>> resolve(@PathVariable Long id, @RequestBody(required = false) IssueCommentRequest body) {
        try {
            return ok(new NgApiResponse<>(perform.resolveIssue(id, body == null ? null : body.text()), "resolved"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, e.getMessage()));
        }
    }

    private <T> ResponseEntity<NgApiResponse<T>> ok(NgApiResponse<T> body) {
        return ResponseEntity.ok(body);
    }
}
