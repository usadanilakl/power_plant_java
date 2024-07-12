package com.dk_power.power_plant_java.sevice.data_transfer;

import com.dk_power.power_plant_java.sevice.data_transfer.excel.*;
import com.dk_power.power_plant_java.sevice.data_transfer.json.HeatTraceTransferService;
import com.dk_power.power_plant_java.sevice.data_transfer.json.HighlightTransferService;
import com.dk_power.power_plant_java.sevice.data_transfer.json.PidTransferService;
import com.dk_power.power_plant_java.sevice.equipment.LotoPointService;
import lombok.AllArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@AllArgsConstructor
public class TransferExcecutionServiceImpl implements TransferExcecutionService {
    private final BypassService bypassService;
    private final HrsgPipeIsoService hrsgPipeIsoService;
    private final HrsgValveService hrsgValveService;
    private final KiewitPipeIsoService kiewitPipeIsoService;
    private final KiewitValveService kiewitValveService;
    private final LotoPointService lotoPointService;
    private final OldLotoPointService oldLotoPointService;
    private final PidTransferService pidTransferService;
    private final HeatTraceTransferService heatTraceTransferService;
    private final HighlightTransferService highlightTransferService;
}
