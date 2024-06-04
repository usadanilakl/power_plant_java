package com.dk_power.power_plant_java.sevice;

import com.dk_power.power_plant_java.util.Util;
import lombok.AllArgsConstructor;
import org.springframework.data.repository.CrudRepository;
import org.springframework.stereotype.Service;

import java.util.List;
@Service
@AllArgsConstructor
public class BaseCrudServiceImpl<T,R extends CrudRepository<T,Long>> implements BaseCrudService<T>{
    private final R repo;
    @Override
    public T save(T entity) {
        return repo.save(entity);
    }

    @Override
    public List<T> getAll() {
        return Util.toList(repo.findAll());
    }
}
