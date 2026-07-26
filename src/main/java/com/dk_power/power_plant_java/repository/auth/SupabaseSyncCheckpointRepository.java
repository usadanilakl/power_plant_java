package com.dk_power.power_plant_java.repository.auth;

import com.dk_power.power_plant_java.entities.auth.SupabaseSyncCheckpoint;
import org.springframework.data.jpa.repository.JpaRepository;

public interface SupabaseSyncCheckpointRepository extends JpaRepository<SupabaseSyncCheckpoint, String> {
}
