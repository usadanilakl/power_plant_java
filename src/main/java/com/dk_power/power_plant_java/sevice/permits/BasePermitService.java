package com.dk_power.power_plant_java.sevice.permits;

import com.dk_power.power_plant_java.enums.Status;

import java.util.List;
import java.util.Map;

public interface BasePermitService<T,D> {
    List<T> getAll();
    List<T> getAllSorted(String column);
    T getById(Long id);
    List<T> getByCreatedBy();
    T save(T entity);
    T createNew(D dto, Class<T> tClass);
    T changeStatus(Long id, Status status);
    List<T> sortTable(String column);
    List<T> filterTable(Map<String,String> filters);
    List<T> getLastFilteredList();
    List<T> clearFilters();
    void filterNew(T entity);
    T resetFields();
    T convertToEntity(D dto, Class<T> tClass);
    D convertToDto(T entity, Class<D> dClass);
    T getTempPermit();
    String getLoggedInUserName();
    Long generatePermitNum();
    List<T> getRevision(Long id,Class<T> entityClass);

}
