package com.dk_power.power_plant_java.sevice.data_transfer.json;

import com.dk_power.power_plant_java.dto.data_transfer.HeatTraceJson;
import com.dk_power.power_plant_java.sevice.FilePathService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class HeatTraceTransferService implements JsonToPojoService<HeatTraceJson> {
    private final FilePathService filePathService;
    @Override
    public FilePathService getFilePathService() {
        return filePathService;
    }

    @Override
    public HeatTraceJson getEntity() {
        return new HeatTraceJson();
    }
}
