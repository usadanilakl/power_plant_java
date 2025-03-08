package com.dk_power.power_plant_java.repository.base_repositories;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.repository.NoRepositoryBean;

import java.time.LocalDateTime;
import java.util.List;

@NoRepositoryBean
public interface BaseAuditRepository<E> extends BaseRepository<E> {
    List<E> findAllByDateModifiedAfter(LocalDateTime since);
}
