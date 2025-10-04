package com.dk_power.power_plant_java.dto.automation;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class FormBuilderProgress {
    private String openBuilderMessage;
    private String fillOutForm;
    private String saveForm;

    public String getFailedStep(){
        if(containsFailed(openBuilderMessage)) return "open-builder";
        if(containsFailed(fillOutForm)) return "fill-out-form";
        if(containsFailed(saveForm)) return "save-form";
        return null;
    }

    private boolean containsFailed(String message){
        return message.toLowerCase().contains("failed");

    }

    public void setOpenBuilderMessage(String message) {
        this.openBuilderMessage = message;
        if(message.toLowerCase().contains("failed")) throw new RuntimeException(message);
    }

    public void setFillOutForm(String message) {
        this.fillOutForm = message;
        if(message.toLowerCase().contains("failed")) throw new RuntimeException(message);
    }

    public void setSaveForm(String message) {
        this.saveForm = message;
        if(message.toLowerCase().contains("failed")) throw new RuntimeException(message);
    }
}
