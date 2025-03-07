package com.dk_power.power_plant_java.repository;

import com.dk_power.power_plant_java.entities.SyncStatus;
import org.springframework.data.jpa.repository.JpaRepository;

public interface SyncStatusRepository extends JpaRepository<SyncStatus, String> {
}
