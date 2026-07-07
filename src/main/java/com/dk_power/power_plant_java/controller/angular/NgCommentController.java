package com.dk_power.power_plant_java.controller.angular;

import com.dk_power.power_plant_java.dto.base_dtos.CommentDto;
import com.dk_power.power_plant_java.entities.base_entities.Comment;
import com.dk_power.power_plant_java.sevice.angular.NgCommentService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.dk_power.power_plant_java.dto.SearchCriteria;
import org.springframework.data.domain.Page;

import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/ng/comments")
@RequiredArgsConstructor
public class NgCommentController {
    private final NgCommentService ngCommentService;

    @GetMapping("/paginated")
    public ResponseEntity<NgApiResponse<Page<CommentDto>>> getPaginated(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "50") int pageSize) {
        try {
            Page<CommentDto> paginatedComments = ngCommentService.getAll(page - 1, pageSize);
            NgApiResponse<Page<CommentDto>> response = new NgApiResponse<>(paginatedComments, "Comments retrieved successfully");
            return ResponseEntity.ok().contentType(MediaType.APPLICATION_JSON).body(response);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, e.getMessage()));
        }
    }

    @com.dk_power.power_plant_java.config.security.RestrictedAllowed // LOTO off-LAN: read comments
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

    @com.dk_power.power_plant_java.config.security.RestrictedAllowed // LOTO off-LAN: add comment (WRITE — shared Comments endpoint)
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

    @com.dk_power.power_plant_java.config.security.RestrictedAllowed // LOTO off-LAN: edit comment (WRITE — shared)
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

    @PostMapping("/search")
    public ResponseEntity<NgApiResponse<Page<CommentDto>>> search(
            @RequestBody SearchCriteria criteria,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "50") int pageSize) {
        try {
            Page<CommentDto> searchResults = null;

            if (criteria.getType().equals(SearchCriteria.SearchType.COLUMN)) {
                String sortColumn = criteria.getSortColumn() != null ? criteria.getSortColumn() : "dateCreated";
                String sortDirection = criteria.getSortDirection() != null ? criteria.getSortDirection().toLowerCase() : "desc";
                searchResults = ngCommentService.complexSearch(criteria, page - 1, pageSize, sortColumn, sortDirection, true);
            } else if (SearchCriteria.SearchType.GLOBAL.equals(criteria.getType()) && criteria.getQuery() != null && !criteria.getQuery().isEmpty()) {
                String sortColumn = criteria.getSortColumn() != null ? criteria.getSortColumn() : "dateCreated";
                String sortDirection = criteria.getSortDirection() != null ? criteria.getSortDirection().toLowerCase() : "desc";
                searchResults = ngCommentService.complexSearch(criteria, page - 1, pageSize, sortColumn, sortDirection, true);
            } else if (criteria.getType().equals(SearchCriteria.SearchType.SORT) && criteria.getSortColumn() != null) {
                String sortDirection = criteria.getSortDirection() != null ? criteria.getSortDirection().toLowerCase() : "desc";
                searchResults = ngCommentService.complexSearch(criteria, page - 1, pageSize, criteria.getSortColumn(), sortDirection, true);
            }

            NgApiResponse<Page<CommentDto>> response = new NgApiResponse<>(searchResults, "Search completed successfully");
            return ResponseEntity.ok().contentType(MediaType.APPLICATION_JSON).body(response);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, e.getMessage()));
        }
    }

    @GetMapping("/unique-values/{column}")
    public ResponseEntity<NgApiResponse<List<String>>> getUniqueValues(@PathVariable String column) {
        try {
            List<String> uniqueValues = ngCommentService.getUniqueValuesOfColumn(column);
            NgApiResponse<List<String>> response = new NgApiResponse<>(uniqueValues, "Unique values retrieved successfully");
            return ResponseEntity.ok().contentType(MediaType.APPLICATION_JSON).body(response);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, e.getMessage()));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, e.getMessage()));
        }
    }

    @PostMapping("/unique-values/{column}/filtered")
    public ResponseEntity<NgApiResponse<Page<String>>> getFilteredUniqueValues(
            @PathVariable String column,
            @RequestBody SearchCriteria searchCriteria,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "50") int pageSize,
            @RequestParam(defaultValue = "false") boolean andLogicEnabled) {
        try {
            Page<String> uniqueValues = ngCommentService.getFilteredUniqueValuesOfColumn2(
                    column, searchCriteria, page, pageSize, andLogicEnabled);
            NgApiResponse<Page<String>> response = new NgApiResponse<>(uniqueValues, "Filtered unique values retrieved successfully");
            return ResponseEntity.ok().contentType(MediaType.APPLICATION_JSON).body(response);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, e.getMessage()));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, e.getMessage()));
        }
    }

    @com.dk_power.power_plant_java.config.security.RestrictedAllowed // LOTO off-LAN: delete comment (WRITE/DELETE — shared)
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
