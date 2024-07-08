package com.dk_power.power_plant_java.sevice.base_services;

import java.util.List;

public interface AuditingService<T> {
    List<T> getRevision(Long id);
    String getCurrentUserFullName();
    String getCurrentUsername();
}
