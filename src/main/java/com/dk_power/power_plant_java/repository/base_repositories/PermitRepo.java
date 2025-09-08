package com.dk_power.power_plant_java.repository.base_repositories;

import org.springframework.data.repository.NoRepositoryBean;

import java.util.List;
@NoRepositoryBean
public interface PermitRepo<E> extends BaseRepository<E>{
    List<E> findByTempTrue();

//    Long findMaxPermitNum();

    List<E> findByPermitStatus_name(String active);
    // Finds all WorkRequest entities where permitStatus.name matches the provided string (case-sensitive)
    // and permitStatus.name is not null (implicit by matching)
    List<E> findByPermitStatus_Name(String name);

    // For case-insensitive match use IgnoreCase suffix
    List<E> findByPermitStatus_NameIgnoreCase(String name);

    // For partial matching use Contains or Like (assuming permitStatus.name is String)
    List<E> findByPermitStatus_NameContaining(String partialName);

    List<E> findByPermitStatus_NameContainingIgnoreCase(String partialName);
}
