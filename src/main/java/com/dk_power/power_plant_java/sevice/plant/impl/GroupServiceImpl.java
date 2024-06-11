package com.dk_power.power_plant_java.sevice.plant.impl;

import com.dk_power.power_plant_java.entities.plant.Group;
import com.dk_power.power_plant_java.mappers.UniversalMapper;
import com.dk_power.power_plant_java.repository.plant.GroupRepo;
import com.dk_power.power_plant_java.sevice.plant.GroupService;
import com.dk_power.power_plant_java.util.Util;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.data.repository.CrudRepository;
import org.springframework.stereotype.Service;

import java.lang.reflect.Constructor;
import java.lang.reflect.InvocationTargetException;
import java.util.List;
@Service
public class GroupServiceImpl<T extends Group> implements GroupService<T> {
    protected final GroupRepo<T> repo;
    protected final UniversalMapper mapper;

    public GroupServiceImpl(@Qualifier("groupRepo") GroupRepo<T> repo, UniversalMapper mapper) {
        this.repo = repo;
        this.mapper = mapper;
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
    public <D> T update(D dto, Class<T> type) {
        try {
            Constructor<T> constructor = type.getConstructor();
            return save(mapper.convert(dto, constructor.newInstance()));
        } catch (NoSuchMethodException | InvocationTargetException | InstantiationException | IllegalAccessException e) {
            throw new RuntimeException(e);
        }
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
    public <D> D getDtoById(Long id,Class<D> type) {
        try {
            Constructor<D> constructor = type.getConstructor();
            return mapper.convert(getById(id), constructor.newInstance());
        } catch (NoSuchMethodException | InvocationTargetException | InstantiationException | IllegalAccessException e) {
            throw new RuntimeException(e);
        }
    }
//    T getByName(String name){
//       return repo.findByName(name);
//    }

//    @Override
//    public <D> D getDtoByName(String name,Class<D> type) {
//        try {
//            Constructor<D> constructor = type.getConstructor();
//            return mapper.convert(getByName(name), constructor.newInstance());
//        } catch (NoSuchMethodException | InvocationTargetException | InstantiationException | IllegalAccessException e) {
//            throw new RuntimeException(e);
//        }
//    }

    @Override
    public String delete(Long id) {
        repo.delete(getById(id));
        return "Sucess";
    }


}
