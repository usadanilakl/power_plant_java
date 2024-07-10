package com.dk_power.power_plant_java.repository.categories;

import com.dk_power.power_plant_java.repository.base_repositories.BaseRepository;
import org.springframework.data.repository.NoRepositoryBean;

import java.util.List;

@NoRepositoryBean
public interface BaseCategoryValueRepo<E> extends BaseRepository<E> {
    List<E> findByName(String name);
}
