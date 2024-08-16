package com.dk_power.power_plant_java.repository.data_transfer;

import com.dk_power.power_plant_java.entities.data_transfer.KiewitPipeIso;
import com.dk_power.power_plant_java.repository.base_repositories.BaseRepository;
import jakarta.persistence.Entity;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.springframework.data.repository.CrudRepository;


public interface KiewitPipeIsoRepo extends BaseRepository<KiewitPipeIso> {

}
