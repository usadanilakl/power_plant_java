package com.dk_power.power_plant_java.sevice.permits.impl;

import com.dk_power.power_plant_java.dto.permits.BasePermitDto;
import com.dk_power.power_plant_java.entities.permits.BasePermit;
import com.dk_power.power_plant_java.entities.permits.lotos.Loto;
import com.dk_power.power_plant_java.enums.Status;
import com.dk_power.power_plant_java.mappers.BasePermitMapper;
import com.dk_power.power_plant_java.repository.permits.BasePermitRepo;
import com.dk_power.power_plant_java.sevice.permits.BasePermitService;
import com.dk_power.power_plant_java.sevice.permits.PermitNumbersService;
import com.dk_power.power_plant_java.sevice.users.impl.UserDetailsServiceImpl;
import com.dk_power.power_plant_java.util.Util;
import jakarta.persistence.EntityManager;
import jakarta.persistence.EntityManagerFactory;
import lombok.AllArgsConstructor;
import org.hibernate.envers.AuditReader;
import org.hibernate.envers.AuditReaderFactory;
import org.hibernate.envers.RevisionType;
import org.hibernate.envers.query.AuditEntity;
import org.hibernate.envers.query.AuditQuery;
import org.springframework.data.domain.Sort;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@AllArgsConstructor
public class BasePermitServiceImpl <T extends BasePermit,D extends BasePermitDto> implements BasePermitService<T, D> {
    private final BasePermitRepo<T> repository;
    protected PermitNumbersService permitNumbersService;
    private final FilterService<T> filterService;
    private final UserDetailsServiceImpl customUserDetails;
    private final BasePermitMapper<T,D> permitMapper;
    private EntityManagerFactory entityManagerFactory;

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
    public List<T> getByCreatedBy() {
        return repository.findByCreatedBy(customUserDetails.getUsersName());
    }

    @Override
    public String getLoggedInUserName() {
        return customUserDetails.getUsersName();
    }

    @Override
    public Long generatePermitNum() {
        Long lastCreatedNumber = repository.findMaxPermitNum();
        String yearr = LocalDateTime.now().getYear()+"0000";
        Long year =Long.parseLong(yearr.substring(2));
        if(lastCreatedNumber == null||year>lastCreatedNumber){
            return year;
        }else{
            return lastCreatedNumber+1;
        }
    }

    @Override
    public T save(T entity) {
        return repository.save(entity);
    }

    @Override
    public T createNew(D dto, Class<T> tClass) {
        T permit = permitMapper.convertToEntity(dto, tClass);
        //permit.setDocNum(permitNumbersService.getNumber(permit.getType()));
        permit.setDocNum(generatePermitNum());
        permit.setStatus(Status.INACTIVE);
        return save(permit);
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
        if(filterService.getPermits()==null || filterService.getPermits().isEmpty()) filterService.setPermits(getAll());
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
    public T resetFields() {
        return getTempPermit();
    }

    @Override
    public T convertToEntity(D dto, Class<T> tClass) {
        return permitMapper.convertToEntity(dto,tClass);
    }

    @Override
    public D convertToDto(T entity, Class<D> dClass) {
        return permitMapper.convertToDto(entity,dClass);
    }

    @Override
    public T getTempPermit() {
        return repository.getTempPermit(getLoggedInUserName());
    }

    @Override
    public List<T> getRevision(Long id, Class<T> entityClass){
        EntityManager entityManager = entityManagerFactory.createEntityManager();
        List<T> entities = new ArrayList<>();
        try {
            AuditReader reader = AuditReaderFactory.get(entityManager);
            AuditQuery query = reader.createQuery().forRevisionsOfEntity(entityClass, false, true);
            query.add(AuditEntity.id().eq(id));
            List<Object[]> result = query.getResultList();
            result.forEach(e->entities.add(entityClass.cast(e[0])));

        } finally {
            if (entityManager != null) {
                entityManager.close();
            }
        }
        return entities;
    }


}
