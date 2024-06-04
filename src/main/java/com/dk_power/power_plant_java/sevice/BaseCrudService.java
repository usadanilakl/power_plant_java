package com.dk_power.power_plant_java.sevice;

import java.util.List;

public interface BaseCrudService<T> {
    T save(T entity);
    List<T> getAll();


}
