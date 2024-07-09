package com.dk_power.power_plant_java.repository.base_repositories;

import org.springframework.data.repository.NoRepositoryBean;

import java.util.List;
@NoRepositoryBean
public interface PermitRepo<E> extends BaseRepository<E>{
    List<E> findByTempTrue();

    Long findMaxPermitNum();
}
