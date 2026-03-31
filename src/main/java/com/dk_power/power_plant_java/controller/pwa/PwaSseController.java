package com.dk_power.power_plant_java.controller.pwa;

import com.dk_power.power_plant_java.entities.users.User;
import com.dk_power.power_plant_java.repository.users.UserRepo;
import com.dk_power.power_plant_java.sevice.pwa.PwaSseService;
import com.dk_power.power_plant_java.sevice.users.impl.CustomUserDetails;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.util.Map;

@RestController
@RequestMapping("/api/pwa/secured/sse")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin(originPatterns = {"https://dk-power.github.io", "https://jacksongeneration.github.io", "http://localhost:*", "http://127.0.0.1:*"}, allowCredentials = "true")
public class PwaSseController {

    private final PwaSseService pwaSseService;
    private final UserRepo userRepo;

    @GetMapping(value = "/subscribe", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter subscribe() {
        User user = getCurrentUser();
        if (user == null) {
            SseEmitter emitter = new SseEmitter(0L);
            emitter.completeWithError(new RuntimeException("Not authenticated"));
            return emitter;
        }

        log.info("[PWA SSE] User {} subscribing to notifications", user.getEmail());
        return pwaSseService.createEmitter(user.getEmail());
    }

    @GetMapping("/stats")
    public ResponseEntity<?> getStats() {
        return ResponseEntity.ok(Map.of(
                "connections", pwaSseService.getConnectionCount()
        ));
    }

    private User getCurrentUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.getPrincipal() instanceof CustomUserDetails details) {
            return userRepo.findById(details.getId()).orElse(null);
        }
        return null;
    }
}
