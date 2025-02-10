package com.dk_power.power_plant_java.api;

import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
@Builder
public class ApiResponse<T> {
    private T data;
    private String message;
    private LocalDateTime timestamp;

    public ApiResponse(T data, String message) {
        this.data = data;
        this.message = message;
        this.timestamp = LocalDateTime.now();
    }

    public ApiResponse(T data, String message, LocalDateTime timestamp) {
        this.data = data;
        this.message = message;
        this.timestamp = timestamp;
    }

}