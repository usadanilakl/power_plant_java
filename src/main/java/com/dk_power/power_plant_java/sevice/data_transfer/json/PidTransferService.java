package com.dk_power.power_plant_java.sevice.data_transfer.json;

import com.dk_power.power_plant_java.dto.data_transfer.PidJson;
import com.dk_power.power_plant_java.sevice.FilePathService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class PidTransferService implements JsonToPojoService<PidJson>{
    private final FilePathService filePathService;
    @Override
    public FilePathService getFilePathService() {
        return filePathService;
    }

    @Override
    public PidJson getEntity() {
        return new PidJson();
    }
}
