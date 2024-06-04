package com.dk_power.power_plant_java.sevice.plant.impl;

import com.dk_power.power_plant_java.sevice.plant.GroupService;
import org.springframework.stereotype.Service;

import java.util.List;
@Service
public class GroupServiceImpl<T> implements GroupService<T> {
    private final T repo;
    public GroupServiceImpl(T repository) {
        repo = repository;
    }

    @Override
    public List<T> getAll() {
        return null;
    }

    @Override
    public T getById() {
        return null;
    }

    @Override
    public T save() {
        return null;
    }
}
