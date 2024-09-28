package com.dk_power.power_plant_java.sevice.data_transfer.data_manupulation;

import com.dk_power.power_plant_java.dto.data_transfer.HeatTraceJson;
import com.dk_power.power_plant_java.dto.data_transfer.HighilightsJson;
import com.dk_power.power_plant_java.dto.data_transfer.PidJson;
import com.dk_power.power_plant_java.entities.files.FileObject;
import com.dk_power.power_plant_java.sevice.data_transfer.excel.*;
import com.dk_power.power_plant_java.sevice.data_transfer.json.HeatTraceTransferService;
import com.dk_power.power_plant_java.sevice.data_transfer.json.HighlightTransferService;
import com.dk_power.power_plant_java.sevice.data_transfer.json.PidTransferService;
import com.dk_power.power_plant_java.sevice.file.FileService;
import com.dk_power.power_plant_java.sevice.loto.loto_point.LotoPointService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
//@AllArgsConstructor
@RequiredArgsConstructor
public class TransferExcecutionServiceImpl implements TransferExcecutionService {
    private final BypassService bypassService;
    private final HrsgPipeIsoService hrsgPipeIsoService;
    private final HrsgValveService hrsgValveService;
    private final KiewitPipeIsoService kiewitPipeIsoService;
    private final KiewitValveService kiewitValveService;
    private final LotoPointService lotoPointService;
    private final OldLotoPointService oldLotoPointService;
    private final RevisedLotoPointService revisedLotoPointService;
    private final PidTransferService pidTransferService;
    private final HeatTraceTransferService heatTraceTransferService;
    private final HighlightTransferService highlightTransferService;
    private final ElectricalTableService electricalTableService;
    private final FileService fileService;
    public void transferBypassFromExcel(){
        System.out.println("Bypass Transfer Started.");
        System.out.println(bypassService.getAll().size() + " items are in db");
        bypassService.transferExcelToDB();
        System.out.println("TransferCompleted.");
        System.out.println(bypassService.getAll().size() + " items are in db");
    }
    public void transferHrsgPipeFromExcel(){
        System.out.println("Hrsg Pipe Transfer Started.");
        System.out.println(hrsgPipeIsoService.getAll().size() + " items are in db");
        hrsgPipeIsoService.transferExcelToDB();
        System.out.println("TransferCompleted.");
        System.out.println(hrsgPipeIsoService.getAll().size() + " items are in db");
    }
    public void transferHrsgValvesFromExcel(){
        System.out.println("Hrst Valves Transfer Started.");
        System.out.println(hrsgValveService.getAll().size() + " items are in db");
        hrsgValveService.transferExcelToDB();
        System.out.println("TransferCompleted.");
        System.out.println(hrsgValveService.getAll().size() + " items are in db");
    }
    public void transferKiewitPipeFromExcel(){
        System.out.println("Kiewit Pipe Transfer Started.");
        System.out.println(kiewitPipeIsoService.getAll().size() + " items are in db");
        kiewitPipeIsoService.transferExcelToDB();
        System.out.println("TransferCompleted.");
        System.out.println(kiewitPipeIsoService.getAll().size() + " items are in db");
    }
    public void transferKiewitValveFromExcel(){
        System.out.println("Kiewit Valve Transfer Started.");
        System.out.println(kiewitValveService.getAll().size() + " items are in db");
        kiewitValveService.transferExcelToDB();
        System.out.println("TransferCompleted.");
        System.out.println(kiewitValveService.getAll().size() + " items are in db");
    }
    public void transferLotoPointsFromExcel(){
        System.out.println("Loto Points Transfer Started.");
        System.out.println(lotoPointService.getAll().size() + " items are in db");
        lotoPointService.transferExcelToDB();
        System.out.println("TransferCompleted.");
        System.out.println(lotoPointService.getAll().size() + " items are in db");
    }
    public void transferOldLotoPointsFromExcel(){
        System.out.println("Old Loto Points Transfer Started.");
        System.out.println(oldLotoPointService.getAll().size() + " items are in db");
        oldLotoPointService.transferExcelToDB();
        System.out.println("TransferCompleted.");
        System.out.println(oldLotoPointService.getAll().size() + " items are in db");
    }

    @Override
    public void transferRevisedLotoPointsFromExcel() {
        System.out.println("Revised Loto Points Transfer Started.");
        System.out.println(revisedLotoPointService.getAll().size() + " items are in db");
        revisedLotoPointService.transferExcelToDB();
        System.out.println("TransferCompleted.");
        System.out.println(revisedLotoPointService.getAll().size() + " items are in db");
    }

    @Override
    public void transferElTableFromExcel() {
        System.out.println("Electrical Table Transfer Started.");
        System.out.println(electricalTableService.getAll().size() + " items are in db");
        electricalTableService.transferExcelToDB();
        System.out.println("TransferCompleted.");
        System.out.println(electricalTableService.getAll().size() + " items are in db");
    }

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

    @Override
    public void addDocNumberToExistingFiles() {
        List<PidJson> pidsFromJson = getPidsFromJson();
        List<FileObject> all = fileService.getAll();
        for (FileObject f : all) {
            Optional<PidJson> first = pidsFromJson.stream().filter(e -> e.getFileNumber().equalsIgnoreCase(f.getFileNumber())).findFirst();
            first.ifPresent(pidJson -> f.setDocNumber(pidJson.getPidNumber()));
            fileService.save(f);
        }
    }

}
