package com.dk_power.power_plant_java.dto.automation;

import com.dk_power.power_plant_java.dto.permits.DailyPermitPackageDto;
import lombok.Getter;
import lombok.Setter;

import java.util.HashSet;
import java.util.Objects;
import java.util.Set;

@Getter
@Setter
public class PermitBuildingProgress {
        private DailyPermitPackageDto packageUnderConstruction;
        private String openAppMessage;
        private String loginMessage;
        private Set<HwBuilderProgress> hwMessages = new HashSet<>();
        private Set<CsBuilderProgress> csMessages = new HashSet<>();
        private Set<SwBuilderProgress> swMessages = new HashSet<>();


        public String getFailedStep(){
            if(packageUnderConstruction==null) return "get-package";
            if(openAppMessage.toLowerCase().contains("failed")) return "open-app";
            if(loginMessage.toLowerCase().contains("failed")) return "login";

            String hwMessage = permitFailures(hwMessages);
            if(hwMessage!=null) return hwMessage;

            String csMessage = permitFailures(csMessages);
            if(csMessage!= null ) return csMessage;

            String swMessage = permitFailures(swMessages);
            if(swMessage!=null) return swMessage;

            return null;
        }

        private String permitFailures(Set<? extends FormBuilderProgress> permits){
            return permits.stream().map(FormBuilderProgress::getFailedStep).filter(Objects::nonNull).findFirst().get();
        }

        public void setOpenAppMessage(String message){
            this.openAppMessage = message;
            if(message.toLowerCase().contains("failed")) throw new RuntimeException(message);
        }

        public void loginMessage(String message){
            this.loginMessage = message;
            if(message.toLowerCase().contains("failed")) throw new RuntimeException(message);
        }

}
