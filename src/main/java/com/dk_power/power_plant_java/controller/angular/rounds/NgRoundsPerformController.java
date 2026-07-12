package com.dk_power.power_plant_java.controller.angular.rounds;

import com.dk_power.power_plant_java.controller.angular.NgApiResponse;
import com.dk_power.power_plant_java.dto.rounds.RoundPerformDtos.*;
import com.dk_power.power_plant_java.sevice.rounds.RoundPerformService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Desktop (jg portal) Rounds monitoring — the Active Out-of-Range dashboard. Read + comment/resolve of {@code RoundIssue}s
 * under {@code /ng/rounds-perform/*}. Authoring is on {@link NgRoundsAdminController}; performing is on the PWA
 * ({@code PwaRoundsController}). Reuses {@link RoundPerformService}.
 */
@RestController
@RequestMapping("/ng/rounds-perform")
@RequiredArgsConstructor
@Slf4j
public class NgRoundsPerformController {

    private final RoundPerformService perform;

    @GetMapping("/issues")
    public ResponseEntity<NgApiResponse<List<RoundIssueDto>>> issues(@RequestParam(defaultValue = "true") boolean openOnly) {
        return json(new NgApiResponse<>(perform.listIssues(openOnly), "issues"));
    }

    @GetMapping("/issues/{id}/comments")
    public ResponseEntity<NgApiResponse<List<IssueCommentDto>>> comments(@PathVariable Long id) {
        return json(new NgApiResponse<>(perform.issueComments(id), "comments"));
    }

    @PostMapping("/issues/{id}/comments")
    public ResponseEntity<NgApiResponse<IssueCommentDto>> addComment(@PathVariable Long id, @RequestBody IssueCommentRequest body) {
        try {
            return json(new NgApiResponse<>(perform.commentIssue(id, body == null ? null : body.text()), "added"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, e.getMessage()));
        }
    }

    @PostMapping("/issues/{id}/resolve")
    public ResponseEntity<NgApiResponse<RoundIssueDto>> resolve(@PathVariable Long id, @RequestBody(required = false) IssueCommentRequest body) {
        try {
            return json(new NgApiResponse<>(perform.resolveIssue(id, body == null ? null : body.text()), "resolved"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, e.getMessage()));
        }
    }

    private <T> ResponseEntity<NgApiResponse<T>> json(NgApiResponse<T> body) {
        return ResponseEntity.ok().contentType(MediaType.APPLICATION_JSON).body(body);
    }
}
