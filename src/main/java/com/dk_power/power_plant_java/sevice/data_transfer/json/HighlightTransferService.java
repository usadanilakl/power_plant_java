package com.dk_power.power_plant_java.sevice.data_transfer.json;

import com.dk_power.power_plant_java.dto.data_transfer.HighilightsJson;
import com.dk_power.power_plant_java.sevice.FilePathService;
import lombok.RequiredArgsConstructor;
import lombok.Setter;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class HighlightTransferService implements JsonToPojoService<HighilightsJson> {
    private final FilePathService filePathService;
    @Override
    public FilePathService getFilePathService() {
        return filePathService;
    }

    @Override
    public HighilightsJson getEntity() {
        return new HighilightsJson();
    }
}
