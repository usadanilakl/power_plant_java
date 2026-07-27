package com.dk_power.power_plant_java.repository.messaging.plant;

import com.dk_power.power_plant_java.entities.messaging.plant.PlantConversation;
import com.dk_power.power_plant_java.repository.base_repositories.BaseRepository;

import java.util.Optional;

public interface PlantConversationRepo extends BaseRepository<PlantConversation> {

    Optional<PlantConversation> findFirstBySupabaseId(String supabaseId);
}
