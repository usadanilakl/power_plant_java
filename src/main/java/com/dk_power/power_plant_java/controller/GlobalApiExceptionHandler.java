package com.dk_power.power_plant_java.controller;

import com.dk_power.power_plant_java.controller.angular.NgApiResponse;
import jakarta.persistence.OptimisticLockException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.orm.ObjectOptimisticLockingFailureException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.time.LocalDateTime;

@RestControllerAdvice
public class GlobalApiExceptionHandler {

    private static final String OPTIMISTIC_LOCK_MESSAGE =
            "Package was modified by another user. Please refresh and try again.";

    @ExceptionHandler({
            OptimisticLockException.class,
            ObjectOptimisticLockingFailureException.class
    })
    public ResponseEntity<NgApiResponse<Void>> handleOptimisticLock(Exception ex) {
        return ResponseEntity.status(HttpStatus.CONFLICT)
                .body(new NgApiResponse<>(null, OPTIMISTIC_LOCK_MESSAGE, LocalDateTime.now()));
    }
}
