package com.dk_power.power_plant_java.sevice.permits.impl;

import com.dk_power.power_plant_java.dto.permits.BasePermitDto;
import com.dk_power.power_plant_java.entities.permits.BasePermit;
import com.dk_power.power_plant_java.enums.Status;
import com.dk_power.power_plant_java.repository.permits.BasePermitRepo;
import com.dk_power.power_plant_java.sevice.permits.BasePermitService;
import com.dk_power.power_plant_java.sevice.permits.PermitNumbersService;
import com.dk_power.power_plant_java.sevice.users.impl.UserDetailsServiceImpl;
import com.dk_power.power_plant_java.util.Util;
import lombok.AllArgsConstructor;
import org.springframework.data.domain.Sort;

import java.util.List;
import java.util.Map;

@AllArgsConstructor
public class BasePermitServiceImpl <T extends BasePermit,D extends BasePermitDto<T>> implements BasePermitService<T, D> {
    private final BasePermitRepo<T> repository;
    protected PermitNumbersService permitNumbersService;
    private final FilterService<T> filterService;
    private final UserDetailsServiceImpl customUserDetails;

    @Override
    public List<T> getAll() {
        return Util.toList(repository.findAll());
    }

    @Override
    public List<T> getAllSorted(String column) {
        return repository.findAll(Sort.by(column));
    }

    @Override
    public T getById(Long id) {
        return repository.findById(id).orElse(null);
    }

    @Override
    public T getByCreatedBy() {
        return repository.findByCreatedBy(customUserDetails.getUsersName());
    }

    @Override
    public T save(T entity) {
        return repository.save(entity);
    }

    @Override
    public T createNew(D dto) {
        T permit = dto.toEntity();
        permit.setDocNum(permitNumbersService.getNumber(permit.getType()));
        permit.setStatus(Status.INCATCIVE);
        return null;
    }

    @Override
    public T changeStatus(Long id, Status status) {
        T permit = getById(id);
        permit.setStatus(status);
        return permit;
    }

    @Override
    public List<T> sortTable(String column) {
        if(filterService.getPermits()==null) filterService.setPermits(getAll());
        if(filterService.getLastSortingRequest()!=null && filterService.getLastSortingRequest().equals(column)){
            if(filterService.getAscending()) filterService.setAscending(false);
            else filterService.setAscending(true);
        }
        if(filterService.getAscending()){
            filterService.sortListAsc(column);
        }else {
            filterService.sortListDsc(column);
        }
        filterService.setLastSortingRequest(column);
        return filterService.getPermits();
    }

    @Override
    public List<T> filterTable(Map<String, String> filters) {
        filterService.setPermits(getAll());
        filterService.setLastSetOfFileters(filters);
        for(Map.Entry<String,String> e : filters.entrySet()){
            filterService.filterPermits(e.getValue(),e.getKey());
        }
        return filterService.getPermits();
    }

    @Override
    public List<T> getLastFilteredList() {
        if(filterService.getPermits()==null) filterService.setPermits(getAll());
        return filterService.getPermits();
    }

    @Override
    public List<T> clearFilters() {
        filterService.setPermits(getAll());
        return filterService.getPermits();
    }

    @Override
    public void filterNew(T entity) {
        boolean contains = true;
        if(filterService.getLastSetOfFileters()!=null){
            for(Map.Entry<String,String> e : filterService.getLastSetOfFileters().entrySet()){
                if(!filterService.getFieldByName(entity,e.getKey()).toString().contains(e.getValue())) contains = false;
            }
        }
        if(filterService.getPermits()!=null){
            for (BasePermit el : filterService.getPermits()) {
                if(el.getId().equals(entity.getId())){
                    el.copy(entity);
                    return;
                }
            }
        }
        if(contains)filterService.addItem(entity);
    }

    @Override
    public void resetFields() {
        T permit = getByCreatedBy();
        permit.copy(new BasePermit());
    }


}
