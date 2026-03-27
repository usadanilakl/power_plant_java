package com.dk_power.power_plant_java.controller;

import com.dk_power.power_plant_java.controller.angular.NgApiResponse;
import com.dk_power.power_plant_java.exception.StaleAggregateUpdateException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.time.LocalDateTime;

@RestControllerAdvice
public class GlobalApiExceptionHandler {

    @ExceptionHandler(StaleAggregateUpdateException.class)
    public ResponseEntity<NgApiResponse<Object>> handleStaleAggregateUpdate(StaleAggregateUpdateException ex) {
        return ResponseEntity.status(HttpStatus.CONFLICT)
            .body(new NgApiResponse<>(null, ex.getMessage(), LocalDateTime.now()));
    }
}
