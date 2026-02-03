package com.dk_power.power_plant_java.repository.base_repositories;

import com.dk_power.power_plant_java.entities.base_entities.Comment;

import java.util.List;

public interface CommentRepo extends BaseRepository<Comment> {
    List<Comment> findByEntityTypeAndEntityId(String entityType, Long entityId);
    List<Comment> findByEntityTypeAndEntityIdOrderByDateCreatedDesc(String entityType, Long entityId);
}
