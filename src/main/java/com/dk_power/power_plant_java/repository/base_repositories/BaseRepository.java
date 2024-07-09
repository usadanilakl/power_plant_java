package com.dk_power.power_plant_java.repository.base_repositories;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.repository.NoRepositoryBean;

import java.util.List;
@NoRepositoryBean
public interface BaseRepository<E> extends JpaRepository<E,Long> {
    List<E> findByCreatedBy(String name);
    List<E> findByDeletedTrue();

}
