package com.dk_power.power_plant_java.controller.angular;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;
@Getter
@Setter
@NoArgsConstructor
public class NgApiResponse<T> {
    private T responseData;
    private String message;
    private LocalDateTime timestamp;

    public NgApiResponse(T data, String message) {
        this.responseData = data;
        this.message = message;
        this.timestamp = LocalDateTime.now();
    }

    public NgApiResponse(T data, String message, LocalDateTime timestamp) {
        this.responseData = data;
        this.message = message;
        this.timestamp = timestamp;
    }
}
