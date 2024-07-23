package com.dk_power.power_plant_java.config;

import com.dk_power.power_plant_java.sevice.FilePathService;
import com.dk_power.power_plant_java.sevice.data_transfer.excel.ExcelService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
@RequiredArgsConstructor
public class ExcelConfig {
    private final FilePathService filePathService;
    /****************************************************************************
     * Hrsg Valve Transfer
     * ***************************************************************************/
    @Value("${excel.path.valves}") String valvePath;
    @Value("${excel.sheetName.hrsgValves}") String hrsgValveSheet;
    @Bean
    @Qualifier("HrsgValve")
    public ExcelService beanForHrsgValve(){
        return new ExcelService( valvePath,hrsgValveSheet,filePathService);
    }
    /****************************************************************************
     * Kiewit Valve Transfer
     * ***************************************************************************/
    @Value("${excel.sheetName.kiewitValves}") String kiewitValveSheet;
    @Bean
    @Qualifier("KiewitValve")
    public ExcelService beanForKiewitValve(){
        return new ExcelService(valvePath,kiewitValveSheet,filePathService);
    }

    /****************************************************************************
     * Revised Loto Point Transfer
     * ***************************************************************************/
    @Value("${excel.path.lotoPoints}") String lotoPointPath;
    @Value("${excel.sheetName.lotoPoints}") String lotoPointSheet;
    @Bean
    @Qualifier("LotoPoint")
    public ExcelService beanForLotoPoints(){
        return new ExcelService(lotoPointPath,lotoPointSheet,filePathService);
    }

    /****************************************************************************
     * Hrsg Pipe Transfer
     * ***************************************************************************/
    @Value("${excel.path.pipes}") String pipePath;
    @Value("${excel.sheetName.hrsgPipes}") String hrsgPipeSheet;
    @Bean
    @Qualifier("HrsgPipe")
    public ExcelService beanForHrsgPipe(){
        return new ExcelService(pipePath,hrsgPipeSheet,filePathService);
    }
    /****************************************************************************
     * Kiewit Valve Transfer
     * ***************************************************************************/
    @Value("${excel.sheetName.kiewitPipes}") String kiewitPipesSheet;
    @Bean
    @Qualifier("KiewitPipe")
    public ExcelService beanForKiewitPipe(){
        return new ExcelService(pipePath,kiewitPipesSheet,filePathService);
    }

    /****************************************************************************
     * Old Loto Point Transfer
     * ***************************************************************************/
    @Value("${excel.path.oldLotoPoints}") String oldLotoPointPath;
    @Value("${excel.sheetName.oldLotoPoints}") String oldLotoPointSheet;
    @Bean
    @Qualifier("OldLotoPoint")
    public ExcelService beanForOldLotoPoints(){
        return new ExcelService(oldLotoPointPath,oldLotoPointSheet,filePathService);
    }

    /****************************************************************************
     * Bypasses Transfer
     * ***************************************************************************/
    @Value("${excel.path.bypasses}") String bypassesPath;
    @Value("${excel.sheetName.bypasses}") String bypassesSheet;
    @Bean
    @Qualifier("Bypass")
    public ExcelService beanForBypasses(){
        return new ExcelService(bypassesPath,bypassesSheet,filePathService);
    }
}
