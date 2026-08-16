package com.dk_power.power_plant_java.sevice.data_transfer.data_manupulation;

import com.dk_power.power_plant_java.dto.data_transfer.HeatTraceJson;
import com.dk_power.power_plant_java.dto.data_transfer.HighilightsJson;
import com.dk_power.power_plant_java.dto.data_transfer.PidJson;
import com.dk_power.power_plant_java.sevice.data_transfer.json.HeatTraceTransferService;
import com.dk_power.power_plant_java.sevice.data_transfer.json.HighlightTransferService;
import com.dk_power.power_plant_java.sevice.data_transfer.json.PidTransferService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
//@AllArgsConstructor
@RequiredArgsConstructor
public class TransferExcecutionServiceImpl implements TransferExcecutionService {
    private final PidTransferService pidTransferService;
    private final HeatTraceTransferService heatTraceTransferService;
    private final HighlightTransferService highlightTransferService;

    @Value("${json.path.pids}")
    private String pidsJsonPath;// = "./src/main/resources/static/data_transfer/files/pids_json_mod.js";
    public List<PidJson> getPidsFromJson(){
        List<PidJson> pids = pidTransferService.getPojoList(pidsJsonPath);
        System.out.println("TransferCompleted.");
        System.out.println(pids.size() + " items are in pids List");
        return pids;
    }
    @Value("${json.path.heatTrace}")
    private String htJsonPath;// = "./src/main/resources/static/data_transfer/files/heat_trace.js";
    public List<HeatTraceJson> getHtFromJson(){
        List<HeatTraceJson> ht = heatTraceTransferService.getPojoList(htJsonPath);
        System.out.println("TransferCompleted.");
        System.out.println(ht.size() + " items are in ht List");
        return ht;
    }

    @Value("${json.path.highlights}")
    private String highlightJsonPath;// = "./src/main/resources/static/data_transfer/files/Equipment.js";
    public List<HighilightsJson> getHighlitsFromJson(){
        List<HighilightsJson> ht = highlightTransferService.getPojoList(highlightJsonPath);
        System.out.println("TransferCompleted.");
        System.out.println(ht.size() + " items are in highlight List");
        return ht;
    }

    public String getProjectRootFolder() {
        return System.getProperty("user.dir");
    }

}
