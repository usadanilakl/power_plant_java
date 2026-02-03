package com.dk_power.power_plant_java.controller.angular;

import com.dk_power.power_plant_java.dto.base_dtos.CommentDto;
import com.dk_power.power_plant_java.entities.base_entities.Comment;
import com.dk_power.power_plant_java.sevice.angular.NgCommentService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/ng/comments")
@RequiredArgsConstructor
public class NgCommentController {
    private final NgCommentService ngCommentService;

    @GetMapping("/{entityType}/{entityId}")
    public ResponseEntity<NgApiResponse<List<CommentDto>>> getCommentsForEntity(
            @PathVariable String entityType,
            @PathVariable Long entityId) {
        try {
            List<CommentDto> comments = ngCommentService.getCommentsForEntity(entityType, entityId);
            NgApiResponse<List<CommentDto>> response = new NgApiResponse<>(comments, "Comments retrieved successfully");
            return ResponseEntity.ok().contentType(MediaType.APPLICATION_JSON).body(response);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, e.getMessage()));
        }
    }

    @PostMapping
    public ResponseEntity<NgApiResponse<CommentDto>> createComment(@RequestBody CommentDto commentDto) {
        try {
            Comment saved = ngCommentService.save(commentDto);
            CommentDto result = ngCommentService.toDto(saved);
            NgApiResponse<CommentDto> response = new NgApiResponse<>(result, "Comment created successfully", LocalDateTime.now());
            return ResponseEntity.ok().contentType(MediaType.APPLICATION_JSON).body(response);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, e.getMessage()));
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<NgApiResponse<CommentDto>> updateComment(
            @PathVariable Long id,
            @RequestBody CommentDto commentDto) {
        try {
            Comment existing = ngCommentService.getEntityById(id);
            if (existing == null) {
                return ResponseEntity.notFound().build();
            }

            if (commentDto.getContent() != null) {
                existing.setContent(commentDto.getContent());
            }
            if (commentDto.getCommentType() != null) {
                Comment converted = ngCommentService.toEntity(commentDto);
                existing.setCommentType(converted.getCommentType());
            }
            if (commentDto.getNeedsAttention() != null) {
                existing.setNeedsAttention(commentDto.getNeedsAttention());
            }
            if (commentDto.getIsResolved() != null) {
                existing.setIsResolved(commentDto.getIsResolved());
            }

            Comment saved = ngCommentService.save(existing);
            CommentDto result = ngCommentService.toDto(saved);
            NgApiResponse<CommentDto> response = new NgApiResponse<>(result, "Comment updated successfully", LocalDateTime.now());
            return ResponseEntity.ok().contentType(MediaType.APPLICATION_JSON).body(response);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, e.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<NgApiResponse<CommentDto>> deleteComment(@PathVariable Long id) {
        try {
            Comment existing = ngCommentService.getEntityById(id);
            if (existing == null) {
                return ResponseEntity.notFound().build();
            }
            Comment deleted = ngCommentService.softDelete(existing);
            CommentDto result = ngCommentService.toDto(deleted);
            NgApiResponse<CommentDto> response = new NgApiResponse<>(result, "Comment deleted successfully");
            return ResponseEntity.ok().contentType(MediaType.APPLICATION_JSON).body(response);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, e.getMessage()));
        }
    }
}
