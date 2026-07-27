package com.dk_power.power_plant_java.repository.messaging.plant;

import com.dk_power.power_plant_java.entities.messaging.plant.PlantChatAck;
import com.dk_power.power_plant_java.repository.base_repositories.BaseRepository;
import org.springframework.data.jpa.repository.Query;

import java.time.LocalDateTime;
import java.util.Optional;

public interface PlantChatAckRepo extends BaseRepository<PlantChatAck> {

    Optional<PlantChatAck> findFirstByExternalUuid(String externalUuid);

    long countByMessageSupabaseId(String messageSupabaseId);

    @Query("select max(a.ackedAtSupabase) from PlantChatAck a")
    LocalDateTime maxAckedAtSupabase();
}
