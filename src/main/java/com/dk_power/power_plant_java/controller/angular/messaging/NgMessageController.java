package com.dk_power.power_plant_java.controller.angular.messaging;

import com.dk_power.power_plant_java.controller.angular.NgApiResponse;
import com.dk_power.power_plant_java.dto.messaging.MessageDto;
import com.dk_power.power_plant_java.sevice.angular.messaging.NgMessageService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/ng/messages")
@RequiredArgsConstructor
@Slf4j
public class NgMessageController {

    private final NgMessageService service;

    @GetMapping("/conversation/{conversationId}")
    public ResponseEntity<NgApiResponse<List<MessageDto>>> getForConversation(@PathVariable Long conversationId) {
        try {
            List<MessageDto> dtos = service.getMessagesForConversation(conversationId);
            return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_JSON)
                .body(new NgApiResponse<>(dtos, "Messages retrieved successfully"));
        } catch (Exception e) {
            log.error("[Message] Failed to get messages for conversation {}", conversationId, e);
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, e.getMessage()));
        }
    }

    @PostMapping
    public ResponseEntity<NgApiResponse<MessageDto>> sendMessage(@RequestBody MessageDto dto) {
        try {
            MessageDto created = service.sendMessage(dto);
            return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_JSON)
                .body(new NgApiResponse<>(created, "Message sent successfully", LocalDateTime.now()));
        } catch (Exception e) {
            log.error("[Message] Failed to send message", e);
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, e.getMessage()));
        }
    }
}
