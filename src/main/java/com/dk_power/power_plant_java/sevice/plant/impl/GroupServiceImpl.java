package com.dk_power.power_plant_java.sevice.plant.impl;

import com.dk_power.power_plant_java.dto.permits.BoxDto;
import com.dk_power.power_plant_java.entities.plant.Group;
import com.dk_power.power_plant_java.sevice.plant.GroupService;
import com.dk_power.power_plant_java.util.Util;
import org.springframework.data.repository.CrudRepository;

import java.lang.reflect.Constructor;
import java.util.List;

public class GroupServiceImpl<T extends Group> implements GroupService<T> {
    private final CrudRepository<T,Long> repo;
    public GroupServiceImpl(CrudRepository<T,Long> repository) {
        repo = repository;
    }

    @Override
    public List<T> getAll() {
        return Util.toList(repo.findAll());
    }
    @Override
    public T getById(Long id) {
        return repo.findById(id).orElse(null);
    }
    @Override
    public T save(T entity) {
        return repo.save(entity);
    }

    @Override
    public T createNew(String name, Class<T> groupType) {
        try {
            Constructor<T> constructor = groupType.getConstructor(String.class);
            T instance = constructor.newInstance(name);
            return save(instance);
        } catch (Exception e) {
            throw new RuntimeException("Failed to create a new instance", e);
        }

//        return save(groupType.cast(new Group(name))) ;
    }

    @Override
    public BoxDto getDtoById(Long l) {
        return null;
    }
}
