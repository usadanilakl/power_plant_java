package com.dk_power.power_plant_java.sevice.base_services;

import com.dk_power.power_plant_java.entities.base_entities.BaseIdEntity;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Common interface for services that support sync operations.
 * Both CrudService and NgCrudService extend this interface.
 */
public interface SyncableService<E extends BaseIdEntity> {

    E getEntity();

    E getEntityById(Long id);

    List<E> getAll();

    E save(E entity);

    E saveAndFlush(E entity);

    void deleteById(Long id);

    List<E> getAllSince(LocalDateTime since);

    void processSyncItem(E item);

    void processSyncItems(List<E> items);

    Page<E> getAllSincePaginated(LocalDateTime lastSyncTime, Pageable pageable);

    Page<E> getAllSinceAndUntilPaginated(LocalDateTime since, LocalDateTime until, Pageable pageable);
}
