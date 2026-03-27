package com.dk_power.power_plant_java.exception;

public class StaleAggregateUpdateException extends RuntimeException {
    public StaleAggregateUpdateException(String message) {
        super(message);
    }
}
