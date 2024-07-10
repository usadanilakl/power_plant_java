package com.dk_power.power_plant_java.sevice.base_services;

import com.dk_power.power_plant_java.entities.base_entities.BaseEntity;
import com.dk_power.power_plant_java.enums.Status;
import com.dk_power.power_plant_java.mappers.BaseMapper;
import com.dk_power.power_plant_java.mappers.UniversalMapper;
import com.dk_power.power_plant_java.repository.base_repositories.BaseRepository;
import jakarta.annotation.PostConstruct;
import org.hibernate.Session;
import org.hibernate.SessionFactory;
import org.springframework.data.domain.Sort;

import java.util.List;

public interface CrudService<
        E extends BaseEntity,
        D,
        R extends BaseRepository<E>,
        M extends BaseMapper> {
    E getEntity();
    D getDto();
    R getRepo();
    M getMapper();
    SessionFactory getSessionFactory();

//    @PostConstruct
    public default void enableFilter() {
        Session session = getSessionFactory().getCurrentSession();
        session.enableFilter("deletedFilter").setParameter("isDeleted", false);
    }
    default List<E> getAll(){
        return getRepo().findAll();
    }
    default List<E> getAllSorted(String column){
        return getRepo().findAll(Sort.by(column));
    }
    default List<D> getAllDtos(){return getAll().stream().map(e->getMapper().convert(e,getDto())).toList();}
    default E getEntityById(Long id){
        return getRepo().findById(id).orElse(null);
    }
    default E getEntityById(String id){
        return getRepo().findById(Long.parseLong(id)).orElse(null);
    }
    default D getDtoById(String id){
        E entityById = getEntityById(id);
        return convertToDto(entityById);
    }
    default D getDtoById(Long id){
        E entityById = getEntityById(id);
        return convertToDto(entityById);
    }
    default List<E> getByCreatedBy(String name){
        return getRepo().findByCreatedBy(name);
    }
    default E save(E entity){
        return getRepo().save(entity);
    }
    default E save(D dto){
        E entity = convertToEntity(dto);
        return save(entity);
    }
    default E update(E entity){
        return getRepo().save(entity);
    }
    default E softDelete(E entity){
        entity.setDeleted(true);
        return save(entity);
    }
    default E softDelete(String id){
        return softDelete(getEntityById(id));
    }
    default E softDelete(Long id){
        return softDelete(getEntityById(id));
    }
    default E hardDelete(E entity){
        getRepo().delete(entity);
        return entity;
    }
    default List<E> getAllSoftDeleted(){
        return getRepo().findByDeletedTrue();
    }
    default E convertToEntity(D dto){
        return getMapper().convert(dto, getEntity());
    }
    default D convertToDto(E entity){
        return getMapper().convert(entity, getDto());
    }


}
