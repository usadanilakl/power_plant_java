package com.dk_power.power_plant_java.sevice.plant;

import com.dk_power.power_plant_java.entities.plant.Group;

import java.util.List;

public interface GroupService <T extends Group>{
    List<T> getAll();
    T getById(Long id);
    T save(T entity);
    public List<T> saveAll(List<T> entities);
    public T saveForTransfer(T entity);
    <D> T update(D dto,Class<T> type);
    T createNew(String name , Class<T> groupType);
    <D> D getDtoById(Long id,Class<D> type);
    String delete(Long id);
//    public <D> D getDtoByName(String name,Class<D> type);

}
