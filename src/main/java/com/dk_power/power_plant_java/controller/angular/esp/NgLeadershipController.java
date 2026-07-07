package com.dk_power.power_plant_java.controller.angular.esp;

import com.dk_power.power_plant_java.controller.angular.NgApiResponse;
import com.dk_power.power_plant_java.sevice.esp.NodeIdentityService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

/**
 * "Am I alive?" probe consumed by desktops' {@code WledLeadershipService}. As
 * long as the hub answers this within its TTL, desktops defer WLED writes to
 * the hub. When probes start failing, desktops promote themselves after the
 * grace period.
 * <p>
 * Public (no {@code @RestrictedAllowed}) — the probe carries no auth
 * information and needs to work regardless of who reaches it. Response body is
 * intentionally trivial; presence of a 200 is the signal.
 */
@RestController
@RequestMapping("/ng/leadership")
@RequiredArgsConstructor
public class NgLeadershipController {

    private final NodeIdentityService nodeIdentity;

    @GetMapping("/alive")
    public ResponseEntity<NgApiResponse<Map<String, Object>>> alive() {
        Map<String, Object> body = Map.of(
                "status", "alive",
                "hostname", nodeIdentity.getHostname(),
                "role", nodeIdentity.getSyncRole()
        );
        return ResponseEntity.ok(new NgApiResponse<>(body, "alive"));
    }
}
