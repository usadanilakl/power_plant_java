package com.dk_power.power_plant_java.sevice.data_transfer.json;

import com.dk_power.power_plant_java.dto.data_transfer.HighilightsJson;
import lombok.Setter;
import org.springframework.stereotype.Service;

@Service
public class HighlightTransferService implements JsonToPojoService<HighilightsJson> {
    @Override
    public HighilightsJson getEntity() {
        return new HighilightsJson();
    }
}
