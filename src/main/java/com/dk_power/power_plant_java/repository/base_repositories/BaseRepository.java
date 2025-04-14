package com.dk_power.power_plant_java.repository.base_repositories;

import com.dk_power.power_plant_java.entities.base_entities.BaseIdEntity;
import org.springframework.data.domain.Page;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.repository.NoRepositoryBean;

import org.springframework.data.domain.Pageable;
import java.time.LocalDateTime;
import java.util.List;
@NoRepositoryBean
public interface BaseRepository<E> extends JpaRepository<E,Long>, JpaSpecificationExecutor<E> {
    List<E> findByCreatedBy(String name);
    List<E> findByDeletedTrue();
    List<E> findAllByDateModifiedAfter(LocalDateTime since);
    Page<E> findAllByDateModifiedAfterOrderByDateModifiedAsc(LocalDateTime since, Pageable pageable);

    Page<E> findAllByDateModifiedBetween(LocalDateTime since, LocalDateTime until, Pageable pageable);
}

